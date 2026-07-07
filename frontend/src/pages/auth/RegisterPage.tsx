import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../../api/auth'
import { saveAuth } from '../../store/auth'

const inputStyle: React.CSSProperties = {
  height: 40, padding: '0 12px', borderRadius: 6, border: '1px solid var(--border-strong)',
  background: 'var(--bg-surface-1)', color: 'var(--txt-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError(null); setLoading(true)
    try {
      const data = await register(form)
      saveAuth(data.accessToken, data.refreshToken, data.user)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }
  const focusProps = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border-strong)' },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--txt-primary)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/plane-logo.png" alt="Plane" style={{ width: 26, height: 26, borderRadius: 6 }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>Plane</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Already have an account?
          <Link to="/login" style={{ fontWeight: 500 }}>Sign in</Link>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>Create your account</div>
            <div style={{ fontSize: 13, color: 'var(--txt-tertiary)', lineHeight: 1.5 }}>
              Track work, run cycles and ship — all in one place.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Full name</label>
              <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setError(null) }} onKeyDown={onKey} placeholder="Your name" style={inputStyle} {...focusProps} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Email</label>
              <input value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setError(null) }} onKeyDown={onKey} placeholder="name@company.com" type="email" style={inputStyle} {...focusProps} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt-tertiary)' }}>Password</label>
              <input value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setError(null) }} onKeyDown={onKey} placeholder="Min. 8 characters" type="password" style={inputStyle} {...focusProps} />
            </div>

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
              onClick={handleSubmit}
              disabled={loading}
              className="hov-accent"
              style={{ height: 44, borderRadius: 6, border: 'none', background: 'var(--accent-primary)', color: 'var(--txt-on-color)', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
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
