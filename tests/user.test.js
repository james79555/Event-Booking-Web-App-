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
    });
});

describe('GET /register - Show Registration Form', () => {
    it('should return a 200 status and render the registration form', async () => {
        const response = await request(app).get('/users/register');
        expect(response.status).toBe(200);
        expect(response.text).toContain('<form'); 
    });
});

describe('POST /users/login - User Login', () => {
    it('should log the user in with the correct credentials', async () => {
        const timestamp = Date.now();
        const testEmail = "loginuser" + timestamp + "@example.com";
        const testPassword = "Secure?1289";
        
        await request(app)
            .post('/users/register')
            .send({
                name:"Test Login",
                email: testEmail,
                password: testPassword
            });

        const response = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: testPassword
            });
            
            expect(response.status).toBe(200);
            expect(response.text).toContain('login successful');
            expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject a login attempt with an unregistered email', async () => {
        const response = await request(app)
            .post('/users/login')
            .send({
                email: "wrongEmail@example.com",
                password: "Secure?1289"
            });

            expect(response.status).toBe(401);
            expect(response.text).toContain('Invalid email or password');
    });

    it('should reject a login attempt with an incorrect password', async () => {
        const timestamp = Date.now();
        const testEmail = "loginuser" + timestamp + "@example.com";
        const testPassword = "Secure?1289";
        
        await request(app)
            .post('/users/register')
            .send({
                name:"Test Login",
                email: testEmail,
                password: testPassword
            });

        
        const response = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: 'wrongPassword1'
            });

            expect(response.status).toBe(401);
            expect(response.text).toContain('Invalid email or password');
    });

});

describe('GET /login - Show Login Form', () => {
    it('should return a 200 status and render the login form', async () => {
        const response = await request(app).get('/users/login');
        expect(response.status).toBe(200);
        expect(response.text).toContain('<form'); 
    });
});

describe('GET /users/profile - View User Profile', () => {
    it('should allow an authenticated user to view their profile', async () => {
        const timestamp = Date.now();
        const testEmail = "profileuser" + timestamp + "@example.com";
        const testPassword = "Secure?1289";
        
        await request(app)
            .post('/users/register')
            .send({
                name:"Test Profile",
                email: testEmail,
                password: testPassword
            });

        const loginResponse = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: testPassword
            });

        const cookies = loginResponse.headers['set-cookie'];

        const profileResponse = await request(app)
            .get('/users/profile')
            .set('Cookie', cookies);

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.text).toContain('Test Profile');
        expect(profileResponse.text).toContain(testEmail);
    }); 

    it('should redirect unauthenticated users to the login page', async () => {
        const response = await request(app).get('/users/profile');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
})