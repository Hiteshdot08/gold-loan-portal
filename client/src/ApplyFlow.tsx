import { useState } from 'react'
import ConfirmStep from './ConfirmStep'
import DetailsStep from './DetailsStep'
import QuoteStep from './QuoteStep'
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

  function reset() {
    setValues(EMPTY)
    setTouched({})
    setPlanId('')
    setStep(1)
  }

  if (step === 1) {
    return (
      <DetailsStep
        values={values}
        errors={errors}
        touched={touched}
        onChange={onChange}
        onBlur={onBlur}
        onNext={() => setStep(2)}
      />
    )
  }
  if (step === 2) {
    return (
      <QuoteStep
        values={values}
        selectedPlanId={planId}
        onSelect={setPlanId}
        onBack={() => setStep(1)}
        onNext={() => setStep(3)}
      />
    )
  }
  return (
    <ConfirmStep
      values={values}
      planId={planId}
      onBack={() => setStep(2)}
      onReset={reset}
    />
  )
}
