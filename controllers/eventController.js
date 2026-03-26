const pool = require('../config/db');

const getAllEvents = (req, res) => {
    res.send("list of all events");
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
            return res.status(404).send("Event not found!");
        }
        
        res.status(200).render('eventDetails', {event: event});
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error while fetching event details");
    }
    
}

module.exports = {
    getAllEvents,
    getEventDetails
}