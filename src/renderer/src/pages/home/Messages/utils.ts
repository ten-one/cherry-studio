import type { Topic } from '@renderer/types'

export const getResetTopicAfterClear = (topic: Topic, defaultTopicName: string): Topic => ({
  ...topic,
  name: defaultTopicName,
  messages: [],
  isNameManuallyEdited: false
})
