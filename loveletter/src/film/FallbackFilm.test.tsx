import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeManifest } from '../content/manifest'
import { photo, words } from '../test/fixtures'
import { FallbackFilm } from './FallbackFilm'

afterEach(cleanup)

const quiet = photo('quiet-01', { chapter: 'quiet', focal: [0.4, 0.45] })
const resolve = vi.fn(async (p: { id: string }) => `blob:${p.id}`)
const props = { words, onOui: () => {}, resolve, eager: true }

describe('FallbackFilm', () => {
  it('plays all seven chapters in order as one page', () => {
    render(<FallbackFilm {...props} m={makeManifest([])} />)
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(['A to B', 'The quiet world', 'La lumière', 'Seven colours', 'Home', '1,461 days', 'Épilogue'])
  })

  it('shows the blurred placeholder first, then the decrypted photo, keeping the focal point', async () => {
    render(<FallbackFilm {...props} m={makeManifest([quiet])} />)
    const img = screen.getByAltText('') as HTMLImageElement
    expect(img.getAttribute('src')).toBe(quiet.blur)
    expect(img.style.objectPosition).toBe('40% 45%')
    expect(img.getAttribute('width')).toBe('3000')
    expect(img.getAttribute('height')).toBe('2000')
    await waitFor(() => expect(img.getAttribute('src')).toBe('blob:quiet-01'))
  })

  it('keeps the placeholder if a photo cannot be loaded', async () => {
    const failing = vi.fn(async () => {
      throw new Error('offline')
    })
    render(<FallbackFilm {...props} resolve={failing} m={makeManifest([quiet])} />)
    await waitFor(() => expect(failing).toHaveBeenCalled())
    expect((screen.getByAltText('') as HTMLImageElement).getAttribute('src')).toBe(quiet.blur)
  })

  it('shows the day count without animation', () => {
    render(<FallbackFilm {...props} m={makeManifest([])} />)
    expect(screen.getByText('1,461')).toBeTruthy()
  })

  it('ends on the question', () => {
    const onOui = vi.fn()
    render(<FallbackFilm {...props} onOui={onOui} m={makeManifest([])} />)
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }))
    expect(onOui).toHaveBeenCalled()
  })
})
