import { useState, type FormEvent } from 'react'

type Props = {
  /** Tries a name and password. Resolves false if they are wrong; rejects if the content could not be fetched. */
  attempt: (name: string, password: string) => Promise<boolean>
  onOpen: () => void
}

/** The door. Photos and words stay encrypted until the right name and password are given. */
export function Login({ attempt, onOpen }: Props) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (busy || !name.trim() || !password) return
    setBusy(true)
    setError('')
    try {
      if (await attempt(name.trim(), password)) return onOpen()
      setError('Not quite. Try once more?')
    } catch {
      setError('Could not reach the letter. Check the connection and try again.')
    }
    setBusy(false)
  }

  return (
    <main className="screen login">
      <h1>
        A <span>to</span> B
      </h1>
      <p className="screen__hint">This one is private.</p>
      <form onSubmit={submit} noValidate>
        <label>
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <button type="submit" className="btn btn--oui" disabled={busy}>
          {busy ? 'Opening…' : 'Open'}
        </button>
        <p className="login__error" role={error ? 'alert' : undefined}>
          {error}
        </p>
      </form>
    </main>
  )
}
