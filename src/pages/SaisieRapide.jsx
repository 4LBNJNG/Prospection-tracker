import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STATUTS = ['Réponse', 'Messagerie', 'Pas répondu', 'Filtrage secrétaire', 'Faux numéro']
const OBJECTIONS = ['Aucune', 'Déjà un prestataire', 'Budget insuffisant', 'Pas le bon interlocuteur', 'Pas de besoin', 'Autre']
const NEXT_STEPS = ['Rappeler J+3', 'Rappeler J+7', 'Rappeler J+14', 'Rappeler J+30', 'Envoyer profil(s)', 'RDV planifié', 'Envoyer un mail']

const today = () => new Date().toISOString().split('T')[0]
const nowTime = () => new Date().toTimeString().slice(0, 5)
const statutBadge = s => s === 'Réponse' ? 'badge badge-green' : s === 'Messagerie' ? 'badge badge-yellow' : 'badge badge-red'

export default function SaisieRapide() {
  const [prospects, setProspects] = useState([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [dernierAppel, setDernierAppel] = useState(null)
  const [form, setForm] = useState({ date: today(), heure: nowTime(), statut: '', rdv_pris: false, date_rdv: '', commentaire: '', objection: '', next_step: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase.from('prospects').select('*').order('nom').then(({ data }) => setProspects(data || []))
  }, [])

  useEffect(() => {
    if (!selected) { setDernierAppel(null); return }
    supabase.from('journal').select('*').eq('nom_contact', selected.nom)
      .order('date', { ascending: false }).limit(1)
      .then(({ data }) => setDernierAppel(data?.[0] || null))
  }, [selected])

  const filtered = prospects.filter(p =>
    p.nom?.toLowerCase().includes(search.toLowerCase()) ||
    p.entreprise?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  const handleSelect = p => { setSelected(p); setSearch(p.nom); setShowDropdown(false) }

  const handleSubmit = async () => {
    if (!selected) return alert('Sélectionne un prospect')
    if (!form.statut) return alert('Renseigne le statut')
    setSaving(true)
    const { error } = await supabase.from('journal').insert([{
      date: form.date, heure: form.heure,
      entreprise: selected.entreprise, nom_contact: selected.nom,
      poste: selected.poste, numero: selected.telephone || selected.mobile,
      statut: form.statut, rdv_pris: form.rdv_pris,
      date_rdv: form.rdv_pris && form.date_rdv ? form.date_rdv : null,
      commentaire: form.commentaire, objection: form.objection, next_step: form.next_step
    }])
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setSelected(null); setSearch('')
      setForm({ date: today(), heure: nowTime(), statut: '', rdv_pris: false, date_rdv: '', commentaire: '', objection: '', next_step: '' })
      setTimeout(() => setSuccess(false), 3000)
    } else alert('Erreur : ' + error.message)
  }

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="page-header">
        <div>
          <h1 className="display">Saisie <em>Rapide</em></h1>
          <p className="subtitle">Enregistre un appel en quelques secondes</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)' }} />
          Données en temps réel
        </div>
      </div>

      {success && <div className="alert-success">✅ Appel enregistré avec succès !</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* COLONNE GAUCHE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Card Prospect — overflow visible pour que le dropdown sorte */}
          <div className="card" style={{ overflow: 'visible' }}>
            <div className="section-title-line"><span>Prospect</span></div>
            <div style={{ position: 'relative' }}>
              <label className="label">Rechercher</label>
              <input className="input" style={{ borderColor: selected ? 'var(--teal)' : undefined }}
                value={search} placeholder="Nom ou entreprise..."
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelected(null) }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)} />
              {showDropdown && filtered.length > 0 && (
                <div className="dropdown">
                  {filtered.map(p => (
                    <div key={p.id} className="dropdown-item" onMouseDown={() => handleSelect(p)}>
                      <div className="dropdown-item-name">{p.nom}</div>
                      <div className="dropdown-item-sub">{p.entreprise}{p.poste ? ` · ${p.poste}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected && (
              <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div className="info-item"><span style={{ opacity: 0.5 }}>🏢</span><strong style={{ color: 'var(--text)' }}>{selected.entreprise || '—'}</strong></div>
                <div className="info-item"><span style={{ opacity: 0.5 }}>💼</span>{selected.poste || '—'}</div>
                <div className="info-item" style={{ gridColumn: '1/-1' }}>
                  <span style={{ opacity: 0.5 }}>📞</span>{selected.telephone || selected.mobile || '—'}
                </div>
              </div>
            )}

            {selected && (
              <div className="last-call-block">
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--teal)', marginBottom: '0.6rem' }}>Dernier contact</div>
                {dernierAppel ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-2)' }}>{new Date(dernierAppel.date).toLocaleDateString('fr-FR')}</span>
                      <span className={statutBadge(dernierAppel.statut)}>{dernierAppel.statut}</span>
                    </div>
                    {dernierAppel.commentaire && <div style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>{dernierAppel.commentaire}</div>}
                    {dernierAppel.next_step && <div style={{ color: 'var(--teal)', fontWeight: 500 }}>→ {dernierAppel.next_step}</div>}
                  </div>
                ) : <div style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Premier contact</div>}
              </div>
            )}
          </div>

          {/* RDV */}
          <div className="card">
            <div className="section-title-line"><span>RDV</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">RDV décroché ?</label>
                <select className="select" value={form.rdv_pris ? 'oui' : 'non'} onChange={e => setForm({ ...form, rdv_pris: e.target.value === 'oui' })}>
                  <option value="non">Non</option>
                  <option value="oui">✅ Oui</option>
                </select>
              </div>
              <div>
                <label className="label">Date du RDV</label>
                <input type="date" className="input" value={form.date_rdv}
                  disabled={!form.rdv_pris} style={{ opacity: form.rdv_pris ? 1 : 0.35 }}
                  onChange={e => setForm({ ...form, date_rdv: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Appel */}
          <div className="card">
            <div className="section-title-line"><span>Appel</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label">Heure</label>
                <input type="time" className="input" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" style={{ color: form.statut ? 'var(--teal)' : 'var(--rose)' }}>Statut ★</label>
              <select className="select"
                style={{ borderColor: form.statut ? 'var(--teal)' : 'rgba(224,108,117,0.4)', color: form.statut ? 'var(--text)' : 'var(--text-3)' }}
                value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                <option value="">— Choisir —</option>
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Détails */}
          <div className="card" style={{ flex: 1 }}>
            <div className="section-title-line"><span>Détails</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label className="label">Objection</label>
                <select className="select" value={form.objection} onChange={e => setForm({ ...form, objection: e.target.value })}>
                  <option value="">—</option>
                  {OBJECTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Next Step</label>
                <select className="select" value={form.next_step} onChange={e => setForm({ ...form, next_step: e.target.value })}>
                  <option value="">—</option>
                  {NEXT_STEPS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Commentaire</label>
                <textarea className="input" style={{ height: 80, resize: 'vertical' }}
                  value={form.commentaire} onChange={e => setForm({ ...form, commentaire: e.target.value })} placeholder="Notes..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.25rem' }}>
        <button className="btn-teal" style={{ width: '100%', fontSize: '1rem', padding: '0.9rem' }}
          onClick={handleSubmit} disabled={saving}>
          {saving ? '⏳ Enregistrement...' : '✅  Enregistrer dans le Journal'}
        </button>
      </div>
    </div>
  )
}