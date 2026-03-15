import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: '#d4dae8' }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color: p.color }}>{p.name} : <strong>{p.value}</strong></div>)}
    </div>
  )
}

export default function AnalyseEntreprise() {
  const [entreprises, setEntreprises] = useState([])
  const [selected, setSelected] = useState('')
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(false)
  const [creneaux, setCreneaux] = useState([])

  useEffect(() => { fetchEntreprises() }, [])
  useEffect(() => { if (selected) fetchJournal() }, [selected])

  const fetchEntreprises = async () => {
    const { data } = await supabase.from('journal').select('entreprise')
    const uniq = [...new Set((data || []).map(d => d.entreprise).filter(Boolean))].sort()
    setEntreprises(uniq)
  }

  const fetchJournal = async () => {
    setLoading(true)
    const { data } = await supabase.from('journal').select('*')
      .eq('entreprise', selected).order('date', { ascending: false })
    setJournal(data || [])
    const slots = {}
    for (let h = 7; h <= 19; h++) slots[h] = { creneau: `${h}h`, appels: 0, reponses: 0 }
    ;(data || []).forEach(j => {
      if (!j.heure) return
      const h = parseInt(j.heure.split(':')[0])
      if (slots[h]) { slots[h].appels++; if (j.statut === 'Réponse') slots[h].reponses++ }
    })
    setCreneaux(Object.values(slots).filter(s => s.appels > 0))
    setLoading(false)
  }

  const total = journal.length
  const reponses = journal.filter(j => j.statut === 'Réponse').length
  const rdv = journal.filter(j => j.rdv_pris).length
  const premierAppel = journal.length ? new Date(journal[journal.length - 1].date).toLocaleDateString('fr-FR') : '—'
  const dernierAppel = journal.length ? new Date(journal[0].date).toLocaleDateString('fr-FR') : '—'
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
          <h1 className="display">Analyse par <em>Entreprise</em></h1>
          <p className="subtitle">KPI et historique par compte</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-line"><span>Sélectionner une entreprise</span></div>
        <select className="select" style={{ maxWidth: 400 }} value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">— Choisir une entreprise —</option>
          {entreprises.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Chargement...</div>}

      {selected && !loading && journal.length > 0 && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-label">Appels passés</div>
            <div className="kpi-value">{total}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Réponses</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>{reponses}</div>
            <div className="kpi-sub">{total ? ((reponses / total) * 100).toFixed(1) : 0}%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">RDV décrochés</div>
            <div className="kpi-value" style={{ color: 'var(--gold)' }}>{rdv}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Contacts différents</div>
            <div className="kpi-value" style={{ color: 'var(--violet)' }}>{[...new Set(journal.map(j => j.nom_contact))].length}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div className="card">
            <div className="section-title-line"><span>Informations</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                ['Premier appel', premierAppel],
                ['Dernier appel', dernierAppel],
                ['Messageries', journal.filter(j => j.statut === 'Messagerie').length],
                ['Pas répondu', journal.filter(j => j.statut === 'Pas répondu').length],
              ].map(([label, val]) => (
                <div key={label} className="info-item" style={{ justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>{label}</span>
                  <strong style={{ color: 'var(--text)' }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title-line"><span>Créneaux optimaux</span></div>
            {creneaux.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={creneaux} barSize={12}>
                  <XAxis dataKey="creneau" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="appels" fill="rgba(46,196,182,0.3)" radius={[4, 4, 0, 0]} name="Appels" />
                  <Bar dataKey="reponses" fill="#2ec4b6" radius={[4, 4, 0, 0]} name="Réponses" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: '2rem' }}>Pas de données horaires</div>}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title-line" style={{ marginBottom: 0 }}><span>Historique ({total})</span></div>
          </div>
          <table className="data-table">
            <thead>
              <tr>{['Date', 'Contact', 'Statut', 'RDV', 'Commentaire', 'Next Step'].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {journal.map(j => (
                <tr key={j.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8rem' }}>{formatDate(j.date)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{j.nom_contact}</td>
                  <td><span className={statutClass(j.statut)}>{j.statut}</span></td>
                  <td>{j.rdv_pris ? <span className="badge badge-teal">✓</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)', fontStyle: 'italic' }}>{j.commentaire || '—'}</td>
                  <td style={{ color: 'var(--teal)', fontWeight: 500, fontSize: '0.82rem' }}>{j.next_step || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}

      {selected && !loading && journal.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>Aucun appel enregistré pour cette entreprise</div>
      )}
    </div>
  )
}