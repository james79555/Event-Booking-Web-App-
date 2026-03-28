const pool = require('../config/db');
const argon2 = require('argon2');


const showRegistrationForm = (req, res) => {
    res.send('registration form');
}

const processRegistration = async (req, res) => {
    //res.send('user registered');
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
    res.send('login page'); 
}

const processLogin = (req, res) => {
    res.send('login processed'); 
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