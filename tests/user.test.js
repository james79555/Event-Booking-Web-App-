const request = require('supertest'); 
const app = require('../app');
const pool = require('../config/db'); 

/**
 * Helper function to create a new user and log them in.
 * Returns the session cookie and credentials so tests can act as an authenticated user.
 */
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
    it('should successfully register a new user and redirect to login view', async () => {
        // 1. Arrange: Prepare unique user data
        const timestamp = Date.now()
        const testEmail = "user" + timestamp + "@example.com"

        // 2. Act: Submit the registration form
        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Test User",
                email: testEmail,
                password: "Secure?1289"
            });

        // 3. Assert: Check for the success redirect to the login page
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });

    it('should redirect back to registration form if required fields are missing', async () => {
        // 1. Act: Submit incomplete data (missing password)
        const response = await request(app)
            .post('/users/register')
            .send({
                name: "Incomplete user",
                email: "incomplete@example.com"
            });

        // 2. Assert: Check that the user is bounced back to the registration form
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/register');
    });
});

describe('GET /register - Show Registration Form', () => {
    it('should return a 200 status and render the registration form', async () => {
        // 1. Act: Request the registration page
        const response = await request(app).get('/users/register');
        
        // 2. Assert: Verify the page loads and contains an HTML form
        expect(response.status).toBe(200);
        expect(response.text).toContain('<form'); 
    });
});

describe('POST /users/login - User Login', () => {
    it('should log the user in with the correct credentials', async () => {
        // 1. Arrange: Create a user in the database first
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

        // 2. Act: Attempt to log in with those exact credentials
        const response = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: testPassword
            });
            
        // 3. Assert: Verify redirect to home and that a session cookie was issued
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
        expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should reject a login attempt with an unregistered email', async () => {
        // 1. Act: Attempt login with a completely fake email
        const response = await request(app)
            .post('/users/login')
            .send({
                email: "wrongEmail@example.com",
                password: "Secure?1289"
            });

        // 2. Assert: Verify the user is bounced back to the login page
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });

    it('should reject a login attempt with an incorrect password', async () => {
        // 1. Arrange: Register a valid user
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

        // 2. Act: Attempt login with the RIGHT email but WRONG password
        const response = await request(app)
            .post('/users/login')
            .send({
                email: testEmail,
                password: 'wrongPassword1'
            });

        // 3. Assert: Verify the bounce back to login
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');

        // 4. Act (Follow-up): Follow the redirect using the cookie to check the flash message
        const sessionCookie = response.headers['set-cookie'];
        const followUpResponse = await request(app)
            .get('/users/login')
            .set('Cookie', sessionCookie);

        // 5. Assert (Follow-up): Verify the error message rendered on the page
        expect(followUpResponse.text).toContain("Invalid email or password");
    });
});

describe('GET /login - Show Login Form', () => {
    it('should return a 200 status and render the login form', async () => {
        // 1. Act: Hit the login route
        const response = await request(app).get('/users/login');
        
        // 2. Assert: Verify it loads successfully and has a form
        expect(response.status).toBe(200);
        expect(response.text).toContain('<form'); 
    });
});

describe('POST /users/logout - User Logout', () => {
    it('should log the user out and destroy the session', async () => {
        // 1. Arrange: Log a user in and get their auth cookie
        const {cookie} = await getAuthCookie();

        // 2. Act: Submit a logout request using their cookie
        const response = await request(app)
            .post('/users/logout')
            .set('Cookie', cookie);

        // 3. Assert: Verify they are redirected to the homepage
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
    });

    it('should redirect unauthenticated users to login', async () => {
        // 1. Act: Attempt to logout WITHOUT a session cookie
        const response = await request(app)
            .post('/users/logout');

        // 2. Assert: Security bouncer should redirect them to login
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});

describe('GET /users/profile - View User Profile', () => {
    it('should allow an authenticated user to view their profile', async () => {
        // 1. Arrange: Get the auth cookie and the user's email
        const {cookie, email} = await getAuthCookie();

        // 2. Act: Request the profile page using the cookie
        const profileResponse = await request(app)
            .get('/users/profile')
            .set('Cookie', cookie);

        // 3. Assert: Verify the page loads and displays their specific email
        expect(profileResponse.status).toBe(200);
        expect(profileResponse.text).toContain('My Profile');
        expect(profileResponse.text).toContain(email);
    }); 

    it('should redirect unauthenticated users to the login page', async () => {
        // 1. Act: Request profile without a cookie
        const response = await request(app).get('/users/profile');
        
        // 2. Assert: Security bouncer redirects to login
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/login');
    });
});

describe('POST /users/profile/password - Change Password', () => {
    it('should allow an authenticated user to change their password', async () => {
        // 1. Arrange: Log in and get current credentials
        const {cookie, password} = await getAuthCookie();

        // 2. Act: Submit the password change form
        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: password,
                newPassword: 'NewSecure?1289'
            });

        // 3. Assert: Verify redirect back to profile on success
        expect(changePasswordResponse.status).toBe(302);
        expect(changePasswordResponse.headers.location).toBe('/users/profile');
    });

    it('should reject a password change attempt with an incorrect current password', async () => {
        // 1. Arrange: Log in
        const {cookie} = await getAuthCookie();

        // 2. Act: Submit form with the WRONG current password
        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: 'WrongCurrent?1289',
                newPassword: 'NewSecure?1289'
            });

        // 3. Assert: Verify failure bounces them back to the profile
        expect(changePasswordResponse.status).toBe(302);
        expect(changePasswordResponse.headers.location).toBe('/users/profile');
    });

    it('should reject a password change attempt with missing fields', async () => {
        // 1. Arrange: Log in
        const {cookie, password} = await getAuthCookie();

        // 2. Act: Submit form without providing the new password
        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .set('Cookie', cookie)
            .send({
                currentPassword: password
            });

        // 3. Assert: Verify failure bounce
        expect(changePasswordResponse.status).toBe(302);
        expect(changePasswordResponse.headers.location).toBe('/users/profile');
    });

    it('should redirect an unauthenticated user to login', async () => {
        // 1. Act: Attempt password change WITHOUT a cookie
        const changePasswordResponse = await request(app)
            .post('/users/profile/password')
            .send({
                currentPassword: "SecurePassword123",
                newPassword: 'NewSecure?1289'
            });

        // 2. Assert: Security bouncer redirects to login
        expect(changePasswordResponse.status).toBe(302);
        expect(changePasswordResponse.headers.location).toBe('/users/login');
    });
});

