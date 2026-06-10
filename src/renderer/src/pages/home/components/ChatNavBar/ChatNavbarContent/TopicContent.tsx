import type { Assistant } from '@renderer/types'

import Tools from '../Tools'
import AssistantModelSelector from './AssistantModelSelector'

type TopicContentProps = {
  assistant: Assistant
}

const TopicContent = ({ assistant }: TopicContentProps) => {
  return (
    <>
      <AssistantModelSelector assistant={assistant} className="ml-2 flex-initial" />
      <Tools assistant={assistant} />
    </>
  )
}

export default TopicContent
