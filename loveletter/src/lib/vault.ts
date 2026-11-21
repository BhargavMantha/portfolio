/**
 * The site's photos and words are stored encrypted, because the repository
 * and the deployed files are public. The name and password are never stored
 * anywhere: they are turned into a key, and the key either opens the content
 * or it does not.
 *
 * Format of a sealed blob: 12-byte IV, then AES-256-GCM ciphertext with tag.
 * scripts/encrypt-content.mjs writes the same format.
 */

const b64 = {
  decode: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
  encode: (b: Uint8Array) => btoa(String.fromCharCode(...b)),
}

export async function deriveKey(user: string, password: string, saltB64: string, iterations: number): Promise<CryptoKey> {
  const secret = new TextEncoder().encode(`${user}\n${password}`)
  const base = await crypto.subtle.importKey('raw', secret, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64.decode(saltB64), iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(key: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data as BufferSource))
  const out = new Uint8Array(12 + ct.length)
  out.set(iv)
  out.set(ct, 12)
  return out
}

/** Throws if the key is wrong or the data was altered. */
export async function open(key: CryptoKey, sealed: Uint8Array): Promise<Uint8Array> {
  if (sealed.length < 12 + 16) throw new Error('sealed data is too short')
  const iv = sealed.slice(0, 12)
  return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, sealed.slice(12) as BufferSource))
}

export async function exportKey(key: CryptoKey): Promise<string> {
  return b64.encode(new Uint8Array(await crypto.subtle.exportKey('raw', key)))
}

export function importKey(saved: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', b64.decode(saved) as BufferSource, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}
