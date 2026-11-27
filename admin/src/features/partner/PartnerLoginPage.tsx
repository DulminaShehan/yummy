import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Store, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export const PartnerLoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please provide both your registered partner email and password.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await signIn(email, password)
      if (res.success) {
        navigate('/partner')
      } else {
        setError(res.error || 'Invalid restaurant partner credentials.')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0b132b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundImage: 'radial-gradient(ellipse at 50% 20%, #1c2541 0%, #0b132b 80%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Banner */}
        <div
          style={{
            backgroundColor: '#1565C0',
            padding: '2.5rem 2rem 2rem',
            textAlign: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#1565C0',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Store size={30} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.35rem', letterSpacing: '-0.02em' }}>
            YUMMY Partner Portal
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
            Restaurant Order, Menu & Kitchen Management
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 8,
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                fontSize: '0.85rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                Partner Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="restaurant@yummy.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.5rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: 8,
                backgroundColor: '#1565C0',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(21, 101, 192, 0.3)',
              }}
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign in to Partner Portal'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <Link
              to="/login"
              style={{
                fontSize: '0.85rem',
                color: '#64748b',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Platform Administrator? Sign in to Admin Panel &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
