# Integration Test Report

**Event Management System (PESU-EMS)**

| Item | Detail |
|---|---|
| Project | Event Management System |
| Team | Team 7 (Shayna Zaidi Gupta, Shaurya Ishan, Shriya C Rao, Sham Santosh) |
| Date of test run | 16-11-2026 |
| Build tested | commit ed58b46 on branch ci/test-reports-and-deploy |
| References | Software Requirement Specification (SRS), Software Test Plan (STP), SASD |

## 1. Purpose

This report records the results of integration testing, the second test level in the Test Plan (section 5, "Integration tests: React frontend - Express REST API; Express - MongoDB via Mongoose"). An integration test checks that several real components work together through their real interfaces.

## 2. Scope and approach

| Interface tested | What runs for real | Test files |
|---|---|---|
| Express REST API with MongoDB (auth, events, registrations, history, participants) | HTTP requests (Supertest) go through the real routes, JWT authentication middleware, role checks, controllers, Mongoose models and validation into an in-memory MongoDB | server/src/auth.test.js, server/src/health.test.js, server/tests/events.*.test.js, server/tests/registrations*.test.js |
| Express REST API for attendance and reports | Real routes, middleware and controllers over HTTP; only the Mongoose model layer is mocked | server/tests/integration/*.test.js |
| React pages with the API client | Real pages, React Router, login context and API module rendered in jsdom; the HTTP calls to the Express API are answered with recorded responses | client/src/**/*.test.jsx |

Each server test file starts its own empty in-memory MongoDB, so results do not depend on the shared Atlas database.

## 3. Test environment

| Item | Value |
|---|---|
| Operating system | Linux 6.18.44-fc-v470 (also run on ubuntu-latest in GitHub Actions on every push) |
| Runtime | Node.js v22.23.4 |
| Server | Express 5.3.0, Mongoose 9.11.4, Jest 30.5.2, Supertest 7.3.1, mongodb-memory-server 11.3.0 |
| Client | React 19.3.1, Vitest 5.0.5, React Testing Library 16.3.3, jsdom |
| Test data | Users, events and registrations created by each test through the models or the API |

## 4. Summary of results

| Part | Test files | Test cases | Passed | Failed | Skipped | Pass rate | Test time |
|---|---|---|---|---|---|---|---|
| Server | 9 | 133 | 133 | 0 | 0 | 100.0% | 24.28 s |
| Client | 6 | 37 | 37 | 0 | 0 | 100.0% | 4.25 s |
| **Total** | 15 | 170 | 170 | 0 | 0 | 100.0% | 28.53 s |

### Results by module

| Module | Test cases | Passed | Failed |
|---|---|---|---|
| Authentication and Role Management | 28 | 28 | 0 |
| Event Creation and Management | 51 | 51 | 0 |
| Event Discovery and Search | 30 | 30 | 0 |
| Event Registration | 22 | 22 | 0 |
| Registration History | 8 | 8 | 0 |
| Participation Management | 7 | 7 | 0 |
| Attendance | 15 | 15 | 0 |
| Event Status and Capacity | 1 | 1 | 0 |
| Reporting | 7 | 7 | 0 |
| Server set-up and hosting | 1 | 1 | 0 |

## 5. Test cases and results

