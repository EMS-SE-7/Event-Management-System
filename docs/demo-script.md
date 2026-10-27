# Sprint 1 demo (about 1 minute)

Setup once: `cd server && cp .env.example .env && npm run seed`, then `npm run dev` (server) and `npm run dev` in `client`.

1. Login as `organizer1@pes.edu` / `password123`. Open "Hackathon 2026" - three registered students are listed as Not Marked. (ATT-04)
2. Click Present for Asha, Absent for Rohan. Statuses update. (ATT-01, ATT-02, ATT-03)
3. Change Rohan to Present. (ATT-05)
4. Refresh the page - the statuses are still there. (ATT-03)
5. Logout, login as `asha@pes.edu` and try `/organizer/attendance` - redirected. Then show the API call being rejected with 403 in the Network tab or Postman. (ATT-06)
6. Login as `organizer2@pes.edu` and call `GET /api/attendance/event/<hackathon id>` - 403. (ATT-06)
7. Show the green CI run and `npm test` output.
