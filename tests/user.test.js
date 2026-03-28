const request = require('supertest'); 
const app = require('../app');

describe('POST /register - User Registration', () => {
    it('should successfully register a new user and return a 201 status', async () => {
        const timestamp = Date.now()
        const testEmail = "user" + timestamp + "@example.com"

        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Test User",
                email: testEmail,
                password: "Secure?1289"
            });

        expect(response.status).toBe(201);
        expect(response.text).toContain('Registration successful');
    });

    it('should return a 400 status if required fields are missing', async () => {
        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Incomplete user",
                email: "incomplete@example.com"
            });

            expect(response.status).toBe(400);
            expect(response.text).toContain('All fields are required');
    })
});

describe('GET /register - Show Registration Form', () => {
    it('should return a 200 status and render the registration form', async () => {
        const response = await request(app).get('/users/register');
        expect(response.status).toBe(200);
        expect(response.text).toContain('<form'); 
    });
});