/**
 * @file Event Model.
 * Handles all database interactions relating to the events catalogue.
 */

const pool = require('../config/db');

const Event = {
    /**
     * Retrieves the complete event catalogue, ordered chronologically by date.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of event objects.
     */
    findAll: async () => {
        const result = await pool.query(
            "SELECT * FROM events ORDER BY event_date ASC"
        );
        return result.rows;
    },

    /**
     * Finds a specific event by its ID to view details and capacity.
     * @param {number|string} eventId - The unique identifier of the event.
     * @returns {Promise<Object|undefined>} A promise that resolves to the event object if found, or undefined if not.
     */
    findById: async (eventId) => {
        const result = await pool.query(
            "SELECT * FROM events WHERE event_id = $1", 
            [eventId]
        );
        return result.rows[0];
    }
};

module.exports = Event;