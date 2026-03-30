const pool = require('../config/db');
const argon2 = require('argon2');


const showRegistrationForm = (req, res) => {
    res.status(200).render('register');
}

const processRegistration = async (req, res) => {
    try{
        const {name, email, password} = req.body

        if (!name || !email || !password) {
            return res.redirect('/users/register');
        }

        const hashedPassword = await argon2.hash(password);

        const result = await pool.query(
            "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3)",
            [name,email,hashedPassword]
        );

        res.redirect("/users/login");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error during registration");
    }
}

const showLoginForm = (req, res) => {
    res.status(200).render('login');
}

const processLogin = async (req, res) => {
    try{
        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).send('Email and password are required')
        }

        const result = await pool.query(
            "SELECT * FROM users where email = $1", [email]
        )

        if (result.rows.length === 0) {
            return res.redirect('/users/login');
        }

        const user = result.rows[0]

        const isMatch = await argon2.verify(user.password_hash, password);

        if (!isMatch) {
            return res.redirect('/users/login');
        }
        req.session.userId = user.user_id;

        const redirectUrl = req.session.returnTo || '/';
        delete req.session.returnTo;

        res.redirect(redirectUrl);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login');
    }
}

const processLogout = (req, res) => {
    try{
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }
        req.session.destroy();
        res.clearCookie('connect.sid').redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during logout');
    }
   
    
}

const updatePassword = async (req,res) => {
    try{
        const userId = req.session.userId;
        const {currentPassword, newPassword} = req.body;

        if (!userId) {
            return res.redirect('/users/login');
        }

        if(!currentPassword || !newPassword) {
            return res.redirect('/users/profile');
        }

        const result = await pool.query(
            "SELECT password_hash FROM users WHERE user_id = $1", [userId]
        )
        const user = result.rows[0];

        const isMatch = await argon2.verify(user.password_hash, currentPassword);

        if (!isMatch) {
            return res.redirect('/users/profile');
        }

        const newHashedPassword = await argon2.hash(newPassword);

        const passwordChange = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE user_id = $2",
            [newHashedPassword, userId]
        );

        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating password');
    }
}

const updateName = async (req,res) => {
    try{
        const userId = req.session.userId;
        const {name} = req.body;

        if (!userId) {
            return res.redirect('/users/login');
        }

        if(!name) {
            return res.redirect('/users/profile');
        }

        const nameChange = await pool.query(
            "UPDATE users SET name = $1 WHERE user_id = $2",
            [name, userId]
        );

        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating name');
    }
}

const updateEmail = async (req,res) => {
    try{
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }

        const {email} = req.body;

        if(!email) {
            return res.redirect('/users/profile');
        }

        const existingEmail = await pool.query(
            "SELECT user_id FROM users WHERE email = $1 AND user_id != $2", [email, userId]
        )

        if (existingEmail.rows.length > 0) {
            return res.redirect('/users/profile');
        }

        const emailChange = await pool.query(
            "UPDATE users SET email = $1 WHERE user_id = $2",
            [email, userId]
        );

        res.redirect('/users/profile');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while updating email');
    }
}

const deleteAccount = async (req,res) => {
    try{
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');
        }

        await pool.query(
            "DELETE FROM bookings WHERE user_id = $1", [userId]
        );

        await pool.query(
            "DELETE FROM users WHERE user_id = $1", [userId]
        );

        req.session.destroy();

        res.clearCookie('connect.sid');
        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error while deleting account');
    }
}


const showProfile = async (req, res) => {
    try{
        const userId = req.session.userId;

        if (!userId) {
            return res.redirect('/users/login');    
        }

        const result = await pool.query(
            'SELECT name, email FROM users WHERE user_id = $1', [userId]
        );

        const user = result.rows[0];

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