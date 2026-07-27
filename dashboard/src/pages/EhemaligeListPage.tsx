import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useEhemalige } from '../hooks/useEhemalige'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PublishToggle } from '../components/PublishToggle'
import { PageSpinner } from '../components/Spinner'
import { supabase } from '../lib/supabaseClient'

export function EhemaligeListPage() {
  const { items, loading, error, reload, softDelete } = useEhemalige()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleTogglePublish = async (id: string, current: boolean) => {
    await supabase.from('ehemalige').update({ veroeffentlicht: !current }).eq('id', id)
    await reload()
  }

  if (loading) return <p className="page-loading">Lädt…</p>
  if (error) return <p className="error-text">{error}</p>

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Ehemalige</h1>
        <Link to="/ehemalige/neu" className="btn btn-primary">+ Neuer Eintrag</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Noch keine Einträge in der Ehemaligengalerie.</p>
          <Link to="/ehemalige/neu" className="btn btn-primary">Ersten Eintrag erstellen</Link>
        </div>
      ) : (
        <div className="list-table">
          {items.map(item => (
            <div key={item.id} className="list-row">
              <div className="list-row-header">
                <div className="list-row-main">
                  <span className="list-row-title">{item.titel}</span>
                  <span className="list-row-meta">
                    {new Date(item.datum).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                    {item.anzahl_welpen ? ` · ${item.anzahl_welpen} Welpen` : ''}
                  </span>
                </div>
                <div className="list-row-actions">
                  <Link to={`/ehemalige/${item.id}/bearbeiten`} className="btn btn-ghost btn-sm">
                    Bearbeiten
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => setDeleteId(item.id)}
                  >
                    Löschen
                  </button>
                </div>
              </div>
              <PublishToggle
                value={item.veroeffentlicht}
                onChange={() => handleTogglePublish(item.id, item.veroeffentlicht)}
              />
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          onConfirm={async () => { await softDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
