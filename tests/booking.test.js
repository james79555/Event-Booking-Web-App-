const request = require('supertest'); 
const app = require('../app')

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
    it('should return a 200 status code when a logged-in user books a ticket', async () => {
        const cookie = await getAuthCookie();

        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(200); 
        expect(response.text).toContain("booking processed");
    });

    it('should return a 401 status code when an unauthenticated user attempts to book a ticket', async () => {
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(401); 
        expect(response.text).toContain("Unauthorized");
    });

    it('should return a 400 status when requesting more tickets than available capacity', async () =>{
        const cookie = await getAuthCookie();
        
        const response = await request(app)
            .post('/bookings')
            .set('Cookie' , cookie)
            .send({eventId: 1, ticketQuantity: 9999});

        expect(response.status).toBe(400);
        expect(response.text).toContain('Not Enough Capacity!');
    }); 

    it('should return a 400 status when ticketQuantity is missing from the request', async () => {
        const cookie = await getAuthCookie();
        
        const response = await request(app)
            .post('/bookings')
            .set('Cookie', cookie)
            .send({ eventId: 1 }); 

        expect(response.status).toBe(400); 
        expect(response.text).toContain("Missing quantity!");
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
