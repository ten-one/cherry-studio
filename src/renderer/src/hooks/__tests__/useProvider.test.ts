import { describe, expect, it } from 'vitest'

import { selectHiddenProviderIds } from '../useProvider'

describe('selectHiddenProviderIds', () => {
  it('returns a stable empty fallback for legacy states', () => {
    const state = { llm: {} } as unknown as Parameters<typeof selectHiddenProviderIds>[0]

    const firstResult = selectHiddenProviderIds(state)

    expect(firstResult).toEqual([])
    expect(selectHiddenProviderIds(state)).toBe(firstResult)
  })
})