**server/tests/registrations.test.js** (Event Registration)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-116 | POST /api/registrations TC-REG-01: an authenticated student can register | REG-01 | Pass | 369 ms |
| IT-117 | POST /api/registrations TC-REG-02: an unauthenticated user cannot register | REG-02 | Pass | 292 ms |
| IT-118 | POST /api/registrations TC-REG-02: an organizer cannot register for an event | REG-02 | Pass | 230 ms |
| IT-119 | POST /api/registrations TC-REG-03: a student cannot register twice for the same event | REG-03 | Pass | 280 ms |
| IT-120 | POST /api/registrations TC-REG-04: registration after the deadline is rejected | REG-04 | Pass | 269 ms |
| IT-121 | POST /api/registrations TC-REG-05: registration is rejected when the event is full | REG-05 | Pass | 258 ms |
| IT-122 | POST /api/registrations TC-REG-05: two students racing for the last seat - only one gets it | REG-05 | Pass | 294 ms |
| IT-123 | POST /api/registrations TC-STATUS-04: registration for a cancelled event is rejected | STATUS-04 | Pass | 246 ms |
| IT-124 | POST /api/registrations TC-REG-01: registration for an event that already started is rejected | REG-01 | Pass | 241 ms |
| IT-125 | POST /api/registrations TC-REG-01: an unknown or malformed event id returns 404, a missing one returns 400 | REG-01 | Pass | 268 ms |
| IT-126 | POST /api/registrations TC-REG-06: different students can register for the same event | REG-06 | Pass | 266 ms |
| IT-127 | GET /api/events/:eventId/participants TC-PART-01: the organizer sees the participants of their event with name and email | PART-01 | Pass | 447 ms |
| IT-128 | GET /api/events/:eventId/participants TC-PART-04: only participants of this event are returned, and cancelled ones are left out | PART-04 | Pass | 558 ms |
| IT-129 | GET /api/events/:eventId/participants TC-PART-01: an event with no registrations returns an empty list | PART-01 | Pass | 264 ms |
| IT-130 | GET /api/events/:eventId/participants TC-PART-03: an organizer cannot view another organizer's participants | PART-03 | Pass | 341 ms |
| IT-131 | GET /api/events/:eventId/participants TC-PART-03: a student cannot view participants | PART-03 | Pass | 246 ms |
| IT-132 | GET /api/events/:eventId/participants TC-PART-03: a logged-out user cannot view participants | PART-03 | Pass | 239 ms |
| IT-133 | GET /api/events/:eventId/participants TC-PART-01: participants of an unknown event return 404 | PART-01 | Pass | 257 ms |

**server/tests/registrations.manage.test.js** (Event Registration)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-098 | PATCH /api/registrations/:id/cancel TC-REG-07: a student can cancel their registration, and the record is kept | REG-07 | Pass | 383 ms |
| IT-099 | PATCH /api/registrations/:id/cancel TC-REG-08: cancelling gives the seat back | REG-08 | Pass | 351 ms |
| IT-100 | PATCH /api/registrations/:id/cancel TC-REG-08: a seat freed by a cancellation can be taken by another student | REG-08 | Pass | 334 ms |
| IT-101 | PATCH /api/registrations/:id/cancel TC-REG-07: a student cannot cancel someone else's registration | REG-07 | Pass | 288 ms |
| IT-102 | PATCH /api/registrations/:id/cancel TC-REG-07: an organizer cannot use the student cancel route | REG-07 | Pass | 259 ms |
| IT-103 | PATCH /api/registrations/:id/cancel TC-REG-07: a logged-out user cannot cancel | REG-07 | Pass | 247 ms |
| IT-104 | PATCH /api/registrations/:id/cancel TC-REG-07: an unknown or malformed registration id returns 404 | REG-07 | Pass | 240 ms |
| IT-105 | PATCH /api/registrations/:id/cancel TC-REG-08: cancelling twice gives the seat back only once | REG-08 | Pass | 269 ms |
| IT-106 | PATCH /api/registrations/:id/cancel TC-REG-07: a registration cannot be cancelled after the event has started | REG-07 | Pass | 287 ms |
| IT-107 | PATCH /api/registrations/:id/cancel TC-REG-03: after cancelling, the student can register again using the same record | REG-03 | Pass | 297 ms |
| IT-108 | GET /api/registrations/mine TC-HIST-01: a student sees only their own registrations, with event details | HIST-01 | Pass | 331 ms |
| IT-109 | GET /api/registrations/mine TC-HIST-03: each registration carries the event details, status and seats left | HIST-03 | Pass | 278 ms |
| IT-110 | GET /api/registrations/mine TC-HIST-02/04: the status is shown and active and cancelled registrations can be told apart | HIST-02 | Pass | 334 ms |
| IT-111 | GET /api/registrations/mine TC-HIST-04: the status filter returns only active or only cancelled registrations | HIST-04 | Pass | 317 ms |
| IT-112 | GET /api/registrations/mine TC-HIST-04: an invalid status filter is rejected | HIST-04 | Pass | 278 ms |
| IT-113 | GET /api/registrations/mine TC-HIST-03: an event cancelled by its organizer shows as Cancelled in the history | HIST-03 | Pass | 283 ms |
| IT-114 | GET /api/registrations/mine TC-HIST-01: a student with no registrations gets an empty list | HIST-01 | Pass | 249 ms |
| IT-115 | GET /api/registrations/mine TC-HIST-01: organizers and logged-out users cannot read a student history | HIST-01 | Pass | 241 ms |

