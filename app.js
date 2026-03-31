/**
 * @file Main Application Entry Point.
 * Configures the Express server, middleware pipeline, secure session management, and root routing.
 * Acts as the foundational spine for the Event Booking application.
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');

const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express()
const port = process.env.PORT || 3000;

// ==========================================
// 1. ENGINE & STATIC ASSETS
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Parses incoming form data (POST requests) and JSON payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Exposes the 'public' folder to the browser so it can download CSS and client-side scripts
app.use(express.static('public'));


// ==========================================
// 2. SESSION & FLASH MEMORY
// ==========================================
// Configures secure, server-side memory for tracking logged-in users and temporary messages.
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false, 
    saveUninitialized: false
}));

// Initializes the flash memory. MUST be invoked after the session middleware 
// because flash messages are inherently stored inside the session object.
app.use(flash());


// ==========================================
// 3. GLOBAL VIEW VARIABLES (res.locals)
// ==========================================

/**
 * Global Flash Middleware.
 * Extracts temporary flash messages from the session and binds them to `res.locals`.
 * This makes `successMsg` and `errorMsg` automatically available to every EJS template.
 * * @function globalFlashMiddleware
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function to continue the pipeline.
 */
app.use((req, res, next) => {
    res.locals.successMsg = req.flash('success');
    res.locals.errorMsg = req.flash('error');

    next();
});

/**
 * Global Authentication State Middleware.
 * Extracts the user's ID from their secure session and binds it to `res.locals`.
 * Allows global partials (like navbar.ejs) to instantly know if a user is logged in
 * without requiring controllers to pass the user ID manually on every render.
 * * @function globalAuthStateMiddleware
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function to continue the pipeline.
 */
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;

    next();
});


// ==========================================
// 4. ROUTER MOUNTING
// ==========================================
app.use('/events', eventRoutes);
app.use('/users', userRoutes);
app.use('/bookings', bookingRoutes);

/**
 * Base Route Handler.
 * Intercepts traffic hitting the root domain and redirects it to the event catalogue.
 * * @name get/
 * @function
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
app.get('/', (req, res) => {
    res.redirect('/events');
});

// Export the Express app so Supertest can use it in the test suite
module.exports = app;


// ==========================================
// 5. SERVER INITIALIZATION
// ==========================================
// Conditional startup: Prevents Jest from triggering a persistent background server 
// (which causes "Open Handle" timeouts) when running the automated test suite.
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on localhost:${port}`);
    });
}