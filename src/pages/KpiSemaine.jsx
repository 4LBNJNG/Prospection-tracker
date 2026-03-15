import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const getWeek = date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#d4dae8' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name} : <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function KpiSemaine() {
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(String(getWeek(new Date())))
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [weeklyData, setWeeklyData] = useState([])

  useEffect(() => {
    supabase.from('journal').select('*').then(({ data }) => {
      setJournal(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!journal.length) return
    const semaines = {}
    journal.forEach(j => {
      if (!j.date) return
      const d = new Date(j.date)
      const w = getWeek(j.date)
      const y = d.getFullYear()
      const key = `S${w}`
      if (!semaines[key]) semaines[key] = { label: key, semaine: w, annee: y, appels: 0, reponses: 0, rdv: 0 }
      semaines[key].appels++
      if (j.statut === 'Réponse') semaines[key].reponses++
      if (j.rdv_pris) semaines[key].rdv++
    })
    setWeeklyData(Object.values(semaines).sort((a, b) => a.annee !== b.annee ? a.annee - b.annee : a.semaine - b.semaine).slice(-12))
  }, [journal])

  const semaineData = journal.filter(j => {
    if (!j.date) return false
    const d = new Date(j.date)
    return getWeek(j.date) === parseInt(selectedWeek) && d.getFullYear() === parseInt(selectedYear)
  })

  const total = semaineData.length
  const reponses = semaineData.filter(j => j.statut === 'Réponse').length
  const rdv = semaineData.filter(j => j.rdv_pris).length
  const messageries = semaineData.filter(j => j.statut === 'Messagerie').length
  const tauxReponse = total ? ((reponses / total) * 100).toFixed(1) : 0

  const byEnt = {}
  semaineData.forEach(j => { if (j.entreprise) byEnt[j.entreprise] = (byEnt[j.entreprise] || 0) + 1 })
  const topEnt = Object.entries(byEnt).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, appels]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, appels }))

  const annees = [...new Set(journal.map(j => j.date ? new Date(j.date).getFullYear() : null).filter(Boolean))].sort()
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const statutClass = s => {
    if (s === 'Réponse') return 'badge badge-green'
    if (s === 'Messagerie') return 'badge badge-yellow'
    if (s === 'Pas répondu') return 'badge badge-red'
    return 'badge badge-slate'
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">KPI par <em>Semaine</em></h1>
          <p className="subtitle">Suivi hebdomadaire de l'activité</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="select" style={{ maxWidth: 160 }} value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}>
            {[...Array(53)].map((_, i) => <option key={i + 1} value={i + 1}>Semaine {i + 1}</option>)}
          </select>
          <select className="select" style={{ maxWidth: 100 }} value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
            {annees.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>Chargement...</div> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-label">Appels passés</div>
            <div className="kpi-value">{total}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Réponses</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>{reponses}</div>
            <div className="kpi-sub">{tauxReponse}% de taux</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Messageries</div>
            <div className="kpi-value" style={{ color: 'var(--gold)' }}>{messageries}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">RDV décrochés</div>
            <div className="kpi-value" style={{ color: 'var(--violet)' }}>{rdv}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div className="section-title-line"><span>Évolution sur 12 semaines</span></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barSize={12} barGap={2}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-3)' }} />
                <Bar dataKey="appels" name="Appels" fill="rgba(46,196,182,0.3)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reponses" name="Réponses" fill="#2ec4b6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rdv" name="RDV" fill="#9d85e8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="section-title-line"><span>Top entreprises cette semaine</span></div>
            {topEnt.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topEnt} layout="vertical" barSize={10}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-2)' }} width={130} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="appels" fill="#2ec4b6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '3rem' }}>Aucun appel cette semaine</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title-line" style={{ marginBottom: 0 }}><span>Détail semaine {selectedWeek} · {selectedYear}</span></div>
          </div>
          {semaineData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Aucun appel cette semaine</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>{['Date', 'Contact', 'Entreprise', 'Statut', 'RDV', 'Commentaire', 'Next Step'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {semaineData.map(j => (
                  <tr key={j.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8rem' }}>{formatDate(j.date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{j.nom_contact}</td>
                    <td style={{ color: 'var(--text-2)' }}>{j.entreprise}</td>
                    <td><span className={statutClass(j.statut)}>{j.statut}</span></td>
                    <td>{j.rdv_pris ? <span className="badge badge-teal">✓</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)', fontStyle: 'italic' }}>{j.commentaire || '—'}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 500, fontSize: '0.82rem' }}>{j.next_step || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>}
    </div>
  )
}