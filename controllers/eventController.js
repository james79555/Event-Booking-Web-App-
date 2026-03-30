const pool = require('../config/db');

const getAllEvents = async (req, res) => {
    try{
        const result = await pool.query(
            "SELECT * FROM events ORDER BY event_date ASC"
        );
    
        const events = result.rows;
    
        res.status(200).render('events', {events: events});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error while fetching events");
    }
   
}

const getEventDetails = async (req, res) => {
    try {
        const eventId = req.params.id; 

        const result = await pool.query(
            "SELECT * FROM events WHERE event_id = $1", 
                [eventId]
        );
        const event = result.rows[0];

        if (!event) {
            req.flash('error', 'Event not found');
            return res.redirect("/events");
        }

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