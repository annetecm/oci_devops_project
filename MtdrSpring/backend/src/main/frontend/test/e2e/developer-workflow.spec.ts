import { test, expect } from '@playwright/test';
import { statusChangeTasks, overdueTask } from './mock/tasks';

test.describe("Authentication Flow", () => {
  test('should reject invalid credentials and allow login with valid credentials @Authentication', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page).toHaveTitle("Collaborative Task Management UI")
  await page.getByRole('textbox', { name: 'Email Address' }).fill("not_email@tec.mx");
  await page.getByRole('textbox', { name: 'Password' }).fill("not_password");
  await page.getByRole('button', { name: 'Log In to Synkra' }).dblclick();
  await expect (page.getByText('Invalid credentials')).toBeVisible();

  await page.getByRole('textbox', { name: 'Email Address' }).fill("A01638996@tec.mx");
  await page.getByRole('textbox', { name: 'Password' }).fill("demo_hector");
  await page.getByRole('button', { name: 'Log In to Synkra' }).dblclick();
  //Only for the tester account is the otp always 000000
  await page.getByRole('textbox', { name: 'Verification Code' }).fill("000000");
  await page.getByRole('button', { name: 'Verify & Sign In' }).dblclick();
  await expect (page.getByText('HAHector AyalaDeveloper')).toBeVisible();
  });
})

test.describe("Developer Dashboard", () => {
  //Logs in for every future test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await page.getByRole('textbox', { name: 'Email Address' }).fill("A01638996@tec.mx");
    await page.getByRole('textbox', { name: 'Password' }).fill("demo_hector");
    await page.getByRole('button', { name: 'Log In to Synkra' }).dblclick();
    await page.getByRole('textbox', { name: 'Verification Code' }).fill("000000");
    await page.getByRole('button', { name: 'Verify & Sign In' }).dblclick();
    await expect(page.getByText('HAHector AyalaDeveloper')).toBeVisible();
  });

  test("should update task status and priority via a user workflow @Mock @Modification", async ({ page }) => {
    test.slow();

    const tasks = structuredClone(statusChangeTasks);

    await page.route('**/api/tasks/448', async route => {
      //If the method has saved the changes
      if (route.request().method() === 'PUT') {

        const updatedTask = route.request().postDataJSON();

        const index = tasks.findIndex(
          task => task.taskID === 448
        );
      
        tasks[index] = {
          ...tasks[index],
          ...updatedTask
        };
      
        await route.fulfill({
          status: 200,
          json: tasks[index]
        });
      
        return;
      }
      //When the task is called for seeing details
      await route.fulfill({
        status: 200,
        json: tasks.find(task => task.taskID === 448)
      });
    });

    await page.route('**/api/dashboard/developer/23', async route => {

      await route.fulfill({
        status: 200,
        json: {
          developers: [{
            developerID: 23,
            assignedTasksCount: tasks.length,
            completedTasksCount:
              tasks.filter(t => t.status === 'closed').length
          }],
          tasks
        }
      });
    
    });

    await page.reload();
    await expect(page.getByText('TEST TO BE: IN PROGRESS')).toBeVisible();
    await expect(page.getByRole('table').getByText('In Progress')).toBeVisible();
    await page.getByRole('table').getByText('In Progress').click();
    await page.getByRole('button', { name: 'Edit Task' }).click();

    await page.locator('button').filter({ hasText: 'To Do' }).click();
    await page.getByLabel('In Progress').click();

    await page.locator('button').filter({ hasText: 'Low' }).click();
    await page.getByLabel('Medium').click();

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByRole('button', { name: 'Back to Dashboard' }).click();
    await expect(page.getByText('Medium', { exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'In Progress', exact: true }).locator('span')).toBeVisible();
  })

  test("Task becomes overdue and shows it in dashboard @Mock @Overdue", async ({page}) => {
    test.slow();

    await page.clock.install({time: new Date("2026-06-18T10:00:00")});

    const tasks = structuredClone(overdueTask);

    await page.route('**/api/dashboard/developer/23', async route => {
      await route.fulfill({
        status: 200,
        json: {
          developers: [{
            developerID: 23,
            assignedTasksCount: 1,
            completedTasksCount: 0
          }],
          tasks
        }
      });
    });

    await page.reload();
    await expect(page.getByText('TEST OVERDUE TASK')).toBeVisible();
    await expect(page.getByText('Overdue', { exact: true })).not.toBeVisible();
    await page.clock.fastForward("48:00:00");
    await page.reload();
    await expect(page.getByText('Overdue', { exact: true })).toBeVisible();
  })
})

