# Event Management System

A web application for managing college events. Organizers create and manage events, students discover and register for them, and organizers record attendance and view reports.

## View deployed site:

###  [**pesu-ems.onrender.com**](https://pesu-ems.onrender.com)

logins:
| Role | Email | Password |
|---|---|---|
| Organizer | organizer1@pesu.pes.edu | Test@1234 |
| Student | pes1ug24cs001@pesu.pes.edu | Test@1234 |

## Features

**Students**
- Sign up and log in
- Browse events with search, category and status filters
- View event details, available seats and the registration deadline
- Register for events, cancel registrations and view registration history

**Organizers**
- Create, edit and cancel events
- View registered students for each event
- Mark attendance as Present or Absent
- View reports on registrations and attendance

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT, bcrypt |
| Testing | Jest, Supertest, Vitest, React Testing Library, Playwright |
| CI/CD | GitHub Actions, Render |

## Running locally

**Prerequisites:** Git, Node.js 20 or newer, and a MongoDB database (MongoDB Atlas or a local MongoDB server).

**1. Clone the repository**

```bash
git clone https://github.com/EMS-SE-7/Event-Management-System.git
cd Event-Management-System
```

**2. Configure and start the server**

```bash
cd server
cp .env.example .env
```

Set the following values in server/.env:

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | A long random string used to sign login tokens |
| `ORGANIZER_EMAILS`, `STUDENT_EMAILS` | Comma-separated demo accounts to create |
| `SEED_PASSWORD` | Password for the demo accounts |
| `PORT` | Server port, default `5000` |

```bash
npm install
npm run seed            # create demo accounts
npm run seed:events     # create demo events, registrations and attendance
npm run dev             # http://localhost:5000
```

**3. Start the client** (in a second terminal)

```bash
cd client
npm install
npm run dev             # http://localhost:5173
```

If the server runs on a port other than 5000, copy `client/.env.example` to `client/.env` and update `VITE_API_PROXY`.

**4. Log in** at http://localhost:5173 using a seeded email and `SEED_PASSWORD`.

## Tests

| Level | Command |
|---|---|
| All server tests | `cd server && npm test` |
| All client tests | `cd client && npm test` |
| Unit | `npm run test:unit` in `server/` or `client/` |
| Integration | `npm run test:integration` in `server/` or `client/` |
| System (end to end) | `npm run build --prefix client`, then in `system-tests/`: `npm ci && npx playwright install chromium && npm test` |

Server tests use an in-memory MongoDB and need no configuration.

## CI/CD and deployment

GitHub Actions (ci.yml) runs the unit, integration and system tests with coverage on every push and pull request. When all tests pass on main, the application is deployed to Render (render.yaml), where a single service hosts both the API and the frontend. 

## Documentation

- [Proposal](docs/Proposal.pdf)
- [Software Requirements Specification](docs/Software_Requirement_Specification.pdf)
- [Software Architecture and Design Specification](docs/SASD.pdf)
- [Test Plan](docs/Test_Plan.pdf)
- [Test Reports](docs)

## Team and contributions

| Member | Role | Contributions |
|---|---|---|
| **Shayna Zaidi Gupta** | Team Lead, Event Management | Project setup, GitHub Actions CI/CD, Render deployment, event module , Sprint 1 integration, UI redesign and bug fixes, Playwright system tests, test reports and coverage, documentation |
| **Shriya C Rao** | Attendance and Reporting | Attendance marking, reports, tests |
| **Shaurya Ishan** | Authentication and Roles | Login and registration, JWT and role-based access, demo account seeding, tests |
| **Sham Santhosh S** | Registration and Participation | Event registration and cancellation, registration history, participants list, event search and edit APIs, tests |
