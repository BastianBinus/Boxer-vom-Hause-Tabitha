export function Spinner({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`spinner ${className}`.trim()}
      style={{ '--spinner-size': `${size}px` } as React.CSSProperties}
      role="status"
      aria-label="Wird geladen"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="page-spinner-wrap">
      <Spinner />
    </div>
  )
}
