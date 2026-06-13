import { defineConfig, devices } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, 'test/.env') });

// Unique per-run subfolder so previous runs' videos/traces aren't overwritten.
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');

export default defineConfig({
  testDir: path.resolve(__dirname, 'test/e2e'),
  outputDir: path.resolve(__dirname, `test/test-results/${RUN_ID}`),
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, 'test/playwright-report'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'off',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});