const request = require('supertest'); 
const app = require('../app')

describe('GET /events/:id - View Event Details', () =>{
    it('should display the event details and a booking form', async () => {
        const response = await request(app).get("/events/1");

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('action="/bookings');
        expect(response.text).toContain('method="POST"');
        expect(response.text).toContain('name="ticketQuantity"');
    });

    it('should return 404 status when the event is not found', async () => {
        const response = await request(app).get("/events/9999");

        expect(response.status).toBe(404);
        expect(response.text).toContain("Event not found!");
    })
});