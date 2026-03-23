const request = require('supertest'); 
const app = require('../app')

describe('POST /bookings - Process Booking', () => {
    it('should return a 200 status code when hitting the booking route', async () => {
        const response = await request(app)
            .post('/bookings')
            .send({ eventId: 1, ticketQuantity: 2 }); 

        expect(response.status).toBe(200); 
        expect(response.text).toContain("booking processed");
    })

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
    }); //(1)add code to make this pass 
});

describe('GET /bookings - Show User Bookings', () => {
    it("should return a 200 status code and 'list of user's bookings'", async () => {
        const response = await request(app).get('/bookings');

        expect(response.status).toBe(200);
        expect(response.text).toContain("list of user's bookings");
    })
    //(2)write test for perfect case, write code to satisfy then cover corner cases recursively 
});

module.exports = app; 