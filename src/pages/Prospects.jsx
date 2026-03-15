import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY = { nom: '', entreprise: '', poste: '', telephone: '', mobile: '', email: '', ville: '', departement: '', techno: '', potentiel: '', commentaire: '', a_rappeler: false }

export default function Prospects() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEntreprise, setFilterEntreprise] = useState('')
  const [filterVille, setFilterVille] = useState('')
  const [filterRappeler, setFilterRappeler] = useState(false)
  const [sortCol, setSortCol] = useState('nom')
  const [sortDir, setSortDir] = useState('asc')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const entreprises = [...new Set(prospects.map(p => p.entreprise).filter(Boolean))].sort()
  const villes = [...new Set(prospects.map(p => p.ville).filter(Boolean))].sort()

  useEffect(() => { fetchProspects() }, [])

  const fetchProspects = async () => {
    setLoading(true)
    const { data } = await supabase.from('prospects').select('*').order('nom')
    setProspects(data || [])
    setLoading(false)
  }

  const filtered = prospects
    .filter(p => {
      if (search) {
        const s = search.toLowerCase()
        if (!p.nom?.toLowerCase().includes(s) && !p.entreprise?.toLowerCase().includes(s) && !p.poste?.toLowerCase().includes(s)) return false
      }
      if (filterEntreprise && p.entreprise !== filterEntreprise) return false
      if (filterVille && p.ville !== filterVille) return false
      if (filterRappeler && !p.a_rappeler) return false
      return true
    })
    .sort((a, b) => {
      const va = (a[sortCol] || '').toString().toLowerCase()
      const vb = (b[sortCol] || '').toString().toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
  }

  const sortIcon = col => sortCol !== col ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓'

  const resetFilters = () => {
    setSearch(''); setFilterEntreprise(''); setFilterVille('')
    setFilterRappeler(false); setSortCol('nom'); setSortDir('asc')
  }

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowModal(true) }
  const openEdit = p => { setEditing(p.id); setForm(p); setShowModal(true) }

  const handleSave = async () => {
    if (!form.nom) return alert('Le nom est obligatoire')
    setSaving(true)
    if (editing) await supabase.from('prospects').update(form).eq('id', editing)
    else await supabase.from('prospects').insert([form])
    setSaving(false); setShowModal(false); fetchProspects()
  }

  const handleDelete = async id => {
    if (!confirm('Supprimer ce prospect ?')) return
    await supabase.from('prospects').delete().eq('id', id)
    fetchProspects()
  }

  const cols = [
    { key: 'nom', label: 'Nom' },
    { key: 'entreprise', label: 'Entreprise' },
    { key: 'poste', label: 'Poste' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'ville', label: 'Ville' },
  ]

  const Field = ({ label, field, type = 'text' }) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" type={type} value={form[field] || ''}
        onChange={e => setForm({ ...form, [field]: e.target.value })} />
    </div>
  )

  const thStyle = col => ({
    padding: '0.7rem 1rem', textAlign: 'left',
    fontSize: '0.68rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: sortCol === col ? 'var(--teal)' : 'var(--text-3)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--border)',
  })

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="display">Liste des <em>Prospects</em></h1>
          <p className="subtitle">{filtered.length} / {prospects.length} contacts</p>
        </div>
        <button className="btn-teal" style={{ animation: 'none' }} onClick={openNew}>+ Ajouter</button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1rem' }}>
        <input className="input" style={{ maxWidth: 240, flex: '1 1 200px' }} placeholder="🔍 Nom, entreprise, poste..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="select" style={{ maxWidth: 200 }} value={filterEntreprise} onChange={e => setFilterEntreprise(e.target.value)}>
          <option value="">Toutes les entreprises</option>
          {entreprises.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 160 }} value={filterVille} onChange={e => setFilterVille(e.target.value)}>
          <option value="">Toutes les villes</option>
          {villes.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem', color: 'var(--text-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={filterRappeler} onChange={e => setFilterRappeler(e.target.checked)}
            style={{ accentColor: 'var(--teal)' }} />
          À rappeler
        </label>
        {(search || filterEntreprise || filterVille || filterRappeler) && (
          <button className="btn-ghost" onClick={resetFilters}>✕ Réinitialiser</button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>Chargement...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {cols.map(({ key, label }) => (
                    <th key={key} style={thStyle(key)} onClick={() => handleSort(key)}>
                      {label}{sortIcon(key)}
                    </th>
                  ))}
                  <th style={{ ...thStyle(null), cursor: 'default' }}>⭐</th>
                  <th style={{ ...thStyle(null), cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '3rem' }}>Aucun prospect trouvé</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{p.nom}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{p.entreprise || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{p.poste || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>{p.telephone || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-2)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>{p.mobile || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-3)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>{p.ville || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{p.a_rappeler ? '⭐' : ''}</td>
                    <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => openEdit(p)}
                          style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--border)', borderRadius: 6, background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.target.style.borderColor = 'var(--teal)'; e.target.style.color = 'var(--teal)' }}
                          onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-2)' }}>
                          ✏️
                        </button>
                        <button onClick={() => handleDelete(p.id)}
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
          </div>
        )}
      </div>

      {/* Sidebar ajout/modification */}
      {showModal && (
        <>
          <div
            onClick={() => setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(3px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 560,
            background: 'var(--bg-3)', borderLeft: '1px solid var(--border-2)',
            zIndex: 201, overflowY: 'auto', padding: '2.5rem',
            animation: 'slideIn 0.25s ease', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem', color: 'var(--text)' }}>
                {editing ? 'Modifier' : 'Nouveau'} <em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>prospect</em>
              </h2>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-2)', cursor: 'pointer', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.color = 'var(--rose)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Nom *" field="nom" />
                <Field label="Entreprise" field="entreprise" />
              </div>
              <Field label="Poste" field="poste" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Téléphone" field="telephone" />
                <Field label="Mobile" field="mobile" />
              </div>
              <Field label="Email" field="email" type="email" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Ville" field="ville" />
                <Field label="Département" field="departement" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Techno" field="techno" />
                <Field label="Potentiel" field="potentiel" />
              </div>
              <div>
                <label className="label">Commentaire</label>
                <textarea className="input" style={{ height: 90, resize: 'vertical' }}
                  value={form.commentaire || ''}
                  onChange={e => setForm({ ...form, commentaire: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-2)' }}>
                <input type="checkbox" checked={form.a_rappeler}
                  onChange={e => setForm({ ...form, a_rappeler: e.target.checked })}
                  style={{ accentColor: 'var(--teal)', width: 15, height: 15 }} />
                ⭐ À rappeler en priorité
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-teal" style={{ flex: 2, animation: 'none' }} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}