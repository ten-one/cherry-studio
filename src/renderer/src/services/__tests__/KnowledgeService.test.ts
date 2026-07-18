import type { KnowledgeBase } from '@renderer/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getStoreProvidersMock } = vi.hoisted(() => ({
  getStoreProvidersMock: vi.fn()
}))

vi.mock('@renderer/hooks/useStore', () => ({
  getStoreProviders: getStoreProvidersMock
}))

vi.mock('@renderer/i18n', () => ({
  default: {
    t: (key: string) => key
  }
}))

import { getKnowledgeBaseParams } from '../KnowledgeService'

describe('getKnowledgeBaseParams', () => {
  beforeEach(() => {
    getStoreProvidersMock.mockReset()
  })

  it('rejects an embedding model whose provider is no longer configured', () => {
    getStoreProvidersMock.mockReturnValue([])
    const base = {
      id: 'legacy-base',
      name: 'Legacy Base',
      model: { id: 'baai/bge-m3(free)', name: 'BGE M3', provider: 'cherryin' },
      items: [],
      created_at: 1,
      updated_at: 1,
      version: 1
    } satisfies KnowledgeBase

    expect(() => getKnowledgeBaseParams(base)).toThrow('knowledge.provider_not_found')
  })
})
