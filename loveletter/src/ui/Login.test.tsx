import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Login } from './Login'

afterEach(cleanup)

const fill = (name: string, password: string) => {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Open' }))
}

describe('Login', () => {
  it('hands the name and password to be tried, and reports success', async () => {
    const attempt = vi.fn(async () => true)
    const onOpen = vi.fn()
    render(<Login attempt={attempt} onOpen={onOpen} />)
    fill('aTob', 'secret')
    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
    expect(attempt).toHaveBeenCalledWith('aTob', 'secret')
  })

  it('says so gently when they are wrong, and lets her try again', async () => {
    const attempt = vi.fn(async () => false)
    const onOpen = vi.fn()
    render(<Login attempt={attempt} onOpen={onOpen} />)
    fill('aTob', 'nope')
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(onOpen).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: 'Open' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('explains a network failure differently from a wrong password', async () => {
    const attempt = vi.fn(async () => {
      throw new Error('offline')
    })
    render(<Login attempt={attempt} onOpen={() => {}} />)
    fill('aTob', 'secret')
    expect((await screen.findByRole('alert')).textContent).toMatch(/connection/i)
  })

  it('does not submit empty fields', () => {
    const attempt = vi.fn(async () => true)
    render(<Login attempt={attempt} onOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(attempt).not.toHaveBeenCalled()
  })

  it('never puts the password in a visible field', () => {
    render(<Login attempt={async () => true} onOpen={() => {}} />)
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password')
  })
})
