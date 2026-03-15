import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function FicheProspect() {
  const [prospects, setProspects] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('prospects').select('*').order('nom').then(({ data }) => setProspects(data || []))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    supabase.from('journal').select('*').eq('nom_contact', selected.nom)
      .order('date', { ascending: false })
      .then(({ data }) => { setJournal(data || []); setLoading(false) })
  }, [selected])

  const filtered = prospects.filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.entreprise?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  const handleSelect = p => { setSelected(p); setSearch(p.nom); setShowDropdown(false) }

  const total = journal.length
  const reponses = journal.filter(j => j.statut === 'Réponse').length
  const rdv = journal.filter(j => j.rdv_pris).length
  const tauxReponse = total ? ((reponses / total) * 100).toFixed(1) + '%' : '—'
  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  const statutClass = s => {
    if (s === 'Réponse') return 'badge badge-green'
    if (s === 'Messagerie') return 'badge badge-yellow'
    if (s === 'Pas répondu') return 'badge badge-red'
    return 'badge badge-slate'
  }

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="display">Fiche <em>Prospect</em></h1>
          <p className="subtitle">Historique et KPI par contact</p>
        </div>
      </div>

      {/* Card avec overflow visible pour que le dropdown sorte */}
      <div className="card" style={{ marginBottom: '1rem', overflow: 'visible' }}>
        <div className="section-title-line"><span>Sélectionner un prospect</span></div>
        <div style={{ position: 'relative' }}>
          <input className="input" value={search} placeholder="Rechercher par nom ou entreprise..."
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelected(null) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)} />
          {showDropdown && filtered.length > 0 && (
            <div className="dropdown">
              {filtered.map(p => (
                <div key={p.id} className="dropdown-item" onMouseDown={() => handleSelect(p)}>
                  <div className="dropdown-item-name">{p.nom}</div>
                  <div className="dropdown-item-sub">{p.entreprise} · {p.poste}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Chargement...</div>}

      {selected && !loading && <>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="section-title-line"><span>Identité</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div className="info-item"><span style={{ opacity: 0.4 }}>🏢</span><strong style={{ color: 'var(--text)' }}>{selected.entreprise || '—'}</strong></div>
            <div className="info-item"><span style={{ opacity: 0.4 }}>💼</span>{selected.poste || '—'}</div>
            <div className="info-item"><span style={{ opacity: 0.4 }}>📞</span>{selected.telephone || '—'}</div>
            <div className="info-item"><span style={{ opacity: 0.4 }}>📱</span>{selected.mobile || '—'}</div>
            <div className="info-item"><span style={{ opacity: 0.4 }}>✉️</span>{selected.email || '—'}</div>
            <div className="info-item"><span style={{ opacity: 0.4 }}>📍</span>{selected.ville || '—'}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div className="kpi-card">
            <div className="kpi-label">Appels passés</div>
            <div className="kpi-value">{total}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Taux de réponse</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>{tauxReponse}</div>
            <div className="kpi-sub">{reponses} réponses</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">RDV décrochés</div>
            <div className="kpi-value" style={{ color: 'var(--gold)' }}>{rdv}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div className="section-title-line" style={{ marginBottom: 0 }}>
              <span>Historique des appels ({total})</span>
            </div>
          </div>
          {journal.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>Aucun appel enregistré</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {['Date', 'Statut', 'RDV', 'Commentaire', 'Objection', 'Next Step'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {journal.map(j => (
                  <tr key={j.id}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8rem' }}>{formatDate(j.date)}</td>
                    <td><span className={statutClass(j.statut)}>{j.statut}</span></td>
                    <td>{j.rdv_pris ? <span className="badge badge-teal">✓ {j.date_rdv ? formatDate(j.date_rdv) : 'Oui'}</span> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)', fontStyle: 'italic' }}>{j.commentaire || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{j.objection || '—'}</td>
                    <td style={{ color: 'var(--teal)', fontWeight: 500 }}>{j.next_step || '—'}</td>
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