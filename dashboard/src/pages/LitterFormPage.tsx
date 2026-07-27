import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLitters, useLitter } from '../hooks/useLitters'
import { useDogs } from '../hooks/useDogs'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import { PageSpinner } from '../components/Spinner'
import type { TablesInsert } from '../types/database.types'

type VaterMode = 'db' | 'extern'

export function LitterFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { litter, loading: litterLoading } = useLitter(id)
  const { create, update } = useLitters()
  const { dogs } = useDogs()

  const [mutterId, setMutterId] = useState('')
  const [datum, setDatum] = useState('')
  const [anzahlRuden, setAnzahlRuden] = useState(0)
  const [anzahlHuendinnen, setAnzahlHuendinnen] = useState(0)
  const [vaterMode, setVaterMode] = useState<VaterMode>('extern')
  const [vaterId, setVaterId] = useState('')
  const [vaterExternName, setVaterExternName] = useState('')
  const [vaterExternZwinger, setVaterExternZwinger] = useState('')
  const [notiz, setNotiz] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    if (!litter) return
    setMutterId(litter.mutter_id)
    setDatum(litter.datum)
    setAnzahlRuden(litter.anzahl_ruden)
    setAnzahlHuendinnen(litter.anzahl_huendinnen)
    setNotiz(litter.notiz ?? '')
    if (litter.vater_id) {
      setVaterMode('db')
      setVaterId(litter.vater_id)
    } else {
      setVaterMode('extern')
      setVaterExternName(litter.vater_extern_name ?? '')
      setVaterExternZwinger(litter.vater_extern_zwinger ?? '')
    }
  }, [litter])

  const huendinnen = dogs.filter(d => d.geschlecht === 'Hündin')
  const rueden = dogs.filter(d => d.geschlecht === 'Rüde')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload: TablesInsert<'wuerfe'> = {
        mutter_id: mutterId,
        datum,
        anzahl_ruden: anzahlRuden,
        anzahl_huendinnen: anzahlHuendinnen,
        notiz: notiz || null,
        vater_id: vaterMode === 'db' ? (vaterId || null) : null,
        vater_extern_name: vaterMode === 'extern' ? (vaterExternName || null) : null,
        vater_extern_zwinger: vaterMode === 'extern' ? (vaterExternZwinger || null) : null,
      }
      if (isEdit && id) await update(id, payload)
      else await create(payload)
      setSaveStatus('success')
      setTimeout(() => navigate('/wuerfe'), 750)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(msg)
      triggerShake()
      setSaveStatus('idle')
    }
  }

  if (isEdit && litterLoading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Wurf bearbeiten' : 'Neuer Wurf'}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <FormError message={error} />

        <div className="form-grid">
          <div className="field">
            <label className="field-label">Mutter *</label>
            <select className="field-input" value={mutterId} onChange={e => setMutterId(e.target.value)} required>
              <option value="">— auswählen —</option>
              {huendinnen.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Datum *</label>
            <input className="field-input" type="date" value={datum} onChange={e => setDatum(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Anzahl Rüden</label>
            <input className="field-input" type="number" min={0} value={anzahlRuden} onChange={e => setAnzahlRuden(Number(e.target.value))} />
          </div>
          <div className="field">
            <label className="field-label">Anzahl Hündinnen</label>
            <input className="field-input" type="number" min={0} value={anzahlHuendinnen} onChange={e => setAnzahlHuendinnen(Number(e.target.value))} />
          </div>
        </div>

        <fieldset>
          <legend>Vater</legend>
          <div className="radio-group" style={{ marginBottom: 12 }}>
            <label className="radio-label">
              <input type="radio" checked={vaterMode === 'db'} onChange={() => setVaterMode('db')} />
              In Datenbank
            </label>
            <label className="radio-label">
              <input type="radio" checked={vaterMode === 'extern'} onChange={() => setVaterMode('extern')} />
              Extern
            </label>
          </div>
          {vaterMode === 'db' ? (
            <select className="field-input" value={vaterId} onChange={e => setVaterId(e.target.value)}>
              <option value="">— auswählen —</option>
              {rueden.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : (
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Name</label>
                <input className="field-input" value={vaterExternName} onChange={e => setVaterExternName(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Zwinger</label>
                <input className="field-input" value={vaterExternZwinger} onChange={e => setVaterExternZwinger(e.target.value)} />
              </div>
            </div>
          )}
        </fieldset>

        <div className="field">
          <label className="field-label">Notiz</label>
          <textarea className="field-input field-textarea" value={notiz} onChange={e => setNotiz(e.target.value)} />
        </div>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/wuerfe')}>
            Abbrechen
          </button>
        </div>
      </form>
    </>
  )
}
