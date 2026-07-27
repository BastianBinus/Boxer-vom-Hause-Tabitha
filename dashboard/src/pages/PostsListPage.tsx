import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../hooks/usePosts'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { PublishToggle } from '../components/PublishToggle'
import { PageSpinner } from '../components/Spinner'
import { supabase } from '../lib/supabaseClient'

type PublishFilter = 'alle' | 'live' | 'entwurf'

export function PostsListPage() {
  const { posts, loading, error, reload, softDelete } = usePosts()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PublishFilter>('alle')
  const [year, setYear] = useState('alle')

  const handleTogglePublish = async (id: string, current: boolean) => {
    await supabase.from('beitraege').update({ veroeffentlicht: !current }).eq('id', id)
    await reload()
  }

  const years = ['alle', ...Array.from(
    new Set(posts.map(p => p.datum?.slice(0, 4)).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a))]

  const filtered = posts.filter(p => {
    const matchSearch = p.titel.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'alle' ? true : filter === 'live' ? p.veroeffentlicht : !p.veroeffentlicht
    const matchYear = year === 'alle' ? true : p.datum?.startsWith(year)
    return matchSearch && matchFilter && matchYear
  })

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

      <input
        className="search-input"
        placeholder="Titel suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="chip-group">
        {(['alle', 'live', 'entwurf'] as PublishFilter[]).map(f => (
          <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'alle' ? 'Alle' : f === 'live' ? 'Veröffentlicht' : 'Entwurf'}
          </button>
        ))}
      </div>

      {years.length > 1 && (
        <div className="chip-group">
          {years.map(y => (
            <button key={y} className={`chip${year === y ? ' active' : ''}`} onClick={() => setYear(y)}>
              {y === 'alle' ? 'Alle Jahre' : y}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>{search || filter !== 'alle' || year !== 'alle' ? 'Keine Treffer.' : 'Noch keine Beiträge erfasst.'}</p>
          {!search && filter === 'alle' && year === 'alle' && (
            <Link to="/beitraege/neu" className="btn btn-primary">
              Ersten Beitrag erstellen
            </Link>
          )}
        </div>
      ) : (
        <div className="list-table">
          {filtered.map(post => (
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
