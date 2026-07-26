import type { MCPServer, MCPTool } from '@types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@main/services/mcp/getMCPServersFromRedux', () => ({
  fetchMCPServersFromRedux: vi.fn(),
  getMCPServersFromRedux: vi.fn()
}))

vi.mock('@main/services/WindowService', () => ({
  windowService: {
    getMainWindow: vi.fn(() => null)
  }
}))

import fs from 'node:fs/promises'

import { fetchMCPServersFromRedux, getMCPServersFromRedux } from '@main/services/mcp/getMCPServersFromRedux'
import mcpService from '@main/services/MCPService'

const baseInputSchema: { type: 'object'; properties: Record<string, unknown>; required: string[] } = {
  type: 'object',
  properties: {},
  required: []
}

const createTool = (overrides: Partial<MCPTool>): MCPTool => ({
  id: `${overrides.serverId}__${overrides.name}`,
  name: overrides.name ?? 'tool',
  description: overrides.description,
  serverId: overrides.serverId ?? 'server',
  serverName: overrides.serverName ?? 'server',
  inputSchema: baseInputSchema,
  type: 'mcp',
  ...overrides
})

describe('MCPService.listAllActiveServerTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters disabled tools per server', async () => {
    const servers: MCPServer[] = [
      {
        id: 'alpha',
        name: 'Alpha',
        isActive: true,
        disabledTools: ['disabled_tool']
      },
      {
        id: 'beta',
        name: 'Beta',
        isActive: true
      }
    ]

    vi.mocked(getMCPServersFromRedux).mockResolvedValue(servers)

    const listToolsSpy = vi.spyOn(mcpService as any, 'listToolsImpl').mockImplementation(async (server: any) => {
      if (server.id === 'alpha') {
        return [
          createTool({ name: 'enabled_tool', serverId: server.id, serverName: server.name }),
          createTool({ name: 'disabled_tool', serverId: server.id, serverName: server.name })
        ]
      }
      return [createTool({ name: 'beta_tool', serverId: server.id, serverName: server.name })]
    })

    const tools = await mcpService.listAllActiveServerTools()

    expect(listToolsSpy).toHaveBeenCalledTimes(2)
    expect(tools.map((tool) => tool.name)).toEqual(['enabled_tool', 'beta_tool'])
  })
})

describe('MCPService.removeServer OAuth cleanup', () => {
  const server: MCPServer = {
    id: 'alpha',
    name: 'Alpha',
    isActive: true,
    baseUrl: 'https://mcp.example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deletes the token file when no other server shares the baseUrl', async () => {
    vi.mocked(fetchMCPServersFromRedux).mockResolvedValue([])
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

    await mcpService.removeServer({} as Electron.IpcMainInvokeEvent, server)

    expect(unlinkSpy).toHaveBeenCalledTimes(1)
    expect(String(unlinkSpy.mock.calls[0][0])).toContain('_oauth.json')
  })

  it('keeps the token file while another server still uses the baseUrl', async () => {
    vi.mocked(fetchMCPServersFromRedux).mockResolvedValue([
      { id: 'beta', name: 'Beta', isActive: true, baseUrl: server.baseUrl } as MCPServer
    ])
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

    await mcpService.removeServer({} as Electron.IpcMainInvokeEvent, server)

    expect(unlinkSpy).not.toHaveBeenCalled()
  })

  it('skips token deletion when the server list cannot be read', async () => {
    vi.mocked(fetchMCPServersFromRedux).mockRejectedValue(new Error('store unreachable'))
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined)

    await mcpService.removeServer({} as Electron.IpcMainInvokeEvent, server)

    expect(unlinkSpy).not.toHaveBeenCalled()
  })
})
