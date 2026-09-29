import { useState } from 'react'
import { PILLARS } from '../../data/wisdom'
import { nav } from '../../lib/nav'
import { haptic } from '../../lib/haptics'
import { toast } from '../../components/Toast'
import { SheetHeader } from '../../components/SheetHost'

export function AddSheet() {
  const pillarsList = Object.values(PILLARS)
  const [selectedPillarId, setSelectedPillarId] = useState(pillarsList[0]?.id || '')
  const [sectionTitle, setSectionTitle] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      toast('Please provide both a title and wisdom body.')
      return
    }

    const targetPillar = PILLARS[selectedPillarId]
    if (targetPillar) {
      const sectionName = sectionTitle.trim() || 'General Insights'
      let section = targetPillar.sections.find((s) => s.title.toLowerCase() === sectionName.toLowerCase())
      if (!section) {
        section = { title: sectionName, entries: [] }
        targetPillar.sections.push(section)
      }
      section.entries.unshift({
        id: `custom-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
      })
    }

    haptic('success')
    toast('Wisdom added to Bonum')
    nav.back()
  }

  return (
    <div className="sheet-content" style={{ padding: '0 20px 32px' }}>
      <SheetHeader title="Add Wisdom" />
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Pillar
          </label>
          <select
            value={selectedPillarId}
            onChange={(e) => setSelectedPillarId(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-small)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--stroke)',
              fontSize: '15px',
              color: 'var(--text)',
            }}
          >
            {pillarsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name} ({p.subtitle})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Section / Topic
          </label>
          <input
            type="text"
            placeholder="e.g. Reflections, Practices..."
            value={sectionTitle}
            onChange={(e) => setSectionTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-small)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--stroke)',
              fontSize: '15px',
              color: 'var(--text)',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Title
          </label>
          <input
            type="text"
            placeholder="e.g. The Power of Calm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-small)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--stroke)',
              fontSize: '15px',
              color: 'var(--text)',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Wisdom / Teaching
          </label>
          <textarea
            placeholder="Write the wisdom, aphorism, or reflection here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={5}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 'var(--radius-small)',
              background: 'var(--surface-raised)',
              border: '1px solid var(--stroke)',
              fontSize: '15px',
              color: 'var(--text)',
              lineHeight: 1.5,
              resize: 'vertical',
            }}
          />
        </div>

        <button
          type="submit"
          className="pressable"
          style={{
            marginTop: '8px',
            padding: '14px 20px',
            borderRadius: 'var(--radius-medium)',
            background: 'var(--text)',
            color: 'var(--surface)',
            border: 'none',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save to Bonum
        </button>
      </form>
    </div>
  )
}
