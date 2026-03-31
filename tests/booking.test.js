const request = require('supertest'); 
const app = require('../app')
const pool = require('../config/db');

/**
 * Helper function to create a new user and log them in.
 * Returns the session cookie so tests can perform authenticated booking actions.
 */
async function getAuthCookie() {
    const timestamp = Date.now();
    const testEmail = "booker" + timestamp + "@example.com";
    const testPassword = "SecurePassword123";

    await request(app)
        .post('/users/register')
        .send({name: "Test Booker", email: testEmail, password: testPassword});

    const loginResponse = await request(app)
        .post('/users/login')
        .send({email: testEmail, password: testPassword});

    return loginResponse.headers['set-cookie'];
}

describe('POST /bookings - Process Booking', () => {
    it("should redirect to the user's bookings when the logged-in user books a ticket", async () => {
        // 1. Arrange: Log in
        const cookie = await getAuthCookie();

        // 2. Act: Submit a booking request for Event 1
        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 }); 

        // 3. Assert: Verify success redirect to the user's bookings dashboard
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/bookings");
    });

    it('should redirect to the login view when an unauthenticated user attempts to book a ticket', async () => {
        // 1. Act: Attempt to book WITHOUT a session cookie
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1, ticketQuantity: 2 }); 

        // 2. Assert: Security bouncer should redirect to login
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/users/login");
    });

    it('should redirect with a flash message when requesting more tickets than available capacity', async () =>{
        // 1. Arrange: Log in
        const cookie = await getAuthCookie();
        
        // 2. Act: Attempt to book an impossibly high number of tickets
        const response = await request(app)
            .post('/bookings')
            .set('Cookie' , cookie)
            .send({eventId: 1, ticketQuantity: 9999});

        // 3. Assert: Verify the controller rejects and bounces back to the event page
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/events/1");

        // 4. Act (Follow-up): Follow the redirect to capture the flash message
        const followUpResponse = await request(app)
            .get('/events/1')
            .set('Cookie', cookie);

        // 5. Assert (Follow-up): Verify the exact error text is displayed
        expect(followUpResponse.text).toContain("Not enough tickets available");
    }); 

    it('should redirect back to the event details page when ticketQuantity is missing from the request', async () => {
        // 1. Arrange: Log in
        const cookie = await getAuthCookie();
        
        // 2. Act: Submit a booking with no ticket amount selected
        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1 }); 

        // 3. Assert: Validation bounce back to the event
        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/events/1");
    }); 
});

describe('POST /bookings/cancel - Cancel Booking', () => {
    it('should successfully cancel a booking and restore the event capacity', async () => {
        // 1. Arrange: Log in and create a valid booking to cancel
        const cookie = await getAuthCookie();
        
        await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 });

        // Peek into the database to get the exact ID of the booking we just made
        const result = await pool.query(
            'SELECT booking_id FROM bookings ORDER BY booking_id DESC LIMIT 1',
        )
        const bookingId = result.rows[0].booking_id;

        // 2. Act: Hit the cancellation route with the correct booking ID
        const response = await request(app)
            .post('/bookings/cancel')
            .set('Cookie', cookie)
            .send({ bookingId: bookingId });

        // 3. Assert: Verify success redirect to the dashboard
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/bookings");

        // 4. Act (Follow-up): Follow the redirect to check UI feedback
        const followUpResponse = await request(app)
            .get('/bookings')
            .set('Cookie', cookie);

        // 5. Assert (Follow-up): Verify flash message
        expect(followUpResponse.text).toContain("Booking cancelled successfully");
    });

    it('should redirect to booking view with a flash message if the booking does not belong to the logged-in user (or doesnt exist)', async () => {
        // 1. Arrange: Log in as a completely new, unrelated user
        const userB = await getAuthCookie();

        // 2. Act: Attempt to cancel a ticket ID that they do not own
        const response = await request(app)
            .post('/bookings/cancel')
            .set('Cookie', userB)
            .send({ bookingId: 9999 });

        // 3. Assert: The controller should reject this and bounce them back
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/bookings");

        // 4. Act (Follow-up): Check the flash message
        const followUpResponse = await request(app)
            .get('/bookings')
            .set('Cookie', userB);

        // 5. Assert (Follow-up): Verify authorization error
        expect(followUpResponse.text).toContain("Booking not found or unauthorized");
    });

    it('should redirect to login if the user is not authenticated', async () => {
        // 1. Act: Attempt cancellation without a cookie
        const response = await request(app)
            .post('/bookings/cancel')
            .send({ bookingId: 1 });

        // 2. Assert: Security bounce
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/users/login");
    });

});

describe('GET /bookings route - View UI Tests', () => {
    it("should return an HTML webpage containing the user's tickets", async () => {
        // 1. Arrange: Log in and buy a ticket
        const cookie = await getAuthCookie();

        await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 });
        
        // 2. Act: Request the bookings dashboard
        const response = await request(app)
            .get("/bookings")
            .set('Cookie', cookie);

        // 3. Assert: Verify the page loads and contains ticket data HTML
        expect(response.status).toBe(200); 
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>My Bookings</h1>"); 
        expect(response.text).toContain("Ticket Quantity:"); 
    });

    it('should render the empty state message if the logged in user has no bookings', async () => {
        // 1. Arrange: Log in (but do NOT buy a ticket)
        const cookie = await getAuthCookie();

        // 2. Act: Request the bookings dashboard
        const response = await request(app)
            .get('/bookings')
            .set('Cookie', cookie);

        // 3. Assert: Verify the empty state UI is rendered instead of a list
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("You haven't booked any tickets yet!");
        expect(response.text).not.toContain("Ticket Quantity:");
    });

    it('should return 302 and redirect to login if the user is not authenticated', async () => {
        // 1. Act: Request dashboard without cookie
        const response = await request(app)
            .get('/bookings')

        // 2. Assert: Security bounce
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});