import { Screen } from '../../components/Screen'
import { PILLARS } from '../../data/wisdom'
import { nav } from '../../lib/nav'
import { ChevronRight } from 'lucide-react'

export function Home() {
  const pillars = Object.values(PILLARS)

  return (
    <Screen title="Bonum">
      <div className="pad">
        <p className="subtitle">A collection of wisdom on morality and being a good person.</p>
        
        <div className="pillars-grid" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pillars.map((pillar) => (
            <button
              key={pillar.id}
              className="pillar-card list-button"
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-medium)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: 'var(--glass-shadow) 0px 4px 12px -4px',
                border: '1px solid var(--stroke)',
                textAlign: 'left'
              }}
              onClick={() => nav.push({ name: 'pillar', id: pillar.id })}
            >
              <div className="pillar-icon" style={{ fontSize: '32px' }}>{pillar.icon}</div>
              <div className="pillar-info" style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'var(--font-serif)', color: 'var(--text)' }}>{pillar.name}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{pillar.subtitle}</p>
              </div>
              <ChevronRight size={20} color="var(--text-tertiary)" />
            </button>
          ))}
        </div>
      </div>
    </Screen>
  )
}
