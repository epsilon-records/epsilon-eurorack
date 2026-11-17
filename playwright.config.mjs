import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', colorScheme: 'light', reducedMotion: 'reduce' },
  webServer: { command: 'npm run serve', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  reporter: [['list'], ['html', { open: 'never' }]],
});
