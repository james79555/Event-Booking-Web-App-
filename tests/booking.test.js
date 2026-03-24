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
    it("should return a 200 status code and an array of tickets for a valid user", async () => {
        const response = await request(app).get('/bookings?userId=1');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true); 
        expect(response.body.length).toBeGreaterThan(0);
    });
   
    it('should return a 200 status and an empty array if the user has no bookings', async () => {
        const response = await request(app).get('/bookings?userId=9999');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
        expect(response.body.length).toBe(0);
    });

    it('should return a 400 status if the userID is missing', async () => {
        const response = await request(app).get('/bookings');

        expect(response.status).toBe(400);
        expect(response.text).toContain('User ID is Required!');
    });
});

module.exports = app; 