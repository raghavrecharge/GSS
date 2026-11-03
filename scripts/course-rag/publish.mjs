/* global process, console, structuredClone */
import { readFile, writeFile, mkdir, rename, unlink, realpath, open, stat } from 'node:fs/promises'
import { resolve, dirname, relative, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { assertIntegrity, normalizeSourceUrl, scopeForUrl, sha256 } from './core.mjs'
import { evaluateCandidate, REQUIRED_SECTIONS, stableStringify } from './contract.mjs'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function publicationRecord(candidate) {
  assertIntegrity(candidate)
  const coverage = evaluateCandidate(candidate)
  if (!coverage.complete) throw new Error(`Publication refused: candidate has not passed independent review. ${coverage.errors.join(' ')}`)
  if (candidate.record.slug !== candidate.courseSlug || candidate.record.sourceUrl !== candidate.sourceUrl) throw new Error('Publication record identity differs from its reviewed course.')
  const sourceUrl = normalizeSourceUrl(candidate.sourceUrl)
  if (scopeForUrl(sourceUrl) !== candidate.scope) throw new Error('Publication source country scope mismatch.')
  return {
    ...structuredClone(candidate.record),
    sourceScope: candidate.scope,
    seedRevision: `rag:${candidate.contentRevision}`,
    sourceVerified: true,
    sourceCoverage: 'complete',
    ragProvenance: {
      schemaVersion: candidate.schemaVersion,
      candidateId: candidate.candidateId,
      contentRevision: candidate.contentRevision,
      evidenceDigest: candidate.evidenceDigest,
      sourceUrl,
      scope: candidate.scope,
      coverage,
      snapshots: structuredClone(candidate.snapshots),
      sections: Object.fromEntries(REQUIRED_SECTIONS.map(id => {
        const { status, reason, checkedSelectors, sourceItems, totalExtractedItems, evidenceIds, omissions } = candidate.sections[id]
        return [id, { status, ...(reason ? { reason } : {}), checkedSelectors: checkedSelectors || [], sourceItems, totalExtractedItems, evidenceIds, omissions }]
      })),
      review: structuredClone(candidate.review),
    },
  }
}

export function planPublication(records, candidate, { expectedRevision } = {}) {
  if (!Array.isArray(records)) throw new Error('Publication catalogue must be an array.')
  const keys = records.map(record => `${record.slug}:${record.sourceScope || 'global'}`)
  if (new Set(keys).size !== keys.length) throw new Error('Publication catalogue contains duplicate course scopes.')
  const record = publicationRecord(candidate)
  const key = `${record.slug}:${record.sourceScope}`
  const index = keys.indexOf(key)
  const previous = index < 0 ? null : records[index]
  if (previous?.ragProvenance?.contentRevision === candidate.contentRevision && previous?.ragProvenance?.evidenceDigest === candidate.evidenceDigest) {
    if (stableStringify(previous) !== stableStringify(record)) throw new Error('Published content differs despite matching revision identifiers.')
    return { changed: false, records, record }
  }
  if (previous && expectedRevision !== previous.ragProvenance?.contentRevision) throw new Error('Publication revision changed or expected revision was not supplied; inspect the current record before replacement.')
  const next = records.filter((_, itemIndex) => itemIndex !== index)
  next.push(record)
  next.sort((a, b) => `${a.slug}:${a.sourceScope || 'global'}`.localeCompare(`${b.slug}:${b.sourceScope || 'global'}`))
  return { changed: true, records: next, record }
}

async function boundedJson(path, limit) {
  if ((await stat(path)).size > limit) throw new Error('Input exceeds publication size limit.')
  return JSON.parse(await readFile(path, 'utf8'))
}

export async function publishCandidateFile({ candidatePath, outputPath = join(projectRoot, 'src/data/course-rag/publishedCourses.json'), expectedRevision, root = projectRoot }) {
  const resolvedRoot = await realpath(root)
  const target = resolve(outputPath)
  const lexicalRelative = relative(resolvedRoot, target)
  if (!lexicalRelative || lexicalRelative.startsWith('..') || isAbsolute(lexicalRelative)) throw new Error('Publication output must be a file below the project root.')
  const targetParent = await realpath(dirname(target))
  const targetRelative = relative(resolvedRoot, join(targetParent, target.split(/[\\/]/).at(-1)))
  if (!targetRelative || targetRelative.startsWith('..') || isAbsolute(targetRelative)) throw new Error('Publication output must be a file below the project root.')
  // Fail closed on a symlink target, including one pointing outside the permitted root.
  try { if (await realpath(target) !== target) throw new Error('Publication target must not be a symlink.') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const lockPath = `${target}.lock`
  const lock = await open(lockPath, 'wx')
  let temporary
  try {
    const candidate = await boundedJson(resolve(candidatePath), 12 * 1024 * 1024)
    let previousBytes
    try {
      if ((await stat(target)).size > 100 * 1024 * 1024) throw new Error('Publication catalogue exceeds size limit.')
      previousBytes = await readFile(target, 'utf8')
    } catch (error) { if (error.code !== 'ENOENT') throw error }
    const records = previousBytes ? JSON.parse(previousBytes) : []
    const plan = planPublication(records, candidate, { expectedRevision })
    if (!plan.changed) return { changed: false, courseSlug: candidate.courseSlug, revision: candidate.contentRevision }
    const history = `${target}.history`
    await mkdir(history, { recursive: true })
    if (await realpath(history) !== history) throw new Error('Publication history must not be a symlink.')
    // Retain the complete reviewed candidate and the previous catalogue before the atomic swap.
    const retained = [[`${candidate.contentRevision}-${candidate.evidenceDigest}.candidate.json`, JSON.stringify(candidate, null, 2)], [`${sha256(previousBytes || '[]')}.catalogue.json`, previousBytes || '[]']]
    for (const [name, bytes] of retained) {
      const path = join(history, name)
      try { await writeFile(path, bytes, { flag: 'wx' }) } catch (error) { if (error.code !== 'EEXIST' || await readFile(path, 'utf8') !== bytes) throw error }
    }
    temporary = `${target}.${randomUUID()}.tmp`
    await writeFile(temporary, `${JSON.stringify(plan.records, null, 2)}\n`, { flag: 'wx' })
    await rename(temporary, target)
    temporary = undefined
    return { changed: true, courseSlug: candidate.courseSlug, revision: candidate.contentRevision, outputPath: target, rollbackDirectory: history }
  } finally {
    if (temporary) await unlink(temporary).catch(() => {})
    await lock.close()
    await unlink(lockPath)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = {}
  const names = { '--candidate': 'candidatePath', '--out': 'outputPath', '--expected-revision': 'expectedRevision' }
  try {
    for (let index = 2; index < process.argv.length; index += 2) {
      const name = names[process.argv[index]]
      if (!name || !process.argv[index + 1]) throw new Error('Usage: node scripts/course-rag/publish.mjs --candidate reviewed.json [--out catalogue.json] [--expected-revision current-hash]')
      options[name] = process.argv[index + 1]
    }
    if (!options.candidatePath) throw new Error('--candidate is required.')
    console.log(JSON.stringify(await publishCandidateFile(options)))
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
