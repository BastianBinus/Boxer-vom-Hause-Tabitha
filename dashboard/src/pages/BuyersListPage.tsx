import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBuyers } from '../hooks/useBuyers'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PageSpinner } from '../components/Spinner'

export function BuyersListPage() {
  const { buyers, loading, softDelete } = useBuyers()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = buyers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.ort ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Käufer</h1>
        <Link to="/kaeufer/neu" className="btn btn-primary">+ Neu</Link>
      </div>

      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Nach Name oder Ort suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">Keine Käufer gefunden.</div>
      ) : (
        <div className="card-list">
          {filtered.map(b => (
            <div key={b.id} className="entity-card">
              <div className="entity-card-thumb">{b.name.charAt(0).toUpperCase()}</div>
              <div className="entity-card-info">
                <div className="entity-card-name">{b.name}</div>
                <div className="entity-card-sub">
                  {[b.ort, b.email, b.telefon].filter(Boolean).join(' · ')}
                </div>
              </div>
              <Link to={`/kaeufer/${b.id}/bearbeiten`} className="btn btn-ghost btn-sm">
                Bearbeiten
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(b.id)}>
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          title="Käufer löschen?"
          message="Der Käufer wird in den Papierkorb verschoben."
          onConfirm={async () => { await softDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
