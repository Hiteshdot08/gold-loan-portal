import { useEffect } from 'react'
import './landing.css'

type Props = { onStart: () => void }

export default function Landing({ onStart }: Props) {
  const howItWorks = () =>
    document.getElementById('lp-how')?.scrollIntoView({ behavior: 'smooth' })

  // Fade sections in as they scroll into view
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = document.querySelectorAll<HTMLElement>(
      '.lp-stats-box, .lp-how > h2, .lp-how > p, .lp-step, .lp-faq h2, .lp-faq details, .lp-banner'
    )
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          el.classList.add('in')
          io.unobserve(el)
          window.setTimeout(() => {
            el.classList.remove('lp-reveal', 'in')
            el.style.transitionDelay = ''
          }, 1100)
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el, i) => {
      el.classList.add('lp-reveal')
      el.style.transitionDelay = `${(i % 4) * 70}ms`
      io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <div className="lp">
      <div className="lp-topbar">
        <nav className="lp-nav">
          <div className="lp-logo">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <path d="M12 44 L22 24 H42 L52 44 Z" fill="#e6bc5a" />
              <path d="M22 24 H42 L38 32 H26 Z" fill="#f6dd95" />
              <rect x="8" y="44" width="48" height="8" rx="2" fill="#c49a2e" />
            </svg>
            Gold Loan
          </div>
          <button className="lp-link" onClick={onStart}>Open portal</button>
        </nav>
      </div>

      <div className="lp-hero-wrap">
        

        <header className="lp-hero">
          <div>
            <p className="lp-eyebrow">Preliminary gold-loan offers</p>
            <h1>
              Turn your jewellery into a clear <span>loan offer.</span>
            </h1>
            <p className="lp-lead">
              Enter your gold's weight and purity, and see what you could borrow under each
              repayment plan in seconds. Use the quick form, or just ask Loan Assist.
            </p>
            <div className="lp-actions">
              <button className="lp-btn lp-btn-gold" onClick={onStart}>Check my offer</button>
              <button className="lp-btn lp-btn-ghost" onClick={howItWorks}>How it works</button>
            </div>
          </div>

          <aside className="lp-quote" aria-label="Example quote">
            <span className="lp-quote-tag">Example quote</span>
            <h3>45 g of 22K jewellery</h3>
            <div className="lp-row"><span>Pure gold</span><b>41.25 g</b></div>
            <div className="lp-row"><span>Gold value</span><b>₹2,88,750</b></div>
            <div className="lp-row"><span>Bullet plan (70%)</span><b>₹2,02,125</b></div>
            <div className="lp-loan">
              <small>Monthly EMI plan (75%)</small>
              <strong>₹2,16,562</strong>
            </div>
            <p className="lp-quote-note">Illustration only, using a mock 24K rate of ₹7,000/g.</p>
          </aside>
        </header>
      </div>

      <section className="lp-stats">
        <div className="lp-stats-box">
          <div className="lp-stat"><b>75%</b><span>Maximum loan-to-value</span></div>
          <div className="lp-stat"><b>2</b><span>Repayment plans</span></div>
          <div className="lp-stat"><b>18-24K</b><span>Karats supported</span></div>
          <div className="lp-stat"><b>~1 min</b><span>To get an offer</span></div>
        </div>
      </section>

      <section className="lp-how" id="lp-how">
        <h2>Three steps, no sign-up</h2>
        <p>Nothing to register. Details are only saved when you submit an application.</p>
        <div className="lp-steps">
          <div className="lp-step">
            <div className="lp-num">1</div>
            <h3>Share your details</h3>
            <p>Name, mobile number, gross and net weight, and the karat of your gold.</p>
          </div>
          <div className="lp-step">
            <div className="lp-num">2</div>
            <h3>See your live quote</h3>
            <p>Pure gold, gold value and the eligible loan appear for every plan as you type.</p>
          </div>
          <div className="lp-step">
            <div className="lp-num">3</div>
            <h3>Confirm and apply</h3>
            <p>Review the summary, submit, and get your application ID. Loan Assist can walk you through it.</p>
          </div>
        </div>
      </section>

      <section className="lp-faq">
        <h2>Common questions</h2>
        <details>
          <summary>Do I need to sign up?</summary>
          <p>No. There are no accounts. Your details are only saved when you submit an application.</p>
        </details>
        <details>
          <summary>How is the loan amount worked out?</summary>
          <p>Pure gold is your net weight times karat divided by 24. Its value uses the day's 24K rate, and the loan is that value times the plan's loan-to-value, capped at 75% and rounded down to whole rupees.</p>
        </details>
        <details>
          <summary>Is the offer final?</summary>
          <p>No. It is a preliminary estimate, not an approval.</p>
        </details>
        <details>
          <summary>Can I apply twice?</summary>
          <p>The same mobile number cannot apply again within 7 days. If you try, you will be shown your existing application ID.</p>
        </details>
      </section>

      <div className="lp-wrapper-pad">
        <section className="lp-banner">
          <div>
            <h2>Ready to see what your gold is worth?</h2>
            <p>It takes about a minute.</p>
          </div>
          <button className="lp-btn lp-btn-gold" onClick={onStart}>Start your application</button>
        </section>
      </div>

      <footer className="lp-footer">
        <b>Gold Loan</b>
        Offers are preliminary estimates and not a final approval.
        <div><button onClick={onStart}>Open portal</button></div>
      </footer>
    </div>
  )
}
