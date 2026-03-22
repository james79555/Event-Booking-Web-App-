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
});

describe('GET /bookings - Show User Bookings', () => {
    it("should return a 200 status code and 'list of user's bookings'", async () => {
        const response = await request(app).get('/bookings');

        expect(response.status).toBe(200);
        expect(response.text).toContain("list of user's bookings");
    })
});

module.exports = app; 