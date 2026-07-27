import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePosts, usePost } from '../hooks/usePosts'
import { PublishToggle } from '../components/PublishToggle'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import { PageSpinner } from '../components/Spinner'

export function PostFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { post, loading: postLoading } = usePost(id)
  const { create, update } = usePosts()

  const [titel, setTitel] = useState('')
  const [datum, setDatum] = useState(new Date().toISOString().slice(0, 10))
  const [auszug, setAuszug] = useState('')
  const [inhalt, setInhalt] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [imagesText, setImagesText] = useState('')
  const [veroeffentlicht, setVeroeffentlicht] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    if (!post) return
    setTitel(post.titel)
    setDatum(post.datum)
    setAuszug(post.auszug ?? '')
    setInhalt(post.inhalt)
    setVideoUrl(post.video_url ?? '')
    setImagesText(Array.isArray(post.images) ? (post.images as string[]).join('\n') : '')
    setVeroeffentlicht(post.veroeffentlicht)
  }, [post])

  const parseImages = (text: string): string[] | null => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    return lines.length > 0 ? lines : null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload = {
        titel: titel.trim(),
        datum,
        auszug: auszug.trim() || null,
        inhalt: inhalt.trim(),
        video_url: videoUrl.trim() || null,
        images: parseImages(imagesText),
        veroeffentlicht,
      }
      if (isEdit && id) {
        await update(id, payload)
      } else {
        await create(payload)
      }
      setSaveStatus('success')
      setTimeout(() => navigate('/beitraege'), 750)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(msg)
      triggerShake()
      setSaveStatus('idle')
    }
  }

  if (isEdit && postLoading) return <PageSpinner />

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}</h1>
        <Link to="/beitraege" className="btn btn-ghost">Abbrechen</Link>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <PublishToggle value={veroeffentlicht} onChange={setVeroeffentlicht} />

        <FormError message={error} />

        <div className="form-grid">
          <div className="field">
            <label className="field-label" htmlFor="titel">Titel *</label>
            <input
              id="titel"
              className="field-input"
              type="text"
              value={titel}
              onChange={e => setTitel(e.target.value)}
              required
            />
          </div>
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
        </div>

        <div className="field">
          <label className="field-label" htmlFor="auszug">Kurztext (optional)</label>
          <textarea
            id="auszug"
            className="field-input field-textarea"
            rows={2}
            value={auszug}
            onChange={e => setAuszug(e.target.value)}
            placeholder="Wird als Vorschautext auf der Website angezeigt"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="inhalt">Inhalt (optional)</label>
          <textarea
            id="inhalt"
            className="field-input field-textarea"
            rows={6}
            value={inhalt}
            onChange={e => setInhalt(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="videoUrl">Video-URL (optional)</label>
          <input
            id="videoUrl"
            className="field-input"
            type="url"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… oder https://vimeo.com/…"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="images">Bild-URLs (optional, eine pro Zeile)</label>
          <textarea
            id="images"
            className="field-input field-textarea"
            rows={3}
            value={imagesText}
            onChange={e => setImagesText(e.target.value)}
            placeholder={'https://beispiel.de/bild1.jpg\nhttps://beispiel.de/bild2.jpg'}
          />
        </div>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
        </div>
      </form>
    </div>
  )
}
