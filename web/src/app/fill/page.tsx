'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useUI } from '@/components/Shell';
import { OptionRows } from '@/components/ShopDrawers';
import { Disclosure, Flatlay, Icon, money, ShopSwitch, Tile } from '@/components/ui';
import { lowestPrice } from '@/lib/catalog';
import { KNOWN_STORES, TYPES } from '@/lib/catalog-meta';
import { rankPieces, slotOf, totalOutfits, whyLine } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { bestOutfitWith, previewsFor } from '@/lib/styling';
import type { Piece } from '@/lib/types';

export default function Fill() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const ranked = useMemo(() => rankPieces(st.catalog, st.items), [st.catalog, st.items]);
  const picks = ranked.filter((p) => p.unlock > 0 && p.dup.level < 1);
  const top3 = picks.slice(0, 3);
  const more = picks.slice(3, 6);
  const total = top3.reduce((a, p) => a + p.unlock, 0);
  const spend = top3.reduce((a, p) => a + lowestPrice(p.piece), 0);
  const skipped = ranked.filter((p) => p.dup.level === 1 || (p.unlock === 0 && p.piece.cat === 'outer')).slice(0, 4);

  const tryIt = (p: Piece) => {
    st.build({ name: `Trying the ${p.name.toLowerCase()}`, slots: bestOutfitWith(p, st.items), focus: slotOf(p) });
    router.push(st.href('/closet'));
  };

  const head = (
    <header className="page-head">
      <div>
        <div className="eyebrow">Fill the gap</div>
        <h1>
          {st.settings.showShop && top3.length ? (
            <>
              {top3.length === 1 ? 'One piece' : `${['', 'One', 'Two', 'Three'][top3.length]} pieces`}, <em>{total} new outfits</em>
            </>
          ) : (
            'Your closet, as it is'
          )}
        </h1>
        <p className="sub">
          We compared {st.catalog.length} common pieces from {KNOWN_STORES.length} stores with your {st.items.length}. These create the most new outfits with what you
          already own.
        </p>
      </div>
      <div className="head-actions">
        <ShopSwitch />
      </div>
    </header>
  );

  if (!st.settings.showShop)
    return (
      <>
        {head}
        <div className="card off-state">
          <Icon name="shield" />
          <h3>Shopping suggestions are off</h3>
          <p>Your closet makes {totalOutfits(st.items)} outfits. Rotation keeps styling what you own and won&apos;t show anything for sale until you turn this back on.</p>
          <ShopSwitch label="Turn suggestions back on" />
        </div>
      </>
    );

  if (!top3.length)
    return (
      <>
        {head}
        <div className="card empty">
          <h2>Nothing to suggest yet</h2>
          <p>Suggestions need something to pair with. Add a few tops, bottoms and shoes, and Rotation will find the pieces that unlock the most new outfits.</p>
          <button className="btn primary" onClick={() => ui.open({ type: 'add' })}>
            <Icon name="plus" />
            Add pieces
          </button>
        </div>
      </>
    );

  return (
    <>
      {head}
      <div className="card summary-bar">
        <div className="stack">
          {top3.map((p) => (
            <Tile key={p.piece.id} w={p.piece} />
          ))}
        </div>
        <div className="txt">
          <b>
            {total} new outfits from {money(spend)}
          </b>
          <span>
            Lowest example price for each piece, about {money(spend / total)} per new outfit before a single wear.
          </span>
        </div>
      </div>

      {top3.map(({ piece: p, unlock }, i) => {
        const prev = previewsFor(p, st.items, 3, i * 2);
        return (
          <article className="card pick" key={p.id}>
            <div className="pick-product">
              <span className="rank">{i + 1}</span>
              <Tile w={p} />
            </div>
            <div className="pick-info">
              <div>
                <h3>{p.name}</h3>
                <div className="price">
                  {TYPES[p.type].label} · {p.colorName} · from {money(lowestPrice(p))} at {p.options.length} stores
                </div>
              </div>
              <div className="unlock-big">
                <span className="num">{unlock}</span>
                <span className="lbl">new outfits with what you own</span>
              </div>
              <p className="why">{whyLine(p, st.items)}</p>
              <OptionRows p={p} />
              <button className="btn sm" style={{ alignSelf: 'flex-start' }} onClick={() => tryIt(p)}>
                Try with my closet
              </button>
            </div>
            <div className="pick-previews">
              <div className="previews-label">Outfits it unlocks</div>
              <div className="previews">
                {prev.map((o, k) => (
                  <figure key={k}>
                    <Flatlay slots={o} />
                    <figcaption>
                      {[o.top !== p.id ? o.top : o.bottom, o.shoes]
                        .map((id) => st.itemById(id)?.name)
                        .filter(Boolean)
                        .join(' · ')}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </article>
        );
      })}

      {more.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h3>Also worth a look</h3>
              <p>Fewer new outfits, still a good fit with your closet.</p>
            </div>
          </div>
          <div className="more-picks">
            {more.map(({ piece: p, unlock, dup }) => (
              <article className="card mini-pick" key={p.id}>
                <Tile w={p} />
                <div>
                  <h4>{p.name}</h4>
                  <div className="unlock-line">
                    <Icon name="unlock" />
                    Unlocks {unlock} outfits · from {money(lowestPrice(p))}
                  </div>
                  <p>{dup.level > 0 && dup.item ? `Close to your ${dup.item.name.toLowerCase()}, so it ranks lower.` : whyLine(p, st.items)}</p>
                  <button className="link" style={{ marginTop: 6, fontSize: 12.5 }} onClick={() => ui.open({ type: 'compare', id: p.id })}>
                    Compare {p.options.length} stores
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {skipped.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h3>What we didn&apos;t recommend, and why</h3>
              <p>Fewer, better picks mean fewer returns and more trust.</p>
            </div>
          </div>
          <div className="card skipped">
            {skipped.map(({ piece: p, dup }) => (
              <div className="skip-row" key={p.id}>
                <Tile w={p} />
                <div>
                  <h4>{p.name}</h4>
                  <p>
                    {dup.level === 1 && dup.item
                      ? `You already own one in ${dup.item.colorName.toLowerCase()} and have worn it ${dup.item.wears} times.`
                      : 'The layers you own already work with every outfit you can make.'}
                  </p>
                </div>
                {dup.level === 1 ? (
                  <span className="chip warn">
                    <Icon name="alert" />
                    You own this
                  </span>
                ) : (
                  <span className="chip">0 new outfits</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="section">
        <Disclosure />
      </div>
    </>
  );
}
