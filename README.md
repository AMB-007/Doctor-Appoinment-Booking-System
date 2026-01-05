# Doctor App

## Description

Full-stack appointment booking app for doctors and patients. React frontend in `client/` and Node/Express backend in `server/` with a MySQL database. Provides signup/login, doctor listing, booking, leave management, and basic dashboards for doctors and patients.

## Features

- User authentication (signup/login)
- Doctor listing and specializations
- Book appointments with slot checking and double-book prevention
- Doctor leave management (per-date leaves)
- Appointment status updates (Pending/Confirmed/Cancelled)
- User profile updates and password change

## Tech Stack

- Frontend: React (client/), Tailwind CSS
- Backend: Node.js, Express
- Database: MySQL (mysql2)
- Auth & utils: bcryptjs, dotenv, CORS

## Project Structure (key paths)

- `client/` — React app (pages, components, assets)
- `server/` — Express API, DB scripts
  - `server/server.js` — main API server
  - `server/db.js` — MySQL connection (uses `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`)
  - `server/setup.sql` — initial schema/data
  - `server/update_schema_v2.js` — schema update helper
- Root `package.json` and per-package manifests in `client/` and `server/` as needed

## Prerequisites

- Node.js >= 14
- npm or yarn
- MySQL server (or MariaDB)

## Environment Variables

Create a `.env` file in `server/` with:

- `DB_HOST` (e.g., localhost)
- `DB_USER` (MySQL username)
- `DB_PASSWORD` (MySQL password)
- `DB_NAME` (database name, e.g., doctor_app)

Example `.env`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=doctor_app
```

## Database Setup

1. Ensure MySQL server is running and you have a user with privileges to create databases.

2. Create the database (name should match `DB_NAME` in your `.env` file, e.g., `doctor_app`).

3. Import the initial schema from `server/setup.sql`:

```bash
mysql -u [your_username] -p [your_database_name] < server/setup.sql
```

Replace `[your_username]` with your MySQL username (e.g., root), and `[your_database_name]` with the database name from `DB_NAME`.

This will create the necessary tables:
- `users`: Stores patient, doctor, and admin accounts.
- `appointments`: Manages appointment bookings.

**Note:** The schema does not include seed data. You can create users (doctors and patients) via the app's signup page. For testing, sign up a few doctors and patients manually.

If you have an existing database from a previous version, the `server/update_schema_v2.js` script can help update the schema, but it's designed for an older version and may not be needed.

## Server (API) — Run

1. Install dependencies:

```bash
cd server
npm install
```

2. Start server:

```bash
node server.js
```

The server listens on port 5000 by default.

## Client (Frontend) — Run

1. Install dependencies:

```bash
cd client
npm install
```

2. Start dev server:

```bash
npm run dev
```

The client expects the API at `http://localhost:5000` by default; adjust as needed.

## Useful Scripts

- `server/server.js` — starts the API server
- `server/update_schema_v2.js` — DB schema helper
- `client/` contains standard React dev scripts (`dev`, `build`, `start`)

## Notes & Tips

- `server/db.js` uses `mysql2` connection pool and exports `.promise()` for async/await usage.
- Example API endpoints:
  - GET `/api/doctors`
  - GET `/api/doctors/:id/leaves`
  - POST `/api/appointments`
  - PUT `/api/appointments/:id`
  - POST `/api/signup` and `/api/login`
- The server enforces UTC timezone in DB config to avoid timezone shifting.

## Contributing

- Fork, create a feature branch, add tests, and open a PR.
- Update `server/setup.sql` for schema changes and provide migrations if needed.

## License

Add your chosen license here (e.g., MIT).
