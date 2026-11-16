# Code & Branch Coverage Report

**Event Management System (PESU-EMS)**

| Item | Detail |
|---|---|
| Project | Event Management System |
| Team | Team 7 (Shayna Zaidi Gupta, Shaurya Ishan, Shriya C Rao, Sham Santosh) |
| Date of test run | 16-11-2026 |
| Build tested | commit ed58b46 on branch ci/test-reports-and-deploy |
| References | Software Requirement Specification (SRS), Software Test Plan (STP), SASD |

## 1. Purpose

This report measures how much of the source code the automated unit and integration tests execute. It supports the Test Plan metrics in section 14 and shows which parts of the code still need tests.

## 2. Coverage measures

| Measure | Meaning |
|---|---|
| Statement coverage | Share of executable statements run at least once by the tests |
| Branch coverage | Share of decision outcomes taken: both sides of every if/else, each case of a ternary (a ? b : c), and the short-circuit outcomes of &&, \|\| and ?? |
| Function coverage | Share of functions called at least once |
| Line coverage | Share of source lines with at least one statement run |

Code coverage is the statement and line figures; branch coverage is the stricter measure, because a line can run while one of its decision outcomes never happens.

## 3. Tools and method

| Part | Tool | Tests measured | Files measured |
|---|---|---|---|
| Server | Jest 30.5.2 with the Istanbul (babel-plugin-istanbul) instrumenter | All server unit and integration tests | server/src/**/*.js, except test files and the seed scripts in src/scripts/ (one-off command-line tools) |
| Client | Vitest 5.0.5 with the V8 coverage provider | All client unit and integration tests | client/src/**/*.{js,jsx}, except test files, src/test/ helpers, src/main.jsx (the browser entry point) and src/api/mock*.js (sample data used only when VITE_USE_MOCK=true during development) |

System tests run in a real browser against the production build and are not instrumented, so they are not counted here. Several client pages with low coverage below (attendance, reports, participants, registration history, sign-up) are exercised end to end by the system tests (see the System Test Report).

## 4. Overall coverage

| Part | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Server (Express API) | 92.16% (459/498) | 88.54% (232/262) | 94.11% (64/68) | 92.17% (436/473) |
| Client (React) | 61.75% (402/651) | 54.41% (296/544) | 57.33% (129/225) | 62.74% (352/561) |
| **Whole code base** | 74.93% (861/1149) | 65.51% (528/806) | 65.87% (193/293) | 76.21% (788/1034) |

## 5. Coverage by file

The last column lists the source lines that contain a branch outcome no test takes. Open `docs/test-reports/coverage-html/server/index.html (or client)` in a browser to see every line highlighted.

### Server

