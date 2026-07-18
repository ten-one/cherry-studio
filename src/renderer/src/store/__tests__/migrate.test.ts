import { describe, expect, it } from 'vitest'

import { initialState as llmInitialState } from '../llm'
import migrate from '../migrate'

describe('store migrations', () => {
  describe('migration 207: StepFun Anthropic-compatible host backfill', () => {
    it('backfills anthropicApiHost for existing StepFun providers', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'stepfun',
              apiHost: 'https://api.stepfun.com'
            }
          ]
        },
        _persist: { version: 206, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 207)

      expect(migrated.llm.providers[0].anthropicApiHost).toBe('https://api.stepfun.com')
    })

    it('preserves existing StepFun anthropicApiHost customizations', async () => {
      const state = {
        llm: {
          providers: [
            {
              id: 'stepfun',
              apiHost: 'https://api.stepfun.com',
              anthropicApiHost: 'https://custom.example.com'
            }
          ]
        },
        _persist: { version: 206, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 207)

      expect(migrated.llm.providers[0].anthropicApiHost).toBe('https://custom.example.com')
    })
  })

  describe('migration 208: removed provider cleanup', () => {
    it('removes persisted provider state and replaces all model references', async () => {
      const removedModel = { id: 'removed-model', name: 'Removed Model', provider: 'cherryin' }
      const state = {
        llm: {
          providers: [{ id: 'cherryin' }, { id: 'openai' }],
          hiddenProviderIds: ['cherryin', 'openai'],
          defaultModel: removedModel,
          topicNamingModel: removedModel,
          quickModel: removedModel,
          translateModel: removedModel,
          settings: {
            ollama: { keepAliveTime: 10 },
            cherryIn: { accessToken: 'access', refreshToken: 'refresh' }
          }
        },
        assistants: {
          assistants: [{ model: removedModel, defaultModel: removedModel }],
          defaultAssistant: { model: removedModel, defaultModel: removedModel }
        },
        settings: { defaultPaintingProvider: 'cherryin' },
        _persist: { version: 207, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 208)

      expect(migrated.llm.providers).toEqual([{ id: 'openai' }])
      expect(migrated.llm.hiddenProviderIds).toEqual(['openai'])
      expect(migrated.llm.settings).toEqual({ ollama: { keepAliveTime: 10 } })
      expect(migrated.llm.defaultModel).toEqual(llmInitialState.defaultModel)
      expect(migrated.llm.topicNamingModel).toEqual(llmInitialState.topicNamingModel)
      expect(migrated.llm.quickModel).toEqual(llmInitialState.quickModel)
      expect(migrated.llm.translateModel).toEqual(llmInitialState.translateModel)
      expect(migrated.assistants.assistants[0].model).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.assistants[0].defaultModel).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.defaultAssistant.model).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.defaultAssistant.defaultModel).toEqual(llmInitialState.defaultModel)
      expect(migrated.settings.defaultPaintingProvider).toBe('zhipu')
    })
  })

  describe('migration 209: hidden provider ids backfill', () => {
    it('initializes hiddenProviderIds for persisted states that do not have it', async () => {
      const state = {
        llm: {},
        _persist: { version: 208, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 209)

      expect(migrated.llm.hiddenProviderIds).toEqual([])
    })
  })

  describe('migration 210: removed CherryAI provider cleanup', () => {
    it('removes persisted provider state and replaces all model references', async () => {
      const removedModel = { id: 'qwen', name: 'Qwen', provider: 'cherryai' }
      const state = {
        llm: {
          providers: [{ id: 'cherryai' }, { id: 'openai' }],
          hiddenProviderIds: ['cherryai', 'openai'],
          defaultModel: removedModel,
          topicNamingModel: removedModel,
          quickModel: removedModel,
          translateModel: removedModel
        },
        assistants: {
          assistants: [{ model: removedModel, defaultModel: removedModel }],
          defaultAssistant: { model: removedModel, defaultModel: removedModel }
        },
        _persist: { version: 209, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 210)

      expect(migrated.llm.providers).toEqual([{ id: 'openai' }])
      expect(migrated.llm.hiddenProviderIds).toEqual(['openai'])
      expect(migrated.llm.defaultModel).toEqual(llmInitialState.defaultModel)
      expect(migrated.llm.topicNamingModel).toEqual(llmInitialState.topicNamingModel)
      expect(migrated.llm.quickModel).toEqual(llmInitialState.quickModel)
      expect(migrated.llm.translateModel).toEqual(llmInitialState.translateModel)
      expect(migrated.assistants.assistants[0].model).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.assistants[0].defaultModel).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.defaultAssistant.model).toEqual(llmInitialState.defaultModel)
      expect(migrated.assistants.defaultAssistant.defaultModel).toEqual(llmInitialState.defaultModel)
    })
  })

  describe('migration 211: removed navbar position cleanup', () => {
    it('removes the persisted navbar position and preserves other settings', async () => {
      const state = {
        settings: {
          navbarPosition: 'top',
          showMessageOutline: true
        },
        _persist: { version: 210, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 211)

      expect(migrated.settings).not.toHaveProperty('navbarPosition')
      expect(migrated.settings.showMessageOutline).toBe(true)
    })
  })

  describe('migration 212: removed update settings cleanup', () => {
    it('removes persisted update settings and preserves other settings', async () => {
      const state = {
        settings: {
          autoCheckUpdate: true,
          testPlan: true,
          testChannel: 'beta',
          showMessageOutline: true
        },
        _persist: { version: 211, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 212)

      expect(migrated.settings).not.toHaveProperty('autoCheckUpdate')
      expect(migrated.settings).not.toHaveProperty('testPlan')
      expect(migrated.settings).not.toHaveProperty('testChannel')
      expect(migrated.settings.showMessageOutline).toBe(true)
    })
  })

  describe('migration 213: removed feature state and provider reference cleanup', () => {
    it('preserves orphaned knowledge bases for explicit migration and clears safe stale references', async () => {
      const removedEmbeddingModel = { id: 'baai/bge-m3(free)', name: 'BGE M3', provider: 'cherryin' }
      const removedChatModel = { id: 'glm-4.5-flash', name: 'GLM 4.5 Flash', provider: 'cherryin' }
      const state = {
        settings: {
          apiServer: { apiKey: 'cs-sk-secret', enabled: true },
          enableQuickAssistant: true,
          clickTrayToShowQuickAssistant: true,
          readClipboardAtStartup: true,
          showMessageOutline: true,
          sidebarIcons: {
            visible: ['assistants', 'agents', 'openclaw', 'minapp'],
            disabled: ['code', 'notes']
          }
        },
        shortcuts: {
          shortcuts: [
            { key: 'show_app', shortcut: [], editable: true, enabled: true, system: true },
            { key: 'mini_window', shortcut: ['CommandOrControl', 'E'], editable: true, enabled: true, system: true }
          ]
        },
        inputTools: {
          toolOrder: { visible: [], hidden: [] },
          sessionToolOrder: { visible: ['create_session'], hidden: [] }
        },
        codeTools: { environmentVariables: { 'claude-code': 'secret' } },
        openclaw: { gatewayPort: 18790 },
        knowledge: {
          bases: [
            {
              id: 'legacy-base',
              name: 'Legacy Base',
              model: removedEmbeddingModel,
              rerankModel: removedEmbeddingModel,
              items: [{ id: 'item-1', processingStatus: 'completed' }],
              updated_at: 1
            }
          ]
        },
        memory: {
          memoryConfig: {
            embeddingModel: removedEmbeddingModel,
            embeddingDimensions: 1024,
            llmModel: removedChatModel,
            isAutoDimensions: false
          },
          globalMemoryEnabled: true
        },
        _persist: { version: 212, rehydrated: false }
      }

      const migrated: any = await migrate(state as any, 213)

      expect(migrated.settings).not.toHaveProperty('apiServer')
      expect(migrated.settings).not.toHaveProperty('enableQuickAssistant')
      expect(migrated.settings).not.toHaveProperty('clickTrayToShowQuickAssistant')
      expect(migrated.settings).not.toHaveProperty('readClipboardAtStartup')
      expect(migrated.settings.showMessageOutline).toBe(true)
      expect(migrated.settings.sidebarIcons).toEqual({ visible: ['assistants', 'minapp'], disabled: ['notes'] })
      expect(migrated.shortcuts.shortcuts.map((shortcut: { key: string }) => shortcut.key)).toEqual(['show_app'])
      expect(migrated.inputTools).not.toHaveProperty('sessionToolOrder')
      expect(migrated).not.toHaveProperty('codeTools')
      expect(migrated).not.toHaveProperty('openclaw')

      const migratedBase = migrated.knowledge.bases[0]
      expect(migratedBase.model).toEqual(removedEmbeddingModel)
      expect(migratedBase).not.toHaveProperty('rerankModel')
      expect(migratedBase.items[0]).toMatchObject({
        processingStatus: 'failed',
        retryCount: 1
      })
      expect(migratedBase.items[0].processingError).toBeTruthy()

      expect(migrated.memory.memoryConfig).not.toHaveProperty('embeddingModel')
      expect(migrated.memory.memoryConfig).not.toHaveProperty('embeddingDimensions')
      expect(migrated.memory.memoryConfig).not.toHaveProperty('llmModel')
      expect(migrated.memory.memoryConfig.isAutoDimensions).toBe(true)
      expect(migrated.memory.globalMemoryEnabled).toBe(false)
    })
  })
})
