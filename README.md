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

You need **Node.js 20 or newer** (`node -v`) and a MongoDB database. Use either the team Atlas cluster or MongoDB on your own machine.

### 1. Get a MongoDB connection string

- **Team Atlas cluster (recommended):** ask Shayna for the `mongodb+srv://...` string. It must end with the database name, e.g. `...mongodb.net/pesu_ems_dev?retryWrites=true&w=majority`.
- **Local MongoDB:** install [MongoDB Community Server](https://www.mongodb.com/try/download/community) (or run `docker run -d -p 27017:27017 --name ems-mongo mongo:7`). The string is then `mongodb://127.0.0.1:27017/pesu_ems`.

### 2. Start the server (terminal 1)

```bash
cd server
cp .env.example .env     # Windows CMD: copy .env.example .env
```

Open `server/.env` and set:

| Variable | What to put |
|---|---|
| `MONGO_URI` | the connection string from step 1 (the name is `MONGO_URI`, not `MONGODB_URI`) |
| `JWT_SECRET` | any long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ORGANIZER_EMAILS`, `STUDENT_EMAILS` | demo accounts to create; every email must end in `@pesu.pes.edu` |
| `SEED_PASSWORD` | the password all seeded accounts get |
| `PORT` | `5000` (on a Mac, use `5050`: AirPlay already uses 5000) |

Then:

```bash
npm install
npm run seed             # creates the organizer and student accounts
npm run seed:events      # demo events in every status, with registrations and attendance
npm run dev              # prints "MongoDB connected" and "Server running on http://localhost:5000"
```

### 3. Start the client (terminal 2)

```bash
cd client
cp .env.example .env     # only needed if you changed PORT: set VITE_API_PROXY=http://localhost:5050
npm install
npm run dev              # http://localhost:5173
```

### 4. Log in

Open http://localhost:5173 and log in with one of the emails from `ORGANIZER_EMAILS` or `STUDENT_EMAILS` and the `SEED_PASSWORD`. New students can also sign up from the Register page. Organizer accounts only come from the seed script.

To click through the event pages without any server, put `VITE_USE_MOCK=true` in `client/.env.local` (login still needs the server).

### Troubleshooting

| Symptom | Fix |
|---|---|
| `MONGO_URI is missing from server/.env` | The variable is called `MONGO_URI`. Check `server/.env` exists (not only `.env.example`). |
| `MongoDB connection failed: bad auth` | Wrong user or password in the Atlas string, or `<db_password>` was left in. |
| `querySrv ENOTFOUND` or a timeout | Your IP is not allowed in Atlas Network Access, or the Wi-Fi blocks port 27017. Try a phone hotspot. |
| Every page says "Something went wrong" or "Cannot reach the server" | The server is not running, or it runs on a port other than the one in `VITE_API_PROXY`. |
| `npm run seed:events` says "No organizer accounts found" | Run `npm run seed` first. |
| Login says "Invalid credentials" | Use a seeded email with `SEED_PASSWORD`, or register a new student. |

## Tests

```bash
cd server && npm test    # Jest + Supertest, uses an in-memory MongoDB (no .env needed)
cd client && npm test    # Vitest + React Testing Library
```
