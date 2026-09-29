import { useEffect, useState } from 'react'
import { ActionSheetHost } from './components/ActionSheet'
import { SheetHost } from './components/SheetHost'
import { StackView } from './components/StackView'
import { TabBar } from './components/TabBar'
import { ToastHost } from './components/Toast'
import { TABS, type Tab, useNav } from './lib/nav'
import { renderRoot, renderRoute, renderSheet } from './screens/registry'
import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/screens.css'

export default function App() {
  const navState = useNav()

  return (
    <>
      <MainApp tab={navState.tab} />
      <ActionSheetHost />
      <ToastHost />
    </>
  )
}

function MainApp({ tab }: { tab: Tab }) {
  const [visited, setVisited] = useState<Set<Tab>>(() => new Set([tab]))
  useEffect(() => {
    setVisited((current) => (current.has(tab) ? current : new Set(current).add(tab)))
  }, [tab])

  return (
    <div className="app app-enter">
      <main className="tab-pages">
        {TABS.map((item) => (
          <section key={item} className="tab-page" data-active={item === tab} aria-hidden={item !== tab}>
            {(visited.has(item) || item === tab) && <StackView tab={item} root={renderRoot(item)} renderRoute={renderRoute} />}
          </section>
        ))}
      </main>
      <TabBar />
      <SheetHost renderSheet={renderSheet} />
    </div>
  )
}
