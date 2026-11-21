import { open } from '../lib/vault'
import type { Words } from './chapters'
import { makeManifest, pickSrc, type Photo } from './manifest'

/** What sits beside the encrypted files, in the clear. Nothing secret. */
export type VaultMeta = { v: 1; salt: string; iterations: number }

type Unlocked = { key: CryptoKey; manifest: ReturnType<typeof makeManifest>; words: Words }

let current: Unlocked | null = null
const urls = new Map<string, Promise<string>>()

const base = () => `${import.meta.env?.BASE_URL ?? '/'}enc/`

async function fetchBytes(name: string): Promise<Uint8Array> {
  const res = await fetch(base() + name)
  if (!res.ok) throw new Error(`could not load ${name}: ${res.status}`)
  return new Uint8Array(await res.arrayBuffer())
}

export async function fetchMeta(): Promise<VaultMeta> {
  const res = await fetch(`${base()}meta.json`)
  if (!res.ok) throw new Error(`could not load meta.json: ${res.status}`)
  return res.json()
}

/** Opens the content with a key. Rejects, leaving everything locked, if the key is wrong. */
export async function unlock(key: CryptoKey): Promise<void> {
  const plain = await open(key, await fetchBytes('content.bin'))
  const { photos, words } = JSON.parse(new TextDecoder().decode(plain)) as { photos: Photo[]; words: Words }
  current = { key, manifest: makeManifest(photos), words }
}

const need = () => {
  if (!current) throw new Error('content is locked')
  return current
}

export const content = {
  get unlocked() {
    return current !== null
  },
  get manifest() {
    return need().manifest
  },
  get words() {
    return need().words
  },
}

/** A usable URL for a photo at the size the screen needs. Decrypted once, then cached. */
export function photoUrl(photo: Photo, cssWidth: number, dpr: number): Promise<string> {
  const name = pickSrc(photo, cssWidth, dpr)
  let url = urls.get(name)
  if (!url) {
    const { key } = need()
    url = fetchBytes(name)
      .then((sealed) => open(key, sealed))
      .then((bytes) => URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/webp' })))
    // A failed download must not be remembered, or the photo could never load later.
    url.catch(() => urls.delete(name))
    urls.set(name, url)
  }
  return url
}

/** For tests: put content in place without any encryption. */
export function setContentForTests(photos: Photo[], words: Words) {
  current = { key: null as unknown as CryptoKey, manifest: makeManifest(photos), words }
}
