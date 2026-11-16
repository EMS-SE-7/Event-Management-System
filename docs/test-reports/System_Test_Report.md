# System Test Report

**Event Management System (PESU-EMS)**

| Item | Detail |
|---|---|
| Project | Event Management System |
| Team | Team 7 (Shayna Zaidi Gupta, Shaurya Ishan, Shriya C Rao, Sham Santosh) |
| Date of test run | 16-11-2026 |
| Build tested | commit ed58b46 on branch ci/test-reports-and-deploy |
| References | Software Requirement Specification (SRS), Software Test Plan (STP), SASD |

## 1. Purpose

This report records the results of system testing, the third test level in the Test Plan (section 5, "System tests: end-to-end flows across modules, e.g. student registers - organizer views participant - organizer marks attendance"). System tests treat the application as a black box: a real web browser uses the finished product the way a student or organizer would, and the tests check only what the user sees and what the public API returns.

## 2. System under test

The complete application is started exactly as it runs when deployed: the production build of the React client, served by the Express server with `NODE_ENV=production`, connected to its own MongoDB database. The database starts empty for every run and is seeded with two organizer and two student accounts, so each run is repeatable.

| Item | Value |
|---|---|
| Browser | Chromium (desktop), driven by Playwright 1.63.0 |
| Front end | Production build of the React 19.3.1 client (vite build) |
| Back end | Express 5.3.0 on Node.js v22.23.4, NODE_ENV=production |
| Database | Fresh MongoDB started by mongodb-memory-server 11.3.0, seeded by system-tests/test-server.js |
| Test accounts | 2 organizers, 2 students (system-tests/tests/accounts.js); one more student signs up during the run |
| Operating system | Linux 6.18.44-fc-v470 (also run on ubuntu-latest in GitHub Actions on every push) |

## 3. Test types covered

| Type (Test Plan section 5) | System test cases |
|---|---|
| Functional | TC-SYS-01, TC-SYS-02, TC-SYS-03, TC-SYS-04, TC-SYS-05, TC-SYS-06, TC-SYS-07, TC-SYS-08, TC-SYS-09, TC-SYS-10, TC-SYS-11, TC-SYS-12, TC-SYS-13, TC-SYS-14, TC-SYS-15, TC-SYS-16, TC-SYS-17 |
| Performance (TC-PERF-01) | TC-SYS-18 |
| Security validation (section 5.1, TC-SEC-01) | TC-SYS-04, TC-SYS-19 |
| Regression | All of the above run automatically on every push and pull request (GitHub Actions) |

The main flow (TC-SYS-07 to TC-SYS-16) runs in order on the same event: an organizer creates it, a student finds it and registers, the organizer sees the participant, marks attendance and reads the report, then cancels the event.

## 4. Summary of results

| Part | Test files | Test cases | Passed | Failed | Skipped | Pass rate | Test time |
|---|---|---|---|---|---|---|---|
| Full system | 4 | 19 | 19 | 0 | 0 | 100.0% | 14.70 s |
| **Total** | 4 | 19 | 19 | 0 | 0 | 100.0% | 14.70 s |

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| TC-SYS-01 | A wrong password is rejected with a message and no login | AUTH-07 | Pass | 930 ms |
| TC-SYS-02 | An organizer signs in and gets the organizer menu | AUTH-01, AUTH-05 | Pass | 584 ms |
| TC-SYS-03 | A student signs in and gets the student menu only | AUTH-01, AUTH-05 | Pass | 544 ms |
| TC-SYS-04 | A student cannot open organizer pages or call organizer APIs | AUTH-06 | Pass | 974 ms |
| TC-SYS-05 | A new student signs up and lands on the student dashboard | AUTH-01 | Pass | 644 ms |
| TC-SYS-06 | Logging out ends the session and protected pages go back to login | AUTH-05 | Pass | 624 ms |
| TC-SYS-07 | The create form rejects missing mandatory fields | EVENT-02 | Pass | 608 ms |
| TC-SYS-08 | The create form rejects an end time before the start | EVENT-08 | Pass | 845 ms |
| TC-SYS-09 | An organizer creates an event and it is listed under My Events | EVENT-01 | Pass | 810 ms |
| TC-SYS-10 | A student browses and searches for the event | DISC-01, DISC-02 | Pass | 909 ms |
| TC-SYS-11 | A student registers once and sees it in My Registrations | REG-01, REG-03, HIST-01 | Pass | 854 ms |
| TC-SYS-12 | The organizer sees the student in the participant list | PART-01 | Pass | 682 ms |
| TC-SYS-13 | The organizer marks the student present and it is stored | ATT-01, ATT-03 | Pass | 723 ms |
| TC-SYS-14 | The event report shows the registration and attendance totals | REP-01, REP-03 | Pass | 598 ms |
| TC-SYS-15 | Another organizer cannot change this event | EVENT-07 | Pass | 110 ms |
| TC-SYS-16 | The organizer cancels the event and the student sees it as cancelled | EVENT-05 | Pass | 1.15 s |
| TC-SYS-17 | Once the last seat is taken nobody else can register | REG-05, STATUS-02, STATUS-03 | Pass | 1.55 s |
| TC-SYS-18 | Main API calls answer within 2 seconds | PERF-01 | Pass | 1.36 s |
| TC-SYS-19 | Protected APIs need a valid token and never return passwords | SEC-01 | Pass | 192 ms |

