const request = require('supertest'); 
const app = require('../app');
const pool = require('../config/db');

describe('GET /events/:id - View Event Details', () =>{
    it('should display the event details and a booking form when the user is authenticated', async () => {
        const timestamp = Date.now()
        const testEmail = "user" + timestamp + "@example.com"
        const testPassword = "Secure?1289";

        await request(app)
            .post('/users/register')
            .send({
                name: "Test User",
                email: testEmail,
                password: testPassword
            });

        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: testPassword
            });

        const cookies = loginResponse.headers['set-cookie'];

        const eventResponse = await request(app)
            .get("/events/1")
            .set("Cookie", cookies);

        expect(eventResponse.status).toBe(200);
        expect(eventResponse.text).not.toContain('value=""');
        expect(eventResponse.headers["content-type"]).toContain("text/html");
        expect(eventResponse.text).toContain('action="/bookings"');
        expect(eventResponse.text).toContain('method="POST"');
        expect(eventResponse.text).toContain('name="ticketQuantity"');
    });

    it('should return 302 and redirect to /user/login when the user is not authenticated', async () => {
        const response = await request(app).get("/events/1");

        expect(response.status).toBe(302);
        expect(response.headers["location"]).toBe("/users/login");
    });


    it('should redirect with flash message when the event is not found', async () => {
        const response = await request(app).get("/events/9999");

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/events");

        const sessionCookie = response.headers['set-cookie'];

        followUpResponse = await request(app)
            .get("/events/")
            .set("Cookie", sessionCookie);
        
        expect(followUpResponse.text).toContain('Event not found');
    })
});

describe('GET /events - View All Events (Catalogue)', () => {
    it('should return a 200 status and display a list of events', async () => {
        const response = await request(app).get('/events');

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>Upcoming Events</h1>");
        expect(response.text).toContain("View Details");
        expect(response.text).toContain('href="/events/');
    });

    it('should display an empty state message if there are no events', async () => {
        await pool.query(
            'TRUNCATE events CASCADE'
        );
        
        const response = await request(app).get('/events');
        
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("No upcoming events at the moment");
        expect(response.text).not.toContain("View Details");
    });

    it('should display Login and Register links when the user is not authenticated', async () => {
        const response = await request(app).get('/events');

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('href="/"');
        expect(response.text).toContain('href="/users/login"');
        expect(response.text).toContain('href="/users/register"');
        expect(response.text).not.toContain('href="/users/profile"');
    });

    it('should display Profile and Logout links when the user is authenticated', async () => {
        const timestamp = Date.now()
        const testEmail = "user" + timestamp + "@example.com"
        const testPassword = "Secure?1289";

        await request(app)
            .post('/users/register')
            .send({
                name: "Test User",
                email: testEmail,
                password: testPassword
            });

        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: testPassword
            });

        const cookies = loginResponse.headers['set-cookie'];

        const response = await request(app)
            .get('/events')
            .set("Cookie", cookies);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('href="/"');
        expect(response.text).toContain('href="/users/profile"');
        expect(response.text).toContain('action="/users/logout"');
        expect(response.text).not.toContain('href="/users/login"');
        expect(response.text).not.toContain('href="/users/register"');
    });
});