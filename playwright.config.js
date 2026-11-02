const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  projects: [
    { name: 'laptop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' } }
  ],
  webServer: { command: 'python3 tests/serve.py', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI }
});
