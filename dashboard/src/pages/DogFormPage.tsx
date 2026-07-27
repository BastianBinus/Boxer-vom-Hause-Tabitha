import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useDogs, useDog } from '../hooks/useDogs'
import { PublishToggle } from '../components/PublishToggle'
import { PhotoUpload } from '../components/PhotoUpload'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import { PageSpinner } from '../components/Spinner'
import type { TablesInsert } from '../types/database.types'

type ParentMode = 'db' | 'extern'

export function DogFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { dog, loading: dogLoading } = useDog(id)
  const { create, update } = useDogs()

  const [name, setName] = useState('')
  const [geburtsdatum, setGeburtsdatum] = useState('')
  const [geschlecht, setGeschlecht] = useState('Hündin')
  const [veroeffentlicht, setVeroeffentlicht] = useState(false)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState('')

  const [mutterMode, setMutterMode] = useState<ParentMode>('extern')
  const [mutterId, setMutterId] = useState('')
  const [mutterExternName, setMutterExternName] = useState('')
  const [mutterExternZwinger, setMutterExternZwinger] = useState('')

  const [vaterMode, setVaterMode] = useState<ParentMode>('extern')
  const [vaterId, setVaterId] = useState('')
  const [vaterExternName, setVaterExternName] = useState('')
  const [vaterExternZwinger, setVaterExternZwinger] = useState('')

  const [allDogs, setAllDogs] = useState<Array<{ id: string; name: string }>>([])
  const [savedId, setSavedId] = useState<string | null>(id ?? null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    supabase.from('hunde').select('id, name').is('deleted_at', null).order('name').then(({ data }) => {
      setAllDogs(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!dog) return
    setName(dog.name)
    setGeburtsdatum(dog.geburtsdatum)
    setGeschlecht(dog.geschlecht)
    setVeroeffentlicht(dog.veroeffentlicht)
    setFotoUrl(dog.foto_url)
    setVideoUrl(dog.video_url ?? '')
    setSavedId(dog.id)
    if (dog.mutter_id) {
      setMutterMode('db')
      setMutterId(dog.mutter_id)
    } else {
      setMutterMode('extern')
      setMutterExternName(dog.mutter_extern_name ?? '')
      setMutterExternZwinger(dog.mutter_extern_zwinger ?? '')
    }
    if (dog.vater_id) {
      setVaterMode('db')
      setVaterId(dog.vater_id)
    } else {
      setVaterMode('extern')
      setVaterExternName(dog.vater_extern_name ?? '')
      setVaterExternZwinger(dog.vater_extern_zwinger ?? '')
    }
  }, [dog])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload: TablesInsert<'hunde'> = {
        name,
        geburtsdatum,
        geschlecht,
        veroeffentlicht,
        foto_url: fotoUrl,
        video_url: videoUrl || null,
        mutter_id: mutterMode === 'db' ? (mutterId || null) : null,
        mutter_extern_name: mutterMode === 'extern' ? (mutterExternName || null) : null,
        mutter_extern_zwinger: mutterMode === 'extern' ? (mutterExternZwinger || null) : null,
        vater_id: vaterMode === 'db' ? (vaterId || null) : null,
        vater_extern_name: vaterMode === 'extern' ? (vaterExternName || null) : null,
        vater_extern_zwinger: vaterMode === 'extern' ? (vaterExternZwinger || null) : null,
      }
      if (isEdit && savedId) {
        await update(savedId, payload)
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 1500)
      } else {
        const newDog = await create(payload)
        setSavedId(newDog.id)
        setSaveStatus('success')
        setTimeout(() => navigate(`/hunde/${newDog.id}/bearbeiten`, { replace: true }), 750)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(msg)
      triggerShake()
      setSaveStatus('idle')
    }
  }

  const otherDogs = allDogs.filter(d => d.id !== savedId)

  if (isEdit && dogLoading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Hund bearbeiten' : 'Neuer Hund'}</h1>
        {savedId && (
          <Link to={`/hunde/${savedId}`} className="btn btn-ghost btn-sm">
            Zum Hund →
          </Link>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <PublishToggle value={veroeffentlicht} onChange={setVeroeffentlicht} />

        <FormError message={error} />

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="name">Name *</label>
            <input
              id="name"
              className="field-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="geburtsdatum">Geburtsdatum *</label>
            <input
              id="geburtsdatum"
              className="field-input"
              type="date"
              value={geburtsdatum}
              onChange={e => setGeburtsdatum(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="geschlecht">Geschlecht *</label>
            <select
              id="geschlecht"
              className="field-input"
              value={geschlecht}
              onChange={e => setGeschlecht(e.target.value)}
            >
              <option>Hündin</option>
              <option>Rüde</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Foto</label>
          <PhotoUpload
            hundId={savedId}
            currentUrl={fotoUrl}
            onUpload={url => setFotoUrl(url)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="video_url">Video-URL (YouTube / Vimeo)</label>
          <input
            id="video_url"
            className="field-input"
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
          />
          <div className="field-hint">Optional — wird auf der Profilseite eingebettet.</div>
        </div>

        <fieldset>
          <legend>Mutter</legend>
          <div className="radio-group" style={{ marginBottom: 12 }}>
            <label className="radio-label">
              <input type="radio" checked={mutterMode === 'db'} onChange={() => setMutterMode('db')} />
              In Datenbank
            </label>
            <label className="radio-label">
              <input type="radio" checked={mutterMode === 'extern'} onChange={() => setMutterMode('extern')} />
              Extern
            </label>
          </div>
          {mutterMode === 'db' ? (
            <select className="field-input" value={mutterId} onChange={e => setMutterId(e.target.value)}>
              <option value="">— auswählen —</option>
              {otherDogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : (
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Name</label>
                <input className="field-input" value={mutterExternName} onChange={e => setMutterExternName(e.target.value)} placeholder="z. B. Luna" />
              </div>
              <div className="field">
                <label className="field-label">Zwinger</label>
                <input className="field-input" value={mutterExternZwinger} onChange={e => setMutterExternZwinger(e.target.value)} placeholder="z. B. vom Bergblick" />
              </div>
            </div>
          )}
        </fieldset>

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
              {otherDogs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : (
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Name</label>
                <input className="field-input" value={vaterExternName} onChange={e => setVaterExternName(e.target.value)} placeholder="z. B. Rex" />
              </div>
              <div className="field">
                <label className="field-label">Zwinger</label>
                <input className="field-input" value={vaterExternZwinger} onChange={e => setVaterExternZwinger(e.target.value)} placeholder="z. B. vom Waldrand" />
              </div>
            </div>
          )}
        </fieldset>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(savedId ? `/hunde/${savedId}` : '/hunde')}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </>
  )
}
