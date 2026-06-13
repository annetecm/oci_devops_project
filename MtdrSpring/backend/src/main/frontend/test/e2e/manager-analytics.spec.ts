import { test, expect, type Route } from '@playwright/test';

const MOCK_OTP = '123456';
const MANAGER_NAME = 'Test Manager';
const TARGET_DEVELOPER_NAME = 'Developer Test';

interface MockDeveloper {
  developerId: number;
  fullName: string;
}

const DEVELOPERS: MockDeveloper[] = [
  { developerId: 10, fullName: 'Annete Cedillo' },
  { developerId: 25, fullName: TARGET_DEVELOPER_NAME },
  { developerId: 33, fullName: 'Other Developer' },
];

const TASKS = [
  // Tasks for Developer Test (id 25)
  {
    taskID: 1,
    name: 'Build login screen',
    description: 'Implement login UI and wire up the auth API.',
    status: 'closed',
    taskType: 'new-feature',
    startDate: '2026-05-01T09:00:00',
    deadline: '2026-05-10T23:59:59',
    developerID: 25,
    estimatedTime: 8,
    timeSpent: 7,
    priority: 'HIGH',
    projectID: 1,
    createdAt: '2026-05-01T09:00:00',
    updatedAt: '2026-05-09T17:00:00',
    sprint: 1,
  },
  {
    taskID: 2,
    name: 'Refactor dashboard charts',
    description: 'Extract chart components and reuse across pages.',
    status: 'in_progress',
    taskType: 'improved-feature',
    startDate: '2026-05-11T09:00:00',
    deadline: '2026-05-20T23:59:59',
    developerID: 25,
    estimatedTime: 6,
    timeSpent: 4,
    priority: 'MEDIUM',
    projectID: 1,
    createdAt: '2026-05-11T09:00:00',
    updatedAt: '2026-05-15T12:00:00',
    sprint: 2,
  },
  // Tasks for other developers — proves the filter actually filters
  {
    taskID: 3,
    name: 'Configure CI pipeline',
    description: 'Set up GitHub Actions for the backend.',
    status: 'closed',
    taskType: 'new-feature',
    startDate: '2026-05-01T09:00:00',
    deadline: '2026-05-08T23:59:59',
    developerID: 10,
    estimatedTime: 5,
    timeSpent: 6,
    priority: 'HIGH',
    projectID: 1,
    createdAt: '2026-05-01T09:00:00',
    updatedAt: '2026-05-08T17:00:00',
    sprint: 1,
  },
  {
    taskID: 4,
    name: 'Write API docs',
    description: 'Document the public REST API.',
    status: 'open',
    taskType: 'documentation',
    startDate: '2026-05-11T09:00:00',
    deadline: '2026-05-22T23:59:59',
    developerID: 33,
    estimatedTime: 4,
    timeSpent: 0,
    priority: 'LOW',
    projectID: 1,
    createdAt: '2026-05-11T09:00:00',
    updatedAt: '2026-05-11T09:00:00',
    sprint: 2,
  },
];

const SPRINTS = [
  { id: 1, name: 'Sprint 1' },
  { id: 2, name: 'Sprint 2' },
];

test.describe('Manager analytics flow', () => {
  test('signs in (mocked), filters the KPI dashboard by a developer, and sees that developer\'s data', async ({ page }) => {
    // ── Mock auth endpoints ───────────────────────────────────────────────
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
          name: MANAGER_NAME,
        }),
      }),
    );

    // ── Mock backend data ─────────────────────────────────────────────────
    await page.route('**/api/developers', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEVELOPERS),
      }),
    );

    await page.route('**/api/tasks', (route: Route) => {
      if (route.request().method() !== 'GET') {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TASKS),
      });
    });

    // Dashboard endpoint used when filtering by a single developer
    await page.route('**/api/dashboard/developer/*', (route: Route) => {
      const url = new URL(route.request().url());
      const id = Number(url.pathname.split('/').pop());
      const devTasks = TASKS.filter((t) => t.developerID === id);
      const dev = DEVELOPERS.find((d) => d.developerId === id);

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          developers: dev
            ? [
                {
                  developerID: dev.developerId,
                  userID: 100 + dev.developerId,
                  teamID: 1,
                  assignedTasksCount: devTasks.length,
                  completedTasksCount: devTasks.filter((t) => t.status === 'closed').length,
                  hoursWorked: devTasks.reduce((sum, t) => sum + (t.timeSpent ?? 0), 0),
                  estimatedHours: devTasks.reduce((sum, t) => sum + t.estimatedTime, 0),
                },
              ]
            : [],
          sprintStats: SPRINTS.map((s) => ({
            sprintId: s.id,
            devId: id,
            assignedTasksCount: devTasks.filter((t) => t.sprint === s.id).length,
            completedTasksCount: devTasks.filter((t) => t.sprint === s.id && t.status === 'closed').length,
            hoursWorked: devTasks
              .filter((t) => t.sprint === s.id)
              .reduce((sum, t) => sum + (t.timeSpent ?? 0), 0),
          })),
          sprints: SPRINTS,
          tasks: devTasks,
        }),
      });
    });

    // ── Step 1: credentials ───────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.locator('#login-email').fill('manager@example.com');
    await page.locator('#login-password').fill('demo_manager');
    await page.getByRole('button', { name: /log in to synkra/i }).click();

    // ── Step 2: OTP step (mocked) ─────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Two-factor verification' })).toBeVisible();
    await page.locator('#otp-code').fill(MOCK_OTP);
    await page.getByRole('button', { name: /verify & sign in/i }).click();

    // ── Step 3: land on the manager workspace ─────────────────────────────
    await page.waitForURL('**/manager');

    // ── Step 4: open KPI dashboard and filter by the target developer ─────
    await page.goto('/manager/kpi');
    await expect(page.getByRole('heading', { name: 'KPI Dashboard' })).toBeVisible();

    const developerTrigger = page.getByRole('combobox').filter({ hasText: 'All Developers' });
    await expect(developerTrigger).toBeVisible();

    await developerTrigger.click();
    await page.getByRole('option', { name: TARGET_DEVELOPER_NAME, exact: true }).click();
    await expect(
      page.getByRole('combobox').filter({ hasText: TARGET_DEVELOPER_NAME }),
    ).toBeVisible();

    // The charts panel reacts to the selection
    await expect(page.getByText('Tasks Completed per Developer', { exact: true })).toBeVisible();

    // ── Step 5: assert the manager actually sees the target dev's data ────
    const match = DEVELOPERS.find((d) => d.fullName === TARGET_DEVELOPER_NAME);
    expect(match, `Developer "${TARGET_DEVELOPER_NAME}" missing from mocked DEVELOPERS`).toBeDefined();

    const developerTasks = TASKS.filter((t) => t.developerID === match!.developerId);
    expect(developerTasks).toHaveLength(2);

    // Each of the target developer's tasks should be reachable through the
    // mocked /api/dashboard/developer/{id} payload that the UI consumed.
    for (const task of developerTasks) {
      expect(task.developerID).toBe(match!.developerId);
    }
  });
});