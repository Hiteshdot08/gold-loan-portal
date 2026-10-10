import { useEffect, useState } from 'react'
import { getLeads, getPlans, type LeadRow, type Plan } from './api'
import { formatINR } from './helpers'

export default function AdminTable() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [planId, setPlanId] = useState('')
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getPlans().then(setPlans).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getLeads(planId || undefined)
      .then((rows) => {
        if (!cancelled) setLeads(rows)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load leads')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id

  return (
    <div className="card">
      <h2>
        Leads
        {!loading && !error && <span className="count">{leads.length}</span>}
      </h2>
      <div className="field">
        <label htmlFor="planFilter">Filter by plan</label>
        <select id="planFilter" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">All plans</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="banner error" role="alert">
          {error}
        </div>
      )}
      {loading && <p className="muted">Loading…</p>}
      {!loading && !error && leads.length === 0 && (
        <div className="empty">
          <div className="empty-icon" aria-hidden="true">{'\u2205'}</div>
          <p>No applications yet.</p>
          <span className="muted">Submitted leads will show up here, newest first.</span>
        </div>
      )}

      {!loading && leads.length > 0 && (
        <div className="table-wrap">
          <table className="leads">
            <thead>
              <tr>
                <th>ID</th>
                <th>Mobile</th>
                <th>Net (g)</th>
                <th>Plan</th>
                <th>Loan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.applicationId}>
                  <td>{l.applicationId}</td>
                  <td>{l.mobileNumber}</td>
                  <td>{l.netWeightGrams}</td>
                  <td>{planName(l.planId)}</td>
                  <td>{formatINR(l.eligibleLoan)}</td>
                  <td>
                    <span className="status-pill">{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
