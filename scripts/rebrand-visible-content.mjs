/* global process, console */
import { readFile, writeFile } from 'node:fs/promises'

const files = process.argv.slice(2)
const replacements = [
  [/Metropolitan School of Business &amp; Management/g, 'The Global School of Skills (GSS)'],
  [/Metropolitan School of Business & Management/g, 'The Global School of Skills (GSS)'],
  [/Metropolitan School of Business and Management/g, 'The Global School of Skills (GSS)'],
  [/Metropolitan School Of Business And Management/g, 'The Global School of Skills (GSS)'],
  [/MSBM UK/g, 'The Global School of Skills (GSS)'],
  [/MSBM/g, 'GSS'],
  [/info@msbm\.org\.uk/g, 'info@globalschoolofskills.com'],
]

for (const file of files) {
  const source = await readFile(file, 'utf8')
  const output = replacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), source)
  if (output !== source) {
    await writeFile(file, output, 'utf8')
    console.log(`rebranded ${file}`)
  }
}
