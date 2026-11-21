// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { deriveKey, exportKey, importKey, open, seal } from './vault'

const salt = 'c2FsdHNhbHRzYWx0c2FsdA=='
// Few iterations keep the tests fast; production uses the count stored beside the content.
const ITER = 1000
const text = (s: string) => new TextEncoder().encode(s)
const latin = (b: Uint8Array) => Array.from(b, (c) => String.fromCharCode(c)).join('')

describe('vault', () => {
  it('opens what it sealed with the same name and password', async () => {
    const key = await deriveKey('aTob', 'correct horse', salt, ITER)
    const sealed = await seal(key, text('a private line'))
    expect(new TextDecoder().decode(await open(key, sealed))).toBe('a private line')
  })

  it('does not contain the plain text', async () => {
    const key = await deriveKey('aTob', 'correct horse', salt, ITER)
    const sealed = await seal(key, text('a private line of text'))
    expect(latin(sealed).includes('private')).toBe(false)
  })

  it('seals the same data differently each time', async () => {
    const key = await deriveKey('aTob', 'correct horse', salt, ITER)
    const a = await seal(key, text('x'))
    const b = await seal(key, text('x'))
    expect(latin(a)).not.toBe(latin(b))
  })

  it('refuses a wrong password', async () => {
    const sealed = await seal(await deriveKey('aTob', 'correct horse', salt, ITER), text('x'))
    await expect(open(await deriveKey('aTob', 'wrong horse', salt, ITER), sealed)).rejects.toThrow()
  })

  it('refuses a wrong name', async () => {
    const sealed = await seal(await deriveKey('aTob', 'correct horse', salt, ITER), text('x'))
    await expect(open(await deriveKey('atob', 'correct horse', salt, ITER), sealed)).rejects.toThrow()
  })

  it('refuses data that was tampered with or cut short', async () => {
    const key = await deriveKey('aTob', 'correct horse', salt, ITER)
    const sealed = await seal(key, text('hello'))
    sealed[sealed.length - 1] ^= 1
    await expect(open(key, sealed)).rejects.toThrow()
    await expect(open(key, sealed.slice(0, 8))).rejects.toThrow()
  })

  it('survives being saved for the session and restored', async () => {
    const key = await deriveKey('aTob', 'correct horse', salt, ITER)
    const sealed = await seal(key, text('again'))
    const restored = await importKey(await exportKey(key))
    expect(new TextDecoder().decode(await open(restored, sealed))).toBe('again')
  })
})
