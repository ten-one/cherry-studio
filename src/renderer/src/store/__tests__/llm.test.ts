import type { Provider } from '@renderer/types'
import { describe, expect, it } from 'vitest'

import llmReducer, { hideProvider, initialState, removeProvider, unhideProvider } from '../llm'

const testProvider: Provider = {
  id: 'test-provider',
  type: 'openai',
  name: 'Test Provider',
  apiKey: '',
  apiHost: '',
  models: [],
  enabled: true
}

const createState = () => ({
  ...initialState,
  providers: [{ ...testProvider }],
  hiddenProviderIds: []
})

describe('llm reducer provider visibility', () => {
  it('hides provider and disables it', () => {
    const state = llmReducer(createState(), hideProvider(testProvider.id))

    expect(state.hiddenProviderIds).toEqual([testProvider.id])
    expect(state.providers[0].enabled).toBe(false)
  })

  it('disables every provider with the hidden id', () => {
    const state = llmReducer(
      {
        ...createState(),
        providers: [{ ...testProvider }, { ...testProvider, name: 'Duplicate Provider' }]
      },
      hideProvider(testProvider.id)
    )

    expect(state.hiddenProviderIds).toEqual([testProvider.id])
    expect(state.providers.every((provider) => provider.enabled === false)).toBe(true)
  })

  it('unhides provider without enabling it', () => {
    const hiddenState = llmReducer(createState(), hideProvider(testProvider.id))
    const visibleState = llmReducer(hiddenState, unhideProvider(testProvider.id))

    expect(visibleState.hiddenProviderIds).toEqual([])
    expect(visibleState.providers[0].enabled).toBe(false)
  })

  it('removes hidden provider id when provider is deleted', () => {
    const hiddenState = llmReducer(createState(), hideProvider(testProvider.id))
    const deletedState = llmReducer(hiddenState, removeProvider(testProvider))

    expect(deletedState.hiddenProviderIds).toEqual([])
    expect(deletedState.providers).toEqual([])
  })
})