**Performance measurements (TC-SYS-18)**

- POST /api/auth/login: slowest of 10 calls 92 ms
- GET /api/events: slowest of 10 calls 7 ms
- GET /api/events/:id: slowest of 10 calls 6 ms
- GET /api/registrations/mine: slowest of 10 calls 8 ms

## 5. Test case details

### TC-SYS-01: A wrong password is rejected with a message and no login

| Field | Detail |
|---|---|
| Requirement | AUTH-07 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (930 ms) |

**Steps and expected results**

1. Open the Login page and enter a registered email with a wrong password
2. An error message is shown and the user stays on the Login page

### TC-SYS-02: An organizer signs in and gets the organizer menu

| Field | Detail |
|---|---|
| Requirement | AUTH-01, AUTH-05 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (584 ms) |

**Steps and expected results**

1. Log in with a seeded organizer account; the organizer dashboard opens
2. The menu shows the organizer-only items Create Event and Reports

### TC-SYS-03: A student signs in and gets the student menu only

| Field | Detail |
|---|---|
| Requirement | AUTH-01, AUTH-05 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (544 ms) |

**Steps and expected results**

1. Log in with a seeded student account; the student dashboard opens
2. The menu shows My Registrations and no organizer items

### TC-SYS-04: A student cannot open organizer pages or call organizer APIs

| Field | Detail |
|---|---|
| Requirement | AUTH-06 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (974 ms) |

**Steps and expected results**

1. Log in as a student
2. Typing the Create Event address sends the student back to their dashboard
3. Calling POST /api/events directly with the student token returns 403 Forbidden

### TC-SYS-05: A new student signs up and lands on the student dashboard

| Field | Detail |
|---|---|
| Requirement | AUTH-01 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (644 ms) |

**Steps and expected results**

1. Fill in the Student registration form with a new @pesu.pes.edu email
2. The account is created and the student dashboard opens

### TC-SYS-06: Logging out ends the session and protected pages go back to login

| Field | Detail |
|---|---|
| Requirement | AUTH-05 |
| Module | Authentication and Role Management |
| Test script | system-tests/tests/01-authentication.spec.js |
| Result | Pass (624 ms) |

**Steps and expected results**

1. Log in as a student, then click Log out
2. Opening My Registrations now redirects to the Login page

### TC-SYS-07: The create form rejects missing mandatory fields

| Field | Detail |
|---|---|
| Requirement | EVENT-02 |
| Module | Event Creation and Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (608 ms) |

**Steps and expected results**

1. Log in as an organizer and open Create Event
2. Submit the empty form
3. Field errors are shown and no event is created

**Measured**

- undefined

### TC-SYS-08: The create form rejects an end time before the start

| Field | Detail |
|---|---|
| Requirement | EVENT-08 |
| Module | Event Creation and Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (845 ms) |

**Steps and expected results**

1. Log in as an organizer and open Create Event
2. Fill every field, with the end time two hours before the start, and submit
3. The server rejects it and the form shows "End date and time must be after the start"

**Measured**

- undefined

### TC-SYS-09: An organizer creates an event and it is listed under My Events

| Field | Detail |
|---|---|
| Requirement | EVENT-01 |
| Module | Event Creation and Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (810 ms) |

**Steps and expected results**

1. Log in as an organizer and fill in Create Event with valid details
2. The new event details page opens with the title
3. My Events lists the event

**Measured**

- undefined

### TC-SYS-10: A student browses and searches for the event

| Field | Detail |
|---|---|
| Requirement | DISC-01, DISC-02 |
| Module | Event Discovery and Search |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (909 ms) |

**Steps and expected results**

