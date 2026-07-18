import type { BaseEmbeddings } from '@cherrystudio/embedjs-interfaces'
import { OllamaEmbeddings } from '@cherrystudio/embedjs-ollama'
import { OpenAiEmbeddings } from '@cherrystudio/embedjs-openai'
import type { ApiClient } from '@types'
import { net } from 'electron'

import { VoyageEmbeddings } from './VoyageEmbeddings'

const DIMENSION_REQUEST_PROVIDERS = new Set(['openai', 'azure-openai', 'ollama', 'voyageai'])

export const supportsEmbeddingDimensionRequest = (provider: string): boolean => {
  return DIMENSION_REQUEST_PROVIDERS.has(provider)
}

export default class EmbeddingsFactory {
  static create({ embedApiClient, dimensions }: { embedApiClient: ApiClient; dimensions?: number }): BaseEmbeddings {
    const batchSize = 10
    const { model, provider, apiKey, baseURL } = embedApiClient
    const requestDimensions = supportsEmbeddingDimensionRequest(provider) ? dimensions : undefined

    if (provider === 'voyageai') {
      return new VoyageEmbeddings({
        modelName: model,
        apiKey,
        ...(requestDimensions !== undefined ? { outputDimension: requestDimensions } : {}),
        batchSize: 8
      })
    }
    if (provider === 'ollama') {
      return new OllamaEmbeddings({
        model,
        baseUrl: baseURL.replace(/\/api$/, ''),
        ...(requestDimensions !== undefined ? { dimensions: requestDimensions } : {})
      })
    }
    // NOTE: Azure OpenAI 也走 OpenAIEmbeddings, baseURL是https://xxxx.openai.azure.com/openai/v1
    return new OpenAiEmbeddings({
      model,
      apiKey,
      ...(requestDimensions !== undefined ? { dimensions: requestDimensions } : {}),
      batchSize,
      configuration: { baseURL, fetch: net.fetch as typeof fetch }
    })
  }
}
