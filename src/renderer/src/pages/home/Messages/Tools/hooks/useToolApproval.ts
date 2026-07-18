import type { ToolMessageBlock } from '@renderer/types/newMessage'

import { useMcpToolApproval } from './useMcpToolApproval'

/**
 * MCP tool approval state
 */
export interface ToolApprovalState {
  /** Whether the tool is waiting for user confirmation */
  isWaiting: boolean
  /** Whether the tool is currently executing after approval */
  isExecuting: boolean
}

/**
 * MCP tool approval actions
 */
export interface ToolApprovalActions {
  /** Confirm/approve the tool execution */
  confirm: () => void | Promise<void>
  /** Cancel/deny the tool execution */
  cancel: () => void | Promise<void>
  /** Auto-approve this tool for future calls (if available) */
  autoApprove?: () => void | Promise<void>
}

/**
 * Hook for MCP tool approval.
 */
export function useToolApproval(block: ToolMessageBlock): ToolApprovalState & ToolApprovalActions {
  return useMcpToolApproval(block)
}

export { useMcpToolApproval } from './useMcpToolApproval'
