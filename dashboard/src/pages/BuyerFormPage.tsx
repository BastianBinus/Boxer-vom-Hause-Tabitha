import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useBuyers } from '../hooks/useBuyers'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import type { TablesInsert } from '../types/database.types'

export function BuyerFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const { buyers, create, update } = useBuyers()

  const [name, setName] = useState('')
  const [ort, setOrt] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')
  const [notiz, setNotiz] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    if (!isEdit) return
    const buyer = buyers.find(b => b.id === id)
    if (!buyer) return
    setName(buyer.name)
    setOrt(buyer.ort ?? '')
    setEmail(buyer.email ?? '')
    setTelefon(buyer.telefon ?? '')
    setNotiz(buyer.notiz ?? '')
  }, [buyers, id, isEdit])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload: TablesInsert<'kaeufer'> = {
        name,
        ort: ort || null,
        email: email || null,
        telefon: telefon || null,
        notiz: notiz || null,
      }
      if (isEdit && id) await update(id, payload)
      else await create(payload)
      setSaveStatus('success')
      setTimeout(() => navigate('/kaeufer'), 750)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(msg)
      triggerShake()
      setSaveStatus('idle')
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Käufer bearbeiten' : 'Neuer Käufer'}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <FormError message={error} />

        <div className="form-grid">
          <div className="field">
            <label className="field-label">Name *</label>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Ort</label>
            <input className="field-input" value={ort} onChange={e => setOrt(e.target.value)} placeholder="z. B. Zürich" />
          </div>
          <div className="field">
            <label className="field-label">E-Mail</label>
            <input className="field-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Telefon</label>
            <input className="field-input" type="tel" value={telefon} onChange={e => setTelefon(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Notiz</label>
          <textarea className="field-input field-textarea" value={notiz} onChange={e => setNotiz(e.target.value)} />
        </div>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/kaeufer')}>
            Abbrechen
          </button>
        </div>
      </form>
    </>
  )
}
