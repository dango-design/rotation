import type { Decorator } from '@storybook/nextjs-vite';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { PathnameContext, SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { fn } from 'storybook/test';

/* The App Router for stories: usePathname() reads `parameters.nextjs.navigation.pathname`, and useRouter() returns
   mock functions a play function can check, e.g. `expect(router().push).toHaveBeenCalledWith('/closet')`.

   Storybook has its own version of this (`parameters.nextjs.appDirectory: true`), but 10.6 predates Next 16.4, whose
   useRouter() reads a layout field Storybook doesn't set, so every story using the router crashes. Leaving the layout
   context empty avoids that. Once @storybook/nextjs-vite supports Next 16.4, this file can go: turn `appDirectory`
   back on and use `getRouter()` from '@storybook/nextjs-vite/navigation.mock' in stories. */

const mocks = () => {
  const m = (name: string) => fn().mockName(`useRouter().${name}`);
  return { back: m('back'), forward: m('forward'), refresh: m('refresh'), hmrRefresh: m('hmrRefresh'), push: m('push'), replace: m('replace'), prefetch: m('prefetch') };
};
let current = mocks();

/** The router the current story's components see. */
export const router = () => current;
/** Fresh mocks for each story; called before it renders. */
export const resetRouter = () => void (current = mocks());

export const withAppRouter: Decorator = (Story, { parameters }) => {
  const { pathname = '/', query = {} } = (parameters.nextjs?.navigation ?? {}) as { pathname?: string; query?: Record<string, string> };
  return (
    <AppRouterContext.Provider value={current as unknown as AppRouterInstance}>
      <PathnameContext.Provider value={pathname}>
        <SearchParamsContext.Provider value={new URLSearchParams(query)}>
          <Story />
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
};
