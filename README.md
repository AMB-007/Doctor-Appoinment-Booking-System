# Doctor Appointment Booking System

## Overview

This is a full-stack doctor appointment booking app with a React frontend in `client/`, a Node/Express backend in `server/`, and a MySQL database. Patients can sign up, browse doctors, and book appointments. Doctors can manage leave dates and update appointment status.

## Features

- User signup and login
- Doctor listing with specialization
- Appointment booking with duplicate-slot protection
- Doctor leave management
- Appointment status updates
- Profile update and password change flows

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL with `mysql2`
- Utilities: `dotenv`, `bcryptjs`, `cors`

## Project Structure

- `client/` - frontend app
- `server/` - backend API and database schema
- `server/server.js` - main Express server
- `server/setup.sql` - fresh database schema for first-time setup
- `server/db.js` - MySQL connection pool helper
- `package.json` - root workspace scripts

## Prerequisites

- A recent version of Node.js with npm
- MySQL Server or MariaDB

## Install Dependencies

Run this once from the project root:

```bash
npm install
```

This installs the workspace dependencies for both `client` and `server`.

## Environment Variables

Create `server/.env` with the following values:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=doctor_app
```

For a smooth first run, keep `DB_NAME=doctor_app` because `server/setup.sql` uses that database name.

## Database Setup For First Run

### Option 1: Import the provided SQL file

Start MySQL from the project root:

```bash
mysql -u root -p
```

Then run this inside the MySQL prompt:

```sql
SOURCE server/setup.sql;
```

If you are using Git Bash or Command Prompt, this one-line import also works:

```bash
mysql -u root -p < server/setup.sql
```

### Option 2: Run the SQL manually

If you want to create the schema by hand, run the following queries in MySQL:

```sql
CREATE DATABASE IF NOT EXISTS doctor_app;
USE doctor_app;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
    specialization VARCHAR(255) DEFAULT 'General Physician',
    next_leave_date DATE DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255),
    patient_id INT NOT NULL,
    patient_name VARCHAR(255),
    date VARCHAR(20) NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    token_number INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS doctor_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    leave_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_leave (doctor_id, leave_date),
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Verify the database

After setup, you can verify the schema with:

```sql
USE doctor_app;
SHOW TABLES;
DESCRIBE users;
DESCRIBE appointments;
DESCRIBE doctor_leaves;
```

Expected tables:

- `users`
- `appointments`
- `doctor_leaves`

There is no seed data by default. Create doctor and patient accounts through the app so passwords are stored correctly with bcrypt.

## Run The Backend

From the project root:

```bash
npm run server
```

The backend starts on `http://localhost:5000`.

## Run The Frontend

Open a second terminal in the project root and run:

```bash
npm run dev
```

The frontend starts with Vite and calls the backend at `http://localhost:5000`.

## Useful Scripts

- `npm run server` - start the backend
- `npm run dev` - start the frontend
- `npm run build` - build the frontend

## API Examples

- `GET /api/doctors`
- `GET /api/doctors/:id/leaves`
- `PUT /api/doctors/:id/leave`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `POST /api/signup`
- `POST /api/login`

## Notes

- The backend uses UTC in the MySQL connection config to reduce timezone issues.
- `server/update_schema_v2.js` is an older helper and should not be used for a fresh install.
