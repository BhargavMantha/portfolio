// Encrypts the photos and words so they can live in a public repository.
//   node scripts/encrypt-content.mjs
// Reads  .private/photos/*, .private/photos.json, content/words.private.json
// Writes public/enc/meta.json, content.bin and one .bin per photo file.
//
// The name and password come from LOVELETTER_USER / LOVELETTER_PASS, or from
// .private/credentials.json ({ "user": "...", "pass": "..." }). They are never
// written to the output. Format matches src/lib/vault.ts: 12-byte IV, then
// AES-256-GCM ciphertext; key = PBKDF2-SHA256(user + "\n" + pass, salt).
import { webcrypto as crypto, randomBytes } from 'node:crypto'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ITERATIONS = 600_000
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const priv = path.join(root, '.private')
const out = path.join(root, 'public', 'enc')

let { LOVELETTER_USER: user, LOVELETTER_PASS: pass } = process.env
if (!user || !pass) {
  const saved = JSON.parse(await readFile(path.join(priv, 'credentials.json'), 'utf8').catch(() => '{}'))
  user ??= saved.user
  pass ??= saved.pass
}
if (!user || !pass) {
  console.error('Set LOVELETTER_USER and LOVELETTER_PASS, or create .private/credentials.json')
  process.exit(1)
}

const salt = randomBytes(16)
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${user}\n${pass}`), 'PBKDF2', false, ['deriveKey'])
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt'])

const seal = async (data) => {
  const iv = randomBytes(12)
  const ct = Buffer.from(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data))
  return Buffer.concat([iv, ct])
}

const photos = JSON.parse(await readFile(path.join(priv, 'photos.json'), 'utf8'))
const words = JSON.parse(await readFile(path.join(root, 'content', 'words.private.json'), 'utf8'))

// Every photo id a beat refers to must exist, or that beat would show no picture.
const ids = new Set(photos.map((p) => p.id))
const missing = Object.values(words.beats).flat().filter((b) => b.photo && !ids.has(b.photo)).map((b) => b.photo)
if (missing.length) {
  console.error(`words.private.json refers to unknown photos: ${missing.join(', ')}`)
  process.exit(1)
}

await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })

let bytes = 0
for (const photo of photos) {
  photo.src = { 800: photo.src[800], 1600: photo.src[1600] }
  for (const w of [800, 1600]) {
    // Opaque names, so the file list says nothing about what the pictures are.
    const name = `${randomBytes(9).toString('hex')}.bin`
    const sealed = await seal(await readFile(path.join(priv, 'photos', path.basename(photo.src[w]))))
    await writeFile(path.join(out, name), sealed)
    photo.src[w] = name
    bytes += sealed.length
  }
}
await writeFile(path.join(out, 'content.bin'), await seal(Buffer.from(JSON.stringify({ photos, words }))))
await writeFile(path.join(out, 'meta.json'), JSON.stringify({ v: 1, salt: salt.toString('base64'), iterations: ITERATIONS }))

const files = await readdir(out)
console.log(`encrypted ${photos.length} photos into ${files.length} files, ${(bytes / 1e6).toFixed(1)} MB`)
