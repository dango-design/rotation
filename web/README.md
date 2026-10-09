# Rotation app

The Rotation web app. See the [project README](../README.md) for what it does and how it works.

```bash
npm install
npm run dev      # http://localhost:3000, or http://localhost:3000/?demo for the demo closet
npm test         # engine tests
npm run lint
npm run build
```

Optional `.env.local`:

```bash
ANTHROPIC_API_KEY=your-key   # turns on photo tagging with Claude
```

## Storybook

```bash
npm run storybook          # http://localhost:6006
npm run test-storybook     # every story in Chromium: renders, interactions, accessibility
npm run build-storybook    # static build in storybook-static/
npm run chromatic          # visual tests; needs CHROMATIC_PROJECT_TOKEN
```

The story tests need a browser once: `npx playwright install chromium`.
