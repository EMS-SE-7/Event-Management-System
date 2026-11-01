# PESU-EMS Server

Express + MongoDB (Mongoose) REST API.

## Setup

```bash
cd server
npm install
cp .env.example .env   # set a long random JWT_SECRET
npm run dev            # http://localhost:5000 (PORT in .env)
```

Default port is 5000. macOS AirPlay Receiver also uses 5000, so on a Mac set `PORT=5050` in your local `.env`.

## Auth routes

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — (needs token) | `{ user }` |

- Email must end in `@pesu.pes.edu`. Password min 6 chars.
- Everyone registers as `Student`; any `role` sent is ignored.
- `user` = `{ id, name, email, role }`.

## Seeding accounts

Organizers are created by a script, never by signup. Students can also be seeded for demos and tests.

1. In `.env`, set `ORGANIZER_EMAILS` and/or `STUDENT_EMAILS` (comma-separated) and `SEED_PASSWORD` (a mock password for dev; change it for real use).
2. Run `npm run seed`. Each organizer email gets an Organizer account and each student email a Student account, all with that password.
3. An email that is already registered is skipped, because someone else may have claimed it first. Check an organizer email is the right person, then run `npm run seed -- --force` to promote it. `--force` never changes students.

## Protecting your routes

```js
const { authenticate, requireRole } = require('../middleware/auth'); // from server/src/routes/

router.get('/', authenticate, listEvents);                                  // any logged-in user
router.post('/', authenticate, requireRole('Organizer'), createEvent);      // organizers only
```

`requireRole` takes one or more roles and ignores case, so `'organizer'` and `'Organizer'` both work.
`protect` and `authorizeRoles` are kept as aliases of `authenticate` and `requireRole`.

Inside a protected handler:

- `req.user.id` — logged-in user's ID (string)
- `req.user.role` — `'Student'` or `'Organizer'`

Responses: no/invalid token → `401`, wrong role → `403`. Errors use the shared format `{ error: { code, message } }`.

## Production notes

- Serve the API over HTTPS only (SRS: HTTPS in production). The app does not redirect, so terminate TLS at the host or proxy.
- Tokens are bearer JWTs in the `Authorization` header; CORS is currently open. Restrict the origin before going live.

## Frontend

After login, store the token and send it on every request:

```js
localStorage.setItem('token', data.token);

fetch('/api/...', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```

## Event routes

All need a token. "Owner" means the organizer who created the event.

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/api/events` | signed in | `?q=` search (title, description, venue), `?category=`, `?status=` (Upcoming, Ongoing, Completed, Cancelled), `?page=`, `?limit=` (default 20, max 100) |
| GET | `/api/events/mine` | organizer | the organizer's own events, same paging |
| GET | `/api/events/:id` | signed in | one event |
| POST | `/api/events` | organizer | create |
| PATCH | `/api/events/:id` | owner | edit; send only the fields that change |
| PATCH | `/api/events/:id/cancel` | owner | cancel; the event is kept with status Cancelled |

Every event comes back with calculated fields: `status`, `seatsLeft`, `isFull`, `registrationOpen`.
Editing or cancelling a cancelled event returns `409 EVENT_CANCELLED`; a completed one returns `409 EVENT_NOT_UPCOMING`.

## Seeding demo events

After `npm run seed`, run `npm run seed:events`. It creates six events split between the seeded organizers:
upcoming with seats, upcoming with 2 seats, full, cancelled, past its registration deadline, and completed with
Present / Absent / Not Marked attendance. Running it again replaces those events.
