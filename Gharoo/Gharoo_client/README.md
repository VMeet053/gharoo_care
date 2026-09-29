FixPro — React + Node minimal homepage

This repository contains a minimal recreation of the FixPro homepage using React (Vite) for the frontend and Express for a small backend.

Quick start (Windows):

1. Open two terminals.

2. In one terminal (server):

```
cd server
npm install
node server.js
```

Server will run on port 4000.

3. In the other terminal (client):

```
cd client
npm install
npm run dev
```

Vite dev server runs on port 5173 by default.

To build the frontend and serve from the server:

```
cd client
npm run build
cd ..\server
node server.js
```

The server serves static files from `../client/dist` when present.