1. Log in as a student and open Browse Events; the new event is listed
2. Search for a word no event contains; the event is not listed
3. Search for "Hackathon" and open the result; its details page opens

**Measured**

- undefined

### TC-SYS-11: A student registers once and sees it in My Registrations

| Field | Detail |
|---|---|
| Requirement | REG-01, REG-03, HIST-01 |
| Module | Event Registration |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (854 ms) |

**Steps and expected results**

1. Log in as a student, open the event and click Register for this event
2. Reload: the page still shows the registration and offers no second Register button
3. My Registrations lists the event

**Measured**

- undefined

### TC-SYS-12: The organizer sees the student in the participant list

| Field | Detail |
|---|---|
| Requirement | PART-01 |
| Module | Participation Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (682 ms) |

**Steps and expected results**

1. Log in as the organizer and open the event Participants page
2. The registered student is listed

**Measured**

- undefined

### TC-SYS-13: The organizer marks the student present and it is stored

| Field | Detail |
|---|---|
| Requirement | ATT-01, ATT-03 |
| Module | Attendance |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (723 ms) |

**Steps and expected results**

1. Log in as the organizer, open Attendance and click Present for the student
2. Reload: Present is still selected, so it was saved in the database

**Measured**

- undefined

### TC-SYS-14: The event report shows the registration and attendance totals

| Field | Detail |
|---|---|
| Requirement | REP-01, REP-03 |
| Module | Reporting |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (598 ms) |

**Steps and expected results**

1. Log in as the organizer and open the event Report
2. Registered 1, Seats left 39 (of 40), Present 1, Absent 0

**Measured**

- undefined

### TC-SYS-15: Another organizer cannot change this event

| Field | Detail |
|---|---|
| Requirement | EVENT-07 |
| Module | Event Creation and Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (110 ms) |

**Steps and expected results**

1. A second organizer sends PATCH /api/events/:id for this event; the API answers 403

**Measured**

- undefined

### TC-SYS-16: The organizer cancels the event and the student sees it as cancelled

| Field | Detail |
|---|---|
| Requirement | EVENT-05 |
| Module | Event Creation and Management |
| Test script | system-tests/tests/02-event-lifecycle.spec.js |
| Result | Pass (1.15 s) |

**Steps and expected results**

1. Log in as the organizer, open Edit or cancel, click Cancel event and confirm
2. In a separate session the student sees the event as Cancelled with no Register button

**Measured**

- undefined

### TC-SYS-17: Once the last seat is taken nobody else can register

| Field | Detail |
|---|---|
| Requirement | REG-05, STATUS-02, STATUS-03 |
| Module | Event Registration |
| Test script | system-tests/tests/03-capacity.spec.js |
| Result | Pass (1.55 s) |

**Steps and expected results**

1. Set-up: an organizer creates an event with 1 seat
2. Student 1 registers and takes the only seat
3. Student 2 opens the event: registration is closed and the button is disabled

### TC-SYS-18: Main API calls answer within 2 seconds

| Field | Detail |
|---|---|
| Requirement | PERF-01 |
| Module | Non-functional: Performance |
| Test script | system-tests/tests/04-non-functional.spec.js |
| Result | Pass (1.36 s) |

**Steps and expected results**

1. Call each of 4 main endpoints 10 times and record the slowest response
2. Every slowest response is at most 2000 ms

**Measured**

- POST /api/auth/login: slowest of 10 calls 92 ms
- GET /api/events: slowest of 10 calls 7 ms
- GET /api/events/:id: slowest of 10 calls 6 ms
- GET /api/registrations/mine: slowest of 10 calls 8 ms

### TC-SYS-19: Protected APIs need a valid token and never return passwords

| Field | Detail |
|---|---|
| Requirement | SEC-01 |
| Module | Non-functional: Security |
| Test script | system-tests/tests/04-non-functional.spec.js |
| Result | Pass (192 ms) |

**Steps and expected results**

1. Calls with no token or a made-up token are rejected with 401
2. A real token with a changed signature is rejected with 401
3. The login and profile responses contain no password field or password value

## 6. Defects

No test case failed in this run, so no defects were raised from it.

## 7. Exit criteria

| Exit criterion (Test Plan section 5) | Status |
|---|---|
| All planned test cases at this level executed | Met: 19 of 19 executed |
| No critical or high-severity defects open | Met: no failing test cases |

## 8. How to reproduce

```bash
npm ci --prefix server && npm ci --prefix client && npm run build --prefix client
cd system-tests && npm ci && npx playwright install chromium
npm test
```
