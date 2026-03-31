const Event = require('../models/Event'); 

/**
 * Retrieves the complete event catalogue and renders the homepage.
 * Events are sorted chronologically by date to surface upcoming events first.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const getAllEvents = async (req, res) => {
    try{
        // Ask the Model for all events
        const events = await Event.findAll();
    
        res.status(200).render('events', {events: events});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error while fetching events");
    }
}

/**
 * Retrieves and displays the details for a single event.
 * Implements a "Security Bouncer" with a breadcrumb trail: unauthenticated users
 * attempting to view an event are redirected to login, but their intended destination
 * is saved in the session so they can go back post-login.
 * @param {Object} req - The Express request object containing the event ID parameter.
 * @param {Object} res - The Express response object for rendering or redirecting.
 */
const getEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id; 

        // Ask the Model for the specific event
        const event = await Event.findById(eventId);

        // Prevent users from hanging on bad URLs
        if (!event) {
            req.flash('error', 'Event not found');
            return res.redirect("/events");
        }

        // Security Bouncer: Save the 'ReturnTo' breadcrumb
        if (!req.session.userId) {
            req.session.returnTo = req.originalUrl;

            req.flash('error', 'You must be logged in to view event details');
            return res.redirect('/users/login');
        }
        
        res.status(200).render('eventDetails', {event: event , userId: req.session.userId});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error while fetching event details");
    }
}

module.exports = {
    getAllEvents,
    getEventDetails
}