**server/tests/events.create.test.js** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-019 | POST /api/events TC-EVENT-01: an organizer creates an event | EVENT-01 | Pass | 125 ms |
| IT-020 | POST /api/events TC-EVENT-01: organizer, status and registeredCount in the body are ignored | EVENT-01 | Pass | 91 ms |
| IT-021 | POST /api/events TC-EVENT-02: an empty body is rejected with a message for each required field | EVENT-02 | Pass | 101 ms |
| IT-022 | POST /api/events TC-EVENT-02: a missing title is rejected | EVENT-02 | Pass | 93 ms |
| IT-023 | POST /api/events TC-EVENT-03: a category not in the list is rejected | EVENT-03 | Pass | 89 ms |
| IT-024 | POST /api/events TC-EVENT-03: a date that is not a date is rejected | EVENT-03 | Pass | 104 ms |
| IT-025 | POST /api/events TC-EVENT-08: capacity of 0 is rejected | EVENT-08 | Pass | 103 ms |
| IT-026 | POST /api/events TC-EVENT-08: an end date before the start is rejected | EVENT-08 | Pass | 90 ms |
| IT-027 | POST /api/events TC-EVENT-08: a start date in the past is rejected | EVENT-08 | Pass | 96 ms |
| IT-028 | POST /api/events TC-EVENT-01: a body that is not valid JSON is rejected | EVENT-01 | Pass | 89 ms |
| IT-029 | POST /api/events TC-EVENT-01: a student cannot create an event (403) | EVENT-01 | Pass | 184 ms |
| IT-030 | POST /api/events TC-EVENT-01: a request without login cannot create an event (401) | EVENT-01 | Pass | 97 ms |

**server/src/auth.test.js** (Authentication and Role Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-001 | register creates a Student and returns token + public user | - | Pass | 130 ms |
| IT-002 | register ignores a role sent by the client | - | Pass | 89 ms |
| IT-003 | register stores a bcrypt hash, never the plain password (TC-AUTH-03, TC-SEC-01) | AUTH-03, SEC-01 | Pass | 89 ms |
| IT-004 | register rejects non-PESU email, duplicates and missing fields | - | Pass | 168 ms |
| IT-005 | login (TC-AUTH-01, TC-AUTH-02, TC-AUTH-04, TC-AUTH-07) valid credentials return token and role | AUTH-01, AUTH-02, AUTH-04, AUTH-07 | Pass | 160 ms |
| IT-006 | login (TC-AUTH-01, TC-AUTH-02, TC-AUTH-04, TC-AUTH-07) wrong password and unknown email get the same 401 | AUTH-01, AUTH-02, AUTH-04, AUTH-07 | Pass | 166 ms |
| IT-007 | login (TC-AUTH-01, TC-AUTH-02, TC-AUTH-04, TC-AUTH-07) non-string credentials are rejected, not queried | AUTH-01, AUTH-02, AUTH-04, AUTH-07 | Pass | 85 ms |
| IT-008 | login (TC-AUTH-01, TC-AUTH-02, TC-AUTH-04, TC-AUTH-07) empty body does not crash | AUTH-01, AUTH-02, AUTH-04, AUTH-07 | Pass | 82 ms |
| IT-009 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) no token, garbage token, wrong secret, wrong algorithm -> 401 | AUTH-05, AUTH-06 | Pass | 100 ms |
| IT-010 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) Student -> 403, Organizer -> 200 with req.user.id/role | AUTH-05, AUTH-06 | Pass | 182 ms |
| IT-011 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) role comes from the DB, not the token; deleted user -> 401 | AUTH-05, AUTH-06 | Pass | 94 ms |
| IT-012 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) tampered token -> 401 | AUTH-05, AUTH-06 | Pass | 100 ms |
| IT-013 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) 401 and 403 use the team error format | AUTH-05, AUTH-06 | Pass | 93 ms |
| IT-014 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) requireRole takes several roles and ignores case; old names are aliases | AUTH-05, AUTH-06 | Pass | 86 ms |
| IT-015 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) expired token -> 401 | AUTH-05, AUTH-06 | Pass | 80 ms |
| IT-016 | authenticate + requireRole (TC-AUTH-05, TC-AUTH-06) GET /api/auth/me returns the logged-in user | AUTH-05, AUTH-06 | Pass | 84 ms |
| IT-017 | unknown route returns JSON 404 | - | Pass | 4 ms |

