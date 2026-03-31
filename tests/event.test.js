const request = require('supertest'); 
const app = require('../app');
const pool = require('../config/db');

describe('GET /events/:id - View Event Details', () =>{
    it('should display the event details and a booking form when the user is authenticated', async () => {
        // 1. Arrange: Register and log in a user to get their cookie
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

        // 2. Act: Hit the event details page with the auth cookie
        const eventResponse = await request(app)
            .get("/events/1")
            .set("Cookie", cookies);

        // 3. Assert: Verify the page loads and the booking form is fully rendered
        expect(eventResponse.status).toBe(200);
        expect(eventResponse.text).not.toContain('value=""');
        expect(eventResponse.headers["content-type"]).toContain("text/html");
        expect(eventResponse.text).toContain('action="/bookings"');
        expect(eventResponse.text).toContain('method="POST"');
        expect(eventResponse.text).toContain('name="ticketQuantity"');
    });

    it('should return 302 and redirect to /user/login when the user is not authenticated', async () => {
        // 1. Act: Request event details WITHOUT an auth cookie
        const response = await request(app).get("/events/1");

        // 2. Assert: Security bouncer redirects them to log in
        expect(response.status).toBe(302);
        expect(response.headers["location"]).toBe("/users/login");
    });


    it('should redirect with flash message when the event is not found', async () => {
        // 1. Act: Request an event ID that doesn't exist
        const response = await request(app).get("/events/9999");

        // 2. Assert: Verify bounce back to the catalogue
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/events");

        // 3. Act (Follow-up): Follow the redirect to check the UI flash message
        const sessionCookie = response.headers['set-cookie'];
        const followUpResponse = await request(app)
            .get("/events/")
            .set("Cookie", sessionCookie);
        
        // 4. Assert (Follow-up): Check the error text
        expect(followUpResponse.text).toContain('Event not found');
    })

    it('should display a message when the event is sold out and hide the form', async () => {
        // 1. Arrange: Manipulate the database directly to force a sold-out state
        await pool.query(
            'UPDATE events SET tickets_sold = 1000 WHERE event_id = 1'
        );

        // Prepare an authenticated user so the security bouncer lets us in
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

        // 2. Act: Visit the sold-out event page
        const response = await request(app)
            .get("/events/1")
            .set("Cookie", cookies);

        // 3. Assert: Verify the booking form is replaced with the sold-out UI
        expect(response.status).toBe(200);
        expect(response.text).toContain("This event is sold out");
        expect(response.text).toContain('disabled');
        expect(response.text).not.toContain('name=\"ticketQuantity\"');

        // 4. Cleanup: Reset the database state so this test doesn't break subsequent tests
        await pool.query(
            "UPDATE events SET tickets_sold = 0 WHERE event_id = 1"
        )
    });
});

describe('GET /events - View All Events (Catalogue)', () => {
    it('should return a 200 status and display a list of events', async () => {
        // 1. Act: Hit the catalogue root
        const response = await request(app).get('/events');

        // 2. Assert: Verify it renders HTML and displays event cards
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>Upcoming Events</h1>");
        expect(response.text).toContain("View Details");
        expect(response.text).toContain('href="/events/');
    });

    it('should display an empty state message if there are no events', async () => {
        // 1. Arrange: Wipe all events from the database
        await pool.query(
            'TRUNCATE events CASCADE'
        );
        
        // 2. Act: Request the catalogue
        const response = await request(app).get('/events');
        
        // 3. Assert: Verify the empty state UI renders instead of cards
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("No upcoming events at the moment");
        expect(response.text).not.toContain("View Details");
    });

    it('should display Login and Register links when the user is not authenticated', async () => {
        // 1. Act: Request the catalogue with NO auth cookie
        const response = await request(app).get('/events');

        // 2. Assert: Verify the dynamic navbar shows the "Guest" options
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('href="/"');
        expect(response.text).toContain('href="/users/login"');
        expect(response.text).toContain('href="/users/register"');
        expect(response.text).not.toContain('href="/users/profile"');
    });

    it('should display Profile and Logout links when the user is authenticated', async () => {
        // 1. Arrange: Create a user and get an auth cookie
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

        // 2. Act: Request the catalogue WITH the auth cookie
        const response = await request(app)
            .get('/events')
            .set("Cookie", cookies);

        // 3. Assert: Verify the dynamic navbar shows the "Logged In" options
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('href="/"');
        expect(response.text).toContain('href="/users/profile"');
        expect(response.text).toContain('action="/users/logout"');
        expect(response.text).not.toContain('href="/users/login"');
        expect(response.text).not.toContain('href="/users/register"');
    });
});