| File (in server/) | Statements | Branches | Functions | Lines | Lines with an untaken branch |
|---|---|---|---|---|---|
| `src/config/db.js` | 0.0% | 100.0% | 0.0% | 0.0% | - |
| `src/controllers/attendanceController.js` | 88.2% | 79.2% | 100.0% | 88.2% | 62, 74, 88, 112 |
| `src/controllers/auth.controller.js` | 96.9% | 92.0% | 100.0% | 96.7% | 15, 28 |
| `src/controllers/events.controller.js` | 100.0% | 95.7% | 100.0% | 100.0% | 60, 138 |
| `src/controllers/registrations.controller.js` | 90.5% | 85.5% | 100.0% | 90.4% | 61, 76, 86, 109, 122, 147, 157, 167 |
| `src/controllers/reportController.js` | 96.7% | 100.0% | 100.0% | 96.5% | - |
| `src/index.js` | 64.1% | 42.9% | 40.0% | 64.9% | 25-26, 36, 38, 42 |
| `src/middleware/auth.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/middleware/errorHandler.js` | 84.2% | 75.0% | 100.0% | 83.3% | 18, 26, 31 |
| `src/models/Event.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/models/Registration.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/models/User.js` | 90.0% | 50.0% | 100.0% | 100.0% | 22 |
| `src/routes/attendanceRoutes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/routes/auth.routes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/routes/events.routes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/routes/participants.routes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/routes/registrations.routes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/routes/reportRoutes.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/serveClient.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/utils/AppError.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/utils/eventStatus.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/utils/reportStats.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/utils/sendError.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |

### Client

| File (in client/) | Statements | Branches | Functions | Lines | Lines with an untaken branch |
|---|---|---|---|---|---|
| `src/api.js` | 93.5% | 94.7% | 75.0% | 95.8% | 45 |
| `src/api/attendanceApi.js` | 10.0% | 0.0% | 0.0% | 14.3% | 9, 14, 19 |
| `src/api/events.js` | 100.0% | 50.0% | 100.0% | 100.0% | 10 |
| `src/api/httpEvents.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/api/registrations.js` | 28.2% | 26.3% | 7.7% | 33.3% | 38, 42, 51, 57-58, 77, 91-94 |
| `src/api/reportApi.js` | 42.9% | 25.0% | 50.0% | 60.0% | 9, 14 |
| `src/App.jsx` | 33.3% | 0.0% | 50.0% | 33.3% | 22 |
| `src/auth-context.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/AuthContext.jsx` | 96.3% | 100.0% | 90.9% | 96.0% | - |
| `src/components/AuthPoster.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/CategoryTag.jsx` | 66.7% | 50.0% | 100.0% | 100.0% | 2 |
| `src/components/DateStub.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/EventCard.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/guards.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/Icon.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/Navbar.jsx` | 100.0% | 83.3% | 100.0% | 100.0% | 54 |
| `src/components/PageHead.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/components/RegisterButton.jsx` | 35.0% | 42.1% | 50.0% | 36.8% | 28, 30, 32, 37, 52, 65, 68 |
| `src/components/SeatsMeter.jsx` | 100.0% | 62.5% | 100.0% | 100.0% | 5-6 |
| `src/components/StatusBadge.jsx` | 66.7% | 50.0% | 100.0% | 100.0% | 4 |
| `src/pages/AttendanceEventsPage.jsx` | 0.0% | 0.0% | 0.0% | 0.0% | 25-27, 29-30 |
| `src/pages/AttendancePage.jsx` | 0.0% | 0.0% | 0.0% | 0.0% | 9, 38-39, 56, 58-60, 64, 66-67, 74-77, 89, 98, 107, 116 |
| `src/pages/EventReportPage.jsx` | 5.0% | 0.0% | 0.0% | 5.3% | 10, 13, 18, 33, 37, 48, 61-62, 79-80 |
| `src/pages/events/BrowseEventsPage.jsx` | 94.1% | 89.4% | 92.3% | 96.7% | 24, 26, 29, 32, 51 |
| `src/pages/events/EventDetailsPage.jsx` | 93.0% | 70.8% | 86.7% | 91.7% | 22-24, 46, 49, 52, 62, 65, 68, 78, 103 |
| `src/pages/events/EventFilters.jsx` | 83.3% | 100.0% | 87.5% | 83.3% | - |
| `src/pages/Home.jsx` | 68.9% | 83.0% | 54.2% | 76.5% | 17, 27, 42, 110, 130, 176 |
| `src/pages/Login.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/pages/organizer/CancelEventButton.jsx` | 84.6% | 75.0% | 100.0% | 83.3% | 12, 32 |
| `src/pages/organizer/CreateEventPage.jsx` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/pages/organizer/EditEventPage.jsx` | 90.9% | 63.6% | 88.9% | 93.1% | 22, 25, 28, 37, 40, 62 |
| `src/pages/organizer/EventForm.jsx` | 95.5% | 75.0% | 100.0% | 95.0% | 41-42, 103 |
| `src/pages/organizer/EventParticipantsPage.jsx` | 0.0% | 0.0% | 0.0% | 0.0% | 19, 21, 24, 27, 41-43, 45-46, 62, 64 |
| `src/pages/organizer/MyEventsPage.jsx` | 88.9% | 72.2% | 87.5% | 92.8% | 21, 24, 27, 41 |
| `src/pages/Register.jsx` | 0.0% | 0.0% | 0.0% | 0.0% | 16, 63, 65 |
| `src/pages/ReportsPage.jsx` | 0.0% | 0.0% | 0.0% | 0.0% | 30-31, 33-34, 42, 44-45, 62, 68, 75 |
| `src/pages/student/MyRegistrationsPage.jsx` | 2.3% | 0.0% | 0.0% | 2.7% | 24, 26-27, 31, 34, 42, 48, 73-76, 79-80, 88-90, 92, 100, 103-106, 109-110, 117 |
| `src/utils/categories.js` | 100.0% | 100.0% | 100.0% | 100.0% | - |
| `src/utils/eventForm.js` | 100.0% | 95.5% | 100.0% | 100.0% | 40 |
| `src/utils/format.js` | 82.3% | 64.3% | 100.0% | 92.3% | 12, 29, 34-35 |

## 6. Gaps and recommendations

Files with branch coverage below 50%:

| File | Branch coverage | Part |
|---|---|---|
| server/src/index.js | 42.9% | server |
| client/src/App.jsx | 0.0% | client |
| client/src/api/attendanceApi.js | 0.0% | client |
| client/src/api/registrations.js | 26.3% | client |
| client/src/api/reportApi.js | 25.0% | client |
| client/src/components/RegisterButton.jsx | 42.1% | client |
| client/src/pages/AttendanceEventsPage.jsx | 0.0% | client |
| client/src/pages/AttendancePage.jsx | 0.0% | client |
| client/src/pages/EventReportPage.jsx | 0.0% | client |
| client/src/pages/Register.jsx | 0.0% | client |
| client/src/pages/ReportsPage.jsx | 0.0% | client |
| client/src/pages/organizer/EventParticipantsPage.jsx | 0.0% | client |
| client/src/pages/student/MyRegistrationsPage.jsx | 0.0% | client |


- `server/src/index.js` lines that start the database connection and listen on a port run only when the server is started directly, never under test.
- `server/src/config/db.js` is used only by the seed scripts, which are not run by the tests.
- Client pages without their own component tests should get React Testing Library tests in the next sprint; until then the system tests cover their main paths.

## 7. How to reproduce

```bash
cd server && npm ci && npm run test:ci   # writes server/coverage/
cd client && npm ci && npm run test:ci   # writes client/coverage/
```
