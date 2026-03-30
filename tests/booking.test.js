const request = require('supertest'); 
const app = require('../app')
const pool = require('../config/db');

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
        const cookie = await getAuthCookie();

        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/bookings");
    });

    it('should redirect to the login view  when an unauthenticated user attempts to book a ticket', async () => {
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/users/login");
    });

    it('should redirect with a flash message when requesting more tickets than available capacity', async () =>{
        const cookie = await getAuthCookie();
        
        const response = await request(app)
            .post('/bookings')
            .set('Cookie' , cookie)
            .send({eventId: 1, ticketQuantity: 9999});

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/events/1");

        const followUpResponse = await request(app)
            .get('/events/1')
            .set('Cookie', cookie);

        expect(followUpResponse.text).toContain("Not enough tickets available");
    }); 

    it('should redirect back to the event details page when ticketQuantity is missing from the request', async () => {
        const cookie = await getAuthCookie();
        
        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1 }); 

        expect(response.status).toBe(302); 
        expect(response.headers.location).toBe("/events/1");
    }); 
});

descibe('POST /bookings/cancel - Cancel Booking', () => {
    it('should successfully cancel a booking and restore the event capacity', async () => {
        const cookie = await getAuthCookie();
        
        await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 });

        const result = await pool.query(
            'SELECT booking_id FROM bookings ORDER BY booking_id DESC LIMIT 1',
        )
        const bookingId = result.rows[0].booking_id;

        await request(app)
            .post('/bookings/cancel')
            .set('Cookie', cookie)
            .send({ bookingId: bookingId });
    });

    it('should redirect to booking view with a flash message if the booking does not belong to the logged-in user (or doesnt exist)', async () => {
        const userB = await getAuthCookie();

        const response = await request(app)
            .post('/bookings/cancel')
            .set('Cookie', cookieB)
            .send({ bookingId: 9999 });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/bookings");

        const followUpResponse = await request(app)
            .get('/bookings')
            .set('Cookie', userB);

        expect(followUpResponse.text).toContain("Booking not found or unauthorized");
    });

    it('should redirect to login if the user is not authenticated', async () => {
        const response = await request(app)
            .post('/bookings/cancel')
            .send({ bookingId: 1 });

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe("/users/login");
    });

});

describe('GET /bookings route - View UI Tests', () => {
    it("should return an HTML webpage containing the user's tickets", async () => {
        const cookie = await getAuthCookie();

        await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 });
        
        const response = await request(app)
            .get("/bookings")
            .set('Cookie', cookie);

        expect(response.status).toBe(200); 
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>My Bookings</h1>"); 
        expect(response.text).toContain("Ticket Quantity:"); 
    });

    it('should render the empty state message if the logged in user has no bookings', async () => {
        const cookie = await getAuthCookie();

        const response = await request(app)
            .get('/bookings')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("You haven't booked any tickets yet!");
        expect(response.text).not.toContain("Ticket Quantity:");
    });

    it('should return 302 and redirect to login if the user is not authenticated', async () => {
        const response = await request(app)
            .get('/bookings')

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});
