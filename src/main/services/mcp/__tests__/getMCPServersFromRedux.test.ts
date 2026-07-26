import type { MCPServer } from '@types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@main/services/ReduxService', () => ({
  reduxService: {
    select: vi.fn()
  }
}))

import { reduxService } from '@main/services/ReduxService'

import { fetchMCPServersFromRedux, getMCPServersFromRedux } from '../getMCPServersFromRedux'

const createServer = (overrides: Partial<MCPServer>): MCPServer =>
  ({
    id: 'server',
    name: 'Server',
    isActive: true,
    ...overrides
  }) as MCPServer

describe('getMCPServersFromRedux', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads fresh state on every call instead of caching', async () => {
    const first = [createServer({ id: 'alpha' })]
    const second = [createServer({ id: 'alpha' }), createServer({ id: 'beta' })]
    vi.mocked(reduxService.select).mockResolvedValueOnce(first).mockResolvedValueOnce(second)

    await expect(getMCPServersFromRedux()).resolves.toEqual(first)
    await expect(getMCPServersFromRedux()).resolves.toEqual(second)
    expect(reduxService.select).toHaveBeenCalledTimes(2)
  })

  it('returns an empty list when the store has no servers', async () => {
    vi.mocked(reduxService.select).mockResolvedValue(undefined)

    await expect(getMCPServersFromRedux()).resolves.toEqual([])
  })

  it('degrades to an empty list when the store is unreachable', async () => {
    vi.mocked(reduxService.select).mockRejectedValue(new Error('Main window is not available'))

    await expect(getMCPServersFromRedux()).resolves.toEqual([])
  })
})

describe('fetchMCPServersFromRedux', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('propagates store failures so callers can fail safe', async () => {
    const failure = new Error('Timeout waiting for Redux store to be ready')
    vi.mocked(reduxService.select).mockRejectedValue(failure)

    await expect(fetchMCPServersFromRedux()).rejects.toThrow(failure)
  })

  it('returns servers from the store', async () => {
    const servers = [createServer({ id: 'alpha', baseUrl: 'https://mcp.example.com' })]
    vi.mocked(reduxService.select).mockResolvedValue(servers)

    await expect(fetchMCPServersFromRedux()).resolves.toEqual(servers)
    expect(reduxService.select).toHaveBeenCalledWith('state.mcp.servers')
  })
})