**server/tests/integration/attendanceApi.test.js** (Attendance)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-076 | PATCH /api/attendance/:registrationId 401 without a token | - | Pass | 12 ms |
| IT-077 | PATCH /api/attendance/:registrationId 401 with a tampered token | - | Pass | 14 ms |
| IT-078 | PATCH /api/attendance/:registrationId 403 when a student tries to mark attendance (ATT-06) | ATT-06 | Pass | 4 ms |
| IT-079 | PATCH /api/attendance/:registrationId 200 when the event organizer marks Present (ATT-01) | ATT-01 | Pass | 3 ms |
| IT-080 | PATCH /api/attendance/:registrationId 200 when the organizer marks Absent (ATT-02) | ATT-02 | Pass | 2 ms |
| IT-081 | PATCH /api/attendance/:registrationId a second call changes the stored status (ATT-05) | ATT-05 | Pass | 4 ms |
| IT-082 | PATCH /api/attendance/:registrationId 403 when a different organizer tries it (ATT-06) | ATT-06 | Pass | 3 ms |
| IT-083 | PATCH /api/attendance/:registrationId 400 for an invalid status value | - | Pass | 2 ms |
| IT-084 | PATCH /api/attendance/:registrationId 404 for an unknown registration | - | Pass | 2 ms |
| IT-085 | GET /api/attendance/event/:eventId returns the participant list to the owner | - | Pass | 2 ms |
| IT-086 | GET /api/attendance/event/:eventId 403 for a student | - | Pass | 3 ms |
| IT-087 | GET /api/attendance/event/:eventId 403 for an organizer who does not own the event | - | Pass | 2 ms |
| IT-088 | GET /api/attendance/event/:eventId 404 for an unknown event | - | Pass | 2 ms |
| IT-089 | GET /api/attendance/events returns the organizer's events | - | Pass | 2 ms |
| IT-090 | GET /api/attendance/events 403 for a student | - | Pass | 2 ms |

**server/tests/integration/reportApi.test.js** (Reporting)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-091 | GET /api/reports/event/:eventId organizer gets registration and attendance statistics | - | Pass | 6 ms |
| IT-092 | GET /api/reports/event/:eventId 401 without a token | - | Pass | 3 ms |
| IT-093 | GET /api/reports/event/:eventId 403 for a student | - | Pass | 3 ms |
| IT-094 | GET /api/reports/event/:eventId 403 for an organizer who does not own the event | - | Pass | 3 ms |
| IT-095 | GET /api/reports/event/:eventId 404 for an unknown event | - | Pass | 3 ms |
| IT-096 | GET /api/reports/events returns a report per event and the totals | - | Pass | 3 ms |
| IT-097 | GET /api/reports/events 403 for a student | - | Pass | 3 ms |

**server/src/health.test.js** (Server set-up and hosting)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-018 | GET /api/health returns ok | - | Pass | 13 ms |

