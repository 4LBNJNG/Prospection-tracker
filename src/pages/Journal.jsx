import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUTS = ['Réponse', 'Messagerie', 'Pas répondu', 'Filtrage secrétaire', 'Faux numéro']
const OBJECTIONS = ['Aucune', 'Déjà un prestataire', 'Budget insuffisant', 'Pas le bon interlocuteur', "Projet non prioritaire", "Appel d'offres en cours", 'Trop cher', 'Pas de besoin', 'Autre']
const NEXT_STEPS = ['Rappeler J+3', 'Rappeler J+7', 'Rappeler J+14', 'Rappeler J+30', 'Envoyer profil(s)', 'Envoyer proposition', 'Planifier démo', 'RDV planifié', 'Attendre décision', 'Classer']

const statutClass = s => {
  if (s === 'Réponse') return 'badge badge-green'
  if (s === 'Messagerie') return 'badge badge-yellow'
  if (s === 'Pas répondu') return 'badge badge-red'
  return 'badge badge-slate'
}

const EMPTY = {
  date: '', heure: '', entreprise: '', nom_contact: '', poste: '',
  numero: '', statut: '', rdv_pris: false, date_rdv: '',
  commentaire: '', objection: '', next_step: ''
}

export default function Journal() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const PER_PAGE = 50

  useEffect(() => { fetchEntries() }, [page, search, filterStatut])

  const fetchEntries = async () => {
    setLoading(true)
    let q = supabase.from('journal').select('*', { count: 'exact' })
      .order('date', { ascending: false }).order('heure', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)
    if (search) q = q.or(`nom_contact.ilike.%${search}%,entreprise.ilike.%${search}%`)
    if (filterStatut) q = q.eq('statut', filterStatut)
    const { data, count } = await q
    setEntries(data || [])
    if (count !== null) setTotal(count)
    setLoading(false)
  }

  const openEdit = e => {
    setEditing(e.id)
    setForm({
      date:         e.date ? e.date.toString().slice(0, 10) : '',
      heure:        e.heure || '',
      entreprise:   e.entreprise || '',
      nom_contact:  e.nom_contact || '',
      poste:        e.poste || '',
      numero:       e.numero || '',
      statut:       e.statut || '',
      rdv_pris:     e.rdv_pris || false,
      date_rdv:     e.date_rdv ? e.date_rdv.toString().slice(0, 10) : '',
      commentaire:  e.commentaire || '',
      objection:    e.objection || '',
      next_step:    e.next_step || '',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('journal').update(form).eq('id', editing)
    setSaving(false)
    setShowModal(false)
    fetchEntries()
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer cet appel du journal ?')) return
    await supabase.from('journal').delete().eq('id', id)
    fetchEntries()
  }

  const formatDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

  const Field = ({ label, field, type = 'text' }) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={form[field] || ''}
        onChange={e => setForm({ ...form, [field]: e.target.value })} />
    </div>
  )

  const SelectField = ({ label, field, options }) => (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={form[field] || ''}
        onChange={e => setForm({ ...form, [field]: e.target.value })}>
        <option value="">—</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">Journal <em>des appels</em></h1>
          <p className="subtitle">{total} appels enregistrés au total</p>
        </div>
      </div>

      <div className="filter-bar">
        <input className="input" style={{ maxWidth: 280 }} placeholder="🔍 Rechercher..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        <select className="select" style={{ maxWidth: 200 }} value={filterStatut}
          onChange={e => { setFilterStatut(e.target.value); setPage(0) }}>
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => <option key={s}>{s}</option>)}
        </select>
        {(search || filterStatut) && (
          <button className="btn-ghost" onClick={() => { setSearch(''); setFilterStatut(''); setPage(0) }}>
            ✕ Réinitialiser
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>Chargement...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {['Date', 'Contact', 'Entreprise', 'Statut', 'RDV', 'Commentaire', 'Next Step', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem' }}>Aucun résultat</td></tr>
              ) : entries.map(e => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: 'nowrap', color: 'var(--text-3)', fontSize: '0.8rem' }}>{formatDate(e.date)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{e.nom_contact}</td>
                  <td style={{ color: 'var(--text-2)' }}>{e.entreprise}</td>
                  <td><span className={statutClass(e.statut)}>{e.statut}</span></td>
                  <td>
                    {e.rdv_pris
                      ? <span className="badge badge-teal">✓ {e.date_rdv ? new Date(e.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Oui'}</span>
                      : <span style={{ color: 'var(--text-3)' }}>—</span>}
                  </td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-3)' }}>
                    {e.commentaire || '—'}
                  </td>
                  <td style={{ color: 'var(--teal)', fontWeight: 500, fontSize: '0.82rem' }}>{e.next_step || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => openEdit(e)}
                        style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.color = 'var(--teal)' }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(e.id)}
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

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
          Page {page + 1} · {Math.min((page + 1) * PER_PAGE, total)} / {total} résultats
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>← Précédent</button>
          <button className="btn-ghost" onClick={() => setPage(page + 1)} disabled={entries.length < PER_PAGE}>Suivant →</button>
        </div>
      </div>

      {/* Modal édition */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-xl)', padding: '2rem', width: '90%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeUp 0.2s ease' }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', color: 'var(--text)', marginBottom: '1.5rem' }}>
              Modifier l'appel
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <Field label="Date" field="date" type="date" />
              <Field label="Heure" field="heure" type="time" />
              <Field label="Nom Contact" field="nom_contact" />
              <Field label="Entreprise" field="entreprise" />
              <Field label="Poste" field="poste" />
              <Field label="Numéro" field="numero" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="label">Statut</label>
              <select className="select" value={form.statut}
                onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="">—</option>
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">RDV décroché ?</label>
                <select className="select" value={form.rdv_pris ? 'oui' : 'non'}
                  onChange={e => setForm({ ...form, rdv_pris: e.target.value === 'oui' })}>
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
              <div>
                <label className="label">Date du RDV</label>
                <input className="input" type="date" value={form.date_rdv || ''}
                  disabled={!form.rdv_pris} style={{ opacity: form.rdv_pris ? 1 : 0.35 }}
                  onChange={e => setForm({ ...form, date_rdv: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <SelectField label="Objection" field="objection" options={OBJECTIONS} />
              <SelectField label="Next Step" field="next_step" options={NEXT_STEPS} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Commentaire</label>
              <textarea className="input" style={{ height: 90, resize: 'vertical' }}
                value={form.commentaire || ''} onChange={e => setForm({ ...form, commentaire: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-teal" style={{ animation: 'none' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : '💾 Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}