import tabsReducer, { addTab, setActiveTab, setTabs, type TabsState } from '@renderer/store/tabs'
import { describe, expect, it } from 'vitest'

const homeTab = { id: 'home', path: '/' }

const createState = (overrides: Partial<TabsState> = {}): TabsState => ({
  tabs: [homeTab],
  activeTabId: 'home',
  ...overrides
})

describe('tabs slice removed routes', () => {
  it('removes legacy feature tabs when restoring persisted tabs', () => {
    const state = createState({
      tabs: [homeTab, { id: 'code', path: '/code/project' }],
      activeTabId: 'code'
    })

    const next = tabsReducer(
      state,
      setTabs([
        homeTab,
        { id: 'agents', path: '/agents' },
        { id: 'code', path: '/code/project' },
        { id: 'legacy-openclaw', path: '/openclaw' },
        { id: 'knowledge', path: '/knowledge' }
      ])
    )

    expect(next.tabs).toEqual([homeTab, { id: 'knowledge', path: '/knowledge' }])
    expect(next.activeTabId).toBe('home')
  })

  it.each(['agents', 'code', 'openclaw'])('does not add the removed %s tab', (id) => {
    const state = createState()

    const next = tabsReducer(state, addTab({ id, path: `/${id}` }))

    expect(next).toEqual(state)
  })

  it.each(['agents', 'code', 'openclaw'])('does not activate the removed %s tab', (id) => {
    const state = createState()

    const next = tabsReducer(state, setActiveTab(id))

    expect(next.activeTabId).toBe('home')
  })
})
