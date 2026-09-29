import { useSyncExternalStore } from 'react'

export type Tab = 'home' | 'meditatio' | 'search'
export const TABS: Tab[] = ['home', 'meditatio', 'search']

export type Route =
  | { name: 'pillar'; id: string }

export type SheetRoute =
  | { name: 'add' }
  | { name: 'entry'; id: string }

export interface Entry<R> {
  key: number
  route: R
}

export interface NavState {
  tab: Tab
  stacks: Record<Tab, Entry<Route>[]>
  sheets: Entry<SheetRoute>[]
}

class NavStore {
  state: NavState = {
    tab: 'home',
    stacks: { home: [], meditatio: [], search: [] },
    sheets: [],
  }
  private listeners = new Set<() => void>()
  private nextKey = 1
  private depth = 0

  constructor() {
    if (typeof window === 'undefined') return
    window.addEventListener('popstate', this.onPopState)
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.state.sheets.length > 0) this.back()
    })
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getState = () => this.state

  private set(patch: Partial<NavState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach((listener) => listener())
  }

  tabHistory: Tab[] = []

  private pushHistory() {
    this.depth++
    history.pushState({ bonum: this.depth }, '')
  }

  setTab(tab: Tab, recordHistory = true) {
    if (tab === this.state.tab) {
      if (this.state.stacks[tab].length > 0) this.set({ stacks: { ...this.state.stacks, [tab]: [] } })
      return
    }
    if (recordHistory) {
      this.tabHistory.push(this.state.tab)
      this.pushHistory()
    }
    this.set({ tab })
  }

  push(route: Route) {
    const tab = this.state.tab
    const entry = { key: this.nextKey++, route }
    this.set({ stacks: { ...this.state.stacks, [tab]: [...this.state.stacks[tab], entry] } })
    this.pushHistory()
  }

  present(route: SheetRoute) {
    this.set({ sheets: [...this.state.sheets, { key: this.nextKey++, route }] })
    this.pushHistory()
  }

  private isHandlingBack = false

  back() {
    this.popLayer()
    if (this.depth > 0) {
      this.depth--
      this.isHandlingBack = true
      history.back()
    }
  }

  private onPopState = () => {
    if (this.isHandlingBack) {
      this.isHandlingBack = false
      return
    }
    if (this.depth > 0) this.depth--
    this.popLayer()
  }

  private popLayer() {
    if (this.state.sheets.length > 0) {
      this.set({ sheets: this.state.sheets.slice(0, -1) })
      return
    }
    const tab = this.state.tab
    const stack = this.state.stacks[tab]
    if (stack.length > 0) {
      this.set({ stacks: { ...this.state.stacks, [tab]: stack.slice(0, -1) } })
      return
    }
    if (this.tabHistory.length > 0) {
      const prevTab = this.tabHistory.pop()!
      this.set({ tab: prevTab })
    }
  }

  dismissAllSheets() {
    if (this.state.sheets.length === 0) return
    this.set({ sheets: [] })
  }
}

export const nav = new NavStore()

export function useNav(): NavState {
  return useSyncExternalStore(nav.subscribe, nav.getState, nav.getState)
}
