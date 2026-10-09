/* Rotation's server routes don't exist in Storybook (or in a static Chromatic build), so stories answer them here.
   The defaults match a server without an Anthropic key; a story overrides a route with `parameters.api`, e.g.
   `api: { 'POST /api/link': { body: { title: 'Linen Shirt', ... } } }`. Every other request goes to the network. */

export type ApiRoutes = Record<string, { status?: number; body: unknown }>;

const DEFAULTS: ApiRoutes = {
  'GET /api/tag': { body: { enabled: false } },
  'POST /api/tag': { status: 501, body: { error: 'Photo tagging is not configured on this server.' } },
  'POST /api/link': { status: 422, body: { error: "That page doesn't describe a product we can read." } },
};

/** Answers /api/* from the table until the returned function restores the real fetch. */
export function stubApi(routes: ApiRoutes = {}) {
  const real = globalThis.fetch;
  const table = { ...DEFAULTS, ...routes };
  globalThis.fetch = async (input, init) => {
    const req = input instanceof Request ? input : undefined;
    const url = new URL(req?.url ?? String(input), location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return real(input, init);
    const method = (init?.method ?? req?.method ?? 'GET').toUpperCase();
    const hit = table[`${method} ${url.pathname}`] ?? { status: 404, body: { error: 'Not found' } };
    return Response.json(hit.body, { status: hit.status ?? 200 });
  };
  return () => {
    globalThis.fetch = real;
  };
}
