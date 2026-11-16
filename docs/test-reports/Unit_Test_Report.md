# Unit Test Report

**Event Management System (PESU-EMS)**

| Item | Detail |
|---|---|
| Project | Event Management System |
| Team | Team 7 (Shayna Zaidi Gupta, Shaurya Ishan, Shriya C Rao, Sham Santosh) |
| Date of test run | 16-11-2026 |
| Build tested | commit ed58b46 on branch ci/test-reports-and-deploy |
| References | Software Requirement Specification (SRS), Software Test Plan (STP), SASD |

## 1. Purpose

This report records the results of unit testing, the first test level in the Test Plan (section 5, "Unit tests: module-level: Express route handlers, Mongoose schema validation"). A unit test checks one function, controller, model or utility on its own, with everything it depends on either replaced by a test double or kept to the minimum.

## 2. Scope and approach

| Unit under test | How it is isolated | Test files |
|---|---|---|
| Utility functions (event status, report statistics) | Pure functions called directly with prepared inputs, including boundary values (full event, zero registrations, missing capacity) | server/tests/eventStatus.test.js, server/tests/unit/reportStats.test.js |
| Express controllers (attendance, reports) | Controller functions called with fake request and response objects; the Mongoose models are replaced with Jest mocks, so no database or HTTP is involved | server/tests/unit/attendanceController.test.js, server/tests/unit/reportController.test.js |
| Mongoose schema validation (Event model) | The model's validators run against a throwaway in-memory MongoDB, with no Express layer | server/tests/event.model.test.js |
| Static hosting helper | A minimal Express app with a temporary folder in place of the real client build | server/tests/serveClient.test.js |
| Client form helpers | Pure functions that convert between form values and the API payload | client/src/utils/eventForm.test.js |

Techniques used: equivalence partitioning (valid and invalid inputs), boundary value analysis (capacity, dates, zero and full counts), and error-path testing (missing records, malformed ids, database failure).

## 3. Test environment

| Item | Value |
|---|---|
| Operating system | Linux 6.18.44-fc-v470 (also run on ubuntu-latest in GitHub Actions on every push) |
| Runtime | Node.js v22.23.4 |
| Server test framework | Jest 30.5.2, mongodb-memory-server 11.3.0 (in-memory MongoDB), Mongoose 9.11.4 |
| Client test framework | Vitest 5.0.5 |
| Test data | Created inside each test and removed after it; no shared database |

## 4. Summary of results

| Part | Test files | Test cases | Passed | Failed | Skipped | Pass rate | Test time |
|---|---|---|---|---|---|---|---|
| Server | 6 | 81 | 81 | 0 | 0 | 100.0% | 143 ms |
| Client | 1 | 4 | 4 | 0 | 0 | 100.0% | 4 ms |
| **Total** | 7 | 85 | 85 | 0 | 0 | 100.0% | 147 ms |

### Results by module

| Module | Test cases | Passed | Failed |
|---|---|---|---|
| Event Creation and Management | 34 | 34 | 0 |
| Event Discovery and Search | 9 | 9 | 0 |
| Attendance | 15 | 15 | 0 |
| Event Status and Capacity | 5 | 5 | 0 |
| Reporting | 17 | 17 | 0 |
| Server set-up and hosting | 5 | 5 | 0 |

## 5. Test cases and results

