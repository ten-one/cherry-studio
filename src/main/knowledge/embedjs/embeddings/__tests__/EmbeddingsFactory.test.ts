import type { ApiClient } from '@types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { embedQueryMock, getDimensionsMock, ollamaEmbeddingsMock, openAiEmbeddingsMock, voyageEmbeddingsMock } =
  vi.hoisted(() => ({
    embedQueryMock: vi.fn(),
    getDimensionsMock: vi.fn(),
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
    getDimensionsMock.mockResolvedValue(1536)
    embedQueryMock.mockResolvedValue(new Array(1536).fill(0))
    openAiEmbeddingsMock.mockImplementation(() => ({
      getDimensions: getDimensionsMock,
      embedQuery: embedQueryMock
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

  it('uses actual dimensions without passing configured dimensions to official OpenAI embeddings', async () => {
    const { default: Embeddings } = await import('../Embeddings')

    const embeddings = new Embeddings({
      embedApiClient: createEmbedApiClient({
        provider: 'openai',
        model: 'text-embedding-3-small'
      }),
      dimensions: 768
    })

    expect(openAiEmbeddingsMock.mock.calls[0][0]).not.toHaveProperty('dimensions')
    await expect(embeddings.getDimensions()).resolves.toBe(1536)
    expect(getDimensionsMock).toHaveBeenCalledOnce()
    expect(embedQueryMock).not.toHaveBeenCalled()
  })

  it('probes actual dimensions when the SDK does not report them', async () => {
    const { default: Embeddings } = await import('../Embeddings')
    getDimensionsMock.mockResolvedValueOnce(undefined)

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
    expect(embedQueryMock).toHaveBeenCalledWith('sample')
  })

  it('throws when probing returns an empty vector', async () => {
    const { default: Embeddings } = await import('../Embeddings')
    getDimensionsMock.mockResolvedValueOnce(undefined)
    embedQueryMock.mockResolvedValueOnce([])

    const embeddings = new Embeddings({
      embedApiClient: createEmbedApiClient({}),
      dimensions: 768
    })

    await expect(embeddings.getDimensions()).rejects.toThrow(
      'Embedding provider returned an empty vector while detecting dimensions'
    )
  })

  it('does not pass dimensions to Ollama or Voyage SDK constructors', async () => {
    const { default: EmbeddingsFactory } = await import('../EmbeddingsFactory')

    EmbeddingsFactory.create({
      embedApiClient: createEmbedApiClient({
        provider: 'ollama',
        baseURL: 'http://localhost:11434/api',
        model: 'nomic-embed-text'
      })
    })
    EmbeddingsFactory.create({
      embedApiClient: createEmbedApiClient({
        provider: 'voyageai',
        model: 'voyage-3'
      })
    })

    expect(ollamaEmbeddingsMock.mock.calls[0][0]).toEqual({
      model: 'nomic-embed-text',
      baseUrl: 'http://localhost:11434'
    })
    expect(voyageEmbeddingsMock.mock.calls[0][0]).toEqual({
      modelName: 'voyage-3',
      apiKey: 'test-key',
      batchSize: 8
    })
  })
})
