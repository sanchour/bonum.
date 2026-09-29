import { Screen } from '../../components/Screen'
import { PILLARS } from '../../data/wisdom'
import { nav } from '../../lib/nav'
import { useState, useMemo } from 'react'
import { Search as SearchIcon } from 'lucide-react'

export function Search() {
  const [query, setQuery] = useState('')

  const allEntries = useMemo(() => {
    return Object.values(PILLARS).flatMap(p => p.sections.flatMap(s => s.entries.map(e => ({...e, pillar: p.name, section: s.title}))))
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return allEntries.filter(e => e.title.toLowerCase().includes(lower) || e.body.toLowerCase().includes(lower))
  }, [query, allEntries])

  return (
    <Screen title="Search" largeTitle>
      <div className="pad" style={{ paddingBottom: '120px' }}>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <SearchIcon size={20} color="var(--text-tertiary)" style={{ position: 'absolute', left: '16px', top: '16px' }} />
          <input 
            type="text" 
            placeholder="Search wisdom..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '16px 16px 16px 48px', 
              borderRadius: 'var(--radius-medium)', 
              border: 'none', 
              background: 'var(--surface)', 
              fontSize: '16px',
              color: 'var(--text)',
              boxShadow: 'var(--glass-shadow) 0px 2px 8px -2px'
            }} 
          />
        </div>

        {query.trim() && results.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '48px' }}>
            No results found.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.map(entry => (
             <button
                key={entry.id}
                className="list-button"
                style={{ 
                    padding: '16px', 
                    width: '100%', 
                    textAlign: 'left', 
                    background: 'var(--surface)', 
                    borderRadius: 'var(--radius-medium)',
                    border: '1px solid var(--stroke)',
                }}
                onClick={() => nav.present({ name: 'entry', id: entry.id })}
              >
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{entry.pillar} &bull; {entry.section}</div>
                <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500 }}>{entry.title}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {entry.body}
                </div>
              </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}
