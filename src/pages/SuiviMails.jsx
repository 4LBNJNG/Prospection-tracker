import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPES = ['Prospection', 'Proposition de profil(s)', 'Relance', 'Suivi RDV', 'Autre']
const STATUTS = ['Non envoyé', 'Envoyé', 'Répondu', 'Sans réponse', 'Relancé', 'Clôturé']

const statutClass = s => {
  if (s === 'Répondu') return 'badge badge-green'
  if (s === 'Envoyé') return 'badge badge-teal'
  if (s === 'Relancé') return 'badge badge-yellow'
  if (s === 'Sans réponse') return 'badge badge-red'
  if (s === 'Non envoyé') return 'badge badge-slate'
  return 'badge badge-slate'
}

const EMPTY = {
  date_envoi: new Date().toISOString().split('T')[0],
  prospect_nom: '',
  entreprise: '',
  type_mail: '',
  profils_envoyes: '',
  statut: 'Envoyé',
  commentaire: ''
}

export default function SuiviMails() {
  const [mails, setMails] = useState([])
  const [prospects, setProspects] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [prospectSearch, setProspectSearch] = useState('')

  useEffect(() => { fetchMails() }, [search, filterStatut, filterType])
  useEffect(() => {
    supabase.from('prospects').select('nom, entreprise').order('nom').then(({ data }) => setProspects(data || []))
  }, [])

  const fetchMails = async () => {
    setLoading(true)
    let q = supabase.from('mails').select('*', { count: 'exact' }).order('date_envoi', { ascending: false })
    if (search) q = q.or(`prospect_nom.ilike.%${search}%,entreprise.ilike.%${search}%`)
    if (filterStatut) q = q.eq('statut', filterStatut)
    if (filterType) q = q.eq('type_mail', filterType)
    const { data, count } = await q
    setMails(data || [])
    if (count !== null) setTotal(count)
    setLoading(false)
  }

  const filteredProspects = prospects.filter(p =>
    p.nom?.toLowerCase().includes(prospectSearch.toLowerCase()) ||
    p.entreprise?.toLowerCase().includes(prospectSearch.toLowerCase())
  ).slice(0, 8)

  const handleSelectProspect = p => {
    setForm({ ...form, prospect_nom: p.nom, entreprise: p.entreprise })
    setProspectSearch(p.nom)
    setShowDropdown(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setProspectSearch('')
    setShowModal(true)
  }

  const openEdit = m => {
    setEditing(m.id)
    setForm({
      date_envoi:      m.date_envoi ? m.date_envoi.toString().slice(0, 10) : '',
      prospect_nom:    m.prospect_nom || '',
      entreprise:      m.entreprise || '',
      type_mail:       m.type_mail || '',
      profils_envoyes: m.profils_envoyes || '',
      statut:          m.statut || 'Envoyé',
      commentaire:     m.commentaire || ''
    })
    setProspectSearch(m.prospect_nom || '')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.prospect_nom) return alert('Renseigne le prospect')
    if (!form.type_mail) return alert('Renseigne le type de mail')
    setSaving(true)
    if (editing) {
      await supabase.from('mails').update(form).eq('id', editing)
    } else {
      await supabase.from('mails').insert([form])
    }
    setSaving(false)
    setShowModal(false)
    fetchMails()
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer ce mail ?')) return
    await supabase.from('mails').delete().eq('id', id)
    fetchMails()
  }

  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

  // Stats rapides
  const envoyes = mails.filter(m => m.statut === 'Envoyé').length
  const repondus = mails.filter(m => m.statut === 'Répondu').length
  const sansReponse = mails.filter(m => m.statut === 'Sans réponse').length
  const tauxReponse = total ? ((repondus / total) * 100).toFixed(1) : 0

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: '100%', animation: 'fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
      <div className="page-header">
        <div>
          <h1 className="display">Suivi des <em>Mails</em></h1>
          <p className="subtitle">{total} mails enregistrés</p>
        </div>
        <button className="btn-teal" style={{ animation: 'none' }} onClick={openNew}>
          + Nouveau mail
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total envoyés</div>
          <div className="kpi-value">{total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Répondus</div>
          <div className="kpi-value" style={{ color: 'var(--teal)' }}>{repondus}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Sans réponse</div>
          <div className="kpi-value" style={{ color: 'var(--rose)' }}>{sansReponse}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Taux de réponse</div>
          <div className="kpi-value" style={{ color: 'var(--gold)' }}>{tauxReponse}%</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-bar">
        <input className="input" style={{ maxWidth: 260 }} placeholder="🔍 Prospect ou entreprise..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" style={{ maxWidth: 180 }} value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 220 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        {(search || filterStatut || filterType) && (
          <button className="btn-ghost" onClick={() => { setSearch(''); setFilterStatut(''); setFilterType('') }}>✕ Réinitialiser</button>
        )}
      </div>

      {/* Tableau */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>Chargement...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Date', 'Prospect', 'Entreprise', 'Type', 'Profil(s) envoyé(s)', 'Statut', 'Commentaire', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mails.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem' }}>Aucun mail enregistré</td></tr>
              ) : mails.map(m => (
                <tr key={m.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8rem' }}>{formatDate(m.date_envoi)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{m.prospect_nom}</td>
                  <td style={{ color: 'var(--text-2)' }}>{m.entreprise}</td>
                  <td><span className="badge badge-violet">{m.type_mail}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{m.profils_envoyes || '—'}</td>
                  <td><span className={statutClass(m.statut)}>{m.statut}</span></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)', fontStyle: 'italic' }}>{m.commentaire || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(m)}
                        style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.color = 'var(--teal)' }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(m.id)}
                        style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.target.style.borderColor = 'var(--rose)'; e.target.style.color = 'var(--rose)' }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sidebar */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 560,
            background: 'var(--bg-3)', borderLeft: '1px solid var(--border-2)',
            zIndex: 201, overflowY: 'auto', padding: '2.5rem',
            animation: 'slideIn 0.25s ease', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: 'var(--text)' }}>
                {editing ? 'Modifier' : 'Nouveau'} <em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>mail</em>
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.color = 'var(--rose)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Prospect avec dropdown */}
              <div style={{ position: 'relative' }}>
                <label className="label">Prospect</label>
                <input className="input" value={prospectSearch} placeholder="Rechercher un prospect..."
                  onChange={e => { setProspectSearch(e.target.value); setForm({ ...form, prospect_nom: e.target.value }); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)} />
                {showDropdown && filteredProspects.length > 0 && (
                  <div className="dropdown">
                    {filteredProspects.map(p => (
                      <div key={p.nom} className="dropdown-item" onMouseDown={() => handleSelectProspect(p)}>
                        <div className="dropdown-item-name">{p.nom}</div>
                        <div className="dropdown-item-sub">{p.entreprise}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Entreprise</label>
                <input className="input" value={form.entreprise}
                  onChange={e => setForm({ ...form, entreprise: e.target.value })} />
              </div>

              <div>
                <label className="label">Date d'envoi</label>
                <input className="input" type="date" value={form.date_envoi}
                  onChange={e => setForm({ ...form, date_envoi: e.target.value })} />
              </div>

              <div>
                <label className="label">Type de mail</label>
                <select className="select" value={form.type_mail}
                  onChange={e => setForm({ ...form, type_mail: e.target.value })}>
                  <option value="">— Choisir —</option>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Profil(s) envoyé(s)</label>
                <textarea className="input" style={{ height: 80, resize: 'vertical' }}
                  placeholder="Ex : Développeur Java 5ans, Ingénieur DevOps..."
                  value={form.profils_envoyes}
                  onChange={e => setForm({ ...form, profils_envoyes: e.target.value })} />
              </div>

              <div>
                <label className="label">Statut</label>
                <select className="select" value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Commentaire</label>
                <textarea className="input" style={{ height: 90, resize: 'vertical' }}
                  value={form.commentaire}
                  onChange={e => setForm({ ...form, commentaire: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-teal" style={{ flex: 2, animation: 'none' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}