/* Passes a product photo from a store's site to the browser, so it can be read on a canvas for background removal
   (most store image hosts don't allow cross-origin reads). Raster images from public hosts only. */

import { IMAGE_TYPES, safeFetch } from '@/lib/server/safe-fetch';

const MAX_IMAGE = 8_000_000;

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return Response.json({ error: 'Send an image link.' }, { status: 400 });

  try {
    const img = await safeFetch(url, IMAGE_TYPES.join(','), MAX_IMAGE);
    const type = img.type.split(';')[0].trim().toLowerCase();
    if (!IMAGE_TYPES.includes(type)) return Response.json({ error: 'That link is not a photo.' }, { status: 415 });
    return new Response(new Uint8Array(img.bytes), {
      headers: {
        'content-type': type,
        'cache-control': 'private, max-age=3600',
        'content-security-policy': "default-src 'none'",
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    const msg = error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'The store took too long to respond.';
    return Response.json({ error: msg }, { status: 422 });
  }
}
