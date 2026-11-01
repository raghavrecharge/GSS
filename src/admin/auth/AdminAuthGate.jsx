import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import './auth.css'
import './auth-geic.css'

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

const slides = [
  ['/assets/img/hero/hero-2.jpg', 'Turn ambitious learning into global opportunity.', 'Manage programmes, learner enquiries and website content from one secure workspace.'],
  ['/assets/img/case-study/cs-2.jpg', 'Guide every learner with clarity.', 'Coordinate admissions, applications and academic pathways from enquiry to enrolment.'],
  ['/assets/img/case-study/cs-3.jpg', 'Keep your global catalogue accurate.', 'Publish programme, university and country information through a structured content workflow.'],
]

export default function AdminAuthGate({ children, loginPage = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  const setupToken = new URLSearchParams(location.search).get('setup') || ''
  const [state, setState] = useState({ loading: true, user: null, csrfToken: '' })
  const [mode, setMode] = useState(setupToken ? 'setup' : 'login')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    request('session').then(payload => setState({ loading: false, user: payload.user, csrfToken: payload.csrfToken }))
      .catch(() => setState({ loading: false, user: null, csrfToken: '' }))
  }, [])

  useEffect(() => {
    const logout = () => request('logout', { method: 'POST', body: '{}', headers: { 'X-CSRF-Token': state.csrfToken } }).catch(() => {}).finally(() => setState({ loading: false, user: null, csrfToken: '' }))
    window.addEventListener('gss:logout', logout)
    return () => window.removeEventListener('gss:logout', logout)
  }, [state.csrfToken])

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (reduced?.matches) return undefined
    const timer = window.setInterval(() => setSlide(current => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [])

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
        navigate('/admin', { replace: true })
      }
    } catch (failure) { setError(failure.message) } finally { setBusy(false) }
  }

  if (state.loading) return <main className="gss-auth-page" aria-busy="true"><div className="gss-auth-loader"><span /><p>Checking administrator access…</p></div></main>
  if (state.user?.role === 'administrator') return loginPage ? <Navigate to="/admin" replace /> : children
  if (!loginPage && !setupToken && location.pathname !== '/admin/login') return <Navigate to="/admin/login" replace />

  const title = mode === 'setup' ? 'Create your GSS password' : mode === 'request' ? 'Activate your administrator account' : 'Welcome back to GSS'
  const intro = mode === 'setup' ? 'Choose a strong password to activate your administrator workspace.' : mode === 'request' ? 'We will email a single-use setup link to the authorized administrator.' : 'Sign in to manage learner enquiries, programmes and website content securely.'

  return <main className="gss-auth-page"><section className="gss-auth-visual" aria-label="Global learning and programme management">
    {slides.map(([image], index) => <div className={`gss-auth-slide${slide === index ? ' is-active' : ''}`} style={{ backgroundImage: `url(${image})` }} key={image} />)}
    <a className="gss-auth-brand" href="/" aria-label="Return to the GSS website"><img src="/assets/img/global-school-of-skills.svg" alt="The Global School of Skills" /></a>
    <div className="gss-auth-quote"><p>{slides[slide][1]}</p><span>{slides[slide][2]}</span><div role="group" aria-label="Learning image slides">{slides.map(([, heading], index) => <button type="button" aria-label={`Show ${heading}`} aria-pressed={slide === index} onClick={() => setSlide(index)} key={heading} />)}</div></div>
  </section><section className="gss-auth-form-pane" aria-labelledby="admin-access-title"><div className="gss-auth-card">
    <span className="gss-auth-kicker">Secure administrator access</span><h1 id="admin-access-title">{title}</h1><p className="gss-auth-intro">{intro}</p>
    {error && <div className="gss-auth-error" role="alert"><i className="ph ph-warning-circle" aria-hidden="true" /><span>{error}</span></div>}
    {message && <div className="gss-auth-success" role="status"><i className="ph ph-check-circle" aria-hidden="true" /><span>{message}</span></div>}
    <form onSubmit={submit}>
      {mode !== 'setup' && <label className="gss-auth-field"><span>Email address</span><input type="email" value={adminEmail} readOnly autoComplete="email" /></label>}
      {mode !== 'request' && <label className="gss-auth-field"><span>Password</span><input type={passwordVisible ? 'text' : 'password'} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} minLength={12} required value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)}><i className={`ph ${passwordVisible ? 'ph-eye-slash' : 'ph-eye'}`} aria-hidden="true" /></button></label>}
      {mode === 'setup' && <label className="gss-auth-field"><span>Confirm password</span><input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>}
      <button className="gss-auth-submit" type="submit" disabled={busy}><span>{busy ? 'Please wait…' : mode === 'setup' ? 'Activate account' : mode === 'request' ? 'Send setup link' : 'Log in'}</span><i className="ph ph-arrow-right" aria-hidden="true" /></button>
    </form>
    {mode !== 'setup' && <button className="gss-auth-link" type="button" onClick={() => { setMode(mode === 'request' ? 'login' : 'request'); setError(''); setMessage('') }}>{mode === 'request' ? 'Return to sign in' : 'First time here? Activate account'}</button>}
    <div className="gss-auth-divider">OR</div><div className="gss-auth-secure"><i className="ph ph-lock-key" aria-hidden="true" /> Protected administrator access</div><a className="gss-auth-back" href="/">Back to public website</a>
  </div></section></main>
}
