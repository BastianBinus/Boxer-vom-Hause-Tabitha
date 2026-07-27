import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEhemalige, useEhemaliger } from '../hooks/useEhemalige'
import { PublishToggle } from '../components/PublishToggle'
import { GalerieUpload } from '../components/GalerieUpload'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import { PageSpinner } from '../components/Spinner'

export function EhemaligeFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { item, loading: itemLoading } = useEhemaliger(id)
  const { create, update } = useEhemalige()

  const [savedId, setSavedId] = useState<string | null>(id ?? null)
  const [titel, setTitel] = useState('')
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [mutterName, setMutterName] = useState('')
  const [vaterName, setVaterName] = useState('')
  const [anzahlWelpen, setAnzahlWelpen] = useState('')
  const [beschreibung, setBeschreibung] = useState('')
  const [bilder, setBilder] = useState<string[]>([])
  const [veroeffentlicht, setVeroeffentlicht] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    if (!item) return
    setTitel(item.titel)
    setDatum(item.datum)
    setMutterName(item.mutter_name ?? '')
    setVaterName(item.vater_name ?? '')
    setAnzahlWelpen(item.anzahl_welpen != null ? String(item.anzahl_welpen) : '')
    setBeschreibung(item.beschreibung ?? '')
    setBilder(Array.isArray(item.bilder) ? (item.bilder as string[]) : [])
    setVeroeffentlicht(item.veroeffentlicht)
  }, [item])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload = {
        titel: titel.trim(),
        datum,
        mutter_name: mutterName.trim() || null,
        vater_name: vaterName.trim() || null,
        anzahl_welpen: anzahlWelpen ? Number(anzahlWelpen) : null,
        beschreibung: beschreibung.trim() || null,
        bilder: bilder.length > 0 ? bilder : null,
        veroeffentlicht,
      }
      if (isEdit && id) {
        await update(id, payload)
        setSaveStatus('success')
        setTimeout(() => navigate('/ehemalige'), 750)
      } else {
        const data = await create(payload)
        setSavedId(data.id)
        setSaveStatus('success')
        setTimeout(() => navigate(`/ehemalige/${data.id}/bearbeiten`), 750)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(msg)
      triggerShake()
      setSaveStatus('idle')
    }
  }

  if (isEdit && itemLoading) return <PageSpinner />

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</h1>
        <Link to="/ehemalige" className="btn btn-ghost">Abbrechen</Link>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <PublishToggle value={veroeffentlicht} onChange={setVeroeffentlicht} />

        <FormError message={error} />

        <div className="field">
          <label className="field-label" htmlFor="titel">Titel *</label>
          <input
            id="titel"
            className="field-input"
            value={titel}
            onChange={e => setTitel(e.target.value)}
            required
            placeholder="z.B. Wurf 2018 — Tabitha × Cooper"
          />
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="datum">Datum *</label>
            <input
              id="datum"
              className="field-input"
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="anzahl">Anzahl Welpen</label>
            <input
              id="anzahl"
              className="field-input"
              type="number"
              min={0}
              value={anzahlWelpen}
              onChange={e => setAnzahlWelpen(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="mutter">Mutter</label>
            <input
              id="mutter"
              className="field-input"
              value={mutterName}
              onChange={e => setMutterName(e.target.value)}
              placeholder="Name der Mutter"
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="vater">Vater</label>
            <input
              id="vater"
              className="field-input"
              value={vaterName}
              onChange={e => setVaterName(e.target.value)}
              placeholder="Name des Vaters"
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="beschreibung">Beschreibung</label>
          <textarea
            id="beschreibung"
            className="field-input field-textarea"
            rows={4}
            value={beschreibung}
            onChange={e => setBeschreibung(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">Fotos</label>
          <GalerieUpload
            bucket="ehemalige-fotos"
            entityId={savedId}
            bilder={bilder}
            onChange={setBilder}
          />
        </div>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
        </div>
      </form>
    </div>
  )
}
