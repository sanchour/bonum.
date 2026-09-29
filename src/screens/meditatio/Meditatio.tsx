import { Screen } from '../../components/Screen'
import { PILLARS } from '../../data/wisdom'
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

export function Meditatio() {
  const allEntries = useMemo(() => {
    return Object.values(PILLARS).flatMap(p => p.sections.flatMap(s => s.entries.map(e => ({...e, pillar: p.name}))))
  }, [])

  const [currentIndex, setCurrentIndex] = useState(0)

  const next = () => setCurrentIndex((i) => (i + 1) % allEntries.length)
  const prev = () => setCurrentIndex((i) => (i - 1 + allEntries.length) % allEntries.length)

  const entry = allEntries[currentIndex]

  if (!entry) {
    return <Screen title="Meditatio"><div className="pad">No wisdom available.</div></Screen>
  }

  return (
    <Screen title="Meditatio" hideNavBar>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🪷</div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', marginBottom: '16px', color: 'var(--text)' }}>
          {entry.title}
        </h2>
        <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '50vh', overflowY: 'auto' }}>
          {entry.body}
        </p>
        <div style={{ marginTop: '32px', fontSize: '14px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {entry.pillar}
        </div>

        <div style={{ position: 'absolute', bottom: '120px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <button className="glass pressable" onClick={prev} style={{ width: 56, height: 56, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={24} color="var(--text)" />
          </button>
          <button className="glass pressable" onClick={next} style={{ width: 56, height: 56, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--text)', color: 'var(--surface)' }}>
            <ChevronRight size={24} color="var(--surface)" />
          </button>
        </div>
      </div>
    </Screen>
  )
}
