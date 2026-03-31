/**
 * @file Booking Model.
 * Handles all database interactions relating to the bookings table and ticket management.
 */

const pool = require('../config/db');

const Booking = {
    /**
     * Retrieves all bookings for a specific user, joined with the events table 
     * to provide human-readable event details (title, date).
     * @param {number|string} userId - The unique identifier of the user.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of booking objects.
     */
    findByUserId: async (userId) => {
        const result = await pool.query(
            `SELECT b.booking_id, b.ticket_quantity, e.title, e.event_date 
             FROM bookings b 
             JOIN events e ON b.event_id = e.event_id 
             WHERE b.user_id = $1`,
            [userId]
        );
        return result.rows;
    },

    /**
     * Finds a specific booking by its ID, enforcing authorization by ensuring 
     * it belongs to the requesting user.
     * @param {number|string} bookingId - The unique identifier of the booking.
     * @param {number|string} userId - The unique identifier of the user attempting to access it.
     * @returns {Promise<Object|undefined>} A promise that resolves to the booking object if found and authorized, or undefined.
     */
    findByIdAndUserId: async (bookingId, userId) => {
        const result = await pool.query(
            "SELECT event_id, ticket_quantity FROM bookings WHERE booking_id = $1 AND user_id = $2",
            [bookingId, userId]
        );
        return result.rows[0];
    },

    /**
     * Creates a new booking record AND updates the event's sold tickets capacity counter.
     * @param {number|string} userId - The ID of the user booking the ticket.
     * @param {number|string} eventId - The ID of the event being booked.
     * @param {number} ticketQuantity - The amount of tickets requested.
     * @returns {Promise<void>}
     */
    create: async (userId, eventId, ticketQuantity) => {
        await pool.query(
            "INSERT INTO bookings (user_id, event_id, ticket_quantity) VALUES ($1, $2, $3)",
            [userId, eventId, ticketQuantity]
        );
        
        await pool.query(
            "UPDATE events SET tickets_sold = tickets_sold + $1 WHERE event_id = $2",
            [ticketQuantity, eventId]
        );
    },

    /**
     * Deletes a booking record AND refunds the event's capacity counter.
     * @param {number|string} bookingId - The ID of the booking to delete.
     * @param {number|string} eventId - The ID of the event to refund capacity to.
     * @param {number} ticketQuantity - The amount of tickets being refunded.
     * @returns {Promise<void>}
     */
    deleteAndRefund: async (bookingId, eventId, ticketQuantity) => {
        await pool.query(
            "DELETE FROM bookings WHERE booking_id = $1",
            [bookingId]
        );

        await pool.query(
            "UPDATE events SET tickets_sold = tickets_sold - $1 WHERE event_id = $2",
            [ticketQuantity, eventId]
        );
    }
};

module.exports = Booking;