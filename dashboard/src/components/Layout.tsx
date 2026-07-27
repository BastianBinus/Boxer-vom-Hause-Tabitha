import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Horizon } from '@theme-toggles/react'
import '@theme-toggles/react/dist/styles/horizon.css'

const NAV = [
  {
    to: '/beitraege',
    label: 'Beiträge',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    to: '/hunde',
    label: 'Hunde',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    to: '/ehemalige',
    label: 'Ehemalige',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    to: '/wuerfe',
    label: 'Würfe',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/kaeufer',
    label: 'Käufer',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    to: '/papierkorb',
    label: 'Papierkorb',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      </svg>
    ),
  },
]


export function Layout() {
  const { logout } = useAuth()

  const [dark, setDark] = useState(() =>
    localStorage.getItem('bvt_theme') === 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '')
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('bvt_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">Haus Tabitha</span>
          <span className="sidebar-brand-kicker">Admin</span>
        </div>

        <div className="nav-group">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <Horizon
            duration={750}
            onClick={() => setDark(d => !d)}
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: 'flex-start', padding: '11px 12px', width: '100%', gap: 8, fontSize: 20 }}
            aria-label={dark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={logout}
            style={{ justifyContent: 'flex-start', padding: '11px 12px', width: '100%' }}
          >
            Abmelden
          </button>
        </div>
      </nav>

      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>

      <nav className="bottom-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="bottom-nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
        <Horizon
          duration={750}
          onClick={() => setDark(d => !d)}
          className="bottom-nav-item"
          style={{ fontSize: 20 }}
          aria-label={dark ? 'Hellmodus aktivieren' : 'Dunkelmodus aktivieren'}
        />
      </nav>
    </div>
  )
}
