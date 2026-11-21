// Builds web copies of the shortlisted photos.
//   node scripts/build-images.mjs
// Reads content/shortlist.json. Writes plain web copies to .private/photos/*
// and .private/photos.json (both git-ignored). Originals are only ever read.
// Run scripts/encrypt-content.mjs afterwards to produce what actually ships.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, '.private', 'photos')
const WIDTHS = [800, 1600]

const shortlist = JSON.parse(await readFile(path.join(root, 'content', 'shortlist.json'), 'utf8'))
await mkdir(outDir, { recursive: true })

const mtime = async (p) => (await stat(p).catch(() => null))?.mtimeMs ?? 0

const photos = []
let built = 0
for (const pick of shortlist) {
  const srcTime = await mtime(pick.source)
  if (!srcTime) throw new Error(`missing source for ${pick.id}: ${pick.source}`)

  // rotate() with no argument applies EXIF orientation; sharp drops all
  // metadata (including GPS) unless asked to keep it.
  const upright = sharp(pick.source).rotate()
  const src = {}
  for (const w of WIDTHS) {
    const name = `${pick.id}-${w}.webp`
    const out = path.join(outDir, name)
    src[w] = name
    if ((await mtime(out)) > srcTime) continue
    await upright.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out)
    built++
  }
  const blurBuf = await upright.clone().resize({ width: 24 }).webp({ quality: 40 }).toBuffer()
  const { source, sharpness, ...rest } = pick
  photos.push({ ...rest, blur: `data:image/webp;base64,${blurBuf.toString('base64')}`, src })
}

await writeFile(path.join(root, '.private', 'photos.json'), JSON.stringify(photos))
console.log(`photos: ${photos.length}, files written: ${built}`)
