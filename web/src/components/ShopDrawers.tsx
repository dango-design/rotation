'use client';

import { findUrl, pieceById } from '@/lib/catalog';
import { duplicate, unlock, whyLine } from '@/lib/engine';
import { useStore } from '@/lib/store';
import type { Item, Piece, StoreOption } from '@/lib/types';
import { Disclosure, Icon, money, Tile } from './ui';

export const listKey = (pieceId: string, store: string) => `${pieceId}|${store}`;

/** The size to pick at a store: from past purchases there, or inferred from the same kind of piece elsewhere. */
export function sizeHint(store: string, p: Piece, items: Item[]) {
  const sameCat = items.filter((i) => i.cat === p.cat && i.size && i.size !== 'One size');
  const here = sameCat.find((i) => (i.store ?? i.brand) === store);
  if (here) return `Your size: ${here.size}, from your closet`;
  const any = sameCat.sort((a, b) => b.wears - a.wears)[0];
  return any ? `Likely ${any.size}, based on your other ${p.cat === 'shoes' ? 'shoes' : 'pieces like this'}` : '';
}

/** Store options for a piece: favorite stores first, then lowest price. */
export function sortedOptions(p: Piece, favorites: string[]): StoreOption[] {
  const fav = (o: StoreOption) => (favorites.includes(o.store) ? 1 : 0);
  return [...p.options].sort((a, b) => fav(b) - fav(a) || a.price - b.price);
}

export function OptionRows({ p }: { p: Piece }) {
  const { settings, items, list, addToList, toast, requireAccount } = useStore();
  return (
    <div className="opt-list">
      {sortedOptions(p, settings.favoriteStores).map((o) => {
        const key = listKey(p.id, o.store);
        const added = list.some((e) => e.key === key);
        const hint = sizeHint(o.store, p, items);
        return (
          <div className="opt-row" key={o.store}>
            <div>
              <div className="opt-store">
                {o.store}
                {settings.favoriteStores.includes(o.store) && (
                  <span className="fav" title="One of your favorite stores">
                    <Icon name="star" />
                  </span>
                )}
              </div>
              <div className="opt-product">
                {o.product} · <a href={findUrl(o.store, o.product)} target="_blank" rel="noreferrer">find it</a>
              </div>
              {hint && (
                <div className="opt-fit">
                  <Icon name="ruler" />
                  {hint}
                </div>
              )}
            </div>
            <div className="opt-price">{money(o.price)}</div>
            {added ? (
              <span className="chip good">
                <Icon name="check" />
                On list
              </span>
            ) : (
              <button
                className="btn xs"
                onClick={() =>
                  requireAccount('save your shopping list', () => {
                    addToList(key);
                    toast(`Added to your list · ${o.product} from ${o.store}`);
                  })
                }
              >
                Add to list
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CompareDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { items } = useStore();
  const p = pieceById(id);
  if (!p) return null;
  const dup = duplicate(p, items);
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`Compare stores for ${p.name}`}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <div className="eyebrow">Compare stores</div>
        <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 16, alignItems: 'center' }}>
          <Tile w={p} />
          <div>
            <h2>{p.name}</h2>
            <div className="unlock-line" style={{ fontSize: 13 }}>
              <Icon name="unlock" />
              Unlocks {unlock(p, items)} new outfits
            </div>
          </div>
        </div>
        <p className="why">{whyLine(p, items)}</p>
        {dup.level === 1 && dup.item && (
          <div className="warn-box">
            <b>You already own this:</b> {dup.item.name}, worn {dup.item.wears} times.
          </div>
        )}
        <OptionRows p={p} />
        <Disclosure />
      </aside>
    </>
  );
}

export function ListDrawer({ onClose }: { onClose: () => void }) {
  const { list, items, removeFromList, toast, requireAccount } = useStore();
  const entries = list
    .map((e) => {
      const [pid, store] = e.key.split('|');
      const piece = pieceById(pid);
      const option = piece?.options.find((o) => o.store === store);
      return piece && option ? { key: e.key, piece, option } : null;
    })
    .filter(Boolean) as { key: string; piece: Piece; option: StoreOption }[];
  const byStore = new Map<string, typeof entries>();
  entries.forEach((e) => byStore.set(e.option.store, [...(byStore.get(e.option.store) ?? []), e]));
  const total = entries.reduce((a, e) => a + e.option.price, 0);
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Shopping list">
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        <div>
          <div className="eyebrow">Shopping list</div>
          <h2>{entries.length ? `${entries.length} piece${entries.length > 1 ? 's' : ''}, ${money(total)}` : 'Your list is empty'}</h2>
        </div>
        {entries.length ? (
          <>
            {[...byStore.entries()].map(([store, es]) => (
              <div className="list-store" key={store}>
                <div className="list-store-head">
                  <b>{store}</b>
                </div>
                {es.map(({ key, piece, option }) => (
                  <div className="sugg" key={key}>
                    <Tile w={piece} />
                    <div>
                      <div className="sugg-name">{option.product}</div>
                      <div className="unlock-line">
                        <Icon name="unlock" />+{unlock(piece, items)} outfits with your closet
                      </div>
                      <div className="sugg-sub">
                        {money(option.price)} · <a href={findUrl(option.store, option.product)} target="_blank" rel="noreferrer">find it at {store}</a>
                      </div>
                    </div>
                    <button
                      className="btn xs"
                      onClick={() =>
                        requireAccount('save your shopping list', () => {
                          removeFromList(key);
                          toast('Removed from your list');
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
            <Disclosure />
          </>
        ) : (
          <p className="sub">Pieces you add from Fill the gap land here, grouped by store, with the outfits they unlock.</p>
        )}
      </aside>
    </>
  );
}
