const Booking = require('../models/Booking');
const Event = require('../models/Event');

/**
 * Retrieves all active bookings for the currently authenticated user.
 * Joins the bookings table with the events table to display 
 * event details (title, date) alongside the ticket quantities.
 * @param {Object} req - The Express request object containing the user's session ID.
 * @param {Object} res - The Express response object.
 */
const showUserBookings = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }

        // Ask the Model for the user's bookings
        const bookings = await Booking.findByUserId(userId);
        
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
 * @param {Object} req - The Express request object containing eventId and ticketQuantity.
 * @param {Object} res - The Express response object.
 */
const processBooking = async (req, res) => {
    try {
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

        // Ask the Event Model for the current capacity
        const event = await Event.findById(eventId);

        if (!event) {
            req.flash('error', 'Event not found');
            return res.redirect('/events');
        }

        const remainingCapacity = event.total_capacity - event.tickets_sold;

        // Capacity Lock: Ensure we don't sell more tickets than exist
        if (ticketQuantity <= remainingCapacity) {
            // Ask the Booking Model to create the booking and update event capacity
            await Booking.create(userId, eventId, ticketQuantity);
            
            req.flash('success', 'Booking successful!');
            res.redirect('/bookings');
        } else {
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
 * @param {Object} req - The Express request object containing the bookingId.
 * @param {Object} res - The Express response object.
 */
const cancelBooking = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }
        const {bookingId} = req.body;

        // Fetch booking while enforcing user ownership to prevent malicious deletions
        const booking = await Booking.findByIdAndUserId(bookingId, userId);

        if (!booking) {
            req.flash('error', 'Booking not found or unauthorized');
            return res.redirect('/bookings');
        }

        // Ask the Model to delete the ticket and refund the capacity in one go
        await Booking.deleteAndRefund(bookingId, booking.event_id, booking.ticket_quantity);

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