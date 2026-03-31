const pool = require('../config/db');

/**
 * Retrieves all active bookings for the currently authenticated user.
 * Joins the bookings table with the events table to display 
 * event details (title, date) alongside the ticket quantities.
 * * @param {Object} req - The Express request object containing the user's session ID.
 * @param {Object} res - The Express response object.
 */
const showUserBookings = async (req, res) => {
    try{
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }

        const result = await pool.query(
            "SELECT b.booking_id, b.ticket_quantity, e.title, e.event_date FROM bookings b JOIN events e ON b.event_id = e.event_id WHERE b.user_id = $1",
            [userId]
        );
        const bookings = result.rows;
        res.status(200).render('bookings', {bookings: bookings});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while fetching bookings');
    }
}

/**
 * Processes a ticket purchase request.
 * Enforces strict capacity limits via backend math to prevent overbooking. 
 * Uses the breadcrumb pattern for unauthenticated users, ensuring a seamless UX 
 * if they are prompted to log in mid-purchase.
 * * @param {Object} req - The Express request object containing eventId and ticketQuantity.
 * @param {Object} res - The Express response object.
 */
const processBooking = async (req, res) => {
    try{
        const {eventId, ticketQuantity} = req.body; 
        const userId = req.session.userId;  

        // Security Bouncer: Save the 'ReturnTo' breadcrumb for the specific event
        if (!userId) {
            req.session.returnTo = '/events/' + eventId;

            req.flash('error', 'You must be logged in to book tickets');
            return res.redirect('/users/login');
        }

        if (!ticketQuantity) {
            req.flash('error', 'Please select the number of tickets');
            return res.redirect('/events/' + eventId);
        }

        const result = await pool.query(
            'SELECT total_capacity, tickets_sold FROM events WHERE event_id = $1', 
            [eventId]
        );
        const event = result.rows[0];

        const remainingCapacity = event.total_capacity - event.tickets_sold;

        // Capacity Lock: Ensure we don't sell more tickets than exist
        if (ticketQuantity <= remainingCapacity) {
            await pool.query(
                'INSERT INTO bookings (user_id, event_id, ticket_quantity) VALUES ($1, $2, $3) RETURNING *',
                [userId, eventId, ticketQuantity]
            );
            await pool.query(
                'UPDATE events SET tickets_sold = tickets_sold + $1 WHERE event_id = $2',
                [ticketQuantity, eventId]
            );
            req.flash('success', 'Booking successful!');
            res.redirect('/bookings');
        }
        else {
            req.flash('error', 'Not enough tickets available. Please reduce the quantity and try again.');
            res.redirect('/events/' + eventId);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong!');
    }
}

/**
 * Processes a user's request to cancel an existing booking.
 * Acts as a dual-transaction: verifies ticket ownership, deletes the booking record, 
 * and refunds the ticket quantity back to the event's available capacity.
 * * @param {Object} req - The Express request object containing the bookingId.
 * @param {Object} res - The Express response object.
 */
const cancelBooking = async (req, res) => {
    try{
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }
        const {bookingId} = req.body;

        // Fetch booking while enforcing user ownership to prevent malicious deletions
        const result = await pool.query(
            'SELECT event_id, ticket_quantity FROM bookings WHERE booking_id = $1 AND user_id = $2',
            [bookingId, userId]
        );
        const booking = result.rows[0];

        if (!booking) {
            req.flash('error', 'Booking not found or unauthorized');
            return res.redirect('/bookings');
        }

        // Delete the ticket
        await pool.query(
            'DELETE FROM bookings WHERE booking_id = $1',
            [bookingId]
        );

        // Refund the capacity back to the original event
        await pool.query(
            'UPDATE events SET tickets_sold = tickets_sold - $1 WHERE event_id = $2',
            [booking.ticket_quantity, booking.event_id]
        );

        req.flash('success', 'Booking cancelled successfully!');
        res.redirect('/bookings');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while cancelling booking');
    }
}

module.exports = {
    showUserBookings,
    processBooking, 
    cancelBooking
};