**server/tests/event.model.test.js** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-001 | Event model TC-EVENT-02: a valid event passes validation | EVENT-02 | Pass | 6 ms |
| UT-002 | Event model TC-EVENT-02: rejects an event with no title | EVENT-02 | Pass | 2 ms |
| UT-003 | Event model TC-EVENT-02: rejects an event with no category | EVENT-02 | Pass | 2 ms |
| UT-004 | Event model TC-EVENT-02: rejects an event with no venue | EVENT-02 | Pass | 2 ms |
| UT-005 | Event model TC-EVENT-02: rejects an event with no startDateTime | EVENT-02 | Pass | 2 ms |
| UT-006 | Event model TC-EVENT-02: rejects an event with no endDateTime | EVENT-02 | Pass | 2 ms |
| UT-007 | Event model TC-EVENT-02: rejects an event with no registrationDeadline | EVENT-02 | Pass | 2 ms |
| UT-008 | Event model TC-EVENT-02: rejects an event with no capacity | EVENT-02 | Pass | 2 ms |
| UT-009 | Event model TC-EVENT-02: rejects an event with no organizer | EVENT-02 | Pass | 1 ms |
| UT-010 | Event model TC-EVENT-02: rejects a title that is only spaces | EVENT-02 | Pass | 2 ms |
| UT-011 | Event model TC-EVENT-03: rejects a title longer than 100 characters | EVENT-03 | Pass | 2 ms |
| UT-012 | Event model TC-EVENT-03: rejects a venue longer than 150 characters | EVENT-03 | Pass | 2 ms |
| UT-013 | Event model TC-EVENT-03: rejects a description longer than 1000 characters | EVENT-03 | Pass | 2 ms |
| UT-014 | Event model TC-EVENT-03: rejects a category not in the list | EVENT-03 | Pass | 1 ms |
| UT-015 | Event model TC-EVENT-03: trims spaces around title and venue | EVENT-03 | Pass | 2 ms |
| UT-016 | Event model TC-EVENT-08: rejects a start date in the past | EVENT-08 | Pass | 2 ms |
| UT-017 | Event model TC-EVENT-08: rejects an end date before the start | EVENT-08 | Pass | 1 ms |
| UT-018 | Event model TC-EVENT-08: rejects an end date equal to the start | EVENT-08 | Pass | 1 ms |
| UT-019 | Event model TC-EVENT-08: rejects a registration deadline in the past | EVENT-08 | Pass | 2 ms |
| UT-020 | Event model TC-EVENT-08: rejects a registration deadline after the start | EVENT-08 | Pass | 1 ms |
| UT-021 | Event model TC-EVENT-08: rejects an invalid date string | EVENT-08 | Pass | 11 ms |
| UT-022 | Event model TC-EVENT-08: rejects capacity of 0 | EVENT-08 | Pass | 14 ms |
| UT-023 | Event model TC-EVENT-08: rejects capacity of -5 | EVENT-08 | Pass | 2 ms |
| UT-024 | Event model TC-EVENT-08: rejects capacity of 2.5 | EVENT-08 | Pass | 2 ms |
| UT-025 | Event model TC-EVENT-08: rejects capacity of 100000 | EVENT-08 | Pass | 2 ms |
| UT-026 | Event model TC-EVENT-08: rejects capacity of "abc" | EVENT-08 | Pass | 2 ms |
| UT-027 | Event model TC-EVENT-08: accepts capacity of 1 | EVENT-08 | Pass | 2 ms |
| UT-028 | Event model TC-EVENT-08: accepts capacity of 99999 | EVENT-08 | Pass | 2 ms |
| UT-029 | Event model TC-EVENT-08: rejects capacity lower than the registered count | EVENT-08 | Pass | 1 ms |
| UT-030 | Event model TC-EVENT-06: a new event is saved with status Upcoming and 0 registered | EVENT-06 | Pass | 6 ms |
| UT-031 | Event model TC-STATUS-01: only Upcoming and Cancelled can be stored as status | STATUS-01 | Pass | 4 ms |
| UT-032 | Event model TC-STATUS-01: an event that has already started can still be cancelled | STATUS-01 | Pass | 8 ms |

**server/tests/serveClient.test.js** (Server set-up and hosting)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-045 | serveClient (production static hosting) serves index.html at the root | - | Pass | 7 ms |
| UT-046 | serveClient (production static hosting) serves built assets | - | Pass | 3 ms |
| UT-047 | serveClient (production static hosting) falls back to index.html for client-side routes | - | Pass | 3 ms |
| UT-048 | serveClient (production static hosting) leaves /api routes to the API, including unknown ones | - | Pass | 5 ms |
| UT-049 | serveClient (production static hosting) serves the API only when there is no client build | - | Pass | 2 ms |

**server/tests/unit/attendanceController.test.js** (Attendance)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-050 | markAttendance marks a student Present (ATT-01) | ATT-01 | Pass | 1 ms |
| UT-051 | markAttendance marks a student Absent (ATT-02) | ATT-02 | Pass | 0 ms |
| UT-052 | markAttendance saves the record on the registration document (ATT-03, ATT-04) | ATT-03, ATT-04 | Pass | 1 ms |
| UT-053 | markAttendance lets the organizer correct an existing record (ATT-05) | ATT-05 | Pass | 1 ms |
| UT-054 | markAttendance 403 when another organizer owns the event (ATT-06) | ATT-06 | Pass | 1 ms |
| UT-055 | markAttendance 400 for a status other than Present/Absent | - | Pass | 0 ms |
| UT-056 | markAttendance 400 when status is missing | - | Pass | 1 ms |
| UT-057 | markAttendance 404 when the registration does not exist | - | Pass | 1 ms |
| UT-058 | markAttendance 400 for a cancelled registration | - | Pass | 0 ms |
| UT-059 | markAttendance 400 when the event itself is cancelled | - | Pass | 1 ms |
| UT-060 | markAttendance 400 for a malformed registration id | - | Pass | 1 ms |
| UT-061 | getEventAttendance 403 for an organizer who does not own the event | - | Pass | 1 ms |
| UT-062 | getEventAttendance returns active registrations to the event owner | - | Pass | 0 ms |
| UT-063 | getEventAttendance 404 when the event is missing | - | Pass | 1 ms |
| UT-064 | getMyEvents lists only the organizer's events with registration counts | - | Pass | 1 ms |

