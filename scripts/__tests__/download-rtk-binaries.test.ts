import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import AdmZip from 'adm-zip'
import { describe, expect, it } from 'vitest'

const { extractArchive } = require('../download-rtk-binaries') as {
  extractArchive: (archivePath: string, destinationDir: string) => void
}

describe('download-rtk-binaries', () => {
  it('extracts the Windows RTK binary from a ZIP archive', () => {
    const fixtureContents = Buffer.from('rtk test binary')
    const fixtureDir = mkdtempSync(path.join(tmpdir(), 'rtk-archive-test-'))
    const archivePath = path.join(fixtureDir, 'rtk-windows.zip')
    const destinationDir = path.join(fixtureDir, 'extracted')
    const extractedBinaryPath = path.join(destinationDir, 'rtk.exe')

    mkdirSync(destinationDir)

    try {
      const archive = new AdmZip()
      archive.addFile('rtk.exe', fixtureContents)
      archive.writeZip(archivePath)

      extractArchive(archivePath, destinationDir)

      expect(readFileSync(extractedBinaryPath)).toEqual(fixtureContents)
    } finally {
      if (existsSync(extractedBinaryPath)) {
        unlinkSync(extractedBinaryPath)
      }
      if (existsSync(archivePath)) {
        unlinkSync(archivePath)
      }
      if (existsSync(destinationDir)) {
        rmdirSync(destinationDir)
      }
      if (existsSync(fixtureDir)) {
        rmdirSync(fixtureDir)
      }
    }
  })
})