describe('POST /users/profile/email - Update Email', () => {
    it('should allow an authenticated user to successfully update their email', async () => {
        // 1. Arrange: Log in and generate a brand new email string
        const {cookie} = await getAuthCookie();
        const newEmail = "new.email" + Date.now() + "@example.com";

        // 2. Act: Submit the email change form
        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({email: newEmail});

        // 3. Assert: Verify success redirect
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/profile');
    });

    it('should return 400 if a new email is already taken', async () => {
        // 1. Arrange: Create 'User A' to take up an email address
        const takenEmail = "taken" + Date.now() + "@example.com"
        await request(app)
            .post('/users/register')
            .send({
                name:"User A",
                email: takenEmail,
                password: "Secure?1289"
            });

        // 2. Arrange: Log in as 'User B'
        const {cookie} = await getAuthCookie();

        // 3. Act: 'User B' attempts to change their email to 'User A's' email
        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({email: takenEmail});

        // 4. Assert: System rejects duplicate email and bounces back to profile
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/profile');
    });

    it('should redirect to profile view if email field is missing', async () => {
        // 1. Arrange: Log in
        const {cookie} = await getAuthCookie();

        // 2. Act: Submit an empty email form
        const response = await request(app)
            .post('/users/profile/email')
            .set('Cookie', cookie)
            .send({});

        // 3. Assert: Validation bounce
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/profile');
    });

    it('should redirect unauthenticated users to login', async () => {
        // 1. Act: Attempt update without cookie
        const response = await request(app)
            .post('/users/profile/email')

        // 2. Assert: Security bounce
        expect(response.status).toBe(302);
    });
});

describe('POST /users/profile/name - Update Name', () => {
    it('should allow an authenticated user to successfully update their name', async () => {
        // 1. Arrange: Log in
        const {cookie} = await getAuthCookie();

        // 2. Act: Submit the name change form
        const response = await request(app)
            .post('/users/profile/name')
            .set('Cookie', cookie)
            .send({name: "New Name"});

        // 3. Assert: Verify success redirect
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/profile');

        // 4. Act (Follow-up): Follow redirect to check the flash message
        const followUpResponse = await request(app)
            .get('/users/profile')
            .set('Cookie', cookie);

        // 5. Assert (Follow-up): Verify the UI feedback
        expect(followUpResponse.text).toContain("Name updated successfully");
    });

    it('should redirect to profile view if the name field is missing', async () => {
        // 1. Arrange: Log in
        const {cookie} = await getAuthCookie();

        // 2. Act: Submit empty name form
        const response = await request(app)
            .post('/users/profile/name')
            .set('Cookie', cookie)
            .send({});

        // 3. Assert: Validation bounce
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/users/profile');
    });

    it('should redirect unauthenticated users to login', async () => {
        // 1. Act: Attempt update without cookie
        const response = await request(app)
            .post('/users/profile/name')
            .send({name: "New Name"});

        // 2. Assert: Security bounce
        expect(response.status).toBe(302);
    });
});

describe('POST /users/profile/delete - Delete Account', () => {
    it('should allow an authenticated user to delete their account and destroy the session', async () => {
        // 1. Arrange: Log in
        const {cookie} = await getAuthCookie();

        // 2. Act: Hit the delete account route
        const response = await request(app)
            .post('/users/profile/delete')
            .set('Cookie', cookie);

        // 3. Assert: Verify successful redirection to the homepage
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('/');
    });

    it('should redirect unauthenticated users to login', async () => {
        // 1. Act: Attempt deletion without cookie
        const response = await request(app)
            .post('/users/profile/delete');

        // 2. Assert: Security bounce
        expect(response.status).toBe(302);
    });
});