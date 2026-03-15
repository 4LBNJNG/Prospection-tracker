import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#d4dae8' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name} : <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function AnalyseHoraire() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [meilleur, setMeilleur] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: journal } = await supabase.from('journal').select('heure, statut, rdv_pris')
    if (!journal) { setLoading(false); return }

    const slots = {}
    for (let h = 7; h <= 19; h++) {
      slots[h] = { creneau: `${h}h–${h + 1}h`, heure: h, appels: 0, reponses: 0, rdv: 0 }
    }
    journal.forEach(j => {
      if (!j.heure) return
      const h = parseInt(j.heure.split(':')[0])
      if (slots[h]) {
        slots[h].appels++
        if (j.statut === 'Réponse') slots[h].reponses++
        if (j.rdv_pris) slots[h].rdv++
      }
    })
    const result = Object.values(slots).map(s => ({
      ...s,
      taux: s.appels ? parseFloat(((s.reponses / s.appels) * 100).toFixed(1)) : 0,
      efficacite: s.appels ? parseFloat(((s.reponses * 0.4 + s.rdv * 0.6) / s.appels * 100).toFixed(1)) : 0
    }))
    const best = result.reduce((a, b) => b.efficacite > a.efficacite ? b : a, result[0])
    setMeilleur(best)
    setData(result)
    setLoading(false)
  }

  const totalAppels = data.reduce((s, d) => s + d.appels, 0)
  const totalReponses = data.reduce((s, d) => s + d.reponses, 0)
  const totalRdv = data.reduce((s, d) => s + d.rdv, 0)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">Analyse <em>Horaire</em></h1>
          <p className="subtitle">Performance par créneau d'appel</p>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-3)' }}>Chargement...</div> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-label">Total appels</div>
            <div className="kpi-value">{totalAppels}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total réponses</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>{totalReponses}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total RDV</div>
            <div className="kpi-value" style={{ color: 'var(--gold)' }}>{totalRdv}</div>
          </div>
          <div className="kpi-card" style={{ borderColor: 'rgba(46,196,182,0.2)' }}>
            <div className="kpi-label">Meilleur créneau</div>
            <div className="kpi-value" style={{ fontSize: '1.6rem', color: 'var(--teal)' }}>🏆 {meilleur?.creneau}</div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title-line"><span>Appels & Réponses par créneau</span></div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barSize={14} barGap={3}>
              <XAxis dataKey="creneau" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-3)' }} />
              <Bar dataKey="appels" name="Appels" fill="rgba(46,196,182,0.3)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="reponses" name="Réponses" fill="#2ec4b6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rdv" name="RDV" fill="#9d85e8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title-line" style={{ marginBottom: 0 }}><span>Tableau détaillé</span></div>
          </div>
          <table className="data-table">
            <thead>
              <tr>{['Créneau', 'Appels', 'Réponses', 'Taux réponse', 'RDV', 'Efficacité'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.heure} style={{ background: row.heure === meilleur?.heure ? 'rgba(46,196,182,0.05)' : 'transparent' }}>
                  <td style={{ fontWeight: 600, color: row.heure === meilleur?.heure ? 'var(--teal)' : 'var(--text)' }}>
                    {row.heure === meilleur?.heure ? '🏆 ' : ''}{row.creneau}
                  </td>
                  <td>{row.appels}</td>
                  <td style={{ color: 'var(--teal)' }}>{row.reponses}</td>
                  <td>{row.taux}%</td>
                  <td style={{ color: 'var(--violet)' }}>{row.rdv}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ height: 6, width: `${row.efficacite}%`, maxWidth: 80, background: 'var(--teal)', borderRadius: 4, opacity: 0.7 }} />
                      <span style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>{row.efficacite}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    </div>
  )
}