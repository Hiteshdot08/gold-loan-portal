import type { FormErrors, FormValues } from './helpers'

interface Props {
  values: FormValues
  errors: FormErrors
  touched: Partial<Record<keyof FormValues, boolean>>
  onChange: (key: keyof FormValues, value: string) => void
  onBlur: (key: keyof FormValues) => void
  onNext: () => void
}

interface FieldProps {
  id: keyof FormValues
  label: string
  value: string
  error?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  maxLength?: number
  placeholder?: string
  onChange: (key: keyof FormValues, value: string) => void
  onBlur: (key: keyof FormValues) => void
}

function Field(p: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={p.id}>{p.label}</label>
      <input
        id={p.id}
        value={p.value}
        inputMode={p.inputMode}
        maxLength={p.maxLength}
        placeholder={p.placeholder}
        aria-invalid={!!p.error}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        onChange={(e) => p.onChange(p.id, e.target.value)}
        onBlur={() => p.onBlur(p.id)}
      />
      {p.error && (
        <div id={`${p.id}-err`} className="field-error" role="alert">
          {p.error}
        </div>
      )}
    </div>
  )
}

export default function DetailsStep({ values, errors, touched, onChange, onBlur, onNext }: Props) {
  const err = (k: keyof FormValues) => (touched[k] ? errors[k] : undefined)
  const common = { onChange, onBlur }
  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="card">
      <h2>Step 1 of 3: Your details</h2>
      <Field id="name" label="Full name" value={values.name} error={err('name')}
        placeholder="Ravi Kumar" {...common} />
      <Field id="mobileNumber" label="Mobile number" value={values.mobileNumber}
        error={err('mobileNumber')} inputMode="numeric" maxLength={10}
        placeholder="9876543210" {...common} />
      <div className="row">
        <Field id="grossWeightGrams" label="Gross weight (g)" value={values.grossWeightGrams}
          error={err('grossWeightGrams')} inputMode="decimal" placeholder="50" {...common} />
        <Field id="netWeightGrams" label="Net weight (g)" value={values.netWeightGrams}
          error={err('netWeightGrams')} inputMode="decimal" placeholder="45" {...common} />
      </div>
      <div className="field">
        <label htmlFor="karat">Karat</label>
        <select id="karat" value={values.karat} onChange={(e) => onChange('karat', e.target.value)}>
          <option value="18">18K</option>
          <option value="22">22K</option>
          <option value="24">24K</option>
        </select>
      </div>
      <button className="btn" disabled={hasErrors} onClick={onNext}>
        See my offers
      </button>
    </div>
  )
}
