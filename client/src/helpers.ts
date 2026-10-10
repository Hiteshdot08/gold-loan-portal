import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

export interface FormValues {
  name: string
  mobileNumber: string
  grossWeightGrams: string
  netWeightGrams: string
  karat: string
}

export type FormErrors = Partial<Record<keyof FormValues, string>>

// Same rules as the server's Zod schemas.
export function validate(v: FormValues): FormErrors {
  const e: FormErrors = {}
  if (!/^[A-Za-z ]{2,60}$/.test(v.name.trim()))
    e.name = 'Name must be 2-60 letters and spaces only'
  if (!/^[6-9]\d{9}$/.test(v.mobileNumber))
    e.mobileNumber = 'Enter a valid 10-digit Indian mobile number'
  const gross = Number(v.grossWeightGrams)
  const net = Number(v.netWeightGrams)
  if (!(gross > 0 && gross <= 1000))
    e.grossWeightGrams = 'Gross weight must be above 0 and up to 1000 g'
  if (!(net > 0 && net <= 1000))
    e.netWeightGrams = 'Net weight must be above 0 and up to 1000 g'
  else if (gross > 0 && net > gross)
    e.netWeightGrams = 'Net weight cannot be greater than gross weight'
  if (!['18', '22', '24'].includes(v.karat)) e.karat = 'Choose 18, 22 or 24 karat'
  return e
}
