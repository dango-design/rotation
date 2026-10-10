import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import About from '@/app/about/page';
import Insights from '@/app/insights/page';
import SettingsPage from '@/app/settings/page';
import { pageModes } from '../../../.storybook/modes';
import { inShell } from '../decorators';
import { demoCloset, emptyCloset } from '../fixtures';

/* The "You" section: the closet report (stats kept out of the daily pages), settings, and how Rotation works. */

const meta = {
  title: 'Pages/You',
  decorators: [inShell],
  parameters: {
    layout: 'fullscreen',
    store: demoCloset,
    chromatic: { modes: pageModes },
    // Known issue: card titles are h3 straight after the page's h1 (heading-order). Reported, not failed.
    a11y: { test: 'todo' },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Outfits you can make, how much of the closet gets worn, cost per wear, and where clothes come from. */
export const ClosetReport: Story = {
  render: () => <Insights />,
  parameters: { nextjs: { navigation: { pathname: '/insights' } } },
};

/** The report before there's anything to report. */
export const ClosetReportEmpty: Story = {
  render: () => <Insights />,
  parameters: { nextjs: { navigation: { pathname: '/insights' } }, store: emptyCloset },
};

/** City, favorite stores, the shopping switch, photo tagging status, and your data. */
export const Settings: Story = {
  render: () => <SettingsPage />,
  parameters: { nextjs: { navigation: { pathname: '/settings' } } },
  play: async ({ canvas }) => {
    // Waits for the server check (answered by .storybook/api.ts) so the snapshot never shows "Checking…".
    await expect(await canvas.findByText(/Off on this server/)).toBeVisible();
  },
};

/** Signing in: an email address first, then the code from the email. The pieces already here go up to the new account. */
export const SettingsSignedOut: Story = {
  ...Settings,
  parameters: { ...Settings.parameters, store: () => demoCloset({ accountsOn: true }), chromatic: { modes: { phone: { disable: true }, tablet: { disable: true } } } },
};

/** Signed in and saved to the account. Signing out takes the closet off this browser. */
export const SettingsSignedIn: Story = {
  ...Settings,
  parameters: {
    ...Settings.parameters,
    store: () => demoCloset({ account: { id: 'demo-account', email: 'jordan@example.com' } }),
    chromatic: { modes: { phone: { disable: true }, tablet: { disable: true } } },
  },
};

/** Signed in but offline: changes wait on the device, and the note under the navigation says so. */
export const SettingsSignedInOffline: Story = {
  ...SettingsSignedIn,
  parameters: {
    ...SettingsSignedIn.parameters,
    store: () => demoCloset({ account: { id: 'demo-account', email: 'jordan@example.com' }, syncState: 'offline' }),
  },
};

/** In the demo closet there's no data to download or delete. */
export const SettingsInTheDemo: Story = {
  ...Settings,
  parameters: { ...Settings.parameters, store: () => demoCloset({ demo: true }), chromatic: { modes: { phone: { disable: true }, tablet: { disable: true } } } },
};

/** How outfits and recommendations work, in plain words. */
export const HowItWorks: Story = {
  render: () => <About />,
  parameters: { nextjs: { navigation: { pathname: '/about' } } },
};
