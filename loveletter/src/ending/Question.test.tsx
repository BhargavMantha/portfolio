import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Question } from './Question'

afterEach(cleanup)

const non = () => screen.getByTestId('non')

describe('Question', () => {
  it('offers Oui as the only reachable answer', () => {
    render(<Question onOui={() => {}} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Oui'])
    expect(non().getAttribute('tabindex')).toBe('-1')
    expect(non().getAttribute('aria-hidden')).toBe('true')
  })

  it('says yes when Oui is pressed', () => {
    const onOui = vi.fn()
    render(<Question onOui={onOui} />)
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }))
    expect(onOui).toHaveBeenCalledTimes(1)
  })

  it('moves Non away when a finger or cursor reaches it, and nothing else happens', () => {
    const onOui = vi.fn()
    render(<Question onOui={onOui} />)
    const before = non().style.transform
    fireEvent.pointerDown(non(), { clientX: 10, clientY: 10 })
    fireEvent.click(non())
    expect(non().style.transform).not.toBe(before)
    expect(onOui).not.toHaveBeenCalled()
    expect(non().textContent).toBe('Non')
  })

  it('also runs from keyboard focus', () => {
    render(<Question onOui={() => {}} />)
    const before = non().style.transform
    fireEvent.focus(non())
    expect(non().style.transform).not.toBe(before)
  })

  it('turns Non into a second Oui after five escapes', () => {
    const onOui = vi.fn()
    render(<Question onOui={onOui} />)
    for (let i = 0; i < 6; i++) fireEvent.pointerEnter(non(), { clientX: 10, clientY: 10 })
    expect(non().textContent).toBe('Oui')
    expect(non().getAttribute('aria-hidden')).toBeNull()
    fireEvent.click(non())
    expect(onOui).toHaveBeenCalledTimes(1)
  })
})
