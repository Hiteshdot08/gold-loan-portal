import { useEffect, useState } from 'react'
import { ApiError, getPlans, getQuotes, type Plan, type PlanQuote } from './api'
import { formatINR, useDebounce, type FormValues } from './helpers'

interface Props {
  values: FormValues
  selectedPlanId: string
  onSelect: (planId: string) => void
  onBack: () => void
  onNext: () => void
}

export default function QuoteStep({ values, selectedPlanId, onSelect, onBack, onNext }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [quotes, setQuotes] = useState<PlanQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const key = useDebounce(
    `${values.netWeightGrams}|${values.grossWeightGrams}|${values.karat}`,
    300
  )

  useEffect(() => {
    getPlans().then(setPlans).catch(() => setError('Could not load loan plans'))
  }, [])

  useEffect(() => {
    let cancelled = false
    const [net, gross, karat] = key.split('|').map(Number)
    setLoading(true)
    setError('')
    getQuotes({ netWeightGrams: net, grossWeightGrams: gross, karat })
      .then((r) => {
        if (!cancelled) setQuotes(r.quotes)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load offers')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [key])

  return (
    <div className="card">
      <h2>Step 2 of 3: Choose your plan</h2>
      <p className="muted">
        {values.netWeightGrams} g net, {values.karat}K gold
      </p>

      {error && (
        <div className="banner error" role="alert">
          {error}
        </div>
      )}
      {loading && (
        <div aria-busy="true" aria-label="Calculating your offers">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {!loading &&
        quotes.map((q) => {
          const plan = plans.find((p) => p.id === q.planId)
          return (
            <button
              key={q.planId}
              className="plan-card"
              aria-pressed={selectedPlanId === q.planId}
              onClick={() => onSelect(q.planId)}
            >
              <h3>{q.planName}</h3>
              {plan && (
                <div className="badges">
                  <span className="badge">{plan.annualInterestRate}% p.a.</span>
                  <span className="badge">{plan.tenureMonths} months</span>
                  <span className="badge">Up to {Math.round(plan.maxLtv * 100)}% LTV</span>
                </div>
              )}
              <div className="plan-caption">Eligible loan</div>
              <div className="plan-loan">{formatINR(q.eligibleLoan)}</div>
              <div className="plan-meta">
                <span>Pure gold: {q.pureGoldGrams} g</span>
                <span>Gold value: {formatINR(q.goldValue)}</span>
              </div>
            </button>
          )
        })}

      <div className="btn-row">
        <button className="btn secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn" disabled={!selectedPlanId || loading} onClick={onNext}>
          Review application
        </button>
      </div>
    </div>
  )
}
