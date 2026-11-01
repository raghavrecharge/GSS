/* global console */
import { rm, writeFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const outputFile = new URL('../dist/api/courses.seed.json', import.meta.url)
const bundleFile = new URL('../dist/course-catalogue-export.mjs', import.meta.url)
await build({
  stdin: { contents: "export { courses } from './src/data/msbmCatalog.js'", resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: fileURLToPath(bundleFile),
})
const { courses } = await import(`${bundleFile.href}?export=${Date.now()}`)
await writeFile(outputFile, `${JSON.stringify(courses, null, 2)}\n`, 'utf8')
await rm(bundleFile)
console.log(`Exported ${courses.length} courses for the cPanel database.`)
