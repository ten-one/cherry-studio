import type { DropResult } from '@hello-pangea/dnd'
import { loggerService } from '@logger'
import {
  DraggableVirtualList,
  type DraggableVirtualListRef,
  useDraggableReorder
} from '@renderer/components/DraggableList'
import { DeleteIcon, EditIcon } from '@renderer/components/Icons'
import { ProviderAvatar } from '@renderer/components/ProviderAvatar'
import { useAllProviders, useProviders } from '@renderer/hooks/useProvider'
import { useTimer } from '@renderer/hooks/useTimer'
import ImageStorage from '@renderer/services/ImageStorage'
import type { Provider, ProviderType } from '@renderer/types'
import { isSystemProvider } from '@renderer/types'
import { getFancyProviderName, matchKeywordsInModel, matchKeywordsInProvider, uuid } from '@renderer/utils'
import { isAnthropicSupportedProvider } from '@renderer/utils/provider'
import type { MenuProps } from 'antd'
import { Button, Dropdown, Input, Tag } from 'antd'
import { Check, ChevronDown, ChevronRight, Eye, EyeOff, Filter, GripVertical, PlusIcon, Search } from 'lucide-react'
import type { FC } from 'react'
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import useSWRImmutable from 'swr/immutable'

import AddProviderPopup from './AddProviderPopup'
import ProviderSetting from './ProviderSetting'
import UrlSchemaInfoPopup from './UrlSchemaInfoPopup'

const logger = loggerService.withContext('ProviderList')

const BUTTON_WRAPPER_HEIGHT = 50

const getIsOvmsSupported = async (): Promise<boolean> => {
  try {
    const result = await window.api.ovms.isSupported()
    return result
  } catch (e) {
    logger.warn('Fetching isOvmsSupported failed. Fallback to false.', e as Error)
    return false
  }
}

interface ProviderListProps {
  /** Whether in onboarding mode for new users */
  isOnboarding?: boolean
}

