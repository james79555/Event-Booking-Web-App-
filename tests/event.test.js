const request = require('supertest'); 
const app = require('../app')

describe('GET /events/:id - View Event Details', () =>{
    it('should display the event details and a booking form', async () => {
        const response = await request(app).get("/events/1");

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain('action="/bookings"');
        expect(response.text).toContain('method="POST"');
        expect(response.text).toContain('name="ticketQuantity"');
    });

    it('should return 404 status when the event is not found', async () => {
        const response = await request(app).get("/events/9999");

        expect(response.status).toBe(404);
        expect(response.text).toContain("Event not found!");
    })
});

describe('GET /events - View All Events (Catalogue)', () => {
    it('should return a 200 status and display a list of events', async () => {
        const response = await request(app).get('/events');

        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("<h1>Upcoming Events</h1>");
        expect(response.text).toContain("View Details");
        expect(response.text).toContain('href="/events/');
    });

    it('should display an empty state message if there are no events', async () => {
        const response = await request(app).get('/events');
        
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toContain("text/html");
        expect(response.text).toContain("No upcoming events at the moment");
        expect(response.text).not.toContain("View Details");
    });
});