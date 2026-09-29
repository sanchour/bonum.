import { type CSSProperties, useRef, useEffect } from 'react'
import { TABS, type Tab, nav, useNav } from '../lib/nav'
import { Home, Search, BookOpen, Plus } from 'lucide-react'

const ITEMS: Record<Tab, { icon: React.ElementType; label: string }> = {
  home: { icon: Home, label: 'Home' },
  meditatio: { icon: BookOpen, label: 'Meditatio' },
  search: { icon: Search, label: 'Search' },
}

export function TabBar() {
  const { tab } = useNav()
  const barRef = useRef<HTMLElement>(null)
  const lensRef = useRef<HTMLSpanElement>(null)
  const index = TABS.indexOf(tab)

  const select = (next: Tab) => {
    nav.setTab(next)
  }

  useEffect(() => {
    // Update lens position when tab changes
    const idx = TABS.indexOf(tab)
    if (barRef.current) {
        barRef.current.style.setProperty('--index', String(idx));
    }
  }, [tab])

  return (
    <div className="tabbar-wrap">
      <nav
        ref={barRef}
        className="tabbar glass"
        aria-label="Main"
        style={{ '--index': index, '--count': TABS.length + 1 } as CSSProperties}
      >
        <span ref={lensRef} className="tabbar-lens" aria-hidden="true" />
        
        {TABS.map((item) => {
          const Icon = ITEMS[item].icon
          return (
            <button
              key={item}
              type="button"
              className={`tabbar-item ${item === tab ? 'active' : ''}`}
              aria-current={item === tab ? 'page' : undefined}
              onClick={() => select(item)}
            >
              <Icon size={24} strokeWidth={2.1} />
              <span className="tabbar-label">{ITEMS[item].label}</span>
            </button>
          )
        })}

        {/* Floating Add Button in TabBar */}
        <button
            type="button"
            className="tabbar-item tabbar-add"
            onClick={() => nav.present({ name: 'add' })}
        >
            <div className="add-button-inner">
                <Plus size={24} strokeWidth={2.5} color="white" />
            </div>
            <span className="tabbar-label">Add</span>
        </button>

      </nav>
    </div>
  )
}
