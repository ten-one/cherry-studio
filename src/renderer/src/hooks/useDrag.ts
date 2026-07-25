// import { loggerService } from '@logger'
import { useCallback, useState } from 'react'

// const logger = loggerService.withContext('useDrag')

const alwaysHandleDrag = () => true

export const useDrag = <T extends HTMLElement>(
  onDrop?: (e: React.DragEvent<T>) => Promise<void> | void,
  shouldHandle?: (e: React.DragEvent<T>) => boolean
) => {
  const [isDragging, setIsDragging] = useState(false)
  const shouldHandleEvent = shouldHandle ?? alwaysHandleDrag

  const handleDragOver = useCallback(
    (e: React.DragEvent<T>) => {
      if (!shouldHandleEvent(e)) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    },
    [shouldHandleEvent]
  )

  const handleDragEnter = useCallback(
    (e: React.DragEvent<T>) => {
      if (!shouldHandleEvent(e)) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
    },
    [shouldHandleEvent]
  )

  const handleDragLeave = useCallback(
    (e: React.DragEvent<T>) => {
      if (!shouldHandleEvent(e)) return

      e.preventDefault()
      e.stopPropagation()
      // 确保是离开当前元素，而不是进入子元素
      // logger.debug('drag leave', { currentTarget: e.currentTarget, relatedTarget: e.relatedTarget })
      if (e.currentTarget.contains(e.relatedTarget as Node)) {
        return
      }
      setIsDragging(false)
    },
    [shouldHandleEvent]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent<T>) => {
      if (!shouldHandleEvent(e)) return

      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      await onDrop?.(e)
    },
    [onDrop, shouldHandleEvent]
  )

  return { isDragging, setIsDragging, handleDragOver, handleDragEnter, handleDragLeave, handleDrop }
}
