import EmojiIcon from '@renderer/components/EmojiIcon'
import HorizontalScrollContainer from '@renderer/components/HorizontalScrollContainer'
import AssistantSettingsPopup from '@renderer/pages/settings/AssistantSettings'
import type { Assistant } from '@renderer/types'
import { getLeadingEmoji } from '@renderer/utils'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import SelectModelButton from '../../SelectModelButton'

type AssistantModelSelectorProps = {
  assistant: Assistant
  className?: string
}

const AssistantModelSelector = ({ assistant, className }: AssistantModelSelectorProps) => {
  const { t } = useTranslation()
  const assistantName = useMemo(() => assistant.name || t('chat.default.name'), [assistant.name, t])

  return (
    <SelectorScroll className={className}>
      <SelectorContent>
        <AssistantLabel onClick={() => AssistantSettingsPopup.show({ assistant })}>
          <EmojiIcon emoji={assistant.emoji || getLeadingEmoji(assistantName)} size={24} />
          <AssistantName>{assistantName}</AssistantName>
        </AssistantLabel>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <ModelButtonWrapper>
          <SelectModelButton assistant={assistant} />
        </ModelButtonWrapper>
      </SelectorContent>
    </SelectorScroll>
  )
}

const SelectorScroll = styled(HorizontalScrollContainer)`
  min-width: 0;
  -webkit-app-region: no-drag;
`

const SelectorContent = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  -webkit-app-region: no-drag;
`

const AssistantLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 100%;
  cursor: pointer;
  -webkit-app-region: no-drag;
`

const AssistantName = styled.span`
  max-width: 10rem;
  overflow: hidden;
  color: var(--color-text);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ModelButtonWrapper = styled.div`
  min-width: 0;
  max-width: 260px;
  -webkit-app-region: no-drag;
`

export default AssistantModelSelector
