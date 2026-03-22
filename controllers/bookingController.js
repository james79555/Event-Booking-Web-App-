const pool = require('../config/db');

const showUserBookings = (req, res) => {
    res.send("list of user's bookings");
}

const processBooking = async (req, res) => {
    try{
        const {eventId, userId, ticketQuantity} = req.body; 
        const result = await pool.query(
            'SELECT total_capacity, tickets_sold FROM events WHERE event_id = $1', 
            [eventId]
        );
        const event = result.rows[0];

        const remainingCapacity = event.total_capacity - event.tickets_sold;

        if (ticketQuantity <= remainingCapacity) {
            await pool.query(
                'INSERT INTO bookings (user_id, event_id, ticket_quantity) VALUES ($1, $2, $3) RETURNING *',
                [userId, eventId, ticketQuantity]
            );
            await pool.query(
                'UPDATE events SET tickets_sold = tickets_sold + $1 WHERE event_id = $2',
                [ticketQuantity, eventId]
            );
            res.status(200).send('booking processed');
        }
        else {
            res.status(400).send('Not Enough Capacity!');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Something went wrong!');
    }
}

module.exports = {
    showUserBookings,
    processBooking
};