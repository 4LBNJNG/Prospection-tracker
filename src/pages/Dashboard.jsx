import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts'

const COLORS = ['#2ec4b6', '#38bdf8', '#fb7185', '#f0b429', '#a78bfa', '#4ade80', '#f97316', '#e879f9']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#d4dae8' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name} : <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('all')

  useEffect(() => { fetchStats() }, [period])

  const fetchStats = async () => {
    setLoading(true)
    let q = supabase.from('journal').select('*')
    if (period === 'week') { const d = new Date(); d.setDate(d.getDate() - 7); q = q.gte('date', d.toISOString().split('T')[0]) }
    else if (period === 'month') { const d = new Date(); d.setDate(d.getDate() - 30); q = q.gte('date', d.toISOString().split('T')[0]) }
    const { data: journal } = await q
    if (!journal) { setLoading(false); return }

    const total = journal.length
    const reponses = journal.filter(j => j.statut === 'Réponse').length
    const messageries = journal.filter(j => j.statut === 'Messagerie').length
    const pasRepondu = journal.filter(j => j.statut === 'Pas répondu').length
    const rdv = journal.filter(j => j.rdv_pris).length
    const tauxReponse = total ? ((reponses / total) * 100).toFixed(1) : 0
    const tauxRdv = total ? ((rdv / total) * 100).toFixed(1) : 0

    const statutData = [
      { name: 'Réponse', value: reponses },
      { name: 'Messagerie', value: messageries },
      { name: 'Pas répondu', value: pasRepondu },
      { name: 'Autres', value: total - reponses - messageries - pasRepondu },
    ].filter(d => d.value > 0)

    const byEnt = {}
    journal.forEach(j => { if (j.entreprise) byEnt[j.entreprise] = (byEnt[j.entreprise] || 0) + 1 })
    const topEntreprises = Object.entries(byEnt).sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, appels]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, appels }))

    const byDay = {}
    const last14 = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0] }).reverse()
    last14.forEach(d => byDay[d] = { appels: 0, reponses: 0 })
    journal.forEach(j => { if (byDay[j.date]) { byDay[j.date].appels++; if (j.statut === 'Réponse') byDay[j.date].reponses++ } })
    const parJour = last14.map(d => ({ date: new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), ...byDay[d] }))

    const byHour = {}
    journal.forEach(j => {
      if (j.heure) {
        const h = parseInt(j.heure.split(':')[0])
        if (!byHour[h]) byHour[h] = { appels: 0, reponses: 0 }
        byHour[h].appels++
        if (j.statut === 'Réponse') byHour[h].reponses++
      }
    })
    const creneaux = Object.entries(byHour).sort((a, b) => a[0] - b[0])
      .map(([h, v]) => ({ creneau: `${h}h`, ...v }))

    // Objections
    const byObjection = {}
    journal.forEach(j => {
      if (j.objection && j.objection !== 'Aucune') {
        byObjection[j.objection] = (byObjection[j.objection] || 0) + 1
      }
    })
    const objections = Object.entries(byObjection)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, value }))

    setStats({ total, reponses, rdv, tauxReponse, tauxRdv, statutData, topEntreprises, parJour, creneaux, objections })
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">Dashboard <em>KPI</em></h1>
          <p className="subtitle">Vue d'ensemble de ton activité prospection</p>
        </div>
        <div className="tab-group">
          {[['all', 'Tout'], ['week', '7j'], ['month', '30j']].map(([v, l]) => (
            <button key={v} className={`tab-btn ${period === v ? 'active' : ''}`} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>Chargement...</div>
      ) : stats && <>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-label">Appels passés</div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-sub">total enregistrés</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Taux de réponse</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>{stats.tauxReponse}%</div>
            <div className="kpi-sub">{stats.reponses} réponses obtenues</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">RDV décrochés</div>
            <div className="kpi-value" style={{ color: 'var(--gold)' }}>{stats.rdv}</div>
            <div className="kpi-sub">{stats.tauxRdv}% des appels</div>
          </div>
        </div>

        {/* Activité + Statuts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div className="section-title-line"><span>Activité — 14 derniers jours</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.parJour}>
                <defs>
                  <linearGradient id="gAppels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ec4b6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2ec4b6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gRep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="appels" stroke="#2ec4b6" strokeWidth={2} fill="url(#gAppels)" name="Appels" dot={false} />
                <Area type="monotone" dataKey="reponses" stroke="#4ade80" strokeWidth={2} fill="url(#gRep)" name="Réponses" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="section-title-line"><span>Statuts</span></div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.statutData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} dataKey="value" paddingAngle={4} strokeWidth={0}>
                  {stats.statutData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-3)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top entreprises + Créneaux */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div className="section-title-line"><span>Top entreprises</span></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.topEntreprises} layout="vertical" barSize={10}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-2)' }} width={120} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appels" fill="#2ec4b6" radius={[0, 6, 6, 0]} background={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="section-title-line"><span>Créneaux horaires</span></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.creneaux} barSize={12} barGap={2}>
                <XAxis dataKey="creneau" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="appels" fill="rgba(46,196,182,0.35)" radius={[4, 4, 0, 0]} name="Appels" />
                <Bar dataKey="reponses" fill="#2ec4b6" radius={[4, 4, 0, 0]} name="Réponses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Objections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="section-title-line"><span>Objections les plus fréquentes</span></div>
            {stats.objections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>Aucune objection enregistrée</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.objections} layout="vertical" barSize={10}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-2)' }} width={150} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Occurrences" fill="#e06c75" radius={[0, 6, 6, 0]} background={{ fill: 'rgba(255,255,255,0.03)', radius: 6 }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="section-title-line"><span>Répartition des objections</span></div>
            {stats.objections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-3)', fontSize: '0.875rem' }}>Aucune objection enregistrée</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.objections} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                      {stats.objections.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {stats.objections.map((o, i) => {
                    const total = stats.objections.reduce((s, x) => s + x.value, 0)
                    const pct = total ? ((o.value / total) * 100).toFixed(1) : 0
                    return (
                      <div key={o.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-2)', flex: 1 }}>{o.name}</span>
                        <span style={{ color: 'var(--text-3)', fontWeight: 600 }}>{o.value}</span>
                        <span style={{ color: 'var(--text-3)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </>}
    </div>
  )
}