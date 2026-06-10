import { loggerService } from '@logger'
import type { MCPServer } from '@types'

import { CacheService } from '../CacheService'
import { reduxService } from '../ReduxService'

const logger = loggerService.withContext('MCPServersFromRedux')
const MCP_SERVERS_CACHE_KEY = 'mcp:servers'
const MCP_SERVERS_CACHE_TTL = 5 * 60 * 1000

export async function getMCPServersFromRedux(): Promise<MCPServer[]> {
  try {
    logger.debug('Getting MCP servers from Redux store')

    const cachedServers = CacheService.get<MCPServer[]>(MCP_SERVERS_CACHE_KEY)
    if (cachedServers) {
      logger.debug('MCP servers resolved from cache', { count: cachedServers.length })
      return cachedServers
    }

    const servers = await reduxService.select<MCPServer[]>('state.mcp.servers')
    const serverList = servers || []

    CacheService.set(MCP_SERVERS_CACHE_KEY, serverList, MCP_SERVERS_CACHE_TTL)

    logger.debug('Fetched MCP servers from Redux store', { count: serverList.length })
    return serverList
  } catch (error: any) {
    logger.error('Failed to get MCP servers from Redux', { error })
    return []
  }
}
