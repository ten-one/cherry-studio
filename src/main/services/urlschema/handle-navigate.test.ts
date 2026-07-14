import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  executeJavaScript: vi.fn(),
  getMainWindow: vi.fn()
}))

vi.mock('@main/constant', () => ({ isMac: false }))

vi.mock('../WindowService', () => ({
  windowService: {
    getMainWindow: mocks.getMainWindow
  }
}))

import { handleNavigateProtocolUrl } from './handle-navigate'

const createNavigationUrl = (path: string) => new URL(`cherrystudio://navigate${path}`)

describe('handleNavigateProtocolUrl allowlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.executeJavaScript.mockResolvedValue(true)
    mocks.getMainWindow.mockReturnValue({
      isDestroyed: () => false,
      webContents: { executeJavaScript: mocks.executeJavaScript }
    })
  })

  it.each(['/', '/settings/provider', '/apps/id'])('allows navigation to %s', async (path) => {
    handleNavigateProtocolUrl(createNavigationUrl(path))

    await vi.waitFor(() => expect(mocks.executeJavaScript).toHaveBeenCalledTimes(2))
    expect(mocks.executeJavaScript).toHaveBeenNthCalledWith(2, `window.navigate('${path}')`)
  })

  it.each(['/agents', '/code', '/openclaw', '/unknown', '/knowledge-legacy'])('blocks navigation to %s', (path) => {
    handleNavigateProtocolUrl(createNavigationUrl(path))

    expect(mocks.getMainWindow).not.toHaveBeenCalled()
    expect(mocks.executeJavaScript).not.toHaveBeenCalled()
  })
})
