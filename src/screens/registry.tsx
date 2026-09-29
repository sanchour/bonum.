import type { ReactNode } from 'react'
import type { Route, SheetRoute, Tab } from '../lib/nav'
import { Home } from './home/Home'
import { Meditatio } from './meditatio/Meditatio'
import { Search } from './search/Search'
import { PillarScreen } from './pillar/PillarScreen'
import { EntrySheet } from './pillar/EntrySheet'

export function renderRoot(tab: Tab): ReactNode {
  switch (tab) {
    case 'home':
      return <Home />
    case 'meditatio':
      return <Meditatio />
    case 'search':
      return <Search />
  }
}

export function renderRoute(route: Route): ReactNode {
  switch (route.name) {
    case 'pillar':
      return <PillarScreen id={route.id} />
    default:
      return null
  }
}

export function renderSheet(route: SheetRoute): { content: ReactNode; size?: 'large' | 'medium' | 'tall' } {
  switch (route.name) {
    case 'add':
      // return { content: <AddSheet /> }
      return { content: <div className="sheet-content pad">Add Wisdom Placeholder</div> }
    case 'entry':
      return { content: <EntrySheet id={route.id} /> }
    default:
      return { content: null }
  }
}
