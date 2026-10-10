import { useEffect, useState } from 'react'
import {
  ApiError,
  createLead,
  getQuotes,
  type FieldError,
  type LeadResult,
  type PlanQuote,
} from './api'
import { formatINR, type FormValues } from './helpers'
import CopyButton from './CopyButton'

interface Props {
  values: FormValues
  planId: string
  onBack: () => void
  onReset: () => void
}

export default function ConfirmStep({ values, planId, onBack, onReset }: Props) {
  const [quote, setQuote] = useState<PlanQuote | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([])
  const [result, setResult] = useState<LeadResult | null>(null)

  useEffect(() => {
    getQuotes({
      netWeightGrams: Number(values.netWeightGrams),
      grossWeightGrams: Number(values.grossWeightGrams),
      karat: Number(values.karat),
    })
      .then((r) => setQuote(r.quotes.find((q) => q.planId === planId) ?? null))
      .catch(() => setError('Could not load your offer. Please go back and try again.'))
  }, [values, planId])

  async function submit() {
    setSubmitting(true)
    setError('')
    setFieldErrors([])
    try {
      const r = await createLead({
        name: values.name.trim(),
        mobileNumber: values.mobileNumber,
        grossWeightGrams: Number(values.grossWeightGrams),
        netWeightGrams: Number(values.netWeightGrams),
        karat: Number(values.karat),
        planId,
      })
      setResult(r)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        setFieldErrors(e.fields)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="card success-card">
        <div className="success-icon" aria-hidden="true">{'\u2713'}</div>
        <h2>Application submitted</h2>
        <div className="success-id" role="status">
          <span>Your application ID</span>
          <strong>{result.applicationId}</strong>
          <CopyButton text={result.applicationId} />
        </div>
        <p>
          Preliminary loan amount: <strong>{formatINR(result.eligibleLoan)}</strong>
        </p>
        <p className="muted">This is a preliminary offer, not a final approval.</p>
        <button className="btn" onClick={onReset}>
          Start a new application
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>Step 3 of 3: Review and submit</h2>
      {error && (
        <div className="banner error" role="alert">
          {error}
          {fieldErrors.length > 0 && (
            <ul>
              {fieldErrors.map((f) => (
                <li key={f.field}>
                  {f.field}: {f.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <dl className="summary">
        <dt className="muted">Name</dt>
        <dd>{values.name.trim()}</dd>
        <dt className="muted">Mobile</dt>
        <dd>{values.mobileNumber}</dd>
        <dt className="muted">Gold</dt>
        <dd>
          {values.netWeightGrams} g net / {values.grossWeightGrams} g gross, {values.karat}K
        </dd>
        <dt className="muted">Plan</dt>
        <dd>{quote?.planName ?? planId}</dd>
        <dt className="muted">Eligible loan</dt>
        <dd>
          <strong>{quote ? formatINR(quote.eligibleLoan) : '…'}</strong>
        </dd>
      </dl>
      <div className="btn-row">
        <button className="btn secondary" onClick={onBack} disabled={submitting}>
          Back
        </button>
        <button className="btn" onClick={submit} disabled={submitting || !quote}>
          {submitting ? 'Submitting…' : 'Submit application'}
        </button>
      </div>
    </div>
  )
}
