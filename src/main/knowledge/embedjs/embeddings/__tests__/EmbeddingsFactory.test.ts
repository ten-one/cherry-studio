import type { ApiClient } from '@types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ollamaEmbeddingsMock, openAiEmbeddingsMock, voyageEmbeddingsMock } = vi.hoisted(() => ({
  ollamaEmbeddingsMock: vi.fn(),
  openAiEmbeddingsMock: vi.fn(),
  voyageEmbeddingsMock: vi.fn()
}))

vi.mock('@cherrystudio/embedjs-ollama', () => ({
  OllamaEmbeddings: ollamaEmbeddingsMock
}))

vi.mock('@cherrystudio/embedjs-openai', () => ({
  OpenAiEmbeddings: openAiEmbeddingsMock
}))

vi.mock('../VoyageEmbeddings', () => ({
  VoyageEmbeddings: voyageEmbeddingsMock
}))

const createEmbedApiClient = (overrides: Partial<ApiClient>): ApiClient => ({
  apiKey: 'test-key',
  apiVersion: '',
  baseURL: 'https://example.com/v1',
  model: 'text-embedding-3-small',
  provider: 'openai',
  ...overrides
})

describe('EmbeddingsFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    openAiEmbeddingsMock.mockImplementation(() => ({
      getDimensions: vi.fn().mockResolvedValue(undefined),
      embedQuery: vi.fn().mockResolvedValue(new Array(1536).fill(0))
    }))
  })

  it('passes custom model names through without passing dimensions to OpenAI-compatible embeddings', async () => {
    const { default: EmbeddingsFactory } = await import('../EmbeddingsFactory')

    EmbeddingsFactory.create({
      embedApiClient: createEmbedApiClient({
        provider: 'openai',
        baseURL: 'https://api.example.com/v1',
        model: 'custom/embedding-model'
      })
    })

    expect(openAiEmbeddingsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom/embedding-model',
        apiKey: 'test-key',
        batchSize: 10,
        configuration: expect.objectContaining({
          baseURL: 'https://api.example.com/v1'
        })
      })
    )
    expect(openAiEmbeddingsMock.mock.calls[0][0]).not.toHaveProperty('dimensions')
  })

  it('passes configured dimensions to official OpenAI embeddings', async () => {
    const { default: Embeddings } = await import('../Embeddings')

    const embeddings = new Embeddings({
      embedApiClient: createEmbedApiClient({
        provider: 'openai',
        model: 'text-embedding-3-small'
      }),
      dimensions: 768
    })

    expect(openAiEmbeddingsMock.mock.calls[0][0]).toHaveProperty('dimensions', 768)
    await expect(embeddings.getDimensions()).resolves.toBe(768)
  })

  it('detects actual dimensions when a custom provider cannot receive the dimensions parameter', async () => {
    const { default: Embeddings } = await import('../Embeddings')

    const embeddings = new Embeddings({
      embedApiClient: createEmbedApiClient({
        provider: 'custom-provider',
        baseURL: 'https://api.example.com/v1',
        model: 'custom/embedding-model'
      }),
      dimensions: 768
    })

    expect(openAiEmbeddingsMock.mock.calls[0][0]).not.toHaveProperty('dimensions')
    await expect(embeddings.getDimensions()).resolves.toBe(1536)
  })

  it('passes dimensions to Ollama and Voyage SDK constructors', async () => {
    const { default: EmbeddingsFactory } = await import('../EmbeddingsFactory')

    EmbeddingsFactory.create({
      embedApiClient: createEmbedApiClient({
        provider: 'ollama',
        baseURL: 'http://localhost:11434/api',
        model: 'nomic-embed-text'
      }),
      dimensions: 768
    })
    EmbeddingsFactory.create({
      embedApiClient: createEmbedApiClient({
        provider: 'voyageai',
        model: 'voyage-3'
      }),
      dimensions: 512
    })

    expect(ollamaEmbeddingsMock.mock.calls[0][0]).toEqual({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434',
      dimensions: 768
    })
    expect(voyageEmbeddingsMock.mock.calls[0][0]).toEqual({
      modelName: 'voyage-3',
      apiKey: 'test-key',
      outputDimension: 512,
      batchSize: 8
    })
  })
})
