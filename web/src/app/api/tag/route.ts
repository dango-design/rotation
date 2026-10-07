/* Photo tagging: Claude suggests the garment type, color and a short name for one photo.
   Enabled when the server has Anthropic credentials (ANTHROPIC_API_KEY). The person always confirms the result. */

import Anthropic from '@anthropic-ai/sdk';
import { SWATCHES, TYPES } from '@/lib/catalog-meta';

const enabled = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const SCHEMA = {
  type: 'object',
  properties: {
    is_clothing: { type: 'boolean' },
    type: { type: 'string', enum: Object.keys(TYPES) },
    colorName: { type: 'string', enum: SWATCHES.map((s) => s.name) },
    name: { type: 'string' },
    brand: { type: 'string' },
  },
  required: ['is_clothing', 'type', 'colorName', 'name', 'brand'],
  additionalProperties: false,
};

const SYSTEM = `You help people catalog their own clothes for a closet app. You get one photo of a single piece of clothing, a pair of shoes, or a bag.
Choose the closest garment type and color from the allowed values. For a striped top use "Navy Stripe"; for denim use the wash colors.
Write a short, plain name a person would use for it, 2 to 4 words, such as "Grey crew sweater" or "Light-wash straight jeans".
Set brand only if a brand name is clearly legible on the item; otherwise use an empty string.
If the photo does not show clothing, shoes or a bag, set is_clothing to false.`;

export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(request: Request) {
  if (!enabled()) return Response.json({ error: 'Photo tagging is not configured on this server.' }, { status: 501 });

  const body = await request.json().catch(() => null);
  const image = body?.image;
  if (typeof image !== 'string' || !image || image.length > 3_000_000)
    return Response.json({ error: 'Send one JPEG image as base64.' }, { status: 400 });

  const client = new Anthropic();
  try {
    const message = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4096,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'Catalog this piece.' },
          ],
        },
      ],
    });

    if (message.stop_reason === 'refusal') return Response.json({ error: 'The photo could not be tagged.' }, { status: 422 });
    const text = message.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return Response.json({ error: 'No tags returned.' }, { status: 502 });

    const tags = JSON.parse(text.text) as { is_clothing: boolean; type: string; colorName: string; name: string; brand: string };
    if (!tags.is_clothing) return Response.json({ error: "That doesn't look like clothing." }, { status: 422 });
    return Response.json({ type: tags.type, colorName: tags.colorName, name: tags.name, brand: tags.brand || null });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return Response.json({ error: 'Busy; try again shortly.' }, { status: 429 });
    if (error instanceof Anthropic.AuthenticationError) return Response.json({ error: 'Tagging credentials are invalid.' }, { status: 501 });
    if (error instanceof Anthropic.APIError) return Response.json({ error: `Tagging failed (${error.status}).` }, { status: 502 });
    if (error instanceof SyntaxError) return Response.json({ error: 'Tags could not be read.' }, { status: 502 });
    throw error;
  }
}
