CREATE DATABASE IF NOT EXISTS doctor_app;
USE doctor_app;

-- 1. Users Table (Handles Patients, Doctors, and Admins)
-- We merged 'doctors' into this table to simplify login and data management.
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
    specialization VARCHAR(255) DEFAULT 'General Physician', -- Only used if role is 'doctor'
    next_leave_date DATE DEFAULT NULL                        -- Only used if role is 'doctor'
);

-- 2. Appointments Table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(255),
    patient_id INT NOT NULL,
    patient_name VARCHAR(255),
    date VARCHAR(20) NOT NULL,       -- Stored as YYYY-MM-DD
    slot_time VARCHAR(20) NOT NULL,  -- Stored as HH:MM (e.g., 09:20)
    status VARCHAR(50) DEFAULT 'Pending', -- Values: Pending, Confirmed, Rejected, Cancelled, Completed
    token_number INT DEFAULT NULL,   -- Assigned only when status becomes 'Confirmed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. (Optional) Insert a Dummy Doctor for testing
-- Password is '123456' (hashed with bcrypt for demo purposes, you might need to register via the app to get a valid hash)
-- Ideally, you should create users via the "Sign Up" page in your app.