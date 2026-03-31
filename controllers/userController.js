const argon2 = require('argon2');
const User = require('../models/User'); 

/**
 * Renders the user registration form.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const showRegistrationForm = (req, res) => {
    res.status(200).render('register');
}

/**
 * Processes new user registration.
 * Cryptographically hashes the user's password using Argon2 before storing it 
 * in the database to protect against data breaches.
 * * @param {Object} req - The Express request object containing name, email, and plaintext password.
 * @param {Object} res - The Express response object.
 */
const processRegistration = async (req, res) => {
    try {
        const {name, email, password} = req.body

        if (!name || !email || !password) {
            req.flash('error', 'All fields are required');
            return res.redirect('/users/register');
        }

        const hashedPassword = await argon2.hash(password);

        await User.create(name, email, hashedPassword);

        req.flash('success', 'Registration successful! Please log in.');
        res.redirect("/users/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error during registration");
    }
}

/**
 * Renders the user login form.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const showLoginForm = (req, res) => {
    res.status(200).render('login');
}

/**
 * Processes user authentication.
 * Utilizes the "ReturnTo" breadcrumb pattern: if the session has a saved URL 
 * (from attempting to hit a protected route while logged out), it teleports the user 
 * directly there upon successful login. Otherwise, it defaults to the root catalogue.
 * * @param {Object} req - The Express request object containing email and password.
 * @param {Object} res - The Express response object.
 */
const processLogin = async (req, res) => {
    try {
        const {email, password} = req.body

        if (!email || !password) {
            req.flash('error', 'Email and password are required');
            return res.redirect('/users/login');
        }

        // The Model returns the user directly, or undefined if not found
        const user = await User.findByEmail(email);

        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }

        const isMatch = await argon2.verify(user.password_hash, password);

        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/users/login');
        }
        
        req.session.userId = user.user_id;

        // Consume the breadcrumb if it exists, default to home if it doesn't
        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;

        req.flash('success', 'Logged in successfully');
        res.redirect(redirectUrl);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login');
    }
}

/**
 * Terminates the user's active session and clears associated cookies.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const processLogout = (req, res) => {
    try {
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }
        delete req.session.userId;

        req.flash('success', 'Logged out successfully');
        res.clearCookie('connect.sid').redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during logout');
    }
}

/**
 * Processes a user's password change request.
 * Requires verification of the current password to ensure the session 
 * hasn't been hijacked before applying the new Argon2 hash.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const updatePassword = async (req,res) => {
    try {
        const userId = req.session.userId;
        const {currentPassword, newPassword} = req.body;

        if (!userId) {
            req.flash('error', 'You must be logged in to change your password');
            return res.redirect('/users/login');
        }

        if(!currentPassword || !newPassword) {
            req.flash('error', 'Current and new password are required');
            return res.redirect('/users/profile');
        }

        const user = await User.findById(userId);

        const isMatch = await argon2.verify(user.password_hash, currentPassword);

        if (!isMatch) {
            req.flash('error', 'Password is incorrect');
            return res.redirect('/users/profile');
        }

        const newHashedPassword = await argon2.hash(newPassword);

        await User.updatePassword(userId, newHashedPassword);

        req.flash('success', 'Password updated successfully');
        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating password');
    }
}

/**
 * Updates the authenticated user's display name.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const updateName = async (req,res) => {
    try {
        const userId = req.session.userId;
        const {name} = req.body;

        if (!userId) {
            req.flash('error', 'You must be logged in to change your name');
            return res.redirect('/users/login');
        }

        if(!name) {
            req.flash('error', 'Name cannot be empty');
            return res.redirect('/users/profile');
        }

        await User.updateName(userId, name);

        req.flash('success', 'Name updated successfully');
        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating name');
    }
}

/**
 * Updates the authenticated user's email address.
 * Cross-references the database to ensure the requested email is not already 
 * bound to another account.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const updateEmail = async (req,res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error', 'You must be logged in to change your email');
            return res.redirect('/users/login');
        }

        const {email} = req.body;

        if(!email) {
            req.flash('error', 'Email cannot be empty');
            return res.redirect('/users/profile');
        }

        const isEmailTaken = await User.checkEmailExistsExcludingUser(email, userId);

        if (isEmailTaken) {
            req.flash('error', 'Email is already in use');
            return res.redirect('/users/profile');
        }

        await User.updateEmail(userId, email);

        req.flash('success', 'Email updated successfully');
        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating email');
    }
}

/**
 * Permanently deletes the authenticated user's account.
 * Enforces a cascading delete manually by removing the user's dependent records (bookings)
 * before deleting the user account itself to maintain referential integrity in the database.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const deleteAccount = async (req,res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error', 'You must be logged in to delete your account');
            return res.redirect('/users/login');
        }

        await User.deleteAccount(userId);

        delete req.session.userId;
        res.clearCookie('connect.sid');

        req.flash('success', 'Account deleted successfully');
        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while deleting account');
    }
}

/**
 * Retrieves the profile data for the currently authenticated user and renders the profile view.
 * * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 */
const showProfile = async (req, res) => {
    try {
        const userId = req.session.userId;

        if (!userId) {
            req.flash('error', 'You must be logged in to view your profile');
            return res.redirect('/users/login');    
        }

        const user = await User.findById(userId);

        res.status(200).render('profile', { user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while fetching profile');
    }
}

module.exports = {
    showRegistrationForm,
    processRegistration,
    showLoginForm,
    processLogin,
    processLogout,
    updatePassword,
    updateName,
    updateEmail,
    deleteAccount,
    showProfile
}