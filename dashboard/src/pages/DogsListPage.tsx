import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDogs } from '../hooks/useDogs'
import { calcAge } from '../lib/calcAge'
import { PageSpinner } from '../components/Spinner'

type Filter = 'alle' | 'live' | 'entwurf'
type GenderFilter = 'alle' | 'Rüde' | 'Hündin'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function DogsListPage() {
  const { dogs, loading } = useDogs()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('alle')
  const [gender, setGender] = useState<GenderFilter>('alle')

  const filtered = dogs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'alle' ? true :
      filter === 'live' ? d.veroeffentlicht :
      !d.veroeffentlicht
    const matchGender = gender === 'alle' ? true : d.geschlecht === gender
    return matchSearch && matchFilter && matchGender
  })

  if (loading) return <PageSpinner />

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Hunde</h1>
        <Link to="/hunde/neu" className="btn btn-primary">+ Neuer Hund</Link>
      </div>

      <input
        className="search-input"
        placeholder="Name suchen…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="chip-group">
        {(['alle', 'live', 'entwurf'] as Filter[]).map(f => (
          <button
            key={f}
            className={`chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'alle' ? 'Alle' : f === 'live' ? 'Veröffentlicht' : 'Entwurf'}
          </button>
        ))}
      </div>

      <div className="chip-group">
        {(['alle', 'Rüde', 'Hündin'] as GenderFilter[]).map(g => (
          <button
            key={g}
            className={`chip${gender === g ? ' active' : ''}`}
            onClick={() => setGender(g)}
          >
            {g === 'alle' ? 'Alle Geschlechter' : g}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">Keine Hunde gefunden</div>
          <div className="empty-state-text">
            {search ? `Keine Treffer für „${search}"` : 'Noch keine Hunde angelegt.'}
          </div>
          {!search && (
            <Link to="/hunde/neu" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
              Ersten Hund anlegen
            </Link>
          )}
        </div>
      ) : (
        <div className="dog-grid">
          {filtered.map(dog => (
            <Link key={dog.id} to={`/hunde/${dog.id}`} className="dog-card">
              <div
                className="dog-avatar"
                style={dog.foto_url ? { backgroundImage: `url(${dog.foto_url})` } : undefined}
              >
                {!dog.foto_url && initials(dog.name)}
              </div>
              <div className="dog-card-body">
                <div className="dog-card-name">{dog.name}</div>
                <div className="dog-card-meta">{calcAge(dog.geburtsdatum)} · {dog.geschlecht}</div>
                <span className={`badge ${dog.veroeffentlicht ? 'badge-live' : 'badge-hidden'}`}>
                  {dog.veroeffentlicht ? 'Veröffentlicht' : 'Entwurf'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