**server/tests/unit/reportController.test.js** (Reporting)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-065 | getEventReport returns registration and attendance totals for the event | - | Pass | 1 ms |
| UT-066 | getEventReport 404 when the event does not exist | - | Pass | 0 ms |
| UT-067 | getEventReport 403 when the organizer does not own the event | - | Pass | 1 ms |
| UT-068 | getEventReport a finished event is reported as Completed, not its stored status | - | Pass | 1 ms |
| UT-069 | getEventReport 400 for a malformed event id | - | Pass | 0 ms |
| UT-070 | getEventReport 500 when the database fails | - | Pass | 0 ms |
| UT-071 | getMyReports lists only the organizer's events with overall totals | - | Pass | 2 ms |
| UT-072 | getMyReports organizer with no events gets an empty list and zero totals | - | Pass | 1 ms |

**server/tests/eventStatus.test.js** (Event Discovery and Search)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-033 | computeStatus TC-DISC-05: Upcoming before the start | DISC-05 | Pass | 1 ms |
| UT-034 | computeStatus TC-DISC-05: Ongoing between start and end | DISC-05 | Pass | 1 ms |
| UT-035 | computeStatus TC-DISC-05: Completed after the end | DISC-05 | Pass | 1 ms |
| UT-036 | computeStatus TC-DISC-05: Cancelled wins over the dates | DISC-05 | Pass | 0 ms |
| UT-037 | seats TC-STATUS-02: seatsLeft is capacity minus registered | STATUS-02 | Pass | 1 ms |
| UT-038 | seats TC-STATUS-02: an event with every seat taken is full | STATUS-02 | Pass | 1 ms |
| UT-039 | seats TC-STATUS-02: an event with seats left is not full | STATUS-02 | Pass | 0 ms |
| UT-040 | registrationOpen TC-DISC-06: open for an upcoming event with seats before the deadline | DISC-06 | Pass | 0 ms |
| UT-041 | registrationOpen TC-DISC-06: closed when the event is full | DISC-06 | Pass | 1 ms |
| UT-042 | registrationOpen TC-DISC-06: closed after the registration deadline | DISC-06 | Pass | 0 ms |
| UT-043 | registrationOpen TC-DISC-06: closed when the event is cancelled | DISC-06 | Pass | 0 ms |
| UT-044 | registrationOpen TC-DISC-06: closed once the event has started | DISC-06 | Pass | 1 ms |

**server/tests/unit/reportStats.test.js** (Reporting)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-073 | percent rounds to one decimal place | - | Pass | 0 ms |
| UT-074 | percent returns 0 instead of dividing by zero | - | Pass | 1 ms |
| UT-075 | buildEventStats counts registrations, present and absent (REP-01 to REP-05) | REP-01, REP-02, REP-03, REP-04, REP-05 | Pass | 0 ms |
| UT-076 | buildEventStats cancelled registrations are not counted as registered or attended | - | Pass | 1 ms |
| UT-077 | buildEventStats event with no registrations gives all zeros | - | Pass | 0 ms |
| UT-078 | buildEventStats full event shows 100% fill and no seats left (boundary) | - | Pass | 1 ms |
| UT-079 | buildEventStats everyone absent gives 0 present | - | Pass | 0 ms |
| UT-080 | buildEventStats missing capacity does not break the report | - | Pass | 1 ms |
| UT-081 | buildEventStats handles undefined registration list | - | Pass | 0 ms |

**client/src/utils/eventForm.test.js** (Event Creation and Management)

| ID | Test case | Requirement | Result | Time |
|---|---|---|---|---|
| UT-082 | event form helpers TC-EVENT-02: toPayload leaves out empty fields and converts dates and capacity | EVENT-02 | Pass | 3 ms |
| UT-083 | event form helpers TC-EVENT-04: toFormValues turns an API event back into form values | EVENT-04 | Pass | 0 ms |
| UT-084 | event form helpers TC-EVENT-04: changedFields returns only what the organizer changed | EVENT-04 | Pass | 0 ms |
| UT-085 | event form helpers TC-EVENT-04: clearing a field sends it empty so the server can reject or clear it | EVENT-04 | Pass | 0 ms |

## 6. Defects

No test case failed in this run, so no defects were raised from it.

## 7. Exit criteria

| Exit criterion (Test Plan section 5) | Status |
|---|---|
| All planned test cases at this level executed | Met: 85 of 85 executed |
| No critical or high-severity defects open | Met: no failing test cases |

## 8. How to reproduce

```bash
cd server && npm ci && npm run test:unit
cd client && npm ci && npm run test:unit
```
