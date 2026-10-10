/* An outfit as a phone-sized picture: the canvas drawn at EXPORT_W × EXPORT_H, exactly as arranged, on the board
   background. Runs in the browser. */

import { hexOf, isNeutral } from './backgrounds';
import { standaloneGarmentSvg } from './garments';
import { EXPORT_H, EXPORT_W, resolveLayout, stackOrder } from './layout';
import type { Background, Layout, OutfitSlots, Wearable } from './types';

type Art = Wearable & { imageId?: string; source?: string; cutout?: boolean };

/** The on-screen canvas is about 300px wide; shadows scale up from there so the export looks the same. */
const K = EXPORT_W / 300;

const load = async (src: string) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
};

export async function renderOutfitImage({
  slots,
  layout,
  byId,
  imageFor,
  bg,
}: {
  slots: OutfitSlots;
  layout?: Layout;
  byId: (id?: string) => Art | undefined;
  imageFor: (w: Art) => string | undefined;
  /** Neutrals use their light value, like the board in dark mode. */
  bg: Background;
}): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_W;
  canvas.height = EXPORT_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = hexOf(bg);
  ctx.fillRect(0, 0, EXPORT_W, EXPORT_H);

  const placed = resolveLayout(slots, layout, byId);
  for (const s of stackOrder(placed)) {
    const w = byId(slots[s])!;
    const p = placed[s]!;
    const size = (p.w / 100) * EXPORT_W;
    const x = (p.x / 100) * EXPORT_W;
    const y = (p.y / 100) * EXPORT_H;
    const url = imageFor(w);
    // Product photos keep their white background and are multiplied into a neutral board, with no shadow, as on screen.
    // On a color, multiplying would tint the piece, so they keep their white instead.
    const onWhite = !!url && w.source === 'link' && !w.cutout && isNeutral(bg);

    ctx.save();
    if (onWhite) ctx.globalCompositeOperation = 'multiply';
    else {
      ctx.shadowColor = 'rgba(28, 27, 25, 0.15)';
      ctx.shadowBlur = 10 * K;
      ctx.shadowOffsetY = 10 * K;
    }
    if (url) {
      const img = await load(url);
      const fit = Math.min(size / img.naturalWidth, size / img.naturalHeight);
      const dw = img.naturalWidth * fit;
      const dh = img.naturalHeight * fit;
      ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
    } else {
      const px = Math.max(1, Math.round(size));
      const svg = URL.createObjectURL(new Blob([standaloneGarmentSvg(w.type, w.color, w.pattern, px)], { type: 'image/svg+xml' }));
      try {
        ctx.drawImage(await load(svg), x, y, size, size);
      } finally {
        URL.revokeObjectURL(svg);
      }
    }
    ctx.restore();
  }

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not make the image'))), 'image/png'));
}

/** Hands the picture over: the share sheet on a phone (where Save Image puts it in Photos), a download elsewhere. */
export async function deliverImage(blob: Blob, name: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([blob], `${name.trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'outfit'}.png`, { type: 'image/png' });
  if (matchMedia('(hover: none)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
      // Otherwise (the browser wants a fresh tap, say), fall back to a download.
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return 'downloaded';
}
