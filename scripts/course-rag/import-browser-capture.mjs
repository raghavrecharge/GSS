/* global console, process */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const payload = JSON.parse(chunks.join(''))
const captures = Array.isArray(payload) ? payload : [payload]
const output = path.resolve(process.cwd(), 'artifacts/course-rag/browser-captures')
await mkdir(output, { recursive: true })

for (const capture of captures) {
  if (!/^[a-z0-9-]+$/.test(capture.slug || '')) throw new Error('Invalid capture slug.')
  if (!/^https:\/\/msbm\.org\.uk\/programme\/[a-z0-9-]+\/?$/.test(capture.url || '')) throw new Error(`Invalid capture URL for ${capture.slug}.`)
  if (typeof capture.html !== 'string' || capture.html.length < 1000) throw new Error(`Capture HTML is empty for ${capture.slug}.`)
  await writeFile(path.join(output, `${capture.slug}.html`), capture.html, 'utf8')
  console.log(JSON.stringify({ slug: capture.slug, characters: capture.html.length }))
}
