import { useEffect, useState } from 'react'
import './auth.css'

const adminEmail = 'raghavsanoriya2012@gmail.com'

async function request(path, options = {}) {
  const response = await fetch(`/api/auth/${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const type = response.headers.get('content-type') || ''
  const payload = type.includes('application/json') ? await response.json() : { error: 'The administrator service is not active on this deployment.' }
  if (!response.ok) throw new Error(payload.error || 'Authentication failed.')
  return payload
}

export default function AdminAuthGate({ children }) {
  const setupToken = new URLSearchParams(window.location.search).get('setup') || ''
  const [state, setState] = useState({ loading: true, user: null, csrfToken: '' })
  const [mode, setMode] = useState(setupToken ? 'setup' : 'login')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    request('session').then(payload => setState({ loading: false, user: payload.user, csrfToken: payload.csrfToken }))
      .catch(() => setState({ loading: false, user: null, csrfToken: '' }))
  }, [])

  useEffect(() => {
    const logout = () => request('logout', { method: 'POST', body: '{}', headers: { 'X-CSRF-Token': state.csrfToken } }).catch(() => {}).finally(() => setState({ loading: false, user: null, csrfToken: '' }))
    window.addEventListener('gss:logout', logout)
    return () => window.removeEventListener('gss:logout', logout)
  }, [state.csrfToken])

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'request') {
        const payload = await request('request-setup', { method: 'POST', body: JSON.stringify({ email: adminEmail }) })
        setMessage(payload.message)
      } else if (mode === 'setup') {
        if (password !== confirmation) throw new Error('The passwords do not match.')
        const payload = await request('set-password', { method: 'POST', body: JSON.stringify({ token: setupToken, password }) })
        window.history.replaceState({}, '', '/admin')
        setState({ loading: false, user: payload.user, csrfToken: payload.csrfToken })
      } else {
        const payload = await request('login', { method: 'POST', body: JSON.stringify({ email: adminEmail, password }) })
        setState({ loading: false, user: payload.user, csrfToken: payload.csrfToken })
      }
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  if (state.loading) return <main className="gss-auth-page" aria-busy="true"><div className="gss-auth-card"><p>Checking administrator access…</p></div></main>
  if (state.user?.role === 'administrator') return children

  return <main className="gss-auth-page"><section className="gss-auth-card" aria-labelledby="admin-access-title"><a className="gss-auth-brand" href="/"><strong>GSS</strong><span>The Global School of Skills</span></a><span className="gss-auth-kicker">Secure administrator access</span><h1 id="admin-access-title">{mode === 'setup' ? 'Create your password' : mode === 'request' ? 'Activate administrator account' : 'Welcome back'}</h1><p>{mode === 'setup' ? 'Choose a strong password to activate your Administrator role.' : mode === 'request' ? 'We will email a one-time password setup link to the authorized administrator.' : 'Sign in to manage courses, content and admissions.'}</p><form onSubmit={submit}>{mode !== 'setup' && <label><span>Administrator email</span><input type="email" value={adminEmail} readOnly /></label>}{mode !== 'request' && <label><span>Password</span><input type="password" autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /></label>}{mode === 'setup' && <label><span>Confirm password</span><input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}{error && <p className="gss-auth-error" role="alert">{error}</p>}{message && <p className="gss-auth-success" role="status">{message}</p>}<button type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'setup' ? 'Activate account' : mode === 'request' ? 'Send setup link' : 'Sign in'}</button></form>{mode !== 'setup' && <button className="gss-auth-link" type="button" onClick={() => { setMode(mode === 'request' ? 'login' : 'request'); setError(''); setMessage('') }}>{mode === 'request' ? 'Return to sign in' : 'First time here? Activate account'}</button>}<small>Protected by an encrypted, HTTP-only server session.</small></section></main>
}
