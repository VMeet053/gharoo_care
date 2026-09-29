# adminHMD - React + Node.js Admin Dashboard

Professional admin dashboard built with React (Vite) frontend and Express.js backend.

## Project Structure

```
admin-kalpesh/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   └── public/assets/
└── server/          # Node.js Express API
    └── index.js
```

## Getting Started

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Start the backend server

```bash
cd server
npm start
```

Server runs at `http://localhost:5000`

### 3. Start the React frontend

```bash
cd client
npm run dev
```

Frontend runs at `http://localhost:5173`

## Available Pages

- Dashboard, Users, Add User, Profile
- Charts, Tables, Forms, Components
- Alerts, Modals, Settings
- Login, Register, Forgot Password
- 404 and 500 error pages

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/users` - List all users

## Tech Stack

- **Frontend:** React 19, React Router, Vite, Bootstrap 5
- **Backend:** Node.js, Express, CORS
