import { useState } from 'react'
import ChatPanel from './ChatPanel'
import AdminTable from './AdminTable'
import ApplyFlow from './ApplyFlow'

type Tab = 'apply' | 'chat' | 'admin'

const TABS: { id: Tab; label: string }[] = [
  { id: 'apply', label: 'Apply' },
  { id: 'chat', label: 'Loan Assist' },
  { id: 'admin', label: 'Admin' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('apply')

  return (
    <>
      <header className="app-header">
        <h1>Gold Loan Portal</h1>
        <p>Get a preliminary offer in a minute</p>
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
        {tab === 'apply' && <ApplyFlow />}
        {tab === 'chat' && <ChatPanel />}
        {tab === 'admin' && <AdminTable />}
      </main>
    </>
  )
}
