import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLitters } from '../hooks/useLitters'
import { useDogs } from '../hooks/useDogs'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PageSpinner } from '../components/Spinner'

export function LittersListPage() {
  const { litters, loading, softDelete } = useLitters()
  const { dogs } = useDogs()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const dogName = (id: string) => dogs.find(d => d.id === id)?.name ?? id

  if (loading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Würfe</h1>
        <Link to="/wuerfe/neu" className="btn btn-primary">+ Neu</Link>
      </div>

      {litters.length === 0 ? (
        <div className="empty-state">Noch keine Würfe erfasst.</div>
      ) : (
        <div className="card-list">
          {litters.map(w => (
            <div key={w.id} className="entity-card">
              <div className="entity-card-thumb">{w.datum?.slice(0, 4) ?? 'W'}</div>
              <div className="entity-card-info">
                <div className="entity-card-name">Wurf {w.datum}</div>
                <div className="entity-card-sub">
                  Mutter: {dogName(w.mutter_id)} · {w.anzahl_ruden} Rüden, {w.anzahl_huendinnen} Hündinnen
                </div>
              </div>
              <Link
                to={`/wuerfe/${w.id}/verkaeufe`}
                className="btn btn-ghost btn-sm"
                onClick={e => e.stopPropagation()}
              >
                Verkäufe
              </Link>
              <Link
                to={`/wuerfe/${w.id}/bearbeiten`}
                className="btn btn-ghost btn-sm"
                onClick={e => e.stopPropagation()}
              >
                Bearbeiten
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(w.id)}>
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          title="Wurf löschen?"
          message="Der Wurf und seine Verkäufe werden in den Papierkorb verschoben."
          onConfirm={async () => { await softDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
