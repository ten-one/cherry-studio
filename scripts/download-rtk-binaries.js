/**
 * Downloads rtk binary for the target platform during build.
 * Called from before-pack.js to bundle the binary into resources/binaries/.
 *
 * Usage:
 *   node scripts/download-rtk-binaries.js <platform> <arch>
 *   e.g. node scripts/download-rtk-binaries.js darwin arm64
 */
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execFileSync } = require('child_process')
const AdmZip = require('adm-zip')

const RTK_VERSION = '0.30.1'

const RTK_PACKAGES = {
  'darwin-arm64': { file: 'rtk-aarch64-apple-darwin.tar.gz', binary: 'rtk' },
  'darwin-x64': { file: 'rtk-x86_64-apple-darwin.tar.gz', binary: 'rtk' },
  'linux-x64': { file: 'rtk-x86_64-unknown-linux-musl.tar.gz', binary: 'rtk' },
  'linux-arm64': { file: 'rtk-aarch64-unknown-linux-gnu.tar.gz', binary: 'rtk' },
  'win32-x64': { file: 'rtk-x86_64-pc-windows-msvc.zip', binary: 'rtk.exe' }
}

function downloadFile(url, destPath) {
  console.log(`Downloading: ${url}`)
  execFileSync('curl', ['-fSL', '--retry', '3', '-o', destPath, url], { stdio: 'inherit' })
  if (!fs.existsSync(destPath)) {
    throw new Error(`Download failed: ${destPath} not found`)
  }
}

function extractArchive(archivePath, destinationDir) {
  if (archivePath.endsWith('.tar.gz')) {
    execFileSync('tar', ['-xzf', archivePath, '-C', destinationDir], { stdio: 'inherit' })
  } else if (archivePath.endsWith('.zip')) {
    new AdmZip(archivePath).extractAllTo(destinationDir, true)
  }
}

function downloadRtk(platformKey, outputDir) {
  const pkg = RTK_PACKAGES[platformKey]
  if (!pkg) {
    console.warn(`[rtk] No binary available for ${platformKey}, skipping`)
    return
  }

  const url = `https://github.com/rtk-ai/rtk/releases/download/v${RTK_VERSION}/${pkg.file}`
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rtk-'))
  const tempFile = path.join(tempDir, pkg.file)

  try {
    downloadFile(url, tempFile)
    extractArchive(tempFile, tempDir)

    // rtk archives extract the binary at the root level
    const srcPath = path.join(tempDir, pkg.binary)
    if (!fs.existsSync(srcPath)) {
      throw new Error(`rtk binary '${pkg.binary}' not found in extracted archive`)
    }

    const destPath = path.join(outputDir, pkg.binary)
    fs.copyFileSync(srcPath, destPath)
    if (process.platform !== 'win32') {
      fs.chmodSync(destPath, 0o755)
    }
    console.log(`[rtk] Installed ${pkg.binary} to ${destPath}`)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function main() {
  const platform = process.argv[2] || process.platform
  const arch = process.argv[3] || process.arch
  const platformKey = `${platform}-${arch}`

  console.log(`Downloading rtk binary for ${platformKey}...`)

  const outputDir = path.join(__dirname, '..', 'resources', 'binaries', platformKey)
  fs.mkdirSync(outputDir, { recursive: true })

  downloadRtk(platformKey, outputDir)

  // Write version file for upgrade detection at runtime
  fs.writeFileSync(path.join(outputDir, '.rtk-version'), RTK_VERSION, 'utf8')

  console.log(`All binaries downloaded to ${outputDir}`)
}

if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error('Failed to download binaries:', error.message)
    // Report failure to before-pack; it decides whether the download is fatal.
    process.exitCode = 1
  }
}

module.exports = { extractArchive }
