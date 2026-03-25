const request = require('supertest'); 
const app = require('../app')

describe('POST /bookings - Process Booking', () => {
    it('should return a 200 status code when hitting the booking route', async () => {
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(200); 
        expect(response.text).toContain("booking processed");
    });

    it('should return a 400 status when requesting more tickets than available capacity', async () =>{
        const response = await request(app)
        .post('/bookings')
        .send({eventId: 1, ticketQuantity: 9999});

        expect(response.status).toBe(400);
        expect(response.text).toContain('Not Enough Capacity!');
    }); 

    it('should return a 400 status when ticketQuantity is missing from the request', async () => {
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1 }); 

        expect(response.status).toBe(400); 
        expect(response.text).toContain("Missing quantity!");
    }); 
});

describe('GET /bookings - Show User Bookings', () => {
    it('should return a 400 status if the userID is missing', async () => {
        const response = await request(app).get('/bookings');

        expect(response.status).toBe(400);
        expect(response.text).toContain('User ID is Required!');
    });
});

describe('GET /bookings route - View UI Tests', () => {
    it("should return an HTML webpage containing the user's tickets", async () => {
        const response = await request(app).get("/bookings?userId=1");

        expect(response.status).toBe(200); 
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>My Bookings</h1>"); 
        expect(response.text).toContain("Ticket Quantity:"); 
    });

    it('should render the empty state message if the user has no bookings', async () => {
        const response = await request(app).get('/bookings?userId=9999');

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");

        expect(response.text).toContain("You haven't booked any tickets yet!");
        expect(response.text).not.toContain("Ticket Quantity:");
    });
});
