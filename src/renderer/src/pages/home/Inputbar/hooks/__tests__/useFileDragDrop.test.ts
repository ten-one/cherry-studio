import type * as InputUtils from '@renderer/utils/input'
import { act, renderHook } from '@testing-library/react'
import type { TFunction } from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFileDragDrop } from '../useFileDragDrop'

const mocks = vi.hoisted(() => ({
  filterSupportedFiles: vi.fn(),
  getFilesFromDropEvent: vi.fn()
}))

vi.mock('@renderer/utils', () => ({
  filterSupportedFiles: mocks.filterSupportedFiles
}))

vi.mock('@renderer/utils/input', async (importOriginal) => {
  const original = await importOriginal<typeof InputUtils>()
  return {
    ...original,
    getFilesFromDropEvent: mocks.getFilesFromDropEvent
  }
})

const createDragEvent = (dataTransfer: Partial<DataTransfer>) =>
  ({
    currentTarget: document.createElement('div'),
    dataTransfer: {
      files: [],
      items: [],
      types: [],
      ...dataTransfer
    },
    preventDefault: vi.fn(),
    relatedTarget: null,
    stopPropagation: vi.fn()
  }) as unknown as React.DragEvent<HTMLDivElement>

describe('useFileDragDrop', () => {
  const setFiles = vi.fn()
  const t = vi.fn((key: string) => key) as unknown as TFunction
  const toastInfo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.toast = { info: toastInfo } as unknown as typeof window.toast
  })

  it('leaves text drag and drop to the native textarea', async () => {
    const { result } = renderHook(() => useFileDragDrop({ enabled: true, setFiles, supportedExts: ['.txt'], t }))
    const dragOverEvent = createDragEvent({ types: ['text/plain'] })
    const dropEvent = createDragEvent({ types: ['text/plain'] })

    act(() => result.current.handleDragOver?.(dragOverEvent))
    await act(async () => result.current.handleDrop?.(dropEvent))

    expect(dragOverEvent.preventDefault).not.toHaveBeenCalled()
    expect(dragOverEvent.stopPropagation).not.toHaveBeenCalled()
    expect(dropEvent.preventDefault).not.toHaveBeenCalled()
    expect(dropEvent.stopPropagation).not.toHaveBeenCalled()
    expect(result.current.isDragging).toBe(false)
    expect(mocks.getFilesFromDropEvent).not.toHaveBeenCalled()
  })

  it('keeps supported file handling and unsupported file feedback', async () => {
    const supportedFile = { ext: '.txt', id: 'supported' }
    const unsupportedFile = { ext: '.exe', id: 'unsupported' }
    mocks.getFilesFromDropEvent.mockResolvedValue([supportedFile, unsupportedFile])
    mocks.filterSupportedFiles.mockResolvedValue([supportedFile])
    const { result } = renderHook(() => useFileDragDrop({ enabled: true, setFiles, supportedExts: ['.txt'], t }))
    const file = new File(['content'], 'file.txt')
    const dragEnterEvent = createDragEvent({ files: [file] as unknown as FileList, types: ['Files'] })
    const dropEvent = createDragEvent({ files: [file] as unknown as FileList, types: ['Files'] })

    act(() => result.current.handleDragEnter?.(dragEnterEvent))
    expect(result.current.isDragging).toBe(true)

    await act(async () => result.current.handleDrop?.(dropEvent))

    expect(result.current.isDragging).toBe(false)
    expect(dropEvent.preventDefault).toHaveBeenCalledOnce()
    expect(dropEvent.stopPropagation).toHaveBeenCalledOnce()
    expect(mocks.filterSupportedFiles).toHaveBeenCalledWith([supportedFile, unsupportedFile], ['.txt'])
    expect(setFiles).toHaveBeenCalledOnce()
    expect(setFiles.mock.calls[0][0]([])).toEqual([supportedFile])
    expect(toastInfo).toHaveBeenCalledWith('chat.input.file_not_supported_count')
    expect(t).toHaveBeenCalledWith('chat.input.file_not_supported_count', { count: 1 })
  })
})
