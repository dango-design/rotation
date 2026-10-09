import { defineMain } from '@storybook/nextjs-vite/node';

export default defineMain({
  framework: '@storybook/nextjs-vite',
  stories: ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    // Shows :hover, :focus-visible and :active without a mouse, so Chromatic can snapshot them
    'storybook-addon-pseudo-states',
  ],
  // No staticDirs: public/ only holds the background-removal model, which stories replace with a mock.
  core: { disableTelemetry: true },
});
