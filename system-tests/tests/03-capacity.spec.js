// System tests: capacity rules across the UI, API and database (REG-05, STATUS-02, STATUS-03).
const { test, expect } = require('@playwright/test');
const { loginAs, createEventViaApi } = require('./helpers');

test('TC-SYS-17 (REG-05, STATUS-02, STATUS-03): once the last seat is taken nobody else can register', async ({ page, browser, request }) => {
  let event;
  await test.step('Set-up: an organizer creates an event with 1 seat', async () => {
    event = await createEventViaApi(request, 'organizer', { title: `One-seat workshop ${Date.now()}`, capacity: 1 });
  });
  await test.step('Student 1 registers and takes the only seat', async () => {
    await loginAs(page, 'student');
    await page.goto(`/events/${event._id}`);
    await page.getByRole('button', { name: 'Register for this event' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'You are registered' })).toBeVisible();
  });
  await test.step('Student 2 opens the event: registration is closed and the button is disabled', async () => {
    const other = await (await browser.newContext()).newPage();
    await loginAs(other, 'student2');
    await other.goto(`/events/${event._id}`);
    await expect(other.getByRole('button', { name: 'Register for this event' })).toHaveCount(0);
    await expect(other.getByRole('button', { name: 'Registration closed' })).toBeDisabled();
  });
});
