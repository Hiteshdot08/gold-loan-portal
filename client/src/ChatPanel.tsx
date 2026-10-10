import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ApiError, confirmChat, sendChat, type ChatMessage } from './api'

interface Msg {
  from: 'user' | 'bot'
  text: string
}

const GREETING: Msg = {
  from: 'bot',
  text: 'Hi! I can estimate your gold loan. Try: "I have 45 grams of 22 carat jewellery, how much can I get?"',
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([GREETING])
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState<Record<string, unknown> | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending, busy])

  const errText = (e: unknown) =>
    e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'

  async function send() {
    const text = input.trim()
    if (!text || busy || pending) return
    setInput('')
    setMessages((m) => [...m, { from: 'user', text }])
    setBusy(true)
    try {
      const r = await sendChat(text, history)
      setHistory(r.history)
      setMessages((m) => [...m, { from: 'bot', text: r.reply }])
      setPending(r.pendingApplication ?? null)
    } catch (e) {
      setMessages((m) => [...m, { from: 'bot', text: errText(e) }])
    } finally {
      setBusy(false)
    }
  }

  async function resolve(confirmed: boolean) {
    if (!pending) return
    const app = pending
    setPending(null)
    setBusy(true)
    try {
      const r = await confirmChat(history, app, confirmed)
      setHistory(r.history)
      setMessages((m) => [...m, { from: 'bot', text: r.reply }])
      setPending(r.pendingApplication ?? null)
    } catch (e) {
      setPending(app)
      setMessages((m) => [...m, { from: 'bot', text: errText(e) }])
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setMessages([GREETING])
    setHistory([])
    setPending(null)
    setInput('')
  }

  const p = pending as Record<string, string | number> | null

  return (
    <div className="card">
      <h2>Loan Assist</h2>
      <div className="chat-log" role="log" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.from}`}>
            {m.from === "bot" ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
          </div>
        ))}
        {busy && <div className="bubble bot muted">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {p && (
        <div className="confirm-box" role="group" aria-label="Confirm application">
          <h3>Confirm your application</h3>
          <p>
            {p.name} · {p.mobileNumber}
            <br />
            {p.netWeightGrams} g net / {p.grossWeightGrams} g gross, {p.karat}K
            <br />
            Plan: {p.planId}
          </p>
          <div className="btn-row">
            <button className="btn" onClick={() => resolve(true)} disabled={busy}>
              Confirm and submit
            </button>
            <button className="btn secondary" onClick={() => resolve(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="chat-input">
        <input
          aria-label="Message"
          value={input}
          placeholder={pending ? 'Confirm or cancel above' : 'Type your message'}
          disabled={busy || !!pending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn" onClick={send} disabled={busy || !!pending || !input.trim()}>
          Send
        </button>
      </div>
      <p>
        <button className="btn secondary" onClick={reset} disabled={busy}>
          New chat
        </button>
      </p>
    </div>
  )
}
