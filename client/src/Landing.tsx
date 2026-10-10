import './landing.css'

type Props = { onStart: () => void }

export default function Landing({ onStart }: Props) {
  const howItWorks = () =>
    document.getElementById('lp-how')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="lp">
      <div className="lp-hero-wrap">
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

      <div className="lp-wrapper-pad">
        <section className="lp-banner">
          <div>
            <h2>Ready to see what your gold is worth?</h2>
            <p>It takes about a minute.</p>
          </div>
          <button className="lp-btn lp-btn-gold" onClick={onStart}>Start your application</button>
        </section>
      </div>

      <p className="lp-foot">Offers are preliminary estimates and not a final approval.</p>
    </div>
  )
}
