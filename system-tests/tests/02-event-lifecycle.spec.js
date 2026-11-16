// System tests: the main end-to-end flow across every module, in order
// (Test Plan section 5: "student registers - organizer views participant - organizer marks attendance").
// Organizer creates an event -> student finds and registers -> organizer sees the participant,
// marks attendance, reads the report -> organizer cancels the event.
const { test, expect } = require('@playwright/test');
const { loginAs, apiToken, future, ACCOUNTS } = require('./helpers');

test.describe.configure({ mode: 'serial' });

const title = `Hackathon ${Date.now()}`;
let eventUrl;
const organizerUrl = (suffix) => `${eventUrl.replace('/events/', '/organizer/events/')}/${suffix}`;

test.describe('Event lifecycle across modules', () => {
  test('TC-SYS-07 (EVENT-02): the create form rejects missing mandatory fields', async ({ page }) => {
    await test.step('Log in as an organizer and open Create Event', async () => {
      await loginAs(page, 'organizer');
      await page.goto('/organizer/events/new');
    });
    await test.step('Submit the empty form', () => page.getByRole('button', { name: 'Create event' }).click());
    await test.step('Field errors are shown and no event is created', async () => {
      await expect(page.locator('.field-error').first()).toBeVisible();
      await expect(page).toHaveURL(/\/organizer\/events\/new$/);
    });
  });

  test('TC-SYS-08 (EVENT-08): the create form rejects an end time before the start', async ({ page }) => {
    await test.step('Log in as an organizer and open Create Event', async () => {
      await loginAs(page, 'organizer');
      await page.goto('/organizer/events/new');
    });
    await test.step('Fill every field, with the end time two hours before the start, and submit', async () => {
      await page.getByLabel('Title').fill('Bad dates');
      await page.getByLabel('Category').selectOption('Workshop');
      await page.getByLabel('Venue').fill('Room 101');
      await page.getByLabel('Starts').fill(future(10, 14).local);
      await page.getByLabel('Ends').fill(future(10, 12).local);
      await page.getByLabel('Registration deadline').fill(future(8).local);
      await page.getByLabel('Capacity').fill('30');
      await page.getByRole('button', { name: 'Create event' }).click();
    });
    await test.step('The server rejects it and the form shows "End date and time must be after the start"', async () => {
      await expect(page.locator('.field-error')).toContainText(/after the start/i);
    });
  });

  test('TC-SYS-09 (EVENT-01): an organizer creates an event and it is listed under My Events', async ({ page }) => {
    await test.step('Log in as an organizer and fill in Create Event with valid details', async () => {
      await loginAs(page, 'organizer');
      await page.goto('/organizer/events/new');
      await page.getByLabel('Title').fill(title);
      await page.getByLabel('Category').selectOption('Technical');
      await page.getByLabel('Venue').fill('MRD Auditorium');
      await page.getByLabel('Description (optional)').fill('24-hour coding contest');
      await page.getByLabel('Starts').fill(future(14, 9).local);
      await page.getByLabel('Ends').fill(future(14, 21).local);
      await page.getByLabel('Registration deadline').fill(future(12).local);
      await page.getByLabel('Capacity').fill('40');
      await page.getByRole('button', { name: 'Create event' }).click();
    });
    await test.step('The new event details page opens with the title', async () => {
      await expect(page).toHaveURL(/\/events\/[a-f0-9]{24}$/);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      eventUrl = new URL(page.url()).pathname;
    });
    await test.step('My Events lists the event', async () => {
      await page.goto('/organizer/events');
      await expect(page.getByText(title)).toBeVisible();
    });
  });

  test('TC-SYS-10 (DISC-01, DISC-02): a student browses and searches for the event', async ({ page }) => {
    await test.step('Log in as a student and open Browse Events; the new event is listed', async () => {
      await loginAs(page, 'student');
      await page.goto('/events');
      await expect(page.getByText(title)).toBeVisible();
    });
    await test.step('Search for a word no event contains; the event is not listed', async () => {
      await page.getByLabel('Search events').fill('no-such-event-xyz');
      await page.getByRole('button', { name: 'Search' }).click();
      await expect(page.getByText(title)).toHaveCount(0);
    });
    await test.step('Search for "Hackathon" and open the result; its details page opens', async () => {
      await page.getByLabel('Search events').fill('Hackathon');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.getByRole('link', { name: title }).first().click();
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    });
  });

  test('TC-SYS-11 (REG-01, REG-03, HIST-01): a student registers once and sees it in My Registrations', async ({ page }) => {
    await test.step('Log in as a student, open the event and click Register for this event', async () => {
      await loginAs(page, 'student');
      await page.goto(eventUrl);
      await page.getByRole('button', { name: 'Register for this event' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'You are registered' })).toBeVisible();
    });
    await test.step('Reload: the page still shows the registration and offers no second Register button', async () => {
      await page.reload();
      await expect(page.getByRole('status').filter({ hasText: 'You are registered' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Register for this event' })).toHaveCount(0);
    });
    await test.step('My Registrations lists the event', async () => {
      await page.goto('/student/registrations');
      await expect(page.getByText(title)).toBeVisible();
    });
  });

  test('TC-SYS-12 (PART-01): the organizer sees the student in the participant list', async ({ page }) => {
    await test.step('Log in as the organizer and open the event Participants page', async () => {
      await loginAs(page, 'organizer');
      await page.goto(organizerUrl('participants'));
    });
    await test.step('The registered student is listed', async () => {
      await expect(page.getByText(ACCOUNTS.student.email)).toBeVisible();
    });
  });

  test('TC-SYS-13 (ATT-01, ATT-03): the organizer marks the student present and it is stored', async ({ page }) => {
    const group = () => page.getByRole('group', { name: `Attendance for ${ACCOUNTS.student.name}` });
    await test.step('Log in as the organizer, open Attendance and click Present for the student', async () => {
      await loginAs(page, 'organizer');
      await page.goto(organizerUrl('attendance'));
      await group().getByRole('button', { name: 'Present' }).click();
      await expect(group().getByRole('button', { name: 'Present' })).toHaveAttribute('aria-pressed', 'true');
    });
    await test.step('Reload: Present is still selected, so it was saved in the database', async () => {
      await page.reload();
      await expect(group().getByRole('button', { name: 'Present' })).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('TC-SYS-14 (REP-01, REP-03): the event report shows the registration and attendance totals', async ({ page }) => {
    await test.step('Log in as the organizer and open the event Report', async () => {
      await loginAs(page, 'organizer');
      await page.goto(organizerUrl('report'));
    });
    await test.step('Registered 1, Seats left 39 (of 40), Present 1, Absent 0', async () => {
      const stat = (label) =>
        page.locator('.stat').filter({ has: page.locator('.stat-label', { hasText: new RegExp(`^${label}$`) }) }).locator('.stat-value');
      await expect(stat('Registered')).toHaveText('1');
      await expect(stat('Seats left')).toHaveText('39');
      await expect(stat('Present')).toHaveText('1');
      await expect(stat('Absent')).toHaveText('0');
    });
  });

  test('TC-SYS-15 (EVENT-07): another organizer cannot change this event', async ({ request }) => {
    await test.step('A second organizer sends PATCH /api/events/:id for this event; the API answers 403', async () => {
      const id = eventUrl.split('/').pop();
      const token = await apiToken(request, 'otherOrganizer');
      const res = await request.patch(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` }, data: { title: 'Hijacked' } });
      expect(res.status()).toBe(403);
    });
  });

  test('TC-SYS-16 (EVENT-05): the organizer cancels the event and the student sees it as cancelled', async ({ page, browser }) => {
    await test.step('Log in as the organizer, open Edit or cancel, click Cancel event and confirm', async () => {
      await loginAs(page, 'organizer');
      await page.goto(organizerUrl('edit'));
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Cancel event' }).click();
      await expect(page.getByText('Cancelled').first()).toBeVisible();
    });
    await test.step('In a separate session the student sees the event as Cancelled with no Register button', async () => {
      const studentPage = await (await browser.newContext()).newPage();
      await loginAs(studentPage, 'student');
      await studentPage.goto(eventUrl);
      await expect(studentPage.getByText('Cancelled').first()).toBeVisible();
      await expect(studentPage.getByRole('button', { name: 'Register for this event' })).toHaveCount(0);
    });
  });
});
