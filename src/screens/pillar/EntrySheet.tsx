import { PILLARS } from '../../data/wisdom'
import { useMemo } from 'react'

export function EntrySheet({ id }: { id: string }) {
  const allEntries = useMemo(() => {
    return Object.values(PILLARS).flatMap(p => p.sections.flatMap(s => s.entries.map(e => ({...e, pillar: p.name, section: s.title}))))
  }, [])

  const entry = allEntries.find(e => e.id === id)

  if (!entry) return <div className="sheet-content pad">Not found.</div>

  return (
    <div className="sheet-content sheet-scrollable" style={{ padding: '24px' }}>
      <div style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
        {entry.pillar} &bull; {entry.section}
      </div>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--text)', marginBottom: '24px' }}>
        {entry.title}
      </h2>
      <p style={{ fontSize: '18px', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
        {entry.body}
      </p>
    </div>
  )
}
