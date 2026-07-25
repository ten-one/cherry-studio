import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useDrag } from '../useDrag'

const createDragEvent = () =>
  ({
    currentTarget: document.createElement('div'),
    preventDefault: vi.fn(),
    relatedTarget: null,
    stopPropagation: vi.fn()
  }) as unknown as React.DragEvent<HTMLDivElement>

describe('useDrag', () => {
  it('leaves rejected events entirely to native drag and drop', async () => {
    const onDrop = vi.fn()
    const shouldHandle = vi.fn(() => false)
    const { result } = renderHook(() => useDrag<HTMLDivElement>(onDrop, shouldHandle))
    const events = [createDragEvent(), createDragEvent(), createDragEvent(), createDragEvent()]

    act(() => {
      result.current.handleDragEnter(events[0])
      result.current.handleDragOver(events[1])
      result.current.handleDragLeave(events[2])
    })
    await act(async () => {
      await result.current.handleDrop(events[3])
    })

    expect(shouldHandle).toHaveBeenCalledTimes(4)
    expect(onDrop).not.toHaveBeenCalled()
    expect(result.current.isDragging).toBe(false)
    for (const event of events) {
      expect(event.preventDefault).not.toHaveBeenCalled()
      expect(event.stopPropagation).not.toHaveBeenCalled()
    }
  })

  it('keeps preventing and tracking accepted drag events', async () => {
    const onDrop = vi.fn()
    const shouldHandle = vi.fn(() => true)
    const { result } = renderHook(() => useDrag<HTMLDivElement>(onDrop, shouldHandle))
    const dragEnterEvent = createDragEvent()
    const dropEvent = createDragEvent()

    act(() => result.current.handleDragEnter(dragEnterEvent))

    expect(result.current.isDragging).toBe(true)
    expect(dragEnterEvent.preventDefault).toHaveBeenCalledOnce()
    expect(dragEnterEvent.stopPropagation).toHaveBeenCalledOnce()

    await act(async () => result.current.handleDrop(dropEvent))

    expect(result.current.isDragging).toBe(false)
    expect(dropEvent.preventDefault).toHaveBeenCalledOnce()
    expect(dropEvent.stopPropagation).toHaveBeenCalledOnce()
    expect(onDrop).toHaveBeenCalledOnce()
    expect(onDrop).toHaveBeenCalledWith(dropEvent)
  })

  it('preserves the original handle-all behavior when no filter is provided', () => {
    const { result } = renderHook(() => useDrag<HTMLDivElement>())
    const event = createDragEvent()

    act(() => result.current.handleDragOver(event))

    expect(result.current.isDragging).toBe(true)
    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(event.stopPropagation).toHaveBeenCalledOnce()
  })
})
