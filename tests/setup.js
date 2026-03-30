const pool = require('../config/db');

jest.setTimeout(15000); 

beforeEach(async () => {
    await pool.query(
        'TRUNCATE users , bookings, events RESTART IDENTITY CASCADE'
    )
    await pool.query(
        "INSERT INTO events (event_id, title, total_capacity, event_date, location, description) VALUES (1,'Test Event', 1000, '2026-12-09', 'Test Location', 'Test Description')"
    )
});

afterAll(async () => {
    await pool.end();
});