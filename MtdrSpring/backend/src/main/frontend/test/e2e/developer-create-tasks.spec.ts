import { test, expect, type Route, type Request } from '@playwright/test';

const MOCK_OTP = '123456';
const DEVELOPER_ID = 42;
const DEVELOPER_NAME = 'Developer Test';
const PROJECT_ID = 1;

interface CreateTaskBody {
  name: string;
  description: string;
  status: string;
  taskType: string;
  deadline: string;
  developerID: number;
  estimatedTime: number;
  priority: string;
  projectID: number;
  sprint?: number;
}

interface NewTaskInput {
  title: string;
  description: string;
  status: 'open' | 'in_progress';
  statusLabel: 'To Do' | 'In Progress';
  taskType: string;
  taskTypeLabel: string;
  deadline: string; // YYYY-MM-DD
  estimatedHours: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityLabel: 'High' | 'Medium' | 'Low';
  sprint: string;
}

const TASKS_TO_CREATE: NewTaskInput[] = [
  {
    title: 'Implement login form validation',
    description: 'Add client-side validation for the login form fields and surface inline error messages.',
    status: 'open',
    statusLabel: 'To Do',
    taskType: 'new-feature',
    taskTypeLabel: 'New Feature',
    deadline: '2026-07-15',
    estimatedHours: '6',
    priority: 'HIGH',
    priorityLabel: 'High',
    sprint: '1',
  },
  {
    title: 'Fix broken KPI chart legend',
    description: 'Legend overlaps the bars on small viewports; rework spacing and wrap labels when needed.',
    status: 'in_progress',
    statusLabel: 'In Progress',
    taskType: 'bug-fixed',
    taskTypeLabel: 'Bug Fix',
    deadline: '2026-07-20',
    estimatedHours: '4',
    priority: 'MEDIUM',
    priorityLabel: 'Medium',
    sprint: '2',
  },
  {
    title: 'Document task API endpoints',
    description: 'Write OpenAPI docs for /api/tasks and /api/dashboard/developer/{id} including example payloads.',
    status: 'open',
    statusLabel: 'To Do',
    taskType: 'documentation',
    taskTypeLabel: 'Documentation',
    deadline: '2026-07-25',
    estimatedHours: '3',
    priority: 'LOW',
    priorityLabel: 'Low',
    sprint: '3',
  },
];

test.describe('Developer task creation flow', () => {
  test('creates three complete tasks with everything mocked', async ({ page }) => {
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
          role: 'developer',
          userId: 100,
          developerId: DEVELOPER_ID,
          managerId: null,
          name: DEVELOPER_NAME,
        }),
      }),
    );

    await page.route('**/api/developers', (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { developerId: DEVELOPER_ID, fullName: DEVELOPER_NAME },
        ]),
      }),
    );

    await page.route(`**/api/dashboard/developer/${DEVELOPER_ID}`, (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          developers: [
            {
              developerID: DEVELOPER_ID,
              userID: 100,
              teamID: 1,
              assignedTasksCount: 0,
              completedTasksCount: 0,
              hoursWorked: 0,
              estimatedHours: 0,
            },
          ],
          sprintStats: [],
          sprints: [
            { id: 1, name: 'Sprint 1' },
            { id: 2, name: 'Sprint 2' },
            { id: 3, name: 'Sprint 3' },
          ],
          tasks: [],
        }),
      }),
    );

    await page.route('**/api/tasks', (route: Route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.fallback();
    });

    const createRequests: CreateTaskBody[] = [];
    let nextTaskId = 1000;

    await page.route('**/api/tasks', (route: Route) => {
      const req: Request = route.request();
      if (req.method() !== 'POST') {
        return route.fallback();
      }
      const body = req.postDataJSON() as CreateTaskBody;
      createRequests.push(body);

      const now = new Date().toISOString();
      const created = {
        taskID: nextTaskId++,
        name: body.name,
        description: body.description,
        status: body.status,
        taskType: body.taskType,
        startDate: now,
        deadline: body.deadline,
        developerID: body.developerID,
        estimatedTime: body.estimatedTime,
        timeSpent: 0,
        priority: body.priority,
        projectID: body.projectID,
        createdAt: now,
        updatedAt: now,
        ...(body.sprint !== undefined ? { sprint: body.sprint } : {}),
      };

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(created),
      });
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.locator('#login-email').fill('developertest@example.com');
    await page.locator('#login-password').fill('demo_developer');
    await page.getByRole('button', { name: /log in to synkra/i }).click();

    await expect(page.getByRole('heading', { name: 'Two-factor verification' })).toBeVisible();
    await page.locator('#otp-code').fill(MOCK_OTP);
    await page.getByRole('button', { name: /verify & sign in/i }).click();

    await page.waitForURL(`**/developer/${DEVELOPER_ID}`);

    for (const task of TASKS_TO_CREATE) {
      await openCreateTaskModal(page);
      await fillCreateTaskForm(page, task);
      await submitCreateTaskForm(page);
    }

    expect(createRequests).toHaveLength(TASKS_TO_CREATE.length);

    TASKS_TO_CREATE.forEach((expectedTask, index) => {
      const actual = createRequests[index];
      expect(actual).toMatchObject({
        name: expectedTask.title,
        description: expectedTask.description,
        status: expectedTask.status,
        taskType: expectedTask.taskType,
        deadline: `${expectedTask.deadline}T23:59:59`,
        estimatedTime: Number(expectedTask.estimatedHours),
        developerID: DEVELOPER_ID,
        priority: expectedTask.priority,
        projectID: PROJECT_ID,
        sprint: Number(expectedTask.sprint),
      });
    });
  });
});

async function openCreateTaskModal(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('button', { name: /create task/i }).first().click();
  await expect(page.locator('#ct-name')).toBeVisible();
}

async function fillCreateTaskForm(
  page: import('@playwright/test').Page,
  task: NewTaskInput,
): Promise<void> {
  const form = page.locator('form').filter({ has: page.locator('#ct-name') });

  await form.locator('#ct-name').fill(task.title);
  await form.locator('#ct-description').fill(task.description);

  await selectOption(form, page, 0, task.priorityLabel);
  await selectOption(form, page, 1, task.taskTypeLabel);
  await selectOption(form, page, 2, task.statusLabel);

  await form.locator('#ct-deadline').fill(task.deadline);
  await form.locator('#ct-estimated').fill(task.estimatedHours);
  await form.locator('#ct-sprint').fill(task.sprint);
}

async function selectOption(
  form: import('@playwright/test').Locator,
  page: import('@playwright/test').Page,
  index: number,
  optionLabel: string,
): Promise<void> {
  await form.getByRole('combobox').nth(index).click();
  // Radix renders the option list in a portal at the document root.
  await page.getByRole('option', { name: optionLabel, exact: true }).click();
}

async function submitCreateTaskForm(page: import('@playwright/test').Page): Promise<void> {
  const form = page.locator('form').filter({ has: page.locator('#ct-name') });
  await form.getByRole('button', { name: /^create task$/i }).click();
  await expect(page.locator('#ct-name')).toBeHidden();
}
