import { loggerService } from '@logger'
import type { MCPServer } from '@types'

import { reduxService } from '../ReduxService'

const logger = loggerService.withContext('MCPServersFromRedux')

/**
 * Fetch the MCP server list from the renderer's Redux store.
 *
 * Always reads fresh state: server edits happen in the renderer and 'mcp/' is
 * not in the StoreSync syncList, so the main process is never notified of
 * changes and any caching here serves stale data. A stale read previously let
 * removeServer delete an OAuth token file that a just-added server sharing the
 * same baseUrl still needed.
 *
 * Throws when the store is unreachable so callers can fail safe.
 */
export async function fetchMCPServersFromRedux(): Promise<MCPServer[]> {
  const servers = await reduxService.select<MCPServer[]>('state.mcp.servers')
  return servers || []
}

/**
 * Like fetchMCPServersFromRedux, but degrades to an empty list when the store
 * is unreachable — for callers where "no servers" is an acceptable fallback.
 */
export async function getMCPServersFromRedux(): Promise<MCPServer[]> {
  try {
    return await fetchMCPServersFromRedux()
  } catch (error: any) {
    logger.error('Failed to get MCP servers from Redux', { error })
    return []
  }
}
