import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public')
const imageRoots = [path.resolve('public/assets/img'), path.resolve('public/conca/assets/img')]
const output = path.resolve('artifacts/baseline/image-manifest.json')
const supported = new Set(['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(absolute))
    else if (supported.has(path.extname(entry.name).toLowerCase())) files.push(absolute)
  }
  return files
}

const files = (await Promise.all(imageRoots.map(walk))).flat().sort()
const manifest = {}
for (const file of files) {
  const bytes = await readFile(file)
  manifest[path.relative(root, file).replaceAll('\\', '/')] = {
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

await mkdir(path.dirname(output), { recursive: true })
await writeFile(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), root: 'public', scopes: ['assets/img', 'conca/assets/img'], files: manifest }, null, 2)}\n`)
console.log(`Recorded ${files.length} locked image assets in ${output}`)
