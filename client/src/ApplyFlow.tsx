import { useRef, useState } from 'react'
import ConfirmStep from './ConfirmStep'
import DetailsStep from './DetailsStep'
import QuoteStep from './QuoteStep'
import Stepper from './Stepper'
import { validate, type FormValues } from './helpers'

const EMPTY: FormValues = {
  name: '',
  mobileNumber: '',
  grossWeightGrams: '',
  netWeightGrams: '',
  karat: '22',
}

export default function ApplyFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [values, setValues] = useState<FormValues>(EMPTY)
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [planId, setPlanId] = useState('')
  const [leaving, setLeaving] = useState(false)
  const busy = useRef(false)

  const errors = validate(values)

  function onChange(key: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
    setTouched((t) => ({ ...t, [key]: true }))
    if (key === 'netWeightGrams' || key === 'grossWeightGrams' || key === 'karat') {
      setPlanId('')
    }
  }

  function onBlur(key: keyof FormValues) {
    setTouched((t) => ({ ...t, [key]: true }))
  }

  // Fade the current step out, swap it, then let the next one fade in.
  function go(next: 1 | 2 | 3, beforeSwap?: () => void) {
    if (busy.current) return
    busy.current = true
    setLeaving(true)
    window.setTimeout(() => {
      beforeSwap?.()
      setStep(next)
      setLeaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      busy.current = false
    }, 300)
  }

  function reset() {
    go(1, () => {
      setValues(EMPTY)
      setTouched({})
      setPlanId('')
    })
  }

  let content
  if (step === 1) {
    content = (
      <DetailsStep
        values={values}
        errors={errors}
        touched={touched}
        onChange={onChange}
        onBlur={onBlur}
        onNext={() => go(2)}
      />
    )
  } else if (step === 2) {
    content = (
      <QuoteStep
        values={values}
        selectedPlanId={planId}
        onSelect={setPlanId}
        onBack={() => go(1)}
        onNext={() => go(3)}
      />
    )
  } else {
    content = (
      <ConfirmStep values={values} planId={planId} onBack={() => go(2)} onReset={reset} />
    )
  }

  return (
    <>
      <Stepper step={step} />
      <div key={step} className={leaving ? 'step-view leaving' : 'step-view'}>
        {content}
      </div>
    </>
  )
}
