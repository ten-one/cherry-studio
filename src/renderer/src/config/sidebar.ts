import type { SidebarIcon } from '@renderer/types'

/**
 * 默认显示的侧边栏图标
 * 这些图标会在侧边栏中默认显示
 */
export const DEFAULT_SIDEBAR_ICONS: SidebarIcon[] = [
  'assistants',
  'agents',
  'store',
  'paintings',
  'translate',
  'minapp',
  'knowledge',
  'files',
  'notes'
]

/**
 * 必须显示的侧边栏图标（不能被隐藏）
 * 这些图标必须始终在侧边栏中可见
 * 抽取为参数方便未来扩展
 */
export const REQUIRED_SIDEBAR_ICONS: SidebarIcon[] = ['assistants']

const SIDEBAR_ICON_SET = new Set<string>(DEFAULT_SIDEBAR_ICONS)

export function isValidSidebarIcon(icon: string): icon is SidebarIcon {
  return SIDEBAR_ICON_SET.has(icon)
}

export function filterValidSidebarIcons(icons: readonly string[] | undefined): SidebarIcon[] {
  return [...new Set(icons ?? [])].filter(isValidSidebarIcon)
}
