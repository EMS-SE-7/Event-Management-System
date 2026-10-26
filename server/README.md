# PESU-EMS Server

Express + MongoDB (Mongoose) REST API.

## Setup

```bash
cd server
npm install
cp .env.example .env   # set a long random JWT_SECRET
npm run dev            # http://localhost:5050
```

Port 5050, not 5000 — macOS AirPlay Receiver uses 5000.

## Auth routes

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — (needs token) | `{ user }` |

- Email must end in `@pesu.pes.edu`. Password min 6 chars.
- Everyone registers as `Student`; any `role` sent is ignored.
- `user` = `{ id, name, email, role }`.

## Making Organizers

1. The organizer registers normally.
2. Add their email to `ORGANIZER_EMAILS` in `.env` (comma-separated).
3. Run `npm run seed:organizers`.

## Protecting your routes

```js
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', protect, listEvents);                                  // any logged-in user
router.post('/', protect, authorizeRoles('Organizer'), createEvent);   // organizers only
```

Inside a protected handler:

- `req.user.id` — logged-in user's ID (string)
- `req.user.role` — `'Student'` or `'Organizer'`

Responses: no/invalid token → `401`, wrong role → `403`.

## Frontend

After login, store the token and send it on every request:

```js
localStorage.setItem('token', data.token);

fetch('/api/...', {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});
```
