import { readdir, readFile, stat } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const candidateDirectory = new URL('../../artifacts/course-rag/candidates/', import.meta.url)
const captureDirectory = 'C:/Users/ragha/Downloads'
for (const filename of (await readdir(candidateDirectory)).filter((name) => name.endsWith('.json')).sort()) {
  const candidate = JSON.parse(await readFile(new URL(filename, candidateDirectory), 'utf8'))
  if (candidate.review?.state === 'verified' || candidate.coverage?.percent === 100) continue
  const capturePath = `${captureDirectory}/${candidate.courseSlug}.html`
  try { await stat(capturePath) } catch { continue }
  const dom = new JSDOM(await readFile(capturePath, 'utf8'))
  const document = dom.window.document
  const result = { slug: candidate.courseSlug, missing: candidate.coverage.missing }
  const overviewText = String(document.querySelector('#course-details,#details')?.textContent || '').replace(/\s+/g, ' ').trim()
  result.outcomeCues = overviewText.match(/.{0,80}(?:learning outcomes?|upon.{0,40}complet(?:ing|ion)|after.{0,40}complet(?:ing|ion)|will allow students to|will be able to).{0,120}/ig) || []
  result.controls = [...document.querySelectorAll('a,button,[data-bs-target]')].map((node) => String(node.textContent || '').replace(/\s+/g, ' ').trim()).filter((text) => /course details|learning outcomes?|modules|university progression|workshops|visa requirements/i.test(text)).filter((text, index, all) => all.indexOf(text) === index)
  for (const selector of ['#details', '#course-details', '#modules', '#university', '#workshop', '#visa']) {
    const node = document.querySelector(selector)
    if (!node) continue
    result[selector] = {
      text: String(node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 1500),
      lists: node.querySelectorAll('ul,ol').length,
      listItems: node.querySelectorAll('li').length,
      moduleCards: node.querySelectorAll('.module-content-accordion-card,[data-module]').length,
    }
  }
  console.log(JSON.stringify(result))
  dom.window.close()
}
