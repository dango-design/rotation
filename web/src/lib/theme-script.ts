/* Kept apart from the theme hooks so the root layout (a Server Component) can import it. */

export const THEME_KEY = 'rotation-theme';

/** Inlined in <head> so a saved theme is on <html> before anything paints. */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
