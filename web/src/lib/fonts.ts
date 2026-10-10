import { DM_Sans, Instrument_Serif } from 'next/font/google';

/* The two typefaces, shared by the app layout and Storybook. Each sets a CSS variable (--font-sans, --font-serif)
   on the element it is applied to; globals.css reads them on :root, so apply `fontVariables` to <html>. */
const sans = DM_Sans({ variable: '--font-sans', subsets: ['latin'] });
const serif = Instrument_Serif({ variable: '--font-serif', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] });

export const fontVariables = `${sans.variable} ${serif.variable}`;
