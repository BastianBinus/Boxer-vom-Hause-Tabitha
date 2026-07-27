import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useBuyers } from '../hooks/useBuyers'
import { useShake } from '../hooks/useShake'
import { FormError } from '../components/FormError'
import { StatusButton } from '../components/StatusButton'
import type { SaveStatus } from '../components/StatusButton'
import type { Tables, TablesInsert } from '../types/database.types'

export function SaleFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const { buyers } = useBuyers()

  const [wurfId, setWurfId] = useState(searchParams.get('wurf_id') ?? '')
  const [welpeLabel, setWelpeLabel] = useState('')
  const [kaeufer_id, setKaeuferId] = useState('')
  const [datum, setDatum] = useState('')
  const [preis, setPreis] = useState('')
  const [notiz, setNotiz] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const triggerShake = useShake(formRef)

  useEffect(() => {
    if (!isEdit || !id) return
    supabase.from('verkaeufe').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return
      const s = data as Tables<'verkaeufe'>
      setWurfId(s.wurf_id ?? '')
      setWelpeLabel(s.welpe_label)
      setKaeuferId(s.kaeufer_id ?? '')
      setDatum(s.datum)
      setPreis(s.preis != null ? String(s.preis) : '')
      setNotiz(s.notiz ?? '')
    })
  }, [id, isEdit])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveStatus('loading')
    setError(null)
    try {
      const payload: TablesInsert<'verkaeufe'> = {
        wurf_id: wurfId,
        welpe_label: welpeLabel,
        kaeufer_id,
        datum,
        preis: preis ? Number(preis) : null,
        notiz: notiz || null,
      }
      if (isEdit && id) {
        const { error: e } = await supabase.from('verkaeufe').update(payload).eq('id', id)
        if (e) throw e
      } else {
        const { error: e } = await supabase.from('verkaeufe').insert(payload)
        if (e) throw e
      }
      setSaveStatus('success')
      setTimeout(() => navigate(`/wuerfe/${wurfId}/verkaeufe`), 750)
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
        <h1 className="page-title">{isEdit ? 'Verkauf bearbeiten' : 'Neuer Verkauf'}</h1>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="form">
        <FormError message={error} />

        <div className="form-grid">
          <div className="field">
            <label className="field-label">Welpe *</label>
            <input
              className="field-input"
              value={welpeLabel}
              onChange={e => setWelpeLabel(e.target.value)}
              required
              placeholder="z. B. Welpe 1 — Rüde brindled"
            />
          </div>
          <div className="field">
            <label className="field-label">Datum *</label>
            <input
              className="field-input"
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Käufer</label>
            <select className="field-input" value={kaeufer_id} onChange={e => setKaeuferId(e.target.value)} required>
              <option value="">— auswählen —</option>
              {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Preis (CHF)</label>
            <input
              className="field-input"
              type="number"
              min={0}
              step={50}
              value={preis}
              onChange={e => setPreis(e.target.value)}
              placeholder="z. B. 2000"
            />
          </div>
        </div>

        <div className="field">
          <label className="field-label">Notiz</label>
          <textarea className="field-input field-textarea" value={notiz} onChange={e => setNotiz(e.target.value)} />
        </div>

        <div className="form-actions">
          <StatusButton status={saveStatus}>Speichern</StatusButton>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(wurfId ? `/wuerfe/${wurfId}/verkaeufe` : '/wuerfe')}>
            Abbrechen
          </button>
        </div>
      </form>
    </>
  )
}