**server/tests/events.read.test.js** (Event Discovery and Search)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-064 | GET /api/events TC-DISC-01: lists events soonest first, with paging info | DISC-01 | Pass | 142 ms |
| IT-065 | GET /api/events TC-DISC-01: returns an empty list when there are no events | DISC-01 | Pass | 96 ms |
| IT-066 | GET /api/events TC-DISC-01: page and limit pick the right slice | DISC-01 | Pass | 101 ms |
| IT-067 | GET /api/events TC-DISC-01: students can browse events too | DISC-01 | Pass | 92 ms |
| IT-068 | GET /api/events TC-DISC-01: browsing without login is refused (401) | DISC-01 | Pass | 94 ms |
| IT-069 | GET /api/events TC-DISC-05: each event shows its calculated status | DISC-05 | Pass | 125 ms |
| IT-070 | GET /api/events TC-DISC-06: each event shows seats left and whether registration is open | DISC-06 | Pass | 130 ms |
| IT-071 | GET /api/events/:id TC-DISC-04: returns the details of one event | DISC-04 | Pass | 112 ms |
| IT-072 | GET /api/events/:id TC-DISC-06: registration is shown as closed after the deadline | DISC-06 | Pass | 110 ms |
| IT-073 | GET /api/events/:id TC-DISC-04: an id that does not exist returns 404 | DISC-04 | Pass | 96 ms |
| IT-074 | GET /api/events/:id TC-DISC-04: an id that is not a valid id returns 404 | DISC-04 | Pass | 89 ms |
| IT-075 | GET /api/events/:id TC-DISC-04: viewing without login is refused (401) | DISC-04 | Pass | 93 ms |

**server/tests/events.manage.test.js** (Event Discovery and Search)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-031 | GET /api/events search and category filter TC-DISC-02: search finds events by title, ignoring case | DISC-02 | Pass | 359 ms |
| IT-032 | GET /api/events search and category filter TC-DISC-02: search also looks at description and venue | DISC-02 | Pass | 294 ms |
| IT-033 | GET /api/events search and category filter TC-DISC-02: search with no match returns an empty list | DISC-02 | Pass | 252 ms |
| IT-034 | GET /api/events search and category filter TC-DISC-02: special characters in search do not break the request | DISC-02 | Pass | 258 ms |
| IT-035 | GET /api/events search and category filter TC-DISC-03: category filter returns only that category | DISC-03 | Pass | 268 ms |
| IT-036 | GET /api/events search and category filter TC-DISC-02/03: search and category can be combined | DISC-02 | Pass | 265 ms |
| IT-037 | GET /api/events search and category filter TC-DISC-02: the old ?search= name still works | DISC-02 | Pass | 252 ms |
| IT-038 | GET /api/events search and category filter TC-DISC-01: no filters still returns every event | DISC-01 | Pass | 255 ms |
| IT-039 | GET /api/events status filter TC-DISC-05: ?status= filters by the calculated status | DISC-05 | Pass | 274 ms |
| IT-040 | GET /api/events status filter TC-DISC-05: an unknown status returns 400 | DISC-05 | Pass | 262 ms |
| IT-041 | GET /api/events/mine TC-EVENT-07: returns only the logged-in organizer's events | EVENT-07 | Pass | 282 ms |
| IT-042 | GET /api/events/mine TC-EVENT-07: a student cannot use My Events | EVENT-07 | Pass | 249 ms |
| IT-043 | PATCH /api/events/:id (edit) TC-EVENT-04: the owner can edit an event | EVENT-04 | Pass | 288 ms |
| IT-044 | PATCH /api/events/:id (edit) TC-EVENT-07: another organizer cannot edit the event | EVENT-07 | Pass | 282 ms |
| IT-045 | PATCH /api/events/:id (edit) TC-EVENT-07: a student cannot edit an event | EVENT-07 | Pass | 282 ms |
| IT-046 | PATCH /api/events/:id (edit) TC-EVENT-07: a logged-out user cannot edit an event | EVENT-07 | Pass | 264 ms |
| IT-047 | PATCH /api/events/:id (edit) TC-EVENT-04: editing a missing or malformed id returns 404 | EVENT-04 | Pass | 261 ms |
| IT-048 | PATCH /api/events/:id (edit) TC-EVENT-07: organizer, status and registeredCount cannot be changed through an edit | EVENT-07 | Pass | 244 ms |
| IT-049 | PATCH /api/events/:id (edit) TC-EVENT-08: an edit with an invalid capacity is rejected | EVENT-08 | Pass | 247 ms |
| IT-050 | PATCH /api/events/:id (edit) TC-EVENT-08: capacity cannot be lowered below the registered count | EVENT-08 | Pass | 252 ms |
| IT-051 | PATCH /api/events/:id (edit) TC-EVENT-08: an edit cannot put the end before the start | EVENT-08 | Pass | 267 ms |
| IT-052 | PATCH /api/events/:id (edit) TC-EVENT-08: an edit cannot move the start into the past | EVENT-08 | Pass | 258 ms |
| IT-053 | PATCH /api/events/:id (edit) TC-EVENT-08: an edit cannot put the registration deadline after the start | EVENT-08 | Pass | 244 ms |
| IT-054 | PATCH /api/events/:id (edit) TC-EVENT-04: a cancelled event cannot be edited | EVENT-04 | Pass | 266 ms |
| IT-055 | PATCH /api/events/:id (edit) TC-EVENT-04: a completed event cannot be edited | EVENT-04 | Pass | 403 ms |
| IT-056 | PATCH /api/events/:id/cancel TC-EVENT-05: the owner can cancel an event | EVENT-05 | Pass | 372 ms |
| IT-057 | PATCH /api/events/:id/cancel TC-EVENT-05: a cancelled event stays in the database and shows as Cancelled | EVENT-05 | Pass | 354 ms |
| IT-058 | PATCH /api/events/:id/cancel TC-EVENT-07: another organizer cannot cancel the event | EVENT-07 | Pass | 251 ms |
| IT-059 | PATCH /api/events/:id/cancel TC-EVENT-07: a student cannot cancel an event | EVENT-07 | Pass | 251 ms |
| IT-060 | PATCH /api/events/:id/cancel TC-EVENT-07: a logged-out user cannot cancel an event | EVENT-07 | Pass | 263 ms |
| IT-061 | PATCH /api/events/:id/cancel TC-EVENT-05: cancelling a missing event returns 404 | EVENT-05 | Pass | 354 ms |
| IT-062 | PATCH /api/events/:id/cancel TC-EVENT-05: cancelling an already cancelled event returns 409 | EVENT-05 | Pass | 276 ms |
| IT-063 | PATCH /api/events/:id/cancel TC-EVENT-05: a completed event cannot be cancelled | EVENT-05 | Pass | 270 ms |

