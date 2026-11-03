/* global console */
import { readFile, rm, writeFile } from 'node:fs/promises'
import { URL, fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const outputFile = new URL('../dist/api/courses.seed.json', import.meta.url)
const versionedOutputFile = new URL('../dist/api/courses.versioned.seed.json', import.meta.url)
const bundleFile = new URL('../dist/course-catalogue-export.mjs', import.meta.url)
const detailRoot = new URL('../public/data/programmes/', import.meta.url)
await build({
  stdin: { contents: "export { courses } from './src/data/msbmCatalog.js'", resolveDir: fileURLToPath(new URL('..', import.meta.url)) },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: fileURLToPath(bundleFile),
})
const { courses } = await import(`${bundleFile.href}?export=${Date.now()}`)
// Light index entries are merged with their static detail files so the database holds full records.
const records = await Promise.all(courses.map(async (course) => {
  if (!course.detailPath) return course
  const detail = JSON.parse(await readFile(new URL(`${course.slug}.json`, detailRoot), 'utf8'))
  return { ...course, ...detail }
}))
await writeFile(outputFile, `${JSON.stringify(records)}\n`, 'utf8')
await writeFile(versionedOutputFile, `${JSON.stringify(records.filter((course) => course.seedRevision), null, 2)}\n`, 'utf8')
await rm(bundleFile)
console.log(`Exported ${records.length} courses for the cPanel database (${records.filter((course) => course.seedRevision).length} versioned).`)