const ProviderList: FC<ProviderListProps> = ({ isOnboarding = false }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const providers = useAllProviders()
  const {
    updateProviders,
    addProvider,
    removeProvider,
    updateProvider,
    hiddenProviderIds,
    hideProvider,
    unhideProvider
  } = useProviders()
  const { setTimeoutTimer } = useTimer()
  const [selectedProvider, _setSelectedProvider] = useState<Provider>(providers[0])
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState<string>('')
  const [dragging, setDragging] = useState(false)
  const [agentFilterEnabled, setAgentFilterEnabled] = useState(false)
  const [hiddenProvidersExpanded, setHiddenProvidersExpanded] = useState(false)
  const [providerLogos, setProviderLogos] = useState<Record<string, string>>({})
  const listRef = useRef<DraggableVirtualListRef>(null)

  const { data: isOvmsSupported } = useSWRImmutable('ovms/isSupported', getIsOvmsSupported)
  const hiddenProviderIdSet = useMemo(() => new Set(hiddenProviderIds), [hiddenProviderIds])
  const visibleProviders = useMemo(
    () => providers.filter((provider) => !hiddenProviderIdSet.has(provider.id)),
    [hiddenProviderIdSet, providers]
  )
  const hiddenProviders = useMemo(
    () => providers.filter((provider) => hiddenProviderIdSet.has(provider.id)),
    [hiddenProviderIdSet, providers]
  )

  const setSelectedProvider = useCallback((provider: Provider) => {
    startTransition(() => _setSelectedProvider(provider))
  }, [])

  useEffect(() => {
    if (hiddenProviders.length === 0) {
      setHiddenProvidersExpanded(false)
    }
  }, [hiddenProviders.length])

  useEffect(() => {
    const selectedProviderExists = providers.some((provider) => provider.id === selectedProvider?.id)
    const selectedProviderHidden = selectedProvider?.id ? hiddenProviderIdSet.has(selectedProvider.id) : false

    if (!selectedProviderExists || selectedProviderHidden) {
      const fallbackProvider = visibleProviders[0]
      if (fallbackProvider) {
        setSelectedProvider(fallbackProvider)
      }
    }
  }, [hiddenProviderIdSet, providers, selectedProvider?.id, setSelectedProvider, visibleProviders])

  useEffect(() => {
    const loadAllLogos = async () => {
      const logos: Record<string, string> = {}
      for (const provider of providers) {
        if (provider.id) {
          try {
            const logoData = await ImageStorage.get(`provider-${provider.id}`)
            if (logoData) {
              logos[provider.id] = logoData
            }
          } catch (error) {
            logger.error(`Failed to load logo for provider ${provider.id}`, error as Error)
          }
        }
      }
      setProviderLogos(logos)
    }

    void loadAllLogos()
  }, [providers])

  useEffect(() => {
    let shouldUpdate = false
    const hasFilterParam = searchParams.get('filter') === 'agent'

    // Handle filter param first - when filter is enabled, ignore id param
    if (hasFilterParam) {
      setAgentFilterEnabled(true)
      searchParams.delete('filter')
      searchParams.delete('id') // Clear id param when filter is enabled
      shouldUpdate = true
    } else if (searchParams.get('id')) {
      const providerId = searchParams.get('id')
      const provider = visibleProviders.find((p) => p.id === providerId)
      if (provider) {
        setSelectedProvider(provider)
        // 滚动到选中的 provider
        const index = visibleProviders.findIndex((p) => p.id === providerId)
        if (index >= 0) {
          setTimeoutTimer(
            'scroll-to-selected-provider',
            () => listRef.current?.scrollToIndex(index, { align: 'center' }),
            100
          )
        }
      } else {
        const fallbackProvider = visibleProviders[0]
        if (fallbackProvider) {
          setSelectedProvider(fallbackProvider)
        }
      }
      searchParams.delete('id')
      shouldUpdate = true
    }

    if (shouldUpdate) {
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams, setSelectedProvider, setTimeoutTimer, visibleProviders])

  // Handle provider add key from URL schema
  useEffect(() => {
    const handleProviderAddKey = async (data: {
      id: string
      apiKey: string
      baseUrl: string
      type?: ProviderType
      name?: string
    }) => {
      const { id } = data

      const { updatedProvider, isNew, displayName } = await UrlSchemaInfoPopup.show(data)
      window.navigate(`/settings/provider?id=${id}`)

      if (!updatedProvider) {
        return
      }

      if (isNew) {
        addProvider(updatedProvider)
      } else {
        updateProvider(updatedProvider)
      }

      setSelectedProvider(updatedProvider)
      window.toast.success(t('settings.models.provider_key_added', { provider: displayName }))
    }

    // 检查 URL 参数
    const addProviderData = searchParams.get('addProviderData')
    if (!addProviderData) {
      return
    }

    try {
      const { id, apiKey: newApiKey, baseUrl, type, name } = JSON.parse(addProviderData)
      if (!id || !newApiKey || !baseUrl) {
        window.toast.error(t('settings.models.provider_key_add_failed_by_invalid_data'))
        window.navigate('/settings/provider')
        return
      }

      void handleProviderAddKey({ id, apiKey: newApiKey, baseUrl, type, name })
    } catch (error) {
      window.toast.error(t('settings.models.provider_key_add_failed_by_invalid_data'))
      window.navigate('/settings/provider')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const onAddProvider = async () => {
    const { name: providerName, type, logo } = await AddProviderPopup.show()

    if (!providerName.trim()) {
      return
    }

    const provider = {
      id: uuid(),
      name: providerName.trim(),
      type,
      apiKey: '',
      apiHost: '',
      models: [],
      enabled: true,
      isSystem: false
    } as Provider

    let updatedLogos = { ...providerLogos }
    if (logo) {
      try {
        await ImageStorage.set(`provider-${provider.id}`, logo)
        updatedLogos = {
          ...updatedLogos,
          [provider.id]: logo
        }
        setProviderLogos(updatedLogos)
      } catch (error) {
        logger.error('Failed to save logo', error as Error)
        window.toast.error(t('message.error.save_provider_logo'))
      }
    }

    addProvider(provider)
    setSelectedProvider(provider)
  }

  const getDropdownMenus = (provider: Provider): MenuProps['items'] => {
    const hideMenu = {
      label: t('settings.provider.hidden.hide'),
      key: 'hide',
      icon: <EyeOff size={14} />,
      onClick: () => {
        hideProvider(provider.id)

        if (selectedProvider?.id === provider.id) {
          const fallbackProvider = visibleProviders.find((p) => p.id !== provider.id)
          if (fallbackProvider) {
            setSelectedProvider(fallbackProvider)
          }
        }
      }
    }

    const editMenu = {
      label: t('common.edit'),
      key: 'edit',
      icon: <EditIcon size={14} />,
      async onClick() {
        const { name, type, logoFile, logo } = await AddProviderPopup.show(provider)

        if (name) {
          updateProvider({ ...provider, name, type })
          if (provider.id) {
            if (logo) {
              try {
                await ImageStorage.set(`provider-${provider.id}`, logo)
                setProviderLogos((prev) => ({
                  ...prev,
                  [provider.id]: logo
                }))
              } catch (error) {
                logger.error('Failed to save logo', error as Error)
                window.toast.error(t('message.error.update_provider_logo'))
              }
            } else if (logo === undefined && logoFile === undefined) {
              try {
                await ImageStorage.set(`provider-${provider.id}`, '')
                setProviderLogos((prev) => {
                  const newLogos = { ...prev }
                  delete newLogos[provider.id]
                  return newLogos
                })
              } catch (error) {
                logger.error('Failed to reset logo', error as Error)
              }
            }
          }
        }
      }
    }

    const deleteMenu = {
      label: t('common.delete'),
      key: 'delete',
      icon: <DeleteIcon size={14} className="lucide-custom" />,
      danger: true,
      async onClick() {
        window.modal.confirm({
          title: t('settings.provider.delete.title'),
          content: t('settings.provider.delete.content'),
          okButtonProps: { danger: true },
          okText: t('common.delete'),
          centered: true,
          onOk: async () => {
            // 删除provider前先清理其logo
            if (provider.id) {
              try {
                await ImageStorage.remove(`provider-${provider.id}`)
                setProviderLogos((prev) => {
                  const newLogos = { ...prev }
                  delete newLogos[provider.id]
                  return newLogos
                })
              } catch (error) {
                logger.error('Failed to delete logo', error as Error)
              }
            }

            setSelectedProvider(providers.filter((p) => isSystemProvider(p))[0])
            removeProvider(provider)
          }
        })
      }
    }

    const menus = [editMenu, hideMenu, deleteMenu]

    if (providers.filter((p) => p.id === provider.id).length > 1) {
      return menus
    }

    if (isSystemProvider(provider)) {
      return [hideMenu]
    } else if (provider.isSystem) {
      // 这里是处理数据中存在新版本删掉的系统提供商的情况
      // 未来期望能重构一下，不要依赖isSystem字段
      return [hideMenu, deleteMenu]
    } else {
      return menus
    }
  }

  const filteredProviders = visibleProviders.filter((provider) => {
    // don't show it when isOvmsSupported is loading
    if (provider.id === 'ovms' && !isOvmsSupported) {
      return false
    }

    // Filter by agent support
    if (agentFilterEnabled && !isAnthropicSupportedProvider(provider)) {
      return false
    }

    const keywords = searchText.toLowerCase().split(/\s+/).filter(Boolean)
    const isProviderMatch = matchKeywordsInProvider(keywords, provider)
    const isModelMatch = provider.models.some((model) => matchKeywordsInModel(keywords, model))
    return isProviderMatch || isModelMatch
  })

  const { onDragEnd: handleReorder, itemKey } = useDraggableReorder({
    originalList: providers,
    filteredList: filteredProviders,
    onUpdate: updateProviders,
    itemKey: 'id'
  })

  const handleUnhideProvider = useCallback(
    (provider: Provider) => {
      unhideProvider(provider.id)
      setSearchText('')
      setAgentFilterEnabled(false)
      setSelectedProvider(provider)

      const restoredProviders = providers.filter((p) => p.id === provider.id || !hiddenProviderIdSet.has(p.id))
      const restoredProviderIndex = restoredProviders.findIndex((p) => p.id === provider.id)
      if (restoredProviderIndex >= 0) {
        setTimeoutTimer(
          'scroll-to-unhidden-provider',
          () => listRef.current?.scrollToIndex(restoredProviderIndex, { align: 'center' }),
          100
        )
      }
    },
    [hiddenProviderIdSet, providers, setSelectedProvider, setTimeoutTimer, unhideProvider]
  )

  const handleDragStart = useCallback(() => {
    setDragging(true)
  }, [])

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setDragging(false)
      handleReorder(result)
    },
    [handleReorder]
  )

  return (
    <Container className="selectable">
      <ProviderListContainer>
        <AddButtonWrapper>
          <Input
            type="text"
            placeholder={t('settings.provider.search')}
            value={searchText}
            style={{ borderRadius: 'var(--list-item-border-radius)', height: 35 }}
            prefix={<Search size={14} />}
            suffix={
              <Dropdown
                menu={{
                  items: [
                    {
                      label: t('settings.provider.filter.all'),
                      key: 'all',
                      icon: agentFilterEnabled ? <CheckPlaceholder /> : <Check size={14} />,
                      onClick: () => setAgentFilterEnabled(false)
                    },
                    {
                      label: t('settings.provider.filter.agent'),
                      key: 'agent',
                      icon: agentFilterEnabled ? <Check size={14} /> : <CheckPlaceholder />,
                      onClick: () => setAgentFilterEnabled(true)
                    }
                  ]
                }}
                trigger={['click']}>
                <FilterButton>
                  <Filter
                    size={14}
                    className={agentFilterEnabled ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-3)]'}
                  />
                </FilterButton>
              </Dropdown>
            }
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setSearchText('')
              }
            }}
            allowClear
            disabled={dragging}
          />
        </AddButtonWrapper>
        <ProviderListArea>
          <DraggableVirtualList
            ref={listRef}
            list={filteredProviders}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            estimateSize={useCallback(() => 40, [])}
            itemKey={itemKey}
            overscan={3}
            style={{
              height: '100%'
            }}
            scrollerStyle={{
              padding: 8,
              paddingRight: 5
            }}
            itemContainerStyle={{ paddingBottom: 5 }}>
            {(provider) => (
              <Dropdown menu={{ items: getDropdownMenus(provider) }} trigger={['contextMenu']}>
                <ProviderListItem
                  key={provider.id}
                  className={provider.id === selectedProvider?.id ? 'active' : ''}
                  onClick={() => setSelectedProvider(provider)}>
                  <DragHandle>
                    <GripVertical size={12} />
                  </DragHandle>
                  <ProviderAvatar
                    style={{
                      width: 24,
                      height: 24
                    }}
                    provider={provider}
                    customLogos={providerLogos}
                  />
                  <ProviderItemName className="text-nowrap">{getFancyProviderName(provider)}</ProviderItemName>
                  {provider.enabled && (
                    <Tag color="green" style={{ marginLeft: 'auto', marginRight: 0, borderRadius: 16 }}>
                      ON
                    </Tag>
                  )}
                </ProviderListItem>
              </Dropdown>
            )}
          </DraggableVirtualList>
        </ProviderListArea>
        {hiddenProviders.length > 0 && (
          <HiddenProvidersSection>
            <HiddenProvidersHeader onClick={() => setHiddenProvidersExpanded((expanded) => !expanded)}>
              {hiddenProvidersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <HiddenProvidersTitle>
                {t('settings.provider.hidden.title')} ({hiddenProviders.length})
              </HiddenProvidersTitle>
            </HiddenProvidersHeader>
            {hiddenProvidersExpanded && (
              <HiddenProvidersList>
                {hiddenProviders.map((provider) => (
                  <HiddenProviderItem key={provider.id}>
                    <ProviderAvatar
                      style={{
                        width: 24,
                        height: 24
                      }}
                      provider={provider}
                      customLogos={providerLogos}
                    />
                    <ProviderItemName className="text-nowrap">{getFancyProviderName(provider)}</ProviderItemName>
                    <Button
                      size="small"
                      type="text"
                      icon={<Eye size={14} />}
                      onClick={() => handleUnhideProvider(provider)}>
                      {t('settings.provider.hidden.unhide')}
                    </Button>
                  </HiddenProviderItem>
                ))}
              </HiddenProvidersList>
            )}
          </HiddenProvidersSection>
        )}
        <AddButtonWrapper>
          <Button
            style={{ width: '100%', borderRadius: 'var(--list-item-border-radius)' }}
            icon={<PlusIcon size={16} />}
            onClick={onAddProvider}
            disabled={dragging}>
            {t('button.add')}
          </Button>
        </AddButtonWrapper>
      </ProviderListContainer>
      <ProviderSetting providerId={selectedProvider.id} key={selectedProvider.id} isOnboarding={isOnboarding} />
    </Container>
  )
}

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  min-height: 0;
`

const ProviderListContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: calc(var(--settings-width) + 10px);
  padding-bottom: 5px;
  border-right: 0.5px solid var(--color-border);
`

