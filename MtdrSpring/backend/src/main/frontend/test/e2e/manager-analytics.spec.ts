import { test, expect, type Route } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOWNLOADS_DIR = path.resolve(__dirname, '..', 'downloads');
const MOCK_OTP = '123456';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required env var ${name}. See test/.env.example.`);
  }
  return value.trim();
}

interface Developer {
  developerId: number | string;
  fullName: string;
}

interface Task {
  developerID: number | string;
  [key: string]: unknown;
}

test.describe('Manager analytics flow', () => {
  test('signs in (mocked OTP), filters KPI dashboard by Developer Test, and downloads that developer\'s analytics', async ({ page }) => {
    const managerEmail = requireEnv('MANAGER_EMAIL');
    const managerPassword = requireEnv('MANAGER_PASSWORD');
    const targetDeveloperName = requireEnv('TARGET_DEVELOPER_NAME');

    await mkdir(DOWNLOADS_DIR, { recursive: true });

    // Mock auth endpoints so no email is sent and any OTP is accepted
    await page.route('**/api/auth/login', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionToken: 'mock-session-token',
          message: 'OTP sent to mocked@test.local',
        }),
      }),
    );

    await page.route('**/api/auth/verify-otp', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: 'manager',
          userId: 1,
          developerId: null,
          managerId: 1,
          name: 'Test Manager',
        }),
      }),
    );

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.locator('#login-email').fill(managerEmail);
    await page.locator('#login-password').fill(managerPassword);
    await page.getByRole('button', { name: /log in to synkra/i }).click();

    await expect(page.getByRole('heading', { name: 'Two-factor verification' })).toBeVisible();
    await page.locator('#otp-code').fill(MOCK_OTP);
    await page.getByRole('button', { name: /verify & sign in/i }).click();

    await page.waitForURL('**/manager');

    await page.goto('/manager/kpi');
    await expect(page.getByRole('heading', { name: 'KPI Dashboard' })).toBeVisible();

    const developerTrigger = page.getByRole('combobox').filter({ hasText: 'All Developers' });
    await expect(developerTrigger).toBeVisible({ timeout: 20_000 });

    await developerTrigger.click();
    await page.getByRole('option', { name: targetDeveloperName, exact: true }).click();
    await expect(page.getByRole('combobox').filter({ hasText: targetDeveloperName })).toBeVisible();

    await expect(page.getByText('Tasks Completed per Developer', { exact: true })).toBeVisible();

    const developers = await fetchJson<Developer[]>(page, '/api/developers');

    const match = developers.find((d) => d.fullName === targetDeveloperName);
    expect(match, `Developer "${targetDeveloperName}" not found in /api/developers`).toBeDefined();
    const developerId = String(match!.developerId);

    const allTasks = await fetchJson<Task[]>(page, '/api/tasks');
    const developerTasks = allTasks.filter((t) => String(t.developerID) === developerId);

    const dashboard = await fetchJson<unknown>(page, `/api/dashboard/developer/${developerId}`);

    await save('developer.json', match);
    await save('tasks.json', developerTasks);
    await save(`dashboard-developer-${developerId}.json`, dashboard);
  });
});

async function fetchJson<T>(page: import('@playwright/test').Page, urlPath: string): Promise<T> {
  const res = await page.request.get(urlPath);
  expect(res.ok(), `${urlPath} returned ${res.status()}`).toBeTruthy();
  return (await res.json()) as T;
}

async function save(filename: string, payload: unknown): Promise<void> {
  const target = path.join(DOWNLOADS_DIR, filename);
  await writeFile(target, JSON.stringify(payload, null, 2), 'utf8');
}
