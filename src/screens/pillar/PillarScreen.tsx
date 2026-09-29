import { Screen } from '../../components/Screen'
import { PILLARS } from '../../data/wisdom'
import { nav } from '../../lib/nav'

export function PillarScreen({ id }: { id: string }) {
  const pillar = PILLARS[id]

  if (!pillar) {
    return <Screen title="Not Found" back><div className="pad">Pillar not found.</div></Screen>
  }

  return (
    <Screen title={pillar.name} back largeTitle>
      <div className="pad" style={{ paddingBottom: '120px' }}>
        <p className="subtitle" style={{ marginTop: '-8px', marginBottom: '32px' }}>{pillar.subtitle}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {pillar.sections.map((section, i) => (
            <div key={i}>
              <h3 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '16px', fontFamily: 'var(--font-serif)' }}>
                {section.title}
              </h3>
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-medium)', border: '1px solid var(--stroke)', overflow: 'hidden' }}>
                {section.entries.map((entry, j) => (
                  <div key={entry.id}>
                    <button
                      className="list-button"
                      style={{ padding: '16px', width: '100%', textAlign: 'left', display: 'block' }}
                      onClick={() => nav.present({ name: 'entry', id: entry.id })}
                    >
                      <div style={{ fontSize: '16px', color: 'var(--text)', fontWeight: 500 }}>{entry.title}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {entry.body}
                      </div>
                    </button>
                    {j < section.entries.length - 1 && <div style={{ height: 1, background: 'var(--separator)', marginLeft: '16px' }} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  )
}
