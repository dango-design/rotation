'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useUI } from '@/components/Shell';
import { OptionRows } from '@/components/ShopDrawers';
import { Disclosure, Flatlay, Icon, money, ShopSwitch, Tile } from '@/components/ui';
import { lowestPrice } from '@/lib/catalog';
import { KNOWN_STORES, TYPES } from '@/lib/catalog-meta';
import { rankPieces, shortlist, slotOf, totalOutfits, whyLine } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { bestOutfitWith, pairedIn, previewsFor } from '@/lib/styling';
import type { OutfitSlots, Piece } from '@/lib/types';

export default function Fill() {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const { top: top3, more, skipped } = useMemo(() => shortlist(rankPieces(st.catalog, st.items)), [st.catalog, st.items]);
  const total = top3.reduce((a, p) => a + p.unlock, 0);
  const spend = top3.reduce((a, p) => a + lowestPrice(p.piece), 0);

  /** Opens the piece on the outfit board, in the outfit given or the one built from what's worn most. */
  const tryIt = (p: Piece, slots: OutfitSlots = bestOutfitWith(p, st.items)) => {
    st.build({ name: `Trying the ${p.name.toLowerCase()}`, slots, focus: slotOf(p) });
    router.push(st.href('/closet'));
  };
  const pairedNames = (o: OutfitSlots, p: Piece) =>
    pairedIn(o, p.id)
      .map((id) => st.itemById(id)?.name)
      .filter(Boolean)
      .join(' · ');

  const showing = st.settings.showShop && top3.length > 0;
  const head = (
    <header className="page-head">
      <div>
        <div className="eyebrow">Fill the gap</div>
        <h1>
          {showing ? (
            <>
              {top3.length === 1 ? 'One piece' : `${['', 'One', 'Two', 'Three'][top3.length]} pieces`}, <em>{total} new outfits</em>
            </>
          ) : (
            'Your closet, as it is'
          )}
        </h1>
        {showing && (
          <p className="sub">
            We compared {st.catalog.length} common pieces from {KNOWN_STORES.length} stores with the {st.items.length} pieces in your closet. These would make the most
            new outfits with what you already own.
          </p>
        )}
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
          <h2>Shopping suggestions are off</h2>
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
          <button className="btn primary" onClick={() => st.requireAccount('start your closet', () => ui.open({ type: 'add' }))}>
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

      {top3.map(({ piece: p, unlock, dup }, i) => {
        const prev = previewsFor(p, st.items, 3, i * 2);
        return (
          <article className="card pick" key={p.id} aria-labelledby={`pick-${p.id}`}>
            <div className="pick-product">
              <span className="rank" aria-hidden="true">
                {i + 1}
              </span>
              <Tile w={p} />
            </div>
            <div className="pick-head">
              <h2 id={`pick-${p.id}`}>
                <span className="sr-only">Pick {i + 1}: </span>
                {p.name}
              </h2>
              <div className="price">
                {TYPES[p.type].label} · {p.colorName} · from {money(lowestPrice(p))} at {p.options.length} {p.options.length === 1 ? 'store' : 'stores'}
              </div>
              <div className="unlock-big">
                <span className="num">{unlock}</span>
                <span className="lbl">new outfits with what you own</span>
              </div>
            </div>
            <div className="pick-why">
              <p className="why">{whyLine(p, st.items)}</p>
              {dup.level > 0 && dup.item && <p className="why">Close to your {dup.item.name}, so it ranks a little lower.</p>}
            </div>
            <div className="pick-previews">
              <div className="previews-label">Outfits it unlocks</div>
              <div className="previews">
                {prev.map((o, k) => (
                  <button key={k} className="preview" onClick={() => tryIt(p, o)} title="Try this outfit on the board">
                    <Flatlay slots={o} />
                    <span className="preview-cap">
                      <span className="sr-only">Try it with </span>
                      {pairedNames(o, p)}
                    </span>
                  </button>
                ))}
              </div>
              <button className="btn sm" onClick={() => tryIt(p)}>
                <Icon name="builder" />
                Try with my closet
              </button>
            </div>
            <div className="pick-stores">
              <OptionRows p={p} limit={1} />
            </div>
          </article>
        );
      })}

      {more.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>Also worth a look</h2>
              <p>Good fits that rank lower, most often because they&apos;re close to something you own or to a pick above.</p>
            </div>
          </div>
          <div className="more-picks">
            {more.map(({ piece: p, unlock, dup }) => {
              const twin = top3.find((t) => t.piece.type === p.type)?.piece;
              return (
                <article className="card mini-pick" key={p.id}>
                  <Tile w={p} />
                  <div>
                    <h3>{p.name}</h3>
                    <div className="unlock-line">
                      <Icon name="unlock" />
                      Unlocks {unlock} outfits · from {money(lowestPrice(p))}
                    </div>
                    <p>
                      {twin
                        ? `Another take on the ${twin.name.toLowerCase()} above, in ${p.colorName.toLowerCase()}.`
                        : dup.level > 0 && dup.item
                          ? `Close to your ${dup.item.name}, so it ranks lower.`
                          : whyLine(p, st.items)}
                    </p>
                    <button className="link" style={{ marginTop: 6, fontSize: 12.5 }} onClick={() => ui.open({ type: 'compare', id: p.id })}>
                      Compare {p.options.length} {p.options.length === 1 ? 'store' : 'stores'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {skipped.length > 0 && (
        <section className="section">
          <div className="section-head">
            <div>
              <h2>What we didn&apos;t recommend, and why</h2>
              <p>Each is too close to something you already own, or wouldn&apos;t add a new outfit.</p>
            </div>
          </div>
          <div className="card skipped">
            {skipped.map(({ piece: p, dup }) => (
              <div className="skip-row" key={p.id}>
                <Tile w={p} />
                <div>
                  <h3>{p.name}</h3>
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
