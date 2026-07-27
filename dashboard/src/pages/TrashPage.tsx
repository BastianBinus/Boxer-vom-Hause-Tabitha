import { useState } from 'react'
import { useTrash } from '../hooks/useTrash'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import type { TrashItem } from '../hooks/useTrash'
import { PageSpinner } from '../components/Spinner'

type TabKey = 'beitraege' | 'ehemalige' | 'hunde' | 'gesundheitschecks' | 'pruefungen' | 'wuerfe' | 'kaeufer' | 'verkaeufe'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'beitraege', label: 'Beiträge' },
  { key: 'ehemalige', label: 'Ehemalige' },
  { key: 'hunde', label: 'Hunde' },
  { key: 'gesundheitschecks', label: 'Gesundheit' },
  { key: 'pruefungen', label: 'Prüfungen' },
  { key: 'wuerfe', label: 'Würfe' },
  { key: 'kaeufer', label: 'Käufer' },
  { key: 'verkaeufe', label: 'Verkäufe' },
]

export function TrashPage() {
  const { items, loading, restore, permanentDelete } = useTrash()
  const [tab, setTab] = useState<TabKey>('beitraege')
  const [confirmItem, setConfirmItem] = useState<TrashItem | null>(null)

  if (loading) return <PageSpinner />

  const current = items[tab] ?? []

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Papierkorb</h1>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
          Einträge werden nach 30 Tagen automatisch gelöscht.
        </span>
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-btn${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {(items[t.key]?.length ?? 0) > 0 && (
              <span className="days-badge">{items[t.key]!.length}</span>
            )}
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <div className="empty-state">Keine gelöschten Einträge.</div>
      ) : (
        <div className="inline-list">
          {current.map(item => (
            <div key={item.id} className="inline-row">
              <div className="inline-row-info">
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <span>Gelöscht: {new Date(item.deleted_at).toLocaleDateString('de-CH')}</span>
                  <span className="days-badge">{item.daysLeft}T übrig</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => restore(item.table, item.id)}
                >
                  Wiederherstellen
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setConfirmItem(item)}
                >
                  Endgültig löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmItem && (
        <ConfirmDeleteDialog
          title="Endgültig löschen?"
          message={`"${confirmItem.label}" wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.`}
          onConfirm={async () => {
            await permanentDelete(confirmItem.table, confirmItem.id)
            setConfirmItem(null)
          }}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </>
  )
}
