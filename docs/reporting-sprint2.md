# Reporting module - Sprint 2 (Shriya C Rao)

Scope: REP-01 to REP-05 (GitHub issues #18 to #22). Builds on the Sprint 1 attendance data (`attendanceStatus` on each registration).

## What was built

| Req | Behaviour | Where |
|-----|-----------|-------|
| REP-01 | Registration statistics: registered, cancelled, capacity, seats left, % filled | `GET /api/reports/event/:eventId` -> `registration` |
| REP-02 | Attendance statistics: present, absent, not marked | same endpoint -> `attendance` |
| REP-03 | Total registrations shown | `registration.total`, Reports page and Event Report page |
| REP-04 | Total present shown | `attendance.present` |
| REP-05 | Total absent shown | `attendance.absent` |

Reports are only available to logged-in organizers.

Supporting endpoint: `GET /api/reports/events` - one row per event of the organizer, plus overall totals.

Frontend:
- `/organizer/reports` - table of all my events with registered / present / absent
- `/organizer/events/:eventId/report` - registration and attendance cards for one event
- Links added from the attendance pages.

The numbers are calculated in `server/src/utils/reportStats.js` so they can be unit tested without a database.

## Error codes (matches SASD 4.3)

| Code | When |
|------|------|
| 400 | malformed event id |
| 401 | no token / invalid token |
| 403 | student |
| 404 | event not found |

## Test cases

| ID | Requirement | Type | Case | Expected |
|----|-------------|------|------|----------|
| TC-REP-01 | REP-01 | Unit + Integration | Event with 4 registrations, capacity 10 | total 4, seats left 6, filled 40% |
| TC-REP-02 | REP-02 | Unit + Integration | 2 present, 1 absent, 1 not marked | counts 2 / 1 / 1 |
| TC-REP-03 | REP-03 | Unit | Cancelled registrations in the list | not counted in total, shown as cancelled |
| TC-REP-04 | REP-04 | Unit + Integration | Present count | matches number of Present records |
| TC-REP-05 | REP-05 | Unit + Integration | Absent count | matches number of Absent records |
| TC-REP-06 | boundary | Unit | No registrations | all zeros, no divide by zero |
| TC-REP-07 | boundary | Unit + Integration | Event exactly full | filled 100%, 0 seats left |
| TC-REP-08 | boundary | Unit | Everyone absent | 0 present, all absent |
| TC-REP-09 | access | Integration | No token / student token | 401 / 403 |
| TC-REP-10 | error | Unit + Integration | Unknown event / malformed id / DB error | 404 / 400 / 500 |
| TC-REP-11 | integration | Integration | `GET /api/reports/events` | one row per event + correct totals |

Run: `cd server && npm test`

## Fix carried over from Sprint 1

After the Registration model was merged, a registration's status is `Registered` or `Cancelled`. The attendance queries were still using `Active`, so the attendance list came back empty. They now use `Registered`.

## Deviations to mention in the demo

- Reports are calculated when the page is opened instead of being stored, so they always match the latest attendance.
- Added "Not marked" and "Cancelled" counts so the totals add up and are easy to check.
