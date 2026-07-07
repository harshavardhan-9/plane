import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { saveAuth } from '../../store/auth'

const inputStyle: React.CSSProperties = {
  height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

const socialBtnStyle: React.CSSProperties = {
  height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--bg-surface-1)',
  color: 'var(--txt-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
}

const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isPassword = step === 'password'

  const handleContinue = async () => {
    if (step === 'email') {
      if (!validEmail(email)) { setError('Please enter a valid email address.'); return }
      setStep('password'); setError(null)
      return
    }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError(null); setLoading(true)
    try {
      const data = await login({ email, password })
      saveAuth(data.accessToken, data.refreshToken, data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sign in failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleContinue() }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--txt-primary)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/plane-logo.png" alt="Plane" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Plane</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          New to Plane?
          <Link to="/register" style={{ fontWeight: 500 }}>Create an account</Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {isPassword ? 'Welcome back' : 'Sign in to Plane'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>
              {isPassword ? `Enter the password for ${email}` : 'Track work, run cycles and ship — all in one place.'}
            </div>
          </div>

          {/* Email step */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Email</label>
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); setStep('email') }}
                onKeyDown={onKey}
                placeholder="name@company.com"
                type="email"
                style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
              />
            </div>

            {isPassword && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Password</label>
                <input
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null) }}
                  onKeyDown={onKey}
                  placeholder="Enter your password"
                  type="password"
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
                  <a href="#" style={{ fontSize: 12, fontWeight: 500 }}>Forgot your password?</a>
                </div>
              </div>
            )}

            {error && (
              <div style={{ fontSize: 12, color: 'var(--danger-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', width: 13, height: 13 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: '100%', height: '100%' }}>
                    <path d="M12 3 a9 9 0 1 1 0 18 a9 9 0 0 1 0 -18 z M12 8v4 M12 16h.01" />
                  </svg>
                </span>
                {error}
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={loading}
              className="hov-accent"
              style={{ height: 44, borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : isPassword ? 'Sign in' : 'Continue'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)' }} />
            <span style={{ fontSize: 12, color: 'var(--txt-placeholder)' }}>or continue with</span>
            <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)' }} />
          </div>

          {/* Social */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="hov-layer" style={socialBtnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.14-4.06 1.14-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.29 14.28A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.28V6.62H1.29a12 12 0 0 0 0 10.76l4-3.1z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l4 3.1C6.23 6.88 8.88 4.77 12 4.77z" />
              </svg>
              Continue with Google
            </button>
            <button className="hov-layer" style={socialBtnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.1 11.1 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.04.77 2.1v3.11c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
              </svg>
              Continue with GitHub
            </button>
          </div>

          {/* Terms */}
          <div style={{ fontSize: 11, color: 'var(--txt-placeholder)', lineHeight: 1.6, textAlign: 'center' }}>
            By continuing you agree to the <a href="#" style={{ color: 'var(--txt-tertiary)', textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--txt-tertiary)', textDecoration: 'underline' }}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  )
}
