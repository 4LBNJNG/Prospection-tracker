import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const statutClass = s => {
  if (s === 'Réponse') return 'badge badge-green'
  if (s === 'Messagerie') return 'badge badge-yellow'
  if (s === 'Pas répondu') return 'badge badge-red'
  return 'badge badge-slate'
}

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 50

  useEffect(() => { fetchEntries() }, [page, search, filterStatut])

  const fetchEntries = async () => {
    setLoading(true)
    let q = supabase.from('journal').select('*').order('date', { ascending: false }).order('heure', { ascending: false }).range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)
    if (search) q = q.or(`nom_contact.ilike.%${search}%,entreprise.ilike.%${search}%`)
    if (filterStatut) q = q.eq('statut', filterStatut)
    const { data } = await q
    setEntries(data || [])
    setLoading(false)
  }

  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="page-enter" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#0d1b2a', letterSpacing: '-0.02em' }}>Journal</h1>
        <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginTop: 4 }}>Historique complet de tes appels</p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="🔍 Rechercher..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        <select className="select" style={{ maxWidth: 220 }} value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(0) }}>
          <option value="">Tous les statuts</option>
          {['Réponse', 'Messagerie', 'Pas répondu', 'Filtrage secrétaire', 'Faux numéro'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-400)' }}>Chargement...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Date', 'Contact', 'Entreprise', 'Statut', 'RDV', 'Commentaire', 'Next Step'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '3rem' }}>Aucun appel trouvé</td></tr>
              ) : entries.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--slate-400)', fontSize: '0.8rem' }}>{formatDate(e.date)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{e.nom_contact}</td>
                  <td style={{ color: 'var(--slate-500)' }}>{e.entreprise}</td>
                  <td><span className={statutClass(e.statut)}>{e.statut}</span></td>
                  <td>{e.rdv_pris ? <span className="badge badge-green">✅ {e.date_rdv ? formatDate(e.date_rdv) : 'Oui'}</span> : <span style={{ color: 'var(--slate-300)' }}>—</span>}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--slate-500)' }}>{e.commentaire || '—'}</td>
                  <td style={{ color: '#0369a1', fontWeight: 500 }}>{e.next_step || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
        <button className="btn-ghost" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Précédent</button>
        <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)', padding: '0 0.5rem' }}>Page {page + 1}</span>
        <button className="btn-ghost" onClick={() => setPage(page + 1)} disabled={entries.length < PER_PAGE}>Suivant →</button>
      </div>
    </div>
  )
}