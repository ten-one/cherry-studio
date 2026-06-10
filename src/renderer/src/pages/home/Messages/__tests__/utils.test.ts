import type { Topic } from '@renderer/types'
import { describe, expect, it } from 'vitest'

import { getResetTopicAfterClear } from '../utils'

describe('getResetTopicAfterClear', () => {
  it('resets topic title, manual rename flag, and messages after clearing messages', () => {
    const topic = {
      id: 'topic-1',
      assistantId: 'assistant-1',
      name: '问候',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T01:00:00.000Z',
      messages: [{ id: 'message-1' }],
      isNameManuallyEdited: true,
      pinned: true
    } as Topic

    const resetTopic = getResetTopicAfterClear(topic, '默认话题')

    expect(resetTopic).toMatchObject({
      id: 'topic-1',
      assistantId: 'assistant-1',
      name: '默认话题',
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T01:00:00.000Z',
      messages: [],
      isNameManuallyEdited: false,
      pinned: true
    })
  })
})
