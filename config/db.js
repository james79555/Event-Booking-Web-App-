const { Pool } = require('pg');
require('dotenv').config();

// The Pool configuration now accepts a single DATABASE_URL string.
// It also conditionally applies SSL encryption. 
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;