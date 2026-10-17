'use client';

/* Stopping the day on the outfit board, from the board's ×, Today's bar for a day left waiting, or the closet's Back to
   Today bar. Whatever the day already had stays as it was, so it only asks first when the board holds pieces the day
   doesn't have yet; otherwise it stops at once. */

import { useState } from 'react';
import { fmt, todayISO } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { dayWear, unsavedDay } from '@/lib/wear';
import { Confirm } from './ui';

/** Stops the day on the board: `stop` for the button, and `ask` to render, which is the question when there is one.
    `then` runs once the day has stopped. */
export function useStopDay(then?: () => void) {
  const st = useStore();
  const [asking, setAsking] = useState(false);
  const today = todayISO();
  const day = st.building ? st.draft.date : undefined;
  const dayName = !day ? '' : day === today ? 'today' : fmt(day, { weekday: 'long' });
  // A past day, or a change to what was worn, is logged; today and later are planned.
  const logging = !!day && (day < today || !!st.draft.log);
  const verb = logging ? 'logging' : 'planning';
  const plan = day ? st.plans.find((p) => p.date === day) : undefined;
  const kept = !!day && !!(logging ? dayWear(st.wears, day) : plan);

  const leave = () => {
    setAsking(false);
    st.setDraft({ name: 'New outfit', slots: {}, focus: 'top' });
    st.setBuilding(false);
    st.toast(!kept ? `Stopped ${verb} ${dayName}` : logging ? `Stopped logging ${dayName}. What you wore is unchanged.` : `Stopped planning ${dayName}. ${plan!.name} is still planned.`);
    then?.();
  };
  const stop = () => (day && unsavedDay({ ...st.draft, date: day }, st.plans, st.wears, today) ? setAsking(true) : leave());

  const ask =
    asking && day ? (
      <Confirm title={`Stop ${verb} ${dayName}?`} confirm={`Stop ${verb}`} cancel={`Keep ${verb}`} onCancel={() => setAsking(false)} onConfirm={leave}>
        {!kept
          ? `Nothing is ${logging ? 'logged' : 'planned'} for ${dayName} yet, so the outfit on the board goes. Its pieces stay in your closet.`
          : logging
            ? `The changes on the board aren't saved. What you wore ${dayName === 'today' ? 'today' : `on ${dayName}`} stays as it was.`
            : `The changes on the board aren't saved. ${plan!.name} stays planned for ${dayName}.`}
      </Confirm>
    ) : null;

  return { stop, ask, logging, verb, dayName, label: `Stop ${verb} ${dayName}` };
}
