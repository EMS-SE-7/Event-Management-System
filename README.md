# Event Management System
A full-stack web application for managing events, including event creation, discovery, and user participation.

## Technology Stack
Frontend: React and Vite
Backend: Node.js and Express
Database: MongoDB with Mongoose

## Project Structure
client/ — React frontend
server/ — Express backend and API
docs/ — Project requirements and documentation

## Prerequisites
Git
Node.js and npm
MongoDB


Project requirements and related PDFs are available in docs/.

## Running locally

You need Node.js 20 or newer and a MongoDB connection (the team Atlas cluster, or MongoDB installed locally).

1. Server:
   ```bash
   cd server
   cp .env.example .env     # Windows CMD: copy .env.example .env
   # edit .env: MONGO_URI, JWT_SECRET, SEED_PASSWORD (emails must end in @pesu.pes.edu)
   npm install
   npm run seed             # organizer and student accounts
   npm run seed:events      # demo events in every status, with registrations and attendance
   npm run dev              # http://localhost:5000
   ```
2. Client, in a second terminal:
   ```bash
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```
3. Open http://localhost:5173 and log in with one of the seeded emails and `SEED_PASSWORD`.

The client calls the real server by default. To click through the event pages without a server, put `VITE_USE_MOCK=true` in `client/.env.local`.

## Tests

```bash
cd server && npm test    # Jest + Supertest, uses an in-memory MongoDB (no .env needed)
cd client && npm test    # Vitest + React Testing Library
```
