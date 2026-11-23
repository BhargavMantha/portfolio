/**
 * Progress store for /dojo. One JSON document in Netlify Blobs.
 *
 *   GET  /.netlify/functions/dojo-progress   → the saved progress, or {}
 *   PUT  /.netlify/functions/dojo-progress   → replace it
 *
 * Callers send "Authorization: Bearer <token>". The token is derived in the
 * browser from the page's decryption key; this function only holds its
 * SHA-256 (token-hash.mjs, written by scripts/encrypt-dojo.mjs).
 */
import { getStore } from '@netlify/blobs';
import { createHash, timingSafeEqual } from 'node:crypto';
import { TOKEN_SHA256 } from './token-hash.mjs';

const MAX_BYTES = 200_000;
const HEX64 = /^[0-9a-f]{64}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function authorised(req) {
  if (!HEX64.test(TOKEN_SHA256)) return false; // encrypt-dojo.mjs has not been run
  const match = /^Bearer ([0-9a-f]{64})$/.exec(req.headers.get('authorization') ?? '');
  if (!match) return false;
  const got = createHash('sha256').update(match[1], 'utf8').digest();
  return timingSafeEqual(got, Buffer.from(TOKEN_SHA256, 'hex'));
}

export default async (req) => {
  if (!authorised(req)) return json({ error: 'unauthorised' }, 401);

  // Strong consistency: a write on the laptop must be visible to the phone's next read.
  const store = getStore({ name: 'dojo', consistency: 'strong' });

  if (req.method === 'GET') {
    return json((await store.get('progress', { type: 'json' })) ?? {});
  }

  if (req.method === 'PUT') {
    const text = await req.text();
    if (text.length > MAX_BYTES) return json({ error: 'too large' }, 413);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: 'invalid JSON' }, 400);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) || body.v !== 1) {
      return json({ error: 'unexpected shape' }, 400);
    }
    await store.setJSON('progress', body);
    return json({ ok: true, t: body.t ?? 0 });
  }

  return json({ error: 'method not allowed' }, 405);
};
