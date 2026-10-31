/* global URL, process, console */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const execFileAsync = promisify(execFile)
const countriesUrl = new URL('../src/data/msbmCountries.json', import.meta.url)
const outputUrl = new URL('../src/data/msbmRegions.json', import.meta.url)
const countries = JSON.parse(await readFile(countriesUrl, 'utf8'))
const output = []
let cursor = 0

async function inspectCountry(country) {
  try {
    const { stdout } = await execFileAsync('curl.exe', [
      '-L', '--max-redirs', '5', '--connect-timeout', '10', '--max-time', '20',
      '--fail', '--silent', '--show-error', `https://msbm.org.uk/${country.slug}`,
    ], { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 })
    const document = new JSDOM(stdout, { url: `https://msbm.org.uk/${country.slug}` }).window.document
    const select = document.querySelector('select.msbm-country-select')
    if (!select) return
    const locations = [...select.options].map((option) => {
      try {
        const url = new URL(option.value, 'https://msbm.org.uk')
        return { name: option.textContent.replace(/\s+/g, ' ').trim(), slug: url.pathname.split('/').filter(Boolean)[0], sourceUrl: url.href }
      } catch {
        return null
      }
    }).filter((location) => location?.name && location.slug)
    const uniqueLocations = [...new Map(locations.map((location) => [location.slug, location])).values()]
    if (uniqueLocations.length > 1) {
      output.push({ countrySlug: country.slug, countryName: country.name, locations: uniqueLocations })
      process.stdout.write(`${country.name}: ${uniqueLocations.length} locations\n`)
    }
  } catch (error) {
    process.stderr.write(`skipped ${country.slug}: ${error.message.split('\n')[0]}\n`)
  }
}

async function worker() {
  while (cursor < countries.length) {
    const country = countries[cursor]
    cursor += 1
    await inspectCountry(country)
  }
}

await Promise.all(Array.from({ length: 5 }, () => worker()))
output.sort((a, b) => a.countryName.localeCompare(b.countryName))
await writeFile(outputUrl, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ countriesWithRegions: output.length, locations: output.reduce((sum, country) => sum + country.locations.length, 0) }, null, 2))
