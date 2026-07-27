import { Spinner } from './Spinner'

export type SaveStatus = 'idle' | 'loading' | 'success'

interface StatusButtonProps {
  status: SaveStatus
  children?: React.ReactNode
  type?: 'submit' | 'button'
  className?: string
  onClick?: () => void
}

export function StatusButton({
  status,
  children = 'Speichern',
  type = 'submit',
  className = 'btn btn-primary',
  onClick,
}: StatusButtonProps) {
  return (
    <button
      type={type}
      className={`status-btn ${className}${status === 'success' ? ' status-btn--success' : ''}`.trim()}
      disabled={status === 'loading'}
      aria-busy={status === 'loading'}
      onClick={onClick}
    >
      {status === 'loading' && <Spinner size={14} className="status-btn-spinner" />}
      {status === 'success' && <span className="status-btn-icon" aria-hidden="true">✓</span>}
      <span>
        {status === 'loading' ? 'Wird gespeichert…' :
         status === 'success' ? 'Gespeichert!' :
         children}
      </span>
    </button>
  )
}