**client/src/App.test.jsx** (Authentication and Role Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-134 | login student login stores the token and lands on the student dashboard | - | Pass | 467 ms |
| IT-135 | login organizer login lands on the organizer dashboard with the organizer menu | - | Pass | 263 ms |
| IT-136 | login invalid credentials show the server message and stay on the login page | - | Pass | 232 ms |
| IT-137 | route guards logged-out visitor is sent to /login | - | Pass | 37 ms |
| IT-138 | route guards student on an organizer route is redirected to the student dashboard | - | Pass | 32 ms |
| IT-139 | route guards organizer reaches an organizer route | - | Pass | 30 ms |
| IT-140 | session requests carry the bearer token | - | Pass | 19 ms |
| IT-141 | session a 401 from the API logs the user out | - | Pass | 37 ms |
| IT-142 | session logout clears the token and returns to login | - | Pass | 42 ms |

**client/src/pages/events/BrowseEventsPage.test.jsx** (Event Discovery and Search)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-143 | Browse Events TC-DISC-01, TC-DISC-05, TC-DISC-06: lists events with status, seats and registration | DISC-01, DISC-05, DISC-06 | Pass | 152 ms |
| IT-144 | Browse Events TC-DISC-02: searching sends ?q= and shows the matches | DISC-02 | Pass | 246 ms |
| IT-145 | Browse Events TC-DISC-03, TC-DISC-05: category and status dropdowns filter the list | DISC-03, DISC-05 | Pass | 139 ms |
| IT-146 | Browse Events TC-DISC-02: a search with no results says so | DISC-02 | Pass | 28 ms |
| IT-147 | Browse Events TC-DISC-01: more than one page shows Next, which loads page 2 | DISC-01 | Pass | 80 ms |
| IT-148 | Browse Events TC-AUTH-06: only organizers see the Create event button | AUTH-06 | Pass | 53 ms |
| IT-149 | Browse Events TC-EVENT-01: an organizer sees the Create event button | EVENT-01 | Pass | 56 ms |
| IT-150 | Browse Events TC-DISC-01: a server error is shown instead of the list | DISC-01 | Pass | 19 ms |

**client/src/pages/events/EventDetailsPage.test.jsx** (Event Discovery and Search)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-151 | Event Details TC-DISC-04, TC-DISC-05: shows the event facts, status and seats left | DISC-04, DISC-05 | Pass | 196 ms |
| IT-152 | Event Details TC-DISC-04: an unknown event shows a not found message | DISC-04 | Pass | 40 ms |
| IT-153 | Event Details TC-REG-01: a student sees the Register button and no management links | REG-01 | Pass | 87 ms |
| IT-154 | Event Details TC-REG-03: a student who is already registered sees that instead of the Register button | REG-03 | Pass | 47 ms |
| IT-155 | Event Details TC-EVENT-04: the owner sees Edit, Attendance and Report links instead of Register | EVENT-04 | Pass | 103 ms |
| IT-156 | Event Details TC-EVENT-07: another organizer does not get the owner links | EVENT-07 | Pass | 60 ms |
| IT-157 | Event Details TC-EVENT-06: a cancelled event has no Edit link, even for the owner | EVENT-06 | Pass | 53 ms |

**client/src/pages/organizer/CreateEventPage.test.jsx** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-158 | Create Event TC-EVENT-02, TC-EVENT-08: server validation messages appear next to each field | EVENT-02, EVENT-08 | Pass | 250 ms |
| IT-159 | Create Event TC-EVENT-01, TC-EVENT-03: a valid event is sent and its details page opens | EVENT-01, EVENT-03 | Pass | 375 ms |

**client/src/pages/organizer/EditEventPage.test.jsx** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-160 | Edit Event TC-EVENT-04: the form opens filled in with the event | EVENT-04 | Pass | 120 ms |
| IT-161 | Edit Event TC-EVENT-04: saving sends only the changed fields | EVENT-04 | Pass | 258 ms |
| IT-162 | Edit Event TC-EVENT-08: a capacity below the registered count shows the server message | EVENT-08 | Pass | 122 ms |
| IT-163 | Edit Event TC-EVENT-05: cancelling asks first, then cancels and returns to My Events | EVENT-05 | Pass | 84 ms |
| IT-164 | Edit Event TC-EVENT-05: saying no to the confirmation does not cancel | EVENT-05 | Pass | 79 ms |
| IT-165 | Edit Event TC-EVENT-07: another organizer cannot edit the event | EVENT-07 | Pass | 36 ms |
| IT-166 | Edit Event TC-EVENT-06: a cancelled event cannot be edited | EVENT-06 | Pass | 35 ms |

**client/src/pages/organizer/MyEventsPage.test.jsx** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| IT-167 | My Events TC-EVENT-04: lists the organizer's events with manage links | EVENT-04 | Pass | 261 ms |
| IT-168 | My Events TC-EVENT-06: cancelled and completed events have no Edit link | EVENT-06 | Pass | 56 ms |
| IT-169 | My Events TC-EVENT-04: an organizer with no events is told so | EVENT-04 | Pass | 23 ms |
| IT-170 | My Events TC-AUTH-06: a student is sent away from My Events | AUTH-06 | Pass | 34 ms |

## 6. Defects

No test case failed in this run, so no defects were raised from it.

## 7. Exit criteria

| Exit criterion (Test Plan section 5) | Status |
|---|---|
| All planned test cases at this level executed | Met: 170 of 170 executed |
| No critical or high-severity defects open | Met: no failing test cases |

## 8. How to reproduce

```bash
cd server && npm ci && npm run test:integration
cd client && npm ci && npm run test:integration
```
