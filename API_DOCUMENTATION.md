# 🔌 HTTP API Documentation

This document outlines the internal HTTP routes and endpoints used by the Event Booking Web Application. Because this application utilizes Server-Side Rendering (SSR) via EJS, most endpoints return rendered HTML views or HTTP redirects, rather than pure JSON payloads.

---

## 🧑‍💻 User Management & Authentication Routes (`/users`)

### 1. Registration
* **Endpoint:** `GET /users/register`
  * **Description:** Renders the user registration form.
  * **Access:** Public
* **Endpoint:** `POST /users/register`
  * **Description:** Processes a new user registration, hashes the password via Argon2, and stores the user in the database.
  * **Request Body (Form Data):** * `name` (string, required)
    * `email` (string, required)
    * `password` (string, required)
  * **Response:** Redirects to `/users/login` on success.

### 2. Authentication
* **Endpoint:** `GET /users/login`
  * **Description:** Renders the user login form.
  * **Access:** Public
* **Endpoint:** `POST /users/login`
  * **Description:** Authenticates a user and establishes an Express Session. Utilizes a breadcrumb URL if the user was redirected here from a protected route.
  * **Request Body (Form Data):**
    * `email` (string, required)
    * `password` (string, required)
  * **Response:** Redirects to `/` (or the saved breadcrumb URL) on success.
* **Endpoint:** `GET /users/logout` (or `POST`)
  * **Description:** Destroys the current user session and clears the authentication cookie.
  * **Access:** Protected (Requires Login)

### 3. Profile Management
* **Endpoint:** `GET /users/profile`
  * **Description:** Renders the profile dashboard for the authenticated user.
  * **Access:** Protected
* **Endpoint:** `POST /users/update-name`
  * **Description:** Updates the authenticated user's display name.
  * **Request Body:** `name` (string, required)
* **Endpoint:** `POST /users/update-email`
  * **Description:** Updates the user's email address (includes backend validation to prevent duplicates).
  * **Request Body:** `email` (string, required)
* **Endpoint:** `POST /users/update-password`
  * **Description:** Verifies the current password and applies a new Argon2 hash.
  * **Request Body:** `currentPassword` (string, required), `newPassword` (string, required)
* **Endpoint:** `POST /users/delete`
  * **Description:** Permanently deletes the user account and cascades the deletion to their bookings.
  * **Access:** Protected

---

## 🎟️ Event Catalogue Routes (`/events`)

### 1. View All Events
* **Endpoint:** `GET /events` (and/or `GET /`)
  * **Description:** Retrieves the complete event catalogue, ordered chronologically by date, and renders the homepage.
  * **Access:** Public

### 2. View Event Details
* **Endpoint:** `GET /events/:id`
  * **Description:** Retrieves specific details and current capacity for a single event. Unauthenticated users are redirected to login but their intended destination (`/events/:id`) is saved to the session.
  * **URL Parameters:** `id` (integer, required) - The database ID of the event.
  * **Access:** Protected (Requires Login to view details/book)

---

## 🎫 Ticketing & Booking Routes (`/bookings`)

### 1. View User Bookings
* **Endpoint:** `GET /bookings`
  * **Description:** Retrieves all active ticket bookings for the currently authenticated user, joined with event details.
  * **Access:** Protected

### 2. Process a Booking
* **Endpoint:** `POST /bookings`
  * **Description:** Processes a ticket purchase. Validates backend capacity limits to prevent overbooking before inserting the record and updating the event capacity.
  * **Request Body (Form Data):**
    * `eventId` (integer, required)
    * `ticketQuantity` (integer, required)
  * **Response:** Redirects to `/bookings` on success, or back to the event page if capacity is insufficient.

### 3. Cancel a Booking
* **Endpoint:** `POST /bookings/cancel`
  * **Description:** Deletes a specific booking record and refunds the ticket quantity back to the event's available capacity counter. Verifies ownership of the ticket before deletion.
  * **Request Body (Form Data):**
    * `bookingId` (integer, required)
  * **Response:** Redirects to `/bookings` on success.