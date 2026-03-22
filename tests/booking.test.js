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
})

module.exports = app; 