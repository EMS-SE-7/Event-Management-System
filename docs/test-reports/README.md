# Testing: levels, reports and how to run them

Results below are from the run on 16-11-2026 (commit `ed58b46`). Regenerate everything with `bash scripts/generate-test-reports.sh`.

## Documents

| Document | PDF | Source |
|---|---|---|
| Software Requirement Specification | [Software_Requirement_Specification.pdf](../Software_Requirement_Specification.pdf) | - |
| Software Test Plan | [Test_Plan.pdf](../Test_Plan.pdf) | - |
| SASD | [SASD.pdf](../SASD.pdf) | - |
| Unit Test Report | [Unit_Test_Report.pdf](../Unit_Test_Report.pdf) | [Unit_Test_Report.md](Unit_Test_Report.md) |
| Integration Test Report | [Integration_Test_Report.pdf](../Integration_Test_Report.pdf) | [Integration_Test_Report.md](Integration_Test_Report.md) |
| System Test Report | [System_Test_Report.pdf](../System_Test_Report.pdf) | [System_Test_Report.md](System_Test_Report.md) |
| Code & Branch Coverage Report | [Code_and_Branch_Coverage_Report.pdf](../Code_and_Branch_Coverage_Report.pdf) | [Code_and_Branch_Coverage_Report.md](Code_and_Branch_Coverage_Report.md) |

Line-by-line coverage: [server](coverage-html/server/index.html), [client](coverage-html/client/index.html). Raw results: [raw/](raw/).

## Test levels

| Level | What it checks | Tools | Where | Run with | Result |
|---|---|---|---|---|---|
| Unit | One function, controller or model on its own, dependencies mocked | Jest, Vitest | server/tests/unit, server/tests/{eventStatus,event.model,serveClient}.test.js, client/src/utils | `npm run test:unit` in server/ and client/ | 85/85 passed |
| Integration | Real components together: HTTP API through middleware and Mongoose into MongoDB; React pages with router, login state and API client | Jest + Supertest + in-memory MongoDB, Vitest + React Testing Library | server/tests, server/src/*.test.js, client/src/**/*.test.jsx | `npm run test:integration` in server/ and client/ | 170/170 passed |
| System | The whole deployed product end to end in a real browser, plus performance and security checks | Playwright (Chromium) | system-tests/ | `npm test` in system-tests/ | 19/19 passed |
| Acceptance | The Product Owner confirms each feature meets its SRS acceptance criteria (UAT, Test Plan section 7) | Manual, on the deployed site | docs/demo-script.md | By hand | Recorded by the Product Owner |

Every push and pull request runs the unit, integration and system tests automatically in GitHub Actions (`.github/workflows/ci.yml`), which is the regression testing in Test Plan section 5. The site is deployed only when all of them pass.

## Traceability: Test Plan features to automated tests

Number of test cases at each level whose name cites the requirement ID.

| Req. ID | Feature | Unit | Integration | System | Status |
|---|---|---|---|---|---|
| AUTH-01 | Registered user sign-in | - | 4 | 3 | Pass |
| AUTH-05 | Role-based access control for students and organizers | - | 8 | 3 | Pass |
| AUTH-06 | Prevent students from accessing organizer-only functionality | - | 10 | 1 | Pass |
| AUTH-07 | Reject invalid login credentials | - | 4 | 1 | Pass |
| EVENT-01 | Organizer creates an event | - | 7 | 1 | Pass |
| EVENT-02 | Validate mandatory event information | 11 | 3 | 1 | Pass |
| EVENT-05 | Organizer cancels an event they manage | - | 7 | 1 | Pass |
| EVENT-07 | Prevent unauthorized event modification | - | 11 | 1 | Pass |
| EVENT-08 | Reject invalid event dates and capacity values | 14 | 10 | 1 | Pass |
| DISC-01 | Browse available events | - | 9 | 1 | Pass |
| DISC-02 | Search for available events | - | 8 | 1 | Pass |
| REG-01 | Authenticated student registers for an event | - | 4 | 1 | Pass |
| REG-03 | Prevent duplicate registration | - | 3 | 1 | Pass |
| REG-04 | Prevent registration after the registration deadline | - | 1 | - | Pass |
| REG-05 | Prevent registration when event capacity is reached | - | 2 | 1 | Pass |
| HIST-01 | Student views registration history | - | 3 | 1 | Pass |
| PART-01 | Organizer views registered participants | - | 3 | 1 | Pass |
| ATT-01 | Organizer marks attendance | 1 | 1 | 1 | Pass |
| ATT-03 | Store attendance information | 1 | - | 1 | Pass |
| STATUS-02 | Detect when event capacity is reached | 3 | - | 1 | Pass |
| STATUS-03 | Prevent registration for full events | - | - | 1 | Pass |
| REP-01 | Generate registration statistics | 1 | - | 1 | Pass |
| REP-03 | Display total registration information | 1 | - | 1 | Pass |
| PERF-01 | NFR Performance: API response time of 2 seconds or less | - | - | 1 | Pass |
| SEC-01 | NFR Security: password protection | - | 1 | 1 | Pass |
