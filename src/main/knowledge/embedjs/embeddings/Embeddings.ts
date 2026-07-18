import type { BaseEmbeddings } from '@cherrystudio/embedjs-interfaces'
import { loggerService } from '@logger'
import { TraceMethod } from '@mcp-trace/trace-core'
import type { ApiClient } from '@types'

import EmbeddingsFactory from './EmbeddingsFactory'

const logger = loggerService.withContext('Embeddings')

export default class Embeddings {
  private sdk: BaseEmbeddings
  private readonly configuredDimensions?: number
  private readonly provider: string

  constructor({ embedApiClient, dimensions }: { embedApiClient: ApiClient; dimensions?: number }) {
    this.configuredDimensions = dimensions
    this.provider = embedApiClient.provider
    this.sdk = EmbeddingsFactory.create({
      embedApiClient
    })
  }
  public async init(): Promise<void> {
    return this.sdk.init()
  }

  @TraceMethod({ spanName: 'dimensions', tag: 'Embeddings' })
  public async getDimensions(): Promise<number> {
    let detectedDimensions = await this.sdk.getDimensions()
    if (!detectedDimensions) {
      detectedDimensions = (await this.sdk.embedQuery('sample')).length
    }

    if (!detectedDimensions) {
      throw new Error('Embedding provider returned an empty vector while detecting dimensions')
    }

    if (this.configuredDimensions !== undefined && this.configuredDimensions !== detectedDimensions) {
      logger.warn('Configured embedding dimensions differ from the provider response; using detected dimensions', {
        provider: this.provider,
        configuredDimensions: this.configuredDimensions,
        detectedDimensions
      })
    }

    return detectedDimensions
  }

  @TraceMethod({ spanName: 'embedDocuments', tag: 'Embeddings' })
  public async embedDocuments(texts: string[]): Promise<number[][]> {
    return this.sdk.embedDocuments(texts)
  }

  @TraceMethod({ spanName: 'embedQuery', tag: 'Embeddings' })
  public async embedQuery(text: string): Promise<number[]> {
    return this.sdk.embedQuery(text)
  }
}
