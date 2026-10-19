import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173/internlog-pk/',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command:
        'npm run build && npm run preview -- --port 4173 --strictPort --base=/internlog-pk/',
      url: 'http://127.0.0.1:4173/internlog-pk/',
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --port 4174 --strictPort',
      url: 'http://127.0.0.1:4174/',
      reuseExistingServer: false,
    },
  ],
});
