import { loggerService } from '@logger'
import { useDrag } from '@renderer/hooks/useDrag'
import type { FileMetadata } from '@renderer/types'
import { filterSupportedFiles } from '@renderer/utils'
import { getFilesFromDropEvent, hasFileDropData } from '@renderer/utils/input'
import type { TFunction } from 'i18next'
import { useCallback } from 'react'

const logger = loggerService.withContext('useFileDragDrop')

export interface UseFileDragDropOptions {
  supportedExts: string[]
  setFiles: (updater: (prevFiles: FileMetadata[]) => FileMetadata[]) => void
  enabled?: boolean
  t: TFunction
}

const shouldHandleFileDrag = (event: React.DragEvent<HTMLDivElement>) => hasFileDropData(event.dataTransfer)

/**
 * Inputbar 文件拖拽上传 Hook
 *
 * 处理文件拖拽、文本拖拽，支持文件类型过滤和错误提示
 *
 * @param options - 拖拽配置选项
 * @returns 拖拽状态和事件处理函数
 *
 * @example
 * ```tsx
 * const dragDrop = useFileDragDrop({
 *   supportedExts: ['.png', '.jpg', '.pdf'],
 *   setFiles: (updater) => setFiles(updater),
 *   enabled: true,
 *   t: useTranslation().t
 * })
 *
 * <div
 *   onDragEnter={dragDrop.handleDragEnter}
 *   onDragLeave={dragDrop.handleDragLeave}
 *   onDragOver={dragDrop.handleDragOver}
 *   onDrop={dragDrop.handleDrop}
 *   className={dragDrop.isDragging ? 'dragging' : ''}
 * >
 *   Drop files here
 * </div>
 * ```
 */
export function useFileDragDrop(options: UseFileDragDropOptions) {
  const { enabled, setFiles, supportedExts, t } = options

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      if (!enabled) {
        return
      }

      // 处理文件拖拽
      const droppedFiles = await getFilesFromDropEvent(event).catch((err) => {
        logger.error('handleDrop:', err)
        return null
      })

      if (droppedFiles) {
        const supportedFiles = await filterSupportedFiles(droppedFiles, supportedExts)
        if (supportedFiles.length > 0) {
          setFiles((prevFiles) => [...prevFiles, ...supportedFiles])
        }

        // 如果有不支持的文件，显示提示
        if (droppedFiles.length > 0 && supportedFiles.length !== droppedFiles.length) {
          window.toast.info(
            t('chat.input.file_not_supported_count', {
              count: droppedFiles.length - supportedFiles.length
            })
          )
        }
      }
    },
    [enabled, setFiles, supportedExts, t]
  )

  const dragState = useDrag(handleDrop, shouldHandleFileDrag)

  return {
    isDragging: enabled ? dragState.isDragging : false,
    setIsDragging: dragState.setIsDragging,
    handleDragOver: enabled ? dragState.handleDragOver : undefined,
    handleDragEnter: enabled ? dragState.handleDragEnter : undefined,
    handleDragLeave: enabled ? dragState.handleDragLeave : undefined,
    handleDrop: enabled ? dragState.handleDrop : undefined
  }
}
