import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSales } from '../hooks/useSales'
import { useBuyers } from '../hooks/useBuyers'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PageSpinner } from '../components/Spinner'

export function SalesListPage() {
  const { wurfId } = useParams<{ wurfId: string }>()
  const { sales, loading, softDelete } = useSales(wurfId)
  const { buyers } = useBuyers()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const buyerName = (id: string | null) => buyers.find(b => b.id === id)?.name ?? '—'

  if (loading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Verkäufe</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/wuerfe" className="btn btn-ghost btn-sm">← Würfe</Link>
          <Link to={`/verkaeufe/neu?wurf_id=${wurfId}`} className="btn btn-primary">+ Neu</Link>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="empty-state">Noch keine Verkäufe für diesen Wurf.</div>
      ) : (
        <div className="card-list">
          {sales.map(s => (
            <div key={s.id} className="entity-card">
              <div className="entity-card-thumb">{s.welpe_label.charAt(0).toUpperCase()}</div>
              <div className="entity-card-info">
                <div className="entity-card-name">{s.welpe_label}</div>
                <div className="entity-card-sub">
                  {buyerName(s.kaeufer_id)} · {s.datum}
                  {s.preis != null ? ` · CHF ${s.preis}` : ''}
                </div>
              </div>
              <Link to={`/verkaeufe/${s.id}/bearbeiten`} className="btn btn-ghost btn-sm">
                Bearbeiten
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(s.id)}>
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          title="Verkauf löschen?"
          message="Der Verkauf wird in den Papierkorb verschoben."
          onConfirm={async () => { await softDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
