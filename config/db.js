const { Pool } = require('pg'); 
require('dotenv').config(); 

const pool = new Pool({
    user: process.env.DB_USER, 
    host: process.env.DB_HOST, 
    port: process.env.DB_PORT, 
    database: process.env.DB_NAME
}); 

pool.connect()
    .then( () => console.log("Successfully connected to PostgreSQL!"))
    .catch(err => console.error("Database connection error", err.stack)); 

module.exports = pool;