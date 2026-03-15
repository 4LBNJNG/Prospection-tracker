import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import SaisieRapide from './pages/SaisieRapide'
import Journal from './pages/Journal'
import Prospects from './pages/Prospects'
import Dashboard from './pages/Dashboard'
import FicheProspect from './pages/FicheProspect'
import AnalyseHoraire from './pages/AnalyseHoraire'
import AnalyseEntreprise from './pages/AnalyseEntreprise'
import KpiSemaine from './pages/KpiSemaine'
import Objectifs from './pages/Objectifs'
import SuiviMails from './pages/SuiviMails'

const NAV_GROUPS = [
  {
    label: 'Actions',
    items: [
      { to: '/',          icon: '⚡', label: 'Saisie Rapide' },
      { to: '/journal',   icon: '📋', label: 'Journal' },
      { to: '/prospects', icon: '👥', label: 'Prospects' },
      { to: '/mails',     icon: '✉️', label: 'Suivi Mails' },
    ]
  },
  {
    label: 'Analyses',
    items: [
      { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
      { to: '/fiche',      icon: '👤', label: 'Fiche Prospect' },
      { to: '/horaire',    icon: '⏰', label: 'Analyse Horaire' },
      { to: '/entreprise', icon: '🔎', label: 'Par Entreprise' },
      { to: '/semaine',    icon: '📅', label: 'KPI Semaine' },
    ]
  },
  {
    label: 'Pilotage',
    items: [
      { to: '/objectifs', icon: '🎯', label: 'Objectifs' },
    ]
  }
]

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 60 : 232

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#111318' }}>

        {/* Sidebar */}
        <nav style={{
          width: sidebarWidth, background: '#060d14', position: 'fixed',
          height: '100vh', zIndex: 100, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          transition: 'width 0.2s ease', overflow: 'hidden'
        }}>
          {/* Logo */}
          <div style={{ padding: collapsed ? '1.5rem 0.75rem' : '1.75rem 1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 80 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #2dd4bf 0%, #0891b2 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 16px rgba(45,212,191,0.35)', flexShrink: 0 }}>📞</div>
              {!collapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f0f4ff', whiteSpace: 'nowrap' }}>Prospection</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dd4bf', animation: 'dot-blink 2s ease-in-out infinite' }} />
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Synchronisé</span>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setCollapsed(c => !c)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem', flexShrink: 0, lineHeight: 1 }}>
              {collapsed ? '→' : '←'}
            </button>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: collapsed ? '0 0.5rem' : '0 0.75rem', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {NAV_GROUPS.map(({ label, items }) => (
              <div key={label}>
                {!collapsed && (
                  <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)', padding: '0 0.6rem', marginBottom: '0.4rem' }}>{label}</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {items.map(({ to, icon, label: lbl }) => (
                    <NavLink key={to} to={to} end={to === '/'}
                      title={collapsed ? lbl : undefined}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center',
                        gap: collapsed ? 0 : '0.65rem',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        padding: collapsed ? '0.65rem 0' : '0.55rem 0.75rem',
                        borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s',
                        background: isActive ? 'rgba(45,212,191,0.1)' : 'transparent',
                        color: isActive ? '#2dd4bf' : 'rgba(255,255,255,0.42)',
                        fontWeight: isActive ? 600 : 400, fontSize: '0.85rem',
                        borderLeft: isActive ? '2px solid #2dd4bf' : '2px solid transparent',
                        whiteSpace: 'nowrap',
                      })}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                      {!collapsed && lbl}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {!collapsed && (
            <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.12)', borderRadius: 10, padding: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2dd4bf', marginBottom: 3 }}>Supabase</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>Base de données connectée</div>
              </div>
            </div>
          )}
        </nav>

        {/* Main */}
        <main style={{ marginLeft: sidebarWidth, flex: 1, minHeight: '100vh', minWidth: 0, transition: 'margin-left 0.2s ease' }}>
          <Routes>
            <Route path="/" element={<SaisieRapide />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/prospects" element={<Prospects />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fiche" element={<FicheProspect />} />
            <Route path="/horaire" element={<AnalyseHoraire />} />
            <Route path="/entreprise" element={<AnalyseEntreprise />} />
            <Route path="/semaine" element={<KpiSemaine />} />
            <Route path="/objectifs" element={<Objectifs />} />
            <Route path="/mails" element={<SuiviMails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}