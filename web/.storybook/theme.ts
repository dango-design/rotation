import { create } from 'storybook/theming/create';

/** Storybook's own chrome in Rotation's colors, so docs pages read like the app (values from globals.css). */
export const theme = create({
  base: 'light',
  brandTitle: 'rotation. · Storybook',
  brandUrl: 'https://github.com/dango-design/rotation',
  brandTarget: '_blank',
  colorPrimary: '#b5532c',
  colorSecondary: '#1e3a6e',
  appBg: '#fbfaf7',
  appContentBg: '#ffffff',
  appPreviewBg: '#f3f0ea',
  appBorderColor: '#e4dfd6',
  appBorderRadius: 10,
  textColor: '#1c1b19',
  textMutedColor: '#6f6a62',
  barBg: '#ffffff',
  barTextColor: '#4f4b45',
  barSelectedColor: '#1e3a6e',
  inputBorder: '#d3cdc2',
  inputBorderRadius: 10,
  fontBase: "'DM Sans', system-ui, -apple-system, sans-serif",
});
