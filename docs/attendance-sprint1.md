# Attendance module - Sprint 1 (Shriya C Rao)

Scope: ATT-01 to ATT-06 (GitHub issues #12 to #17). Reporting (REP-01 to REP-07) is planned for Sprint 2.

## What was built

| Req | Behaviour | Where |
|-----|-----------|-------|
| ATT-01 | Organizer marks a registered student Present | `PATCH /api/attendance/:registrationId` |
| ATT-02 | Organizer marks a registered student Absent | same endpoint, `status: "Absent"` |
| ATT-03 | Attendance is stored | `attendanceStatus` field on the registration (plus `attendanceMarkedBy`, `attendanceMarkedAt`) |
| ATT-04 | Attendance is linked to its registration | the status lives on the registration document itself |
| ATT-05 | Authorized organizer can change a record | same PATCH call again |
| ATT-06 | Unauthorized users cannot change attendance | `protect` + `authorizeRoles('Organizer')`, then an ownership check against `event.organizer` |

Supporting endpoints: `GET /api/attendance/events` (my events) and `GET /api/attendance/event/:eventId` (participants of one event).

Frontend: `/organizer/attendance` (pick an event) and `/organizer/events/:eventId/attendance` (Present / Absent buttons).

## Error codes (matches SASD 4.3)

| Code | When |
|------|------|
| 400 | status is not Present/Absent, bad id, cancelled registration or event |
| 401 | no token / invalid token |
| 403 | student, or an organizer who does not own the event |
| 404 | registration or event not found |

## Test cases

| ID | Requirement | Type | Case | Expected |
|----|-------------|------|------|----------|
| TC-ATT-01 | ATT-01 | Unit + Integration | Owner sends `Present` | 200, status Present |
| TC-ATT-02 | ATT-02 | Unit + Integration | Owner sends `Absent` | 200, status Absent |
| TC-ATT-03 | ATT-03 | Unit | Save is called on the registration; markedBy / markedAt set | record persisted |
| TC-ATT-04 | ATT-04 | Unit | Registration looked up by id and updated in place | linked to that registration |
| TC-ATT-05 | ATT-05 | Unit + Integration | Absent then Present on the same registration | final status Present |
| TC-ATT-06 | ATT-06 | Unit + Integration | Student token; other organizer; no token; tampered token | 403 / 403 / 401 / 401, nothing saved |
| TC-ATT-07 | boundary | Unit + Integration | status `Late`, or missing | 400 |
| TC-ATT-08 | boundary | Unit | Cancelled registration / cancelled event | 400, nothing saved |
| TC-ATT-09 | error | Unit + Integration | Unknown registration / event | 404 |
| TC-ATT-10 | error | Unit | Malformed id (CastError) | 400 |

Run: `cd server && npm test`

## Temporary stand-ins (to be replaced when teammates merge)

| File | Owner | Why it is here |
|------|-------|----------------|
| `server/src/models/User.js` | Shaurya | needed to run |
| `server/src/models/Event.js` | Shayna | needed to run |
| `server/src/models/Registration.js` | Sham | needed to run (adds `attendanceMarkedBy/At`) |
| `server/src/middleware/authMiddleware.js` | Shaurya | `protect`, `authorizeRoles` |
| `server/src/controllers/authController.js`, `routes/authRoutes.js` | Shaurya | login for the demo |
| `client/src/pages/LoginPage.jsx` | Shaurya | login for the demo |
| `server/src/seed.js` | - | demo data |

If any of these conflict at merge time, keep the teammate's version. The attendance code only needs the agreed fields (`student`, `event`, `status`, `attendanceStatus`, `organizer`, `title`, `capacity`, `req.user.id`, `req.user.role`).

## Deviations to mention in the demo

- Attendance is stored on the registration document (SRS Appendix B, `Attendance Status`) rather than a separate collection.
- Added `attendanceMarkedBy` and `attendanceMarkedAt` to satisfy the repudiation point in SASD 3.9.
- Added `GET /api/attendance/events` so the attendance page does not depend on the Event module's list endpoint.
