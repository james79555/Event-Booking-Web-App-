# 🎟️ Full-Stack Event Booking Platform

A robust, full-stack event ticketing application built with Node.js, Express, and PostgreSQL. This application allows users to browse an event catalogue, securely register for accounts, manage their profiles, and book or cancel tickets with real-time capacity protections.

## 🎓 Project Motivation & Academic Context

[cite_start]This project was developed as the summative coursework for the Software Development 2 module[cite: 47]. [cite_start]The goal of this assignment was to design, build, test, deploy, and document an Event Booking & Ticketing Web Application[cite: 56]. 

It was built to demonstrate the clear, practical application of several advanced software engineering concepts, including:
* [cite_start]**Architectural Patterns:** Strict use of the MVC (Model-View-Controller) design pattern[cite: 64].
* [cite_start]**Programming Paradigms:** Application of Object-oriented programming (OOP) and Event-driven programming[cite: 59, 60].
* [cite_start]**Database Integration:** Relational data modelling and integration using SQL[cite: 63].
* [cite_start]**Professional Workflows:** Utilization of Agile-influenced workflows, automated testing, and proper version control using Git[cite: 67, 68].

## ✨ Key Features

* **Secure Authentication:** User registration and login utilizing `argon2` cryptographic hashing and express sessions.
* **Real-Time Capacity Locking:** Backend validation prevents users from overbooking. If an event sells out, the UI dynamically updates to block further purchases.
* **Intelligent Routing (Breadcrumbs):** Unauthenticated users attempting to book a ticket are redirected to login, and seamlessly teleported back to their intended purchase page post-login.
* **Comprehensive Profile Management:** Users can update their display names, emails (with duplication checks), passwords, and permanently delete their accounts along with all associated data.
* **Automated Testing:** Backed by a suite of 42+ automated integration tests using Jest and Supertest.

## 🏗️ Architecture & Tech Stack

This application was engineered using a **Strict MVC (Model-View-Controller)** architectural pattern to ensure a clean separation of concerns, maximum maintainability, and highly readable controllers.

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (`pg` node-postgres)
* **Frontend Views:** EJS (Embedded JavaScript), custom CSS
* **Security:** Argon2, Express-Session
* **Testing:** Jest, Supertest

## 🚀 Local Installation & Setup

If you wish to run this application locally on your machine, follow these steps:

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/James79555/Event-Booking-Web-App-.git
cd Event-Booking-Web-App-
\`\`\`

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Database Setup
Create a PostgreSQL database named `event_booking`. Then, run the following SQL commands to build your tables:

\`\`\`sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    total_capacity INTEGER NOT NULL,
    tickets_sold INTEGER DEFAULT 0
);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    ticket_quantity INTEGER NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### 4. Environment Variables
Create a `.env` file in the root directory and add your credentials:
\`\`\`text
PORT=3000
SESSION_SECRET=your_super_secret_session_key
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_booking
\`\`\`

### 5. Start the Server
\`\`\`bash
npm run dev
\`\`\`
The application will now be running on `http://localhost:3000`.

## 🧪 Running the Tests

This application features a robust testing suite that covers database integrity, route security, and UI rendering. To run the tests:

\`\`\`bash
npm test
\`\`\`
*(Note: Ensure your test database is properly configured in your environment before running).*