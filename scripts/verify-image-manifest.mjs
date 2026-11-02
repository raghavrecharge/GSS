import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const manifestPath = path.resolve('artifacts/baseline/image-manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const changed = []

for (const [relative, expected] of Object.entries(manifest.files)) {
  try {
    const bytes = await readFile(path.resolve(manifest.root, relative))
    const actual = createHash('sha256').update(bytes).digest('hex')
    if (actual !== expected.sha256 || bytes.length !== expected.bytes) changed.push(relative)
  } catch {
    changed.push(relative)
  }
}

if (changed.length) {
  console.error(`Locked Mindu/Conca images changed or disappeared:\n${changed.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Verified ${Object.keys(manifest.files).length} locked Mindu/Conca image assets.`)
}
