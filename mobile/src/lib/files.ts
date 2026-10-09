/* Photos and backup files on the phone. Photos live in the app's documents folder, one file per piece.
   The closet keeps only the file name: iOS moves the app's folder when the app updates, so full paths go stale. */

import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';

const folder = () => {
  const d = new Directory(Paths.document, 'images');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};

/** Photos are kept at most this wide; plenty for a phone screen and much lighter than a camera original. */
const MAX_SIDE = 1200;

/**
 * Keeps a picked, captured or pasted photo for a piece and returns the reference to store with it.
 * Cutouts (PNG with a transparent background) stay PNG; everything else is saved as JPEG.
 */
export async function keepImage(id: string, uri: string, size?: { width: number; height: number }): Promise<string> {
  const png = uri.startsWith('data:image/png') || /\.png($|\?)/i.test(uri);
  if (uri.startsWith('data:')) {
    // Pasted images and photos from a backup arrive as data URLs: write them out before resizing.
    const tmp = new File(Paths.cache, `${id}-in.${png ? 'png' : 'jpg'}`);
    if (tmp.exists) tmp.delete();
    tmp.create();
    tmp.write(uri.slice(uri.indexOf(',') + 1), { encoding: 'base64' });
    uri = tmp.uri;
  }
  const ctx = ImageManipulator.manipulate(uri);
  if (size && Math.max(size.width, size.height) > MAX_SIDE)
    ctx.resize(size.width >= size.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  const img = await ctx.renderAsync();
  const saved = await img.saveAsync({ format: png ? SaveFormat.PNG : SaveFormat.JPEG, compress: 0.85 });
  const name = `${id}-${Date.now().toString(36)}.${png ? 'png' : 'jpg'}`;
  const dest = new File(folder(), name);
  await new File(saved.uri).move(dest);
  return name;
}

/** The URI to show for a stored reference. */
export const uriFor = (ref: string) => (ref.includes('/') || ref.startsWith('data:') ? ref : new File(Paths.document, 'images', ref).uri);

export function dropImage(ref: string) {
  try {
    const f = new File(Paths.document, 'images', ref);
    if (f.exists) f.delete();
  } catch {
    // Already gone.
  }
}

export function clearImages() {
  const d = new Directory(Paths.document, 'images');
  if (d.exists) d.delete();
}

/** A stored photo as a data URL, for backups that move between the phone and the web app. */
export async function imageAsDataUrl(ref: string): Promise<string> {
  const b64 = await new File(uriFor(ref)).base64();
  return `data:image/${ref.endsWith('.png') ? 'png' : 'jpeg'};base64,${b64}`;
}

/** Hands a backup file to the share sheet, so it can go to Files, AirDrop or email. */
export async function shareJson(name: string, json: string) {
  const f = new File(Paths.cache, name);
  if (f.exists) f.delete();
  f.create();
  f.write(json);
  await Sharing.shareAsync(f.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Save your closet' });
}

/** Reads a file picked with the document picker. */
export const readText = (uri: string) => new File(uri).text();
