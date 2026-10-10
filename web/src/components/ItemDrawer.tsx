'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TYPES } from '@/lib/catalog-meta';
import { ago, shortDate } from '@/lib/dates';
import { check, cpw, outfitsWith, pairsWith, rankPieces, slotOf } from '@/lib/engine';
import { useStore } from '@/lib/store';
import { bestOutfitWith } from '@/lib/styling';
import { ItemForm } from './ItemForm';
import { useUI } from './Shell';
import { Icon, money, Tile } from './ui';

const SOURCE: Record<string, string> = {
  photo: 'Added from a photo. The background was removed on this device.',
  link: 'Added from a product link; the photo and details came from the store page.',
  manual: 'Added by description; the illustration is drawn from its type and color.',
  email: 'Imported from an order email (demo).',
  demo: 'Part of the demo closet.',
};

export function ItemDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const st = useStore();
  const ui = useUI();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const it = st.itemById(id);
  if (!it) return null;
  const pairs = pairsWith(it, st.items);
  const c = cpw(it);
  const shop = st.settings.showShop
    ? rankPieces(st.catalog.filter((p) => slotOf(p) !== slotOf(it) && check([it, p]).ok), st.items)
        .filter((x) => x.unlock > 0 && x.dup.level < 1)
        .slice(0, 2)
    : [];

  const styleIt = () => {
    st.build({ name: `Styling the ${it.name}`, slots: bestOutfitWith(it, st.items), focus: slotOf(it) });
    onClose();
    router.push(st.href('/closet'));
  };

  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={it.name}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close">
          <Icon name="x" />
        </button>
        {editing ? (
          <>
            <h2>Edit piece</h2>
            <ItemForm
              initial={it}
              previewUrl={st.imageFor(it)}
              submitLabel="Save changes"
              onCancel={() => setEditing(false)}
              onSubmit={(f) => {
                st.updateItem({ ...it, ...f });
                setEditing(false);
                st.toast('Saved');
              }}
            />
          </>
        ) : (
          <>
            <Tile w={it} className="big" />
            <div>
              <span className="chip">{it.brand || TYPES[it.type].label}</span>
              {it.store ? <span className="chip" style={{ marginLeft: 6 }}>Bought at {it.store}</span> : null}
              <h2 style={{ marginTop: 10 }}>{it.name}</h2>
              <div className="meta-line">
                {it.colorName} · {TYPES[it.type].label}
                {it.size ? ` · Size ${it.size}` : ''}
                {it.bought ? ` · Bought ${shortDate(it.bought)}` : ''}
              </div>
            </div>
            <div className="kv">
              <div>
                <div className="v">{it.wears}</div>
                <div className="l">wears</div>
              </div>
              <div>
                <div className="v">{c ? money(c) : '—'}</div>
                <div className="l">cost per wear</div>
              </div>
              <div>
                <div className="v" style={{ fontSize: 18 }}>{ago(it.lastWorn)}</div>
                <div className="l">last worn</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn primary" onClick={styleIt}>
                <Icon name="builder" />
                Style it
              </button>
              <button
                className="btn"
                onClick={() =>
                  st.requireAccount('log what you wore', () => {
                    st.wear({ [slotOf(it)]: it.id });
                    st.toast(`Logged a wear for the ${it.name}`);
                  })
                }
              >
                <Icon name="check" />
                Wore it today
              </button>
            </div>
            <div>
              <h3 className="small">Pairs with {pairs.length} pieces you own</h3>
              <p className="meta-line" style={{ margin: '2px 0 10px' }}>
                Most-worn first · {outfitsWith(it, st.items).length} complete outfits
              </p>
              {pairs.length ? (
                <div className="thumb-row">
                  {pairs.slice(0, 10).map((p) => (
                    <button key={p.id} className="thumb" title={p.name} style={{ border: 0, padding: 0, background: 'none' }} onClick={() => ui.open({ type: 'item', id: p.id })}>
                      <Tile w={p} />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="empty-note">Add more pieces to see what this goes with.</p>
              )}
            </div>
            {shop.length > 0 && (
              <div>
                <h3 className="small">Complete it</h3>
                <p className="meta-line" style={{ margin: '2px 0 6px' }}>
                  Pieces that pair with this one, ranked by outfits unlocked
                </p>
                {shop.map(({ piece, unlock }) => (
                  <div className="sugg shop" key={piece.id}>
                    <Tile w={piece} />
                    <div>
                      <div className="sugg-name">{piece.name}</div>
                      <div className="unlock-line">
                        <Icon name="unlock" />
                        Unlocks {unlock} outfits
                      </div>
                      <div className="sugg-sub">From {money(Math.min(...piece.options.map((o) => o.price)))} at {piece.options.length} stores</div>
                    </div>
                    <button className="btn xs" onClick={() => ui.open({ type: 'compare', id: piece.id })}>
                      Compare
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="provenance">
              <Icon name={it.source === 'link' ? 'link' : it.source === 'photo' ? 'camera' : 'info'} />
              <span>{SOURCE[it.source]}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm" onClick={() => st.requireAccount('edit your closet', () => setEditing(true))}>
                <Icon name="pencil" />
                Edit
              </button>
              {confirmDelete ? (
                <button
                  className="btn sm"
                  style={{ borderColor: 'var(--warn)', color: 'var(--warn)' }}
                  onClick={() => {
                    st.removeItem(it.id);
                    st.toast(`${it.name} removed`);
                    onClose();
                  }}
                >
                  Remove permanently
                </button>
              ) : (
                <button className="btn sm ghost" onClick={() => st.requireAccount('edit your closet', () => setConfirmDelete(true))}>
                  <Icon name="trash" />
                  Remove
                </button>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}
