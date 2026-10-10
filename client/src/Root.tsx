import { useState } from 'react'
import App from './App'
import Landing from './Landing'
import './transition.css'

type Phase = 'landing' | 'leaving' | 'app'

export default function Root() {
  const [phase, setPhase] = useState<Phase>('landing')

  const start = () => {
    if (phase !== 'landing') return
    setPhase('leaving')
    window.setTimeout(() => {
      window.scrollTo(0, 0)
      setPhase('app')
    }, 400)
  }

  if (phase === 'app') {
    return (
      <div className="fade-in">
        <App />
      </div>
    )
  }

  return (
    <div className={phase === 'leaving' ? 'fade-out' : 'fade-in'}>
      <Landing onStart={start} />
    </div>
  )
}
