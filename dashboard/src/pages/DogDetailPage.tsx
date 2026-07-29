import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDog, useDogs } from '../hooks/useDogs'
import { useHealthChecks } from '../hooks/useHealthChecks'
import { useExams } from '../hooks/useExams'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PageSpinner } from '../components/Spinner'
import { calcAge } from '../lib/calcAge'

type Tab = 'uebersicht' | 'gesundheit' | 'pruefungen'

const EMPTY_HC = { kategorie: '', ergebnis: '', datum: '', tierarzt: '', notiz: '' }
const EMPTY_EX = { art: '', ergebnis: '', datum: '', ort: '', notiz: '' }

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1)
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
    }
    if (u.hostname === 'vimeo.com' || u.hostname === 'www.vimeo.com') {
      const id = u.pathname.replace(/^\//, '')
      if (id) return `https://player.vimeo.com/video/${id}`
    }
    return null
  } catch {
    return null
  }
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function DogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { dog, loading } = useDog(id)
  const { softDelete } = useDogs()
  const { items: checks, create: createCheck, softDelete: deleteCheck } = useHealthChecks(id)
  const { items: exams, create: createExam, softDelete: deleteExam } = useExams(id)

  const [tab, setTab] = useState<Tab>('uebersicht')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showHcForm, setShowHcForm] = useState(false)
  const [hcForm, setHcForm] = useState(EMPTY_HC)
  const [showExForm, setShowExForm] = useState(false)
  const [exForm, setExForm] = useState(EMPTY_EX)

  if (loading) return <PageSpinner />
  if (!dog) return <p style={{ color: 'var(--color-muted)', fontSize: 14 }}>Hund nicht gefunden.</p>

  const submitHc = async (e: FormEvent) => {
    e.preventDefault()
    await createCheck({ ...hcForm, hund_id: id! })
    setHcForm(EMPTY_HC)
    setShowHcForm(false)
  }

  const submitEx = async (e: FormEvent) => {
    e.preventDefault()
    await createExam({ ...exForm, hund_id: id! })
    setExForm(EMPTY_EX)
    setShowExForm(false)
  }

  return (
    <>
      <Link to="/hunde" className="back-link">← Zurück zu Hunde</Link>

      <div className="detail-header">
        <div
          className="detail-avatar"
          style={dog.foto_url ? { backgroundImage: `url(${dog.foto_url})` } : undefined}
        >
          {!dog.foto_url && initials(dog.name)}
        </div>
        <div className="detail-header-info">
          <div className="detail-name">{dog.name}</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
            {dog.geschlecht} · {calcAge(dog.geburtsdatum)}
          </div>
          <span className={`badge ${dog.veroeffentlicht ? 'badge-live' : 'badge-hidden'}`} style={{ marginTop: 4 }}>
            {dog.veroeffentlicht ? 'Veröffentlicht' : 'Entwurf'}
          </span>
        </div>
        <div className="detail-actions">
          <Link to={`/hunde/${id}/bearbeiten`} className="btn btn-secondary btn-sm">
            Bearbeiten
          </Link>
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            Löschen
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {(['uebersicht', 'gesundheit', 'pruefungen'] as Tab[]).map(t => (
          <button
            key={t}
            className={`tab-btn${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'uebersicht' ? 'Übersicht' : t === 'gesundheit' ? 'Gesundheit' : 'Prüfungen'}
          </button>
        ))}
      </div>

      {tab === 'uebersicht' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {dog.foto_url && (
            <img
              src={dog.foto_url}
              alt={dog.name}
              style={{ width: '100%', maxWidth: 320, height: 220, objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
            />
          )}
          {dog.video_url && (() => {
            const embedUrl = getEmbedUrl(dog.video_url!)
            return embedUrl ? (
              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <iframe
                  src={embedUrl}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`Video von ${dog.name}`}
                />
              </div>
            ) : null
          })()}
          <div className="fact-grid">
            <div className="fact-card">
              <div className="fact-label">Alter</div>
              <div className="fact-value">{calcAge(dog.geburtsdatum)}</div>
            </div>
            <div className="fact-card">
              <div className="fact-label">Geburtsdatum</div>
              <div className="fact-value">{dog.geburtsdatum ?? '—'}</div>
            </div>
            <div className="fact-card">
              <div className="fact-label">Geschlecht</div>
              <div className="fact-value">{dog.geschlecht ?? '—'}</div>
            </div>
            <div className="fact-card">
              <div className="fact-label">Status</div>
              <div className="fact-value">{dog.veroeffentlicht ? 'Veröffentlicht' : 'Entwurf'}</div>
            </div>
            {(dog.mutter_extern_name || dog.mutter_id) && (
              <div className="fact-card">
                <div className="fact-label">Mutter</div>
                <div className="fact-value">
                  {dog.mutter_extern_name
                    ? [dog.mutter_extern_name, dog.mutter_extern_zwinger].filter(Boolean).join(' v. ')
                    : dog.mutter_id ?? '—'}
                </div>
              </div>
            )}
            {(dog.vater_extern_name || dog.vater_id) && (
              <div className="fact-card">
                <div className="fact-label">Vater</div>
                <div className="fact-value">
                  {dog.vater_extern_name
                    ? [dog.vater_extern_name, dog.vater_extern_zwinger].filter(Boolean).join(' v. ')
                    : dog.vater_id ?? '—'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'gesundheit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header-row">
            <div className="section-title">Gesundheitschecks</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowHcForm(v => !v)}>
              {showHcForm ? 'Abbrechen' : '+ Eintrag'}
            </button>
          </div>
          {showHcForm && (
            <form onSubmit={submitHc} className="inline-form">
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Kategorie *</label>
                  <input className="field-input" value={hcForm.kategorie} onChange={e => setHcForm(p => ({ ...p, kategorie: e.target.value }))} required placeholder="z. B. HD-Röntgen" />
                </div>
                <div className="field">
                  <label className="field-label">Ergebnis</label>
                  <input className="field-input" value={hcForm.ergebnis} onChange={e => setHcForm(p => ({ ...p, ergebnis: e.target.value }))} placeholder="z. B. HD-A" />
                </div>
                <div className="field">
                  <label className="field-label">Datum *</label>
                  <input className="field-input" type="date" value={hcForm.datum} onChange={e => setHcForm(p => ({ ...p, datum: e.target.value }))} required />
                </div>
                <div className="field">
                  <label className="field-label">Tierarzt</label>
                  <input className="field-input" value={hcForm.tierarzt} onChange={e => setHcForm(p => ({ ...p, tierarzt: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Notiz</label>
                <textarea className="field-input field-textarea" value={hcForm.notiz} onChange={e => setHcForm(p => ({ ...p, notiz: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm">Speichern</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHcForm(false)}>Abbrechen</button>
              </div>
            </form>
          )}
          <div className="inline-list">
            {checks.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-title">Keine Einträge</div>
                <div className="empty-state-text">Noch keine Gesundheitschecks erfasst.</div>
              </div>
            )}
            {checks.map(c => (
              <div key={c.id} className="inline-row">
                <div className="inline-row-info">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.kategorie}{c.ergebnis ? ` — ${c.ergebnis}` : ''}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                    {c.datum}{c.tierarzt ? ` · ${c.tierarzt}` : ''}
                  </div>
                  {c.notiz && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{c.notiz}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-cat-blush-text)' }} onClick={() => deleteCheck(c.id)}>Löschen</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'pruefungen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-header-row">
            <div className="section-title">Prüfungen</div>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowExForm(v => !v)}>
              {showExForm ? 'Abbrechen' : '+ Eintrag'}
            </button>
          </div>
          {showExForm && (
            <form onSubmit={submitEx} className="inline-form">
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Art *</label>
                  <input className="field-input" value={exForm.art} onChange={e => setExForm(p => ({ ...p, art: e.target.value }))} required placeholder="z. B. Wesenstest" />
                </div>
                <div className="field">
                  <label className="field-label">Ergebnis</label>
                  <input className="field-input" value={exForm.ergebnis} onChange={e => setExForm(p => ({ ...p, ergebnis: e.target.value }))} placeholder="z. B. Bestanden" />
                </div>
                <div className="field">
                  <label className="field-label">Datum *</label>
                  <input className="field-input" type="date" value={exForm.datum} onChange={e => setExForm(p => ({ ...p, datum: e.target.value }))} required />
                </div>
                <div className="field">
                  <label className="field-label">Ort / Verein</label>
                  <input className="field-input" value={exForm.ort} onChange={e => setExForm(p => ({ ...p, ort: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Notiz</label>
                <textarea className="field-input field-textarea" value={exForm.notiz} onChange={e => setExForm(p => ({ ...p, notiz: e.target.value }))} />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary btn-sm">Speichern</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowExForm(false)}>Abbrechen</button>
              </div>
            </form>
          )}
          <div className="inline-list">
            {exams.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-title">Keine Einträge</div>
                <div className="empty-state-text">Noch keine Prüfungen erfasst.</div>
              </div>
            )}
            {exams.map(ex => (
              <div key={ex.id} className="inline-row">
                <div className="inline-row-info">
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.art}{ex.ergebnis ? ` — ${ex.ergebnis}` : ''}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                    {[ex.datum, ex.ort].filter(Boolean).join(' · ')}
                  </div>
                  {ex.notiz && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{ex.notiz}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-cat-blush-text)' }} onClick={() => deleteExam(ex.id)}>Löschen</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDeleteDialog
          title="Hund löschen?"
          message={`"${dog.name}" wird in den Papierkorb verschoben.`}
          onConfirm={async () => { await softDelete(id!); navigate('/hunde') }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
