const mysql = require('mysql2/promise');

async function updateSchema() {
  const db = await mysql.createConnection({
    host: 'localhost', user: 'root', password: 'abc123', database: 'doctor_app'
  });

  console.log("✅ Connected to database...");

  try {
    // 1. Add 'token_number' to appointments
    await db.query("ALTER TABLE appointments ADD COLUMN token_number INT;");
    console.log("👉 Added 'token_number' to appointments");
  } catch (e) { console.log("⚠️ token_number exists"); }

  try {
    // 2. Add 'is_on_leave' to doctors
    await db.query("ALTER TABLE doctors ADD COLUMN is_on_leave BOOLEAN DEFAULT FALSE;");
    console.log("👉 Added 'is_on_leave' to doctors");
  } catch (e) { console.log("⚠️ is_on_leave exists"); }

  await db.end();
}

updateSchema();