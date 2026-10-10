const LABELS = ['Details', 'Plan', 'Review']

export default function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="stepper" aria-label="Progress">
      {LABELS.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={label} className={`stepper-item ${state}`} aria-current={n === step ? 'step' : undefined}>
            <span className="stepper-dot">{n < step ? '\u2713' : n}</span>
            <span className="stepper-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
