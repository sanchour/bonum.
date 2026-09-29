import { useEffect, useState } from 'react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Hold splash for 900ms then trigger smooth 300ms exit dissolve
    const timer = window.setTimeout(() => setLeaving(true), 900)
    const doneTimer = window.setTimeout(() => onComplete(), 1250)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(doneTimer)
    }
  }, [onComplete])

  return (
    <div
      className={`splash-overlay ${leaving ? 'splash-leaving' : ''}`}
      onClick={() => {
        setLeaving(true)
        window.setTimeout(onComplete, 320)
      }}
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--background)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: leaving ? 0 : 1, transition: 'opacity 300ms ease-out',
        pointerEvents: leaving ? 'none' : 'auto'
      }}
    >
      <div className="splash-content" style={{ textAlign: 'center' }}>
        <div className="splash-logo-wrap" style={{ fontSize: '80px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
          🪷
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--text)', marginTop: '24px' }}>Bonum</h1>
        <p className="splash-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '8px', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '14px' }}>Wisdom & Virtue</p>
      </div>
    </div>
  )
}
