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
})
