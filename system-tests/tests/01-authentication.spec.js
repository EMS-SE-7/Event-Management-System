// System tests: authentication and role management (Test Plan section 3, AUTH-*).
const { test, expect } = require('@playwright/test');
const { loginAs, apiToken, ACCOUNTS, PASSWORD } = require('./helpers');

test.describe('Authentication and roles', () => {
  test('TC-SYS-01 (AUTH-07): a wrong password is rejected with a message and no login', async ({ page }) => {
    await test.step('Open the Login page and enter a registered email with a wrong password', async () => {
      await page.goto('/login');
      await page.getByLabel('Email').fill(ACCOUNTS.student.email);
      await page.getByLabel('Password').fill('wrong-password');
      await page.getByRole('button', { name: 'Login' }).click();
    });
    await test.step('An error message is shown and the user stays on the Login page', async () => {
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page).toHaveURL(/\/login$/);
    });
  });

  test('TC-SYS-02 (AUTH-01, AUTH-05): an organizer signs in and gets the organizer menu', async ({ page }) => {
    await test.step('Log in with a seeded organizer account; the organizer dashboard opens', () => loginAs(page, 'organizer'));
    await test.step('The menu shows the organizer-only items Create Event and Reports', async () => {
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav.getByRole('link', { name: 'Create Event' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Reports' })).toBeVisible();
    });
  });

  test('TC-SYS-03 (AUTH-01, AUTH-05): a student signs in and gets the student menu only', async ({ page }) => {
    await test.step('Log in with a seeded student account; the student dashboard opens', () => loginAs(page, 'student'));
    await test.step('The menu shows My Registrations and no organizer items', async () => {
      const nav = page.getByRole('navigation', { name: 'Main' });
      await expect(nav.getByRole('link', { name: 'My Registrations' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Create Event' })).toHaveCount(0);
    });
  });

  test('TC-SYS-04 (AUTH-06): a student cannot open organizer pages or call organizer APIs', async ({ page, request }) => {
    await test.step('Log in as a student', () => loginAs(page, 'student'));
    await test.step('Typing the Create Event address sends the student back to their dashboard', async () => {
      await page.goto('/organizer/events/new');
      await expect(page).toHaveURL(/\/student$/);
    });
    await test.step('Calling POST /api/events directly with the student token returns 403 Forbidden', async () => {
      const token = await apiToken(request, 'student');
      const res = await request.post('/api/events', { headers: { Authorization: `Bearer ${token}` }, data: { title: 'Not allowed' } });
      expect(res.status()).toBe(403);
    });
  });

  test('TC-SYS-05 (AUTH-01): a new student signs up and lands on the student dashboard', async ({ page }) => {
    await test.step('Fill in the Student registration form with a new @pesu.pes.edu email', async () => {
      await page.goto('/register');
      await page.getByLabel('Name').fill('New Student');
      await page.getByLabel('Email (@pesu.pes.edu)').fill(`pes1ug24cs${Date.now() % 1000}x@pesu.pes.edu`);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: /create|register|sign up/i }).click();
    });
    await test.step('The account is created and the student dashboard opens', async () => {
      await expect(page).toHaveURL(/\/student$/);
    });
  });

  test('TC-SYS-06 (AUTH-05): logging out ends the session and protected pages go back to login', async ({ page }) => {
    await test.step('Log in as a student, then click Log out', async () => {
      await loginAs(page, 'student');
      await page.getByRole('button', { name: /log ?out/i }).click();
      await expect(page).toHaveURL(/\/login$/);
    });
    await test.step('Opening My Registrations now redirects to the Login page', async () => {
      await page.goto('/student/registrations');
      await expect(page).toHaveURL(/\/login$/);
    });
  });
});
