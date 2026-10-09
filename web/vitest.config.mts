import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/* Two test projects:
   - unit: the engine and other logic, in Node (`npm test`)
   - storybook: every story rendered in Chromium, with its play function and accessibility checks (`npm run test-storybook`).
     Needs a browser once: `npx playwright install chromium`. */
export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: { '@': path.join(dirname, 'src') } },
        test: { name: 'unit', include: ['src/**/*.test.ts'], environment: 'node' },
      },
      {
        plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
