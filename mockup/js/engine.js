/* Outfit engine: rule-based pairing (the MVP stage of the compatibility model) and the Outfit Unlock score.
   An outfit is a top, a bottom and shoes, with an optional outer layer and accessory. */

const Engine = (() => {
  const ALL = [...CLOSET, ...CATALOG];
  const byId = (id) => ALL.find((i) => i.id === id);
  const isGapInc = (item) => GAP_INC.includes(item.brand);
  const owned = (cat) => CLOSET.filter((i) => i.cat === cat);

  function clash(a, b) {
    if (a.tone !== 'neutral' && b.tone !== 'neutral' && a.tone !== b.tone)
      return `${a.colorName} and ${b.colorName} compete for attention`;
    if (a.denim && b.denim && a.denim === b.denim)
      return `Two ${a.colorName.toLowerCase()} denim pieces read as one block`;
    return null;
  }

  /* Returns { ok, reason } for any set of items. Accessories are excluded from the formality check. */
  function check(items) {
    const list = items.filter(Boolean);
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const reason = clash(list[i], list[j]);
        if (reason) return { ok: false, reason };
      }
    const worn = list.filter((i) => i.cat !== 'acc');
    if (worn.length > 1) {
      const hi = worn.reduce((a, b) => (b.f > a.f ? b : a));
      const lo = worn.reduce((a, b) => (b.f < a.f ? b : a));
      if (hi.f - lo.f > 1) return { ok: false, reason: `The ${hi.name.toLowerCase()} is much dressier than the ${lo.name.toLowerCase()}` };
    }
    return { ok: true };
  }

  /* Every complete outfit (top + bottom + shoes) an item takes part in, using owned pieces for the rest.
     Outer layers count the outfits they can be worn over. */
  function outfitsWith(c) {
    const pick = (cat) => (c.cat === cat ? [c] : owned(cat));
    const out = [];
    for (const t of pick('top'))
      for (const b of pick('bottom'))
        for (const s of pick('shoes')) {
          const set = c.cat === 'outer' ? [t, b, s, c] : [t, b, s];
          if (check(set).ok) out.push({ top: t.id, bottom: b.id, shoes: s.id, ...(c.cat === 'outer' ? { outer: c.id } : {}) });
        }
    return out;
  }

  /* Outfit Unlock: outfits that only become possible with this item.
     A new top, bottom or shoe creates outfits outright; a new layer only counts outfits no owned layer works with. */
  function unlock(c) {
    const outfits = outfitsWith(c);
    if (c.cat !== 'outer') return outfits.length;
    return outfits.filter((o) => !owned('outer').some((l) => check([o.top, o.bottom, o.shoes].map(byId).concat(l)).ok)).length;
  }

  function totalOutfits() {
    let n = 0;
    for (const t of owned('top')) for (const b of owned('bottom')) for (const s of owned('shoes')) if (check([t, b, s]).ok) n++;
    return n;
  }

  /* Duplicate penalty D: 1 = blocks the suggestion, 0.35 = a close cousin of something owned. */
  const dupPenalty = (c) => (c.dupOf ? 1 : c.similarTo ? 0.35 : 0);
  const rank = (c) => unlock(c) * c.style * (1 - dupPenalty(c));

  function gapPicks() {
    return CATALOG.filter((c) => !c.dupOf)
      .map((c) => ({ ...c, unlock: unlock(c), score: rank(c) }))
      .sort((a, b) => b.score - a.score);
  }

  /* Owned items that pair with a given item, Gap Inc. first. */
  function pairsWith(item) {
    return CLOSET.filter((i) => i.id !== item.id && i.cat !== item.cat && i.cat !== 'acc')
      .filter((i) => check([item, i]).ok)
      .sort((a, b) => isGapInc(b) - isGapInc(a) || b.wears - a.wears);
  }

  /* Suggestions for one outfit slot given the rest of the outfit.
     Tier 1: owned Gap Inc. (under-worn first), tier 2: owned other brands, tier 3: new Gap by rank. */
  function forSlot(slot, outfit) {
    const others = Object.entries(outfit)
      .filter(([k, v]) => k !== slot && v)
      .map(([, v]) => byId(v));
    const fits = (i) => check([...others, i]).ok;
    const mine = owned(slot).filter(fits);
    return {
      gap: mine.filter(isGapInc).sort((a, b) => a.wears - b.wears),
      other: mine.filter((i) => !isGapInc(i)).sort((a, b) => b.wears - a.wears),
      shop: CATALOG.filter((c) => c.cat === slot && !c.dupOf && fits(c))
        .map((c) => ({ ...c, unlock: unlock(c), score: rank(c) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2),
    };
  }

  const cpw = (i) => (i.wears ? i.price / i.wears : i.price);

  return { byId, isGapInc, owned, check, outfitsWith, unlock, totalOutfits, gapPicks, pairsWith, forSlot, cpw, dupPenalty };
})();
