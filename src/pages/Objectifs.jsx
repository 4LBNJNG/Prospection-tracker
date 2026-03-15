import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'

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

export default function Objectifs() {
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)
  const [objectifs, setObjectifs] = useState({ id: null, appels_semaine: 50, reponses_semaine: 10, rdv_semaine: 2, appels_mois: 200, reponses_mois: 40, rdv_mois: 8 })
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('journal').select('*').order('date'),
      supabase.from('objectifs').select('*').limit(1).single()
    ]).then(([{ data: j }, { data: o }]) => {
      setJournal(j || [])
      if (o) setObjectifs(o)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { id, ...data } = objectifs
    if (id) await supabase.from('objectifs').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
    else {
      const { data: ins } = await supabase.from('objectifs').insert([data]).select().single()
      if (ins) setObjectifs(ins)
    }
    setSaving(false); setSaved(true); setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const now = new Date()
  const currentWeek = getWeek(now)
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const semaineData = journal.filter(j => j.date && getWeek(j.date) === currentWeek && new Date(j.date).getFullYear() === currentYear)
  const moisData = journal.filter(j => j.date && new Date(j.date).getMonth() === currentMonth && new Date(j.date).getFullYear() === currentYear)

  const calcStats = data => ({
    appels: data.length,
    reponses: data.filter(j => j.statut === 'Réponse').length,
    rdv: data.filter(j => j.rdv_pris).length,
    taux: data.length ? ((data.filter(j => j.statut === 'Réponse').length / data.length) * 100).toFixed(1) : 0,
  })

  const statsSemaine = calcStats(semaineData)
  const statsMois = calcStats(moisData)

  const semaines = {}
  journal.forEach(j => {
    if (!j.date) return
    const d = new Date(j.date); const w = getWeek(j.date); const y = d.getFullYear()
    const key = `S${w}`
    if (!semaines[key]) semaines[key] = { label: key, semaine: w, annee: y, appels: 0, reponses: 0, rdv: 0 }
    semaines[key].appels++
    if (j.statut === 'Réponse') semaines[key].reponses++
    if (j.rdv_pris) semaines[key].rdv++
  })
  const evolutionData = Object.values(semaines)
    .sort((a, b) => a.annee !== b.annee ? a.annee - b.annee : a.semaine - b.semaine)
    .slice(-12)

  const pct = (val, obj) => Math.min(100, Math.round((val / obj) * 100))

  const ProgressBar = ({ value, objectif }) => {
    const p = pct(value, objectif)
    const color = p >= 100 ? 'var(--green)' : p >= 70 ? 'var(--gold)' : 'var(--rose)'
    return (
      <div className="progress-wrap">
        <div className="progress-header">
          <span>{value} / {objectif}</span>
          <span style={{ fontWeight: 700, color }}>{p}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${p}%`, background: color }} />
        </div>
      </div>
    )
  }

  const ObjCard = ({ label, value, objectif, color }) => (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <ProgressBar value={value} objectif={objectif} />
    </div>
  )

  const fields = [
    { key: 'appels_semaine', label: 'Appels / semaine' },
    { key: 'reponses_semaine', label: 'Réponses / semaine' },
    { key: 'rdv_semaine', label: 'RDV / semaine' },
    { key: 'appels_mois', label: 'Appels / mois' },
    { key: 'reponses_mois', label: 'Réponses / mois' },
    { key: 'rdv_mois', label: 'RDV / mois' },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">Mes <em>Objectifs</em></h1>
          <p className="subtitle">Suivi de tes objectifs hebdomadaires et mensuels</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && <span style={{ fontSize: '0.82rem', color: 'var(--green)' }}>✅ Sauvegardé</span>}
          {!editing
            ? <button className="btn-primary" onClick={() => setEditing(true)}>✏️ Modifier</button>
            : <>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
              <button className="btn-teal" style={{ animation: 'none' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
              </button>
            </>}
        </div>
      </div>

      {editing && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="section-title-line"><span>Modifier les objectifs</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {fields.map(({ key, label }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" type="number" min="0"
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                  value={objectifs[key]}
                  onChange={e => setObjectifs({ ...objectifs, [key]: parseInt(e.target.value) || 0 })} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button className="btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
            <button className="btn-teal" style={{ animation: 'none' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>Chargement...</div> : <>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title-line"><span>Semaine {currentWeek} — en cours</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
            <ObjCard label="Appels passés" value={statsSemaine.appels} objectif={objectifs.appels_semaine} color="var(--text)" />
            <ObjCard label="Réponses" value={statsSemaine.reponses} objectif={objectifs.reponses_semaine} color="var(--teal)" />
            <ObjCard label="RDV décrochés" value={statsSemaine.rdv} objectif={objectifs.rdv_semaine} color="var(--violet)" />
          </div>
          <div style={{ padding: '0.7rem 1rem', background: 'var(--bg-3)', borderRadius: 'var(--r-md)', fontSize: '0.84rem', color: 'var(--text-3)' }}>
            Taux de réponse cette semaine : <strong style={{ color: 'var(--text-2)' }}>{statsSemaine.taux}%</strong>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title-line"><span>{now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} — en cours</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.75rem' }}>
            <ObjCard label="Appels passés" value={statsMois.appels} objectif={objectifs.appels_mois} color="var(--text)" />
            <ObjCard label="Réponses" value={statsMois.reponses} objectif={objectifs.reponses_mois} color="var(--teal)" />
            <ObjCard label="RDV décrochés" value={statsMois.rdv} objectif={objectifs.rdv_mois} color="var(--violet)" />
          </div>
          <div style={{ padding: '0.7rem 1rem', background: 'var(--bg-3)', borderRadius: 'var(--r-md)', fontSize: '0.84rem', color: 'var(--text-3)' }}>
            Taux de réponse ce mois : <strong style={{ color: 'var(--text-2)' }}>{statsMois.taux}%</strong>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title-line"><span>Évolution sur 12 semaines</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolutionData} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-3)' }} />
              <ReferenceLine y={objectifs.appels_semaine} stroke="rgba(46,196,182,0.3)" strokeDasharray="4 4" />
              <ReferenceLine y={objectifs.reponses_semaine} stroke="rgba(76,175,130,0.3)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="appels" stroke="#2ec4b6" strokeWidth={2} dot={false} name="Appels" />
              <Line type="monotone" dataKey="reponses" stroke="#4caf82" strokeWidth={2} dot={false} name="Réponses" />
              <Line type="monotone" dataKey="rdv" stroke="#9d85e8" strokeWidth={2} dot={false} name="RDV" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title-line" style={{ marginBottom: 0 }}><span>Récapitulatif par semaine</span></div>
          </div>
          <table className="data-table">
            <thead>
              <tr>{['Semaine', 'Appels', 'vs Obj.', 'Réponses', 'vs Obj.', 'Taux', 'RDV', 'vs Obj.'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {evolutionData.map((row, i) => {
                const taux = row.appels ? ((row.reponses / row.appels) * 100).toFixed(1) : 0
                const isCurrent = row.label === `S${currentWeek}`
                const diff = v => <span style={{ fontWeight: 600, color: v >= 0 ? 'var(--green)' : 'var(--rose)' }}>{v >= 0 ? '+' : ''}{v}</span>
                return (
                  <tr key={row.label} style={{ background: isCurrent ? 'rgba(46,196,182,0.05)' : 'transparent' }}>
                    <td style={{ fontWeight: isCurrent ? 700 : 400, color: isCurrent ? 'var(--teal)' : 'var(--text)' }}>{isCurrent ? '▶ ' : ''}{row.label}</td>
                    <td style={{ fontWeight: 600 }}>{row.appels}</td>
                    <td>{diff(row.appels - objectifs.appels_semaine)}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{row.reponses}</td>
                    <td>{diff(row.reponses - objectifs.reponses_semaine)}</td>
                    <td style={{ color: 'var(--text-2)' }}>{taux}%</td>
                    <td style={{ color: 'var(--violet)', fontWeight: 600 }}>{row.rdv}</td>
                    <td>{diff(row.rdv - objectifs.rdv_semaine)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  )
}