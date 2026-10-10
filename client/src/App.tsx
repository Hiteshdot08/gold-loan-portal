import { useState } from 'react'
import ChatPanel from './ChatPanel'
import AdminTable from './AdminTable'
import ApplyFlow from './ApplyFlow'
import './portal.css'

type Tab = 'apply' | 'chat' | 'admin'

const TABS: { id: Tab; label: string }[] = [
  { id: 'apply', label: 'Apply' },
  { id: 'chat', label: 'Loan Assist' },
  { id: 'admin', label: 'Admin' },
]

export default function App({ onHome }: { onHome?: () => void }) {
  const [tab, setTab] = useState<Tab>('apply')

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M12 44 L22 24 H42 L52 44 Z" fill="#e6bc5a" />
              <path d="M22 24 H42 L38 32 H26 Z" fill="#f6dd95" />
              <rect x="8" y="44" width="48" height="8" rx="2" fill="#c49a2e" />
            </svg>
            <div>
              <h1>Gold Loan</h1>
              <p>Get a preliminary offer in a minute</p>
            </div>
          </div>
          {onHome && (
            <button className="home-btn" onClick={onHome}>
              Home
            </button>
          )}
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            className="tab"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'apply' && (
          <section className="intro">
            <h2>
              See what your gold <span>can earn</span>
            </h2>
            <p>Three quick steps. Exact numbers, calculated on the server.</p>
            <div className="chips">
              <span className="chip">No sign-up</span>
              <span className="chip">Live quote</span>
              <span className="chip">Loan capped at 75% of value</span>
            </div>
          </section>
        )}
        <div className="view" key={tab}>
          {tab === 'apply' && <ApplyFlow />}
          {tab === 'chat' && <ChatPanel />}
          {tab === 'admin' && <AdminTable />}
        </div>
      </main>

      <footer className="app-footer">
        Offers are preliminary estimates and not a final approval.
      </footer>
    </>
  )
}