const ProviderListArea = styled.div`
  flex: 1;
  min-height: 0;
`

const ProviderListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px 10px;
  width: 100%;
  border-radius: var(--list-item-border-radius);
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  border: 0.5px solid transparent;
  user-select: none;
  cursor: pointer;
  &:hover {
    background: var(--color-background-soft);
  }
  &.active {
    background: var(--color-background-soft);
    border: 0.5px solid var(--color-border);
    font-weight: bold !important;
  }
`

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
  width: 12px;
  color: var(--color-text-3);
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  cursor: grab;

  ${ProviderListItem}:hover & {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
`

const ProviderItemName = styled.div`
  margin-left: 10px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
`

const AddButtonWrapper = styled.div`
  display: flex;
  height: ${BUTTON_WRAPPER_HEIGHT}px;
  flex-shrink: 0;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 8px;
`

const HiddenProvidersSection = styled.div`
  flex-shrink: 0;
  margin: 0 8px 4px;
  border-top: 0.5px solid var(--color-border);
`

const HiddenProvidersHeader = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 6px;
  padding: 8px 2px;
  border: none;
  background: transparent;
  color: var(--color-text-2);
  cursor: pointer;
`

const HiddenProvidersTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
`

const HiddenProvidersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 160px;
  overflow-y: auto;
  padding-bottom: 4px;
`

const HiddenProviderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  min-height: 36px;
  padding: 4px 2px;

  ${ProviderItemName} {
    flex: 1;
    min-width: 0;
  }
`

const FilterButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
`

const CheckPlaceholder = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
`

export default ProviderList
