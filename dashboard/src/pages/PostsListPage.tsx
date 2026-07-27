import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PublishToggle } from '../components/PublishToggle'
import { PageSpinner } from '../components/Spinner'
import { supabase } from '../lib/supabaseClient'

export function PostsListPage() {
  const { posts, loading, error, reload, softDelete } = usePosts()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleTogglePublish = async (id: string, current: boolean) => {
    await supabase.from('beitraege').update({ veroeffentlicht: !current }).eq('id', id)
    await reload()
  }

  if (loading) return <p className="page-loading">Lädt…</p>
  if (error) return <p className="error-text">{error}</p>

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Beiträge</h1>
        <Link to="/beitraege/neu" className="btn btn-primary">
          + Neuer Beitrag
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>Noch keine Beiträge erfasst.</p>
          <Link to="/beitraege/neu" className="btn btn-primary">
            Ersten Beitrag erstellen
          </Link>
        </div>
      ) : (
        <div className="list-table">
          {posts.map(post => (
            <div key={post.id} className="list-row">
              <div className="list-row-header">
                <div className="list-row-main">
                  <span className="list-row-title">{post.titel}</span>
                  <span className="list-row-meta">
                    {new Date(post.datum).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="list-row-actions">
                  <Link to={`/beitraege/${post.id}/bearbeiten`} className="btn btn-ghost btn-sm">
                    Bearbeiten
                  </Link>
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={() => setDeleteId(post.id)}
                  >
                    Löschen
                  </button>
                </div>
              </div>
              <PublishToggle
                value={post.veroeffentlicht}
                onChange={() => handleTogglePublish(post.id, post.veroeffentlicht)}
              />
            </div>
          ))}
        </div>
      )}

      {deleteId && (
        <ConfirmDeleteDialog
          onConfirm={async () => {
            await softDelete(deleteId)
            setDeleteId(null)
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
