/**
 * @file User Model.
 * Handles all database interactions relating to the users table.
 */

const pool = require('../config/db');

const User = {
    /**
     * Creates a new user in the database.
     * * @param {string} name - The user's full name.
     * @param {string} email - The user's email address.
     * @param {string} hashedPassword - The cryptographically hashed password.
     * @returns {Promise<Object>} A promise that resolves to the newly created user object.
     */
    create: async (name, email, hashedPassword) => {
        const result = await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]
        );
        return result.rows[0];
    },

    /**
     * Finds a user by their email address (used for login and validation).
     * * @param {string} email - The email address to search for.
     * @returns {Promise<Object|undefined>} A promise that resolves to the user object if found, or undefined if not.
     */
    findByEmail: async (email) => {
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1", 
            [email]
        );
        return result.rows[0];
    },

    /**
     * Finds a user by their database ID (used for profile viewing).
     * * @param {number|string} userId - The unique identifier of the user.
     * @returns {Promise<Object|undefined>} A promise that resolves to the user object if found, or undefined if not.
     */
    findById: async (userId) => {
        const result = await pool.query(
            "SELECT * FROM users WHERE user_id = $1", 
            [userId]
        );
        return result.rows[0];
    },

    /**
     * Updates a user's password hash in the database.
     * * @param {number|string} userId - The unique identifier of the user.
     * @param {string} newHashedPassword - The new cryptographically hashed password.
     * @returns {Promise<void>}
     */
    updatePassword: async (userId, newHashedPassword) => {
        await pool.query(
            "UPDATE users SET password_hash = $1 WHERE user_id = $2",
            [newHashedPassword, userId]
        );
    },

    /**
     * Updates a user's display name.
     * * @param {number|string} userId - The unique identifier of the user.
     * @param {string} name - The new display name.
     * @returns {Promise<void>}
     */
    updateName: async (userId, name) => {
        await pool.query(
            "UPDATE users SET name = $1 WHERE user_id = $2",
            [name, userId]
        );
    },

    /**
     * Checks if an email exists in the database, excluding a specific user ID.
     * Used to ensure a user doesn't update their email to one already bound to another account.
     * * @param {string} email - The email address to check for conflicts.
     * @param {number|string} userId - The ID of the user requesting the change (to exclude from the search).
     * @returns {Promise<boolean>} A promise that resolves to true if the email is taken, false otherwise.
     */
    checkEmailExistsExcludingUser: async (email, userId) => {
        const result = await pool.query(
            "SELECT user_id FROM users WHERE email = $1 AND user_id != $2", 
            [email, userId]
        );
        return result.rows.length > 0;
    },

    /**
     * Updates a user's email address.
     * * @param {number|string} userId - The unique identifier of the user.
     * @param {string} email - The new email address.
     * @returns {Promise<void>}
     */
    updateEmail: async (userId, email) => {
        await pool.query(
            "UPDATE users SET email = $1 WHERE user_id = $2",
            [email, userId]
        );
    },

    /**
     * Permanently deletes a user and enforces a cascading delete of their dependencies (bookings).
     * * @param {number|string} userId - The unique identifier of the user to delete.
     * @returns {Promise<void>}
     */
    deleteAccount: async (userId) => {
        // Must delete foreign key dependencies (bookings) before the user
        await pool.query("DELETE FROM bookings WHERE user_id = $1", [userId]);
        await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);
    }
};

module.exports = User;