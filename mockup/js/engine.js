/* Outfit engine: rule-based pairing (the MVP stage of the compatibility model) and the Outfit Unlock score.
   An outfit is a top, a bottom and shoes, with an optional outer layer and accessory.
   Nothing here weights any store: pieces are ranked by the value they add to this closet. */

const Engine = (() => {
  const ALL = [...CLOSET, ...CATALOG];
  const byId = (id) => ALL.find((i) => i.id === id);
  const owned = (cat) => CLOSET.filter((i) => i.cat === cat);
  const storeOf = (i) => i.store || i.brand;
  const stores = () => [...new Set(CLOSET.map(storeOf))];

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

  /* Store options for a piece: the customer's favorite stores first, then lowest price. */
  function optionsFor(piece) {
    const fav = (o) => FAVORITE_STORES.includes(o.store);
    return [...byId(piece.id).options].sort((a, b) => fav(b) - fav(a) || a.price - b.price);
  }

  /* Owned items that pair with a given item, most-worn first. */
  function pairsWith(item) {
    return CLOSET.filter((i) => i.id !== item.id && i.cat !== item.cat && i.cat !== 'acc')
      .filter((i) => check([item, i]).ok)
      .sort((a, b) => b.wears - a.wears);
  }

  /* Suggestions for one outfit slot given the rest of the outfit:
     owned pieces that fit (least-worn first, to bring forgotten pieces back), then new pieces by rank. */
  function forSlot(slot, outfit) {
    const others = Object.entries(outfit)
      .filter(([k, v]) => k !== slot && v)
      .map(([, v]) => byId(v));
    const fits = (i) => check([...others, i]).ok;
    return {
      mine: owned(slot).filter(fits).sort((a, b) => a.wears - b.wears),
      shop: CATALOG.filter((c) => c.cat === slot && !c.dupOf && fits(c))
        .map((c) => ({ ...c, unlock: unlock(c), score: rank(c) }))
        .filter((c) => c.unlock > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2),
    };
  }

  const cpw = (i) => (i.wears ? i.price / i.wears : i.price);

  return { byId, owned, storeOf, stores, check, outfitsWith, unlock, totalOutfits, gapPicks, optionsFor, pairsWith, forSlot, cpw, dupPenalty };
})();
