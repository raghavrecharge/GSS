import { createServer } from 'node:http'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import { stdout } from 'node:process'

const outputPath = resolve('src/data/msbmVerifiedCatalog.json')
const countriesOutputPath = resolve('src/data/msbmCountries.json')
const previewPath = resolve('artifacts/msbm-mba-preview.png')
const modulesPreviewPath = resolve('artifacts/msbm-mba-modules.png')

const server = createServer((request, response) => {
  if (request.method !== 'POST' || !['/catalog', '/countries', '/screenshot', '/screenshot-modules'].includes(request.url)) {
    response.writeHead(404)
    response.end('Not found')
    return
  }

  const chunks = []
  request.on('data', (chunk) => chunks.push(chunk))
  request.on('end', async () => {
    try {
      const payload = Buffer.concat(chunks)
      if (request.url === '/screenshot' || request.url === '/screenshot-modules') {
        const screenshotPath = request.url === '/screenshot-modules' ? modulesPreviewPath : previewPath
        await mkdir(resolve('artifacts'), { recursive: true })
        await writeFile(screenshotPath, payload)
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ ok: true, outputPath: screenshotPath }))
        return
      }

      const data = JSON.parse(payload.toString('utf8'))
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Expected a non-empty catalogue array')
      }

      if (request.url === '/countries') {
        if (data.length < 200) throw new Error('Expected the complete MSBM country list')
        await writeFile(countriesOutputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ ok: true, count: data.length, outputPath: countriesOutputPath }))
        return
      }

      await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: true, count: data.length, outputPath }))
    } catch (error) {
      response.writeHead(400, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: false, error: String(error) }))
    }
  })
})

server.listen(4178, '127.0.0.1', () => {
  stdout.write('MSBM catalogue receiver listening on http://127.0.0.1:4178\n')
})
