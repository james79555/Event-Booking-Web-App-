const pool = require('../config/db');
const argon2 = require('argon2');


const showRegistrationForm = (req, res) => {
    res.status(200).render('register');
}

const processRegistration = async (req, res) => {
    try{
        const {name, email, password} = req.body

        if (!name || !email || !password) {
            return res.status(400).send('All fields are required');
        }

        const hashedPassword = await argon2.hash(password);

        const result = await pool.query(
            "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3)",
            [name,email,hashedPassword]
        );

        res.status(201).send("Registration successful");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error during registration");
    }
}

const showLoginForm = (req, res) => {
    res.status(200).render('login');
}

const processLogin = async (req, res) => {
    //res.send('login processed');
    try{
        const {email, password} = req.body

        if (!email || !password) {
            return res.status(400).send('Email and password are required')
        }

        const result = await pool.query(
            "SELECT * FROM users where email = $1", [email]
        )

        if (result.rows.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const user = result.rows[0]

        const isMatch = await argon2.verify(user.password_hash, password);

        if (!isMatch) {
            return res.status(401).send('Invalid email or password');
        }

        res.status(200).send('login successful');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error during login');
    }
}

const showProfile = (req, res) => {
    res.send('user profile page');
}

module.exports = {
    showRegistrationForm,
    processRegistration,
    showLoginForm,
    processLogin,
    showProfile
}