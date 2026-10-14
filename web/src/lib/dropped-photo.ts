/* A photo dropped or pasted into Rotation: a file from Finder or the clipboard, or an image dragged from another
   web page, which arrives only as its address and is fetched through /api/image. */

import { photoUrl } from './vision/find';

/** Whether a drag carries something that could be a photo, before it is dropped (its contents aren't readable yet). */
export const mayHoldPhoto = (types: readonly string[]) => types.includes('Files') || types.includes('text/uri-list');

/** The image address in a drag from a web page: the dragged <img>'s src, else a link that looks like a photo. */
export function imageLinkIn(uriList: string, html: string): string | null {
  const src = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, '&');
  const links = [src, ...uriList.split(/\r?\n/).filter((l) => l && !l.startsWith('#'))].filter((u): u is string => !!u);
  const web = links.filter((u) => /^https?:\/\//i.test(u));
  return web.find((u) => u === src) ?? web.find((u) => /\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(u)) ?? null;
}

/** The photo in a drop or paste. Throws with a message for the person when there is something, but not a photo. */
export async function photoIn(data: DataTransfer): Promise<File | null> {
  const files = [...data.files];
  const image = files.find((f) => f.type.startsWith('image/'));
  if (image) return image;
  if (files.length) throw new Error("That file isn't a photo. Drop a photo of the piece instead.");

  const link = imageLinkIn(data.getData('text/uri-list'), data.getData('text/html'));
  if (!link) return null;
  const res = await fetch(photoUrl(link)).catch(() => null);
  if (!res?.ok) throw new Error("Couldn't load that photo from its site. Save it to your computer, then drop the file here.");
  const blob = await res.blob();
  return new File([blob], 'dropped-photo', { type: blob.type });
}
