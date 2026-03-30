const request = require('supertest'); 
const app = require('../app');

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

    return {
        cookie: loginResponse.headers['set-cookie'],
        email: testEmail,
        password: testPassword
    }
    
}

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

describe('POST /users/logout - User Logout', () => {
    it('should log the user out and destroy the session', async () => {
        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/logout')
            .set('Cookie', cookie);

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });

    it('should redirect unauthenticated users to login', async () => {
        const response = await request(app)
            .post('/users/logout');

        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});

describe('GET /users/profile - View User Profile', () => {
    it('should allow an authenticated user to view their profile', async () => {
        const {cookie, email} = await getAuthCookie();

        const profileResponse = await request(app)
            .get('/users/profile')
            .set('Cookie', cookie);

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.text).toContain('My Profile');
        expect(profileResponse.text).toContain(email);
    }); 

    it('should redirect unauthenticated users to the login page', async () => {
        const response = await request(app).get('/users/profile');
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});

describe('POST /users/profile/password - Change Password', () => {
    it('should allow an authenticated user to change their password', async () => {
        const {cookie, password} = await getAuthCookie();

        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: password,
                newPassword: 'NewSecure?1289'
            });

        expect(changePasswordResponse.status).toBe(200);
        expect(changePasswordResponse.text).toContain('Password changed successfully');
    });

    it('should reject a password change attempt with an incorrect current password', async () => {
        const {cookie} = await getAuthCookie();

        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: 'WrongCurrent?1289',
                newPassword: 'NewSecure?1289'
            });

        expect(changePasswordResponse.status).toBe(401);
        expect(changePasswordResponse.text).toContain('Incorrect password');
    });

    it('should reject a password change attempt with missing fields', async () => {
        const {cookie, password} = await getAuthCookie();

        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: password
            });

        expect(changePasswordResponse.status).toBe(400);
        expect(changePasswordResponse.text).toContain('All fields are required');
    });

    it('should redirect an unauthenticated user to login', async () => {
        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .send({
                currentPassword: "SecurePassword123",
                newPassword: 'NewSecure?1289'
            });

        expect(changePasswordResponse.status).toBe(302);
        expect(changePasswordResponse.headers.location).toBe('/users/login');
    });
});

describe('POST /users/profile/email - Update Email', () => {
    it('should allow an authenticated user to successfully update their email', async () => {
        const {cookie} = await getAuthCookie();
        const newEmail = "new.email" + Date.now() + "@example.com";

        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({email: newEmail});

            expect(response.status).toBe(200);
            expect(response.text).toContain('Email updated successfully');
    });

    it('should return 400 if a new email is already taken', async () => {
        const takenEmail = "taken" + Date.now() + "@example.com"
        
        await request(app)
            .post('/users/register')
            .send({
                name:"User A",
                email: takenEmail,
                password: "Secure?1289"
            });

        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({email: takenEmail});

        expect(response.status).toBe(400);
        expect(response.text).toContain('Email is already in use');
    });

    it('should return 400 if email field is missing', async () => {
        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({});

        expect(response.status).toBe(400);
        expect(response.text).toContain('Email is required');
    });

    it('should redirect unauthenticated users to login', async () => {
        const response = await request(app)
            .post('/users/profile/email')

        expect(response.status).toBe(302);
    });
});

describe('POST /users/profile/name - Update Name', () => {
    it('should allow an authenticated user to successfully update their name', async () => {
        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/profile/name')
            .set('Cookie', cookie)
            .send({name: "New Name"});

            expect(response.status).toBe(200);
            expect(response.text).toContain('Name updated successfully');
    });

    it('should return 400 if the name field is missing', async () => {
        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/profile/name')
            .set('Cookie', cookie)
            .send({});

        expect(response.status).toBe(400);
        expect(response.text).toContain('Name is required');
    });

    it('should redirect unauthenticated users to login', async () => {
        const response = await request(app)
            .post('/users/profile/name')
            .send({name: "New Name"});

        expect(response.status).toBe(302);
    });
});

describe('POST /users/profile/delete - Delete Account', () => {
    it('should allow an authenticated user to delete their account and destroy the session', async () => {
        const {cookie} = await getAuthCookie();

        const response = await request(app)
            .post('/users/profile/delete')
            .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.text).toContain('Account deleted successfully');
    });

    it('should redirect unauthenticated users to login', async () => {
        const response = await request(app)
            .post('/users/profile/delete');

        expect(response.status).toBe(302);
    });
});
