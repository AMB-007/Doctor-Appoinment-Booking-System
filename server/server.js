require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs'); 
const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',      
    password: process.env.DB_PASSWORD || 'abc123',      
    database: process.env.DB_NAME || 'doctor_app',
    timezone: '+00:00' // Critical: Forces UTC to prevent auto-timezone shifting
});

db.getConnection()
    .then(() => console.log('✅ Connected to MySQL Database'))
    .catch(err => console.error('❌ Database Connection Failed:', err));


// --- Routes ---

// 1. GET ALL DOCTORS (UPDATED: Added specialization back to the select list)
app.get('/api/doctors', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, name, specialization FROM users WHERE role = 'doctor'");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. GET ALL ACTIVE LEAVES (Fixed: Returns Date String)
app.get('/api/doctors/leaves', async (req, res) => {
    try {
        const query = `
            SELECT 
                u.id AS doctor_id, 
                u.name AS doctor_name, 
                DATE_FORMAT(dl.leave_date, '%Y-%m-%d') AS date 
            FROM doctor_leaves dl
            JOIN users u ON dl.doctor_id = u.id
            WHERE dl.leave_date >= CURDATE() 
            ORDER BY dl.leave_date ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. GET SPECIFIC DOCTOR LEAVES (Fixed: Returns Date String)
app.get('/api/doctors/:id/leaves', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            "SELECT DATE_FORMAT(leave_date, '%Y-%m-%d') as date FROM doctor_leaves WHERE doctor_id = ?", 
            [id]
        );
        res.json(rows); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. APPLY/REMOVE LEAVE (Supports Multiple Dates)
app.put('/api/doctors/:id/leave', async (req, res) => {
    try {
        const { date, is_on_leave } = req.body; 
        const { id } = req.params;

        if (is_on_leave) {
            // Insert new leave (IGNORE prevents crashing if date already exists)
            await db.query('INSERT IGNORE INTO doctor_leaves (doctor_id, leave_date) VALUES (?, ?)', [id, date]);
            res.json({ success: true, message: `Leave added for ${date}` });
        } else {
            if (date) {
                // Remove specific date
                await db.query('DELETE FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?', [id, date]);
                res.json({ success: true, message: `Leave removed for ${date}` });
            } else {
                // Remove ALL leaves (Clear Schedule)
                await db.query('DELETE FROM doctor_leaves WHERE doctor_id = ?', [id]);
                res.json({ success: true, message: `All leaves cleared` });
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. GET APPOINTMENTS (Fixed: Returns Date String)
app.get('/api/appointments', async (req, res) => {
    try {
        const { doctor_id, patient_id } = req.query;
        // Fetch raw date string to prevent JS conversion issues
        let query = 'SELECT *, DATE_FORMAT(date, "%Y-%m-%d") as date_str FROM appointments'; 
        let params = [];
        let conditions = [];

        if (doctor_id) { conditions.push('doctor_id = ?'); params.push(doctor_id); }
        if (patient_id) { conditions.push('patient_id = ?'); params.push(patient_id); }
        
        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        
        // Add ordering to show newest first
        query += ' ORDER BY date DESC, slot_time ASC';

        const [rows] = await db.query(query, params);
        
        // Map date_str back to date property
        const cleanedRows = rows.map(r => ({
            ...r,
            date: r.date_str // Use the clean string "2025-12-23"
        }));

        res.json(cleanedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. POST APPOINTMENT (Checks Multiple Leaves)
app.post('/api/appointments', async (req, res) => {
    try {
        const { doctor_id, patient_id, date, time, age } = req.body;

        // 1. Check Doctor Existence
        const [docRows] = await db.query("SELECT name FROM users WHERE id = ?", [doctor_id]);
        if (docRows.length === 0) return res.status(404).json({ error: "Doctor not found" });
        
        // 2. Check for Leave in NEW TABLE
        const [leaves] = await db.query("SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?", [doctor_id, date]);
        if (leaves.length > 0) {
            return res.status(400).json({ error: `Doctor is on leave on ${date}.` });
        }

        // 3. Get Patient Name
        const [patRows] = await db.query("SELECT name FROM users WHERE id = ?", [patient_id]);
        const patientName = patRows.length > 0 ? patRows[0].name : "Unknown Patient";

        // 4. Validate time
        if (!time) return res.status(400).json({ error: 'Invalid time.' });

        // 5. Double Booking Check
        const [slotRes] = await db.query("SELECT count(*) as cnt FROM appointments WHERE doctor_id = ? AND date = ? AND slot_time = ? AND status != 'Cancelled'", [doctor_id, date, time]);
        if (slotRes[0].cnt > 0) return res.status(400).json({ error: 'Slot already booked.' });

        // 6. Insert Appointment
        const sql = `INSERT INTO appointments (doctor_id, patient_name, patient_id, date, slot_time, age, status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [doctor_id, patientName, patient_id, date, time, age, 'Pending'];
        
        const [result] = await db.query(sql, values);

        res.status(201).json({ message: "Booked successfully", id: result.insertId });
    } catch (err) {
        console.error("Booking Error:", err);
        res.status(500).json({ error: "Server error during booking." });
    }
});

// 7. UPDATE APPOINTMENT STATUS
app.put('/api/appointments/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: "Status updated", status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 8. GET BOOKED SLOTS (Checks Multiple Leaves)
app.get('/api/doctors/:id/booked', async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        // Check if doctor is on leave in NEW TABLE
        const [leaves] = await db.query("SELECT * FROM doctor_leaves WHERE doctor_id = ? AND leave_date = ?", [id, date]);
        if (leaves.length > 0) {
            return res.json({ is_on_leave: true });
        }

        const [rows] = await db.query("SELECT slot_time FROM appointments WHERE doctor_id = ? AND date = ? AND status != 'Cancelled'", [id, date]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 9. CHANGE PASSWORD (NEW)
app.put('/api/auth/password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        // 1. Get user
        const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const user = users[0];

        // 2. Verify Old Password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

        // 3. Hash New Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Update Database
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 10. UPDATE USER PROFILE (NEW - For Phone/Place)
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { phone, place } = req.body;

        await db.query('UPDATE users SET phone = ?, place = ? WHERE id = ?', [phone, place, id]);
        
        // Return updated user data so frontend can update state
        // IMPORTANT: Added specialization back to the select list here as well
        const [updatedUser] = await db.query('SELECT id, name, email, role, phone, place, specialization FROM users WHERE id = ?', [id]);
        
        res.json({ message: "Profile updated successfully", user: updatedUser[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// --- Auth Routes ---
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userRole = role || 'patient';
        // Note: Specialization is automatically NULL for new signups unless explicitly provided,
        // which is fine since the frontend currently forces role='patient'.

        const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [name, email, hashedPassword, userRole]);

        res.status(201).json({ message: "User created", user: { id: result.insertId, name, email, role: userRole } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ message: "Invalid email or password" });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            // Return specialization for doctor dashboards/profile updates
            res.json({ message: "Login successful", user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role, 
                phone: user.phone, 
                place: user.place,
                specialization: user.specialization // Added specialization
            }});
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});