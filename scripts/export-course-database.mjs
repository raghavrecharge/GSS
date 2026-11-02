/* global console */
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'
import esbuild from '../node_modules/esbuild/lib/main.js'

const { build } = esbuild

const outputFile = new URL('../dist/api/courses.seed.json', import.meta.url)
const publicOutputFile = new URL('../public/api/courses.seed.json', import.meta.url)
const bundleFile = new URL('../dist/course-catalogue-export.mjs', import.meta.url)
await build({
  stdin: { contents: "export { getCompleteCourses } from './src/data/msbmCatalog.js'", resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: fileURLToPath(bundleFile),
})
const { getCompleteCourses } = await import(`${bundleFile.href}?export=${Date.now()}`)
const courses = getCompleteCourses()
const payload = `${JSON.stringify(courses, null, 2)}\n`
await mkdir(new URL('../dist/api/', import.meta.url), { recursive: true })
await writeFile(outputFile, payload, 'utf8')
await writeFile(publicOutputFile, payload, 'utf8')
for (const name of ['content.seed.json', 'countries.seed.json', 'regions.seed.json']) {
  await copyFile(new URL(`../public/api/${name}`, import.meta.url), new URL(`../dist/api/${name}`, import.meta.url))
}
await rm(bundleFile)
console.log(`Exported ${courses.length} courses for the cPanel database.`)
