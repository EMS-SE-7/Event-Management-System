const { expect } = require('@playwright/test');
const { ACCOUNTS, PASSWORD } = require('./accounts');

// Logs in through the real Login page and waits for the role's dashboard.
async function loginAs(page, who) {
  const account = ACCOUNTS[who];
  await page.goto('/login');
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(account.role === 'Organizer' ? /\/organizer$/ : /\/student$/);
}

// Gets a token from the real login API, for set-up steps and API-level checks.
async function apiToken(request, who) {
  const res = await request.post('/api/auth/login', { data: { email: ACCOUNTS[who].email, password: PASSWORD } });
  expect(res.ok()).toBeTruthy();
  return (await res.json()).token;
}

// A date `days` from now, in both the API's ISO form and the form's datetime-local form.
function future(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    iso: d.toISOString(),
    local: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`,
  };
}

// Creates an event through the API as `who` (an organizer) and returns it.
async function createEventViaApi(request, who, overrides = {}) {
  const token = await apiToken(request, who);
  const res = await request.post('/api/events', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: `System test event ${Date.now()}`,
      category: 'Technical',
      venue: 'MRD Auditorium',
      description: 'Created by the system tests',
      startDateTime: future(10).iso,
      endDateTime: future(10, 13).iso,
      registrationDeadline: future(8).iso,
      capacity: 50,
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

module.exports = { loginAs, apiToken, future, createEventViaApi, ACCOUNTS, PASSWORD };
