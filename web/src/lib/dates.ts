/** Local calendar dates as YYYY-MM-DD strings, so a day never shifts with time zones. */

const pad = (n: number) => String(n).padStart(2, '0');

export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => isoDate(new Date());

export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

export const daysBetween = (from: string, to: string) => Math.round((parseISO(to).getTime() - parseISO(from).getTime()) / 864e5);

/** Monday of the week containing the date. */
export const weekStart = (s: string) => {
  const d = parseISO(s);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return isoDate(d);
};

export const fmt = (s: string, opts: Intl.DateTimeFormatOptions) => parseISO(s).toLocaleDateString('en-US', opts);
export const shortDate = (s: string) => fmt(s, { month: 'short', day: 'numeric' });
export const longDay = (s: string) => fmt(s, { weekday: 'long', month: 'long', day: 'numeric' });

export function ago(s: string | undefined, today = todayISO()) {
  if (!s) return 'not worn yet';
  const n = daysBetween(s, today);
  if (n <= 0) return 'today';
  if (n === 1) return 'yesterday';
  if (n < 14) return `${n} days ago`;
  return shortDate(s);
}
