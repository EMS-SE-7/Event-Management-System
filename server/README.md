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

## Frontend

After login, store the token and send it on every request:

```js
localStorage.setItem('token', data.token);

fetch('/api/...', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```
