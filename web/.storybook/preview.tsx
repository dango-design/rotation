import type { Decorator, Preview } from '@storybook/nextjs-vite';
import MockDate from 'mockdate';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { action } from 'storybook/actions';
import { sb } from 'storybook/test';
import '../src/app/globals.css';
import { GarmentDefs } from '../src/components/GarmentDefs';
import { UICtx } from '../src/components/Shell';
import { fontVariables } from '../src/lib/fonts';
import { StoreProvider, type Fixture } from '../src/lib/store';
import { stubApi, type ApiRoutes } from './api';
import { VIEWPORTS } from './modes';
import { resetRouter, withAppRouter } from './router';
import { theme } from './theme';

/* Background removal downloads a model and runs it in WASM. Every export is replaced by a mock that does nothing;
   stories that need a result set one with `mocked(removeBackground).mockResolvedValue(...)`. */
sb.mock('../src/lib/bgremove.ts');

/* What the app's root layout does: fonts on <html>, and the shared garment <defs> once per page. */
document.documentElement.classList.add(...fontVariables.split(' '));
const defs = document.createElement('div');
document.body.prepend(defs);
flushSync(() => createRoot(defs).render(<GarmentDefs />));

/** Every story starts on this morning unless it sets `parameters.now`: a Thursday, so the week strip has past, today and future days. */
export const NOW = '2026-10-08T09:00:00';

/* Each story gets its own in-memory closet from `parameters.store` (a fixture, or a function returning one, called
   after the clock is set so relative dates line up). Drawers and dialogs that a component asks to open are logged
   in the Actions panel; page stories render the real Shell, which opens them for real. */
const ui = { open: action('open'), close: action('close') };
const withApp: Decorator = (Story, { parameters, id }) => {
  const store = parameters.store as Fixture | (() => Fixture) | undefined;
  return (
    <StoreProvider key={id} fixture={typeof store === 'function' ? store() : (store ?? {})}>
      <UICtx.Provider value={ui}>
        <Story />
      </UICtx.Provider>
    </StoreProvider>
  );
};

const preview: Preview = {
  decorators: [withApp, withAppRouter],
  async beforeEach({ parameters }) {
    resetRouter();
    MockDate.set((parameters.now as string | undefined) ?? NOW);
    const restoreFetch = stubApi(parameters.api as ApiRoutes | undefined);
    return () => {
      restoreFetch();
      MockDate.reset();
    };
  },
  parameters: {
    layout: 'padded',
    docs: { theme },
    nextjs: { navigation: { pathname: '/' } },
    viewport: { options: VIEWPORTS },
    backgrounds: {
      options: {
        canvas: { name: 'Canvas (--bg)', value: '#f3f0ea' },
        panel: { name: 'Panel (--panel)', value: '#ffffff' },
        gap: { name: 'Gap blue (--gap)', value: '#1e3a6e' },
      },
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: { order: ['Introduction', 'Foundations', 'Components', 'Patterns', 'Pages'] },
    },
    a11y: {
      // Fail story tests on accessibility violations (Vitest and Chromatic both read this).
      test: 'error',
    },
    chromatic: {
      // Drawers, dialogs and toasts animate in; snapshot them where they come to rest.
      pauseAnimationAtEnd: true,
    },
  },
  initialGlobals: {
    backgrounds: { value: 'canvas' },
  },
};

export default preview;
