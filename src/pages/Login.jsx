import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) return setError('Remplis tous les champs')
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email ou mot de passe incorrect')
    else onLogin()
  }

  const handleKey = e => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div style={{
      minHeight: '100vh', background: '#111318',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #2dd4bf 0%, #0891b2 100%)',
            borderRadius: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1.6rem',
            boxShadow: '0 8px 24px rgba(45,212,191,0.35)',
            margin: '0 auto 1.25rem'
          }}>📞</div>
          <h1 style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: '2rem', fontWeight: 400,
            color: '#d4dae8', letterSpacing: '-0.02em', lineHeight: 1.1
          }}>
            Prospection <em style={{ fontStyle: 'italic', color: '#2ec4b6' }}>CRM</em>
          </h1>
          <p style={{ color: '#4a5568', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Connecte-toi pour accéder à ton espace
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1e2330', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          {error && (
            <div style={{
              background: 'rgba(224,108,117,0.1)', border: '1px solid rgba(224,108,117,0.25)',
              borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '1.25rem',
              color: '#e06c75', fontSize: '0.875rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#7d8ba0', marginBottom: 6 }}>
                Adresse email
              </label>
              <input
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: '#1c2028', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, fontSize: '0.9rem', color: '#d4dae8',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
                type="email" placeholder="ton@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKey}
                onFocus={e => e.target.style.borderColor = '#2ec4b6'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#7d8ba0', marginBottom: 6 }}>
                Mot de passe
              </label>
              <input
                style={{
                  width: '100%', padding: '0.75rem 1rem',
                  background: '#1c2028', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10, fontSize: '0.9rem', color: '#d4dae8',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                onFocus={e => e.target.style.borderColor = '#2ec4b6'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit} disabled={loading}
            style={{
              width: '100%', marginTop: '1.5rem',
              padding: '0.85rem', background: '#2ec4b6', color: '#0e1a1f',
              border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(46,196,182,0.3)'
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#3dd6c8' }}
            onMouseLeave={e => { e.target.style.background = '#2ec4b6' }}
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: '#4a5568' }}>
          Accès restreint — usage interne uniquement
        </p>
      </div>
    </div>
  )
}