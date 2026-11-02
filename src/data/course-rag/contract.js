export const SCHEMA_VERSION = 1
export const REQUIRED_SECTIONS = [
  'identity', 'programmeDetails', 'courseDetails', 'learningOutcomes', 'accreditation',
  'modules', 'universityProgression', 'entryRequirements', 'workshops', 'visa',
  'tuition', 'about', 'library', 'gettingStarted', 'certificate', 'testimonials',
]
export const SECTION_STATUSES = ['observed', 'missing', 'source_absent', 'blocked', 'conflict']
export const MAX_REPAIR_ROUNDS = 3
export const BLOCK_TYPES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'table', 'blockquote', 'image', 'embed', 'sectionText', 'module', 'fact']

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  return JSON.stringify(value) ?? 'null'
}

export function contentPayload(candidate) {
  return { courseSlug: candidate.courseSlug, sourceUrl: candidate.sourceUrl, scope: candidate.scope || 'global', record: candidate.record, sections: candidate.sections }
}

export function evidencePayload(candidate) {
  return { snapshots: candidate.snapshots, evidence: candidate.evidence }
}

export function projectSections(sections) {
  const blocks = (id) => sections?.[id]?.value?.blocks || []
  const text = (id) => {
    const items = blocks(id)
    return items.find((block) => block.type === 'sectionText')?.text || items.filter((block) => ['p', 'li'].includes(block.type)).map((block) => block.text).join('\n\n')
  }
  const result = {
    title: blocks('identity')[0]?.text || '',
    longDescription: text('programmeDetails'), courseDetails: text('courseDetails'),
    outcomes: blocks('learningOutcomes').filter((block) => block.type === 'li').map((block) => block.text),
    accreditation: text('accreditation'), modules: sections?.modules?.value?.modules || [],
    progression: text('universityProgression'),
    entry: blocks('entryRequirements').filter((block) => ['li', 'p'].includes(block.type)).map((block) => block.text),
    workshops: text('workshops'), visa: text('visa'), library: text('library'),
  }
  for (const sectionId of ['identity', 'tuition']) {
    for (const block of blocks(sectionId)) if (block.type === 'fact' && ['duration', 'mode', 'university', 'fee', 'monthly', 'paymentMonths', 'administrativeFee'].includes(block.field)) result[block.field] = block.value
  }
  return result
}

export function reviewFingerprint(candidate) {
  return stableStringify({ content: contentPayload(candidate), evidence: evidencePayload(candidate), conflicts: candidate.conflicts, unresolvedConflicts: candidate.unresolvedConflicts })
}

export async function verifyCandidateIntegrity(candidate) {
  if (validateCandidate(candidate).length) return false
  const digest = async (value) => {
    const bytes = new TextEncoder().encode(stableStringify(value))
    const result = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(result)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return candidate.contentRevision === await digest(contentPayload(candidate)) && candidate.evidenceDigest === await digest(evidencePayload(candidate))
}

export function validateCandidate(candidate) {
  const errors = []
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return ['Candidate must be an object.']
  if (candidate.schemaVersion !== SCHEMA_VERSION) errors.push('Unsupported candidate schema version.')
  for (const field of ['candidateId', 'courseSlug', 'sourceUrl', 'contentRevision', 'evidenceDigest']) {
    if (typeof candidate[field] !== 'string' || !candidate[field]) errors.push(`${field} is required.`)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate.courseSlug || '')) errors.push('Invalid course slug.')
  if (!Array.isArray(candidate.evidence) || !Array.isArray(candidate.snapshots)) errors.push('Evidence and snapshots must be arrays.')
  if (!candidate.record || typeof candidate.record !== 'object' || Array.isArray(candidate.record)) errors.push('A normalized record is required.')
  if (typeof candidate.record?.title !== 'string' || !candidate.record.title.trim()) errors.push('record.title must be a nonempty string.')
  if (!Array.isArray(candidate.record?.modules) || candidate.record.modules.some((module) => !module || typeof module.title !== 'string' || typeof module.summary !== 'string' || !Array.isArray(module.lessons) || module.lessons.some((lesson) => !lesson || typeof lesson.title !== 'string' || typeof lesson.description !== 'string' || typeof lesson.type !== 'string'))) errors.push('record.modules has an invalid module or lesson shape.')
  if (Array.isArray(candidate.evidence) && candidate.evidence.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.text !== 'string' || !Array.isArray(item.items))) errors.push('Invalid evidence chunk shape.')
  if (Array.isArray(candidate.snapshots) && candidate.snapshots.some((item) => !item || typeof item !== 'object' || typeof item.id !== 'string')) errors.push('Invalid snapshot shape.')
  if (!candidate.review?.builderRunId) errors.push('A builder run identity is required.')
  if (candidate.review?.decisions !== undefined && (!Array.isArray(candidate.review.decisions) || candidate.review.decisions.some((item) => !item || typeof item !== 'object' || typeof item.actor !== 'string'))) errors.push('Invalid review decisions.')
  if (!Array.isArray(candidate.conflicts) || !Array.isArray(candidate.unresolvedConflicts)) errors.push('Conflict arrays are required.')
  for (const id of REQUIRED_SECTIONS) {
    const section = candidate.sections?.[id]
    if (!section || !SECTION_STATUSES.includes(section.status)) errors.push(`${id}: invalid or missing section status.`)
    else if (!Array.isArray(section.evidenceIds) || !Array.isArray(section.omissions)) errors.push(`${id}: evidence and omissions must be arrays.`)
    else if (!Array.isArray(section.value?.blocks) || section.value.blocks.some((block) => !block || !BLOCK_TYPES.includes(block.type) || typeof block.text !== 'string' || (!block.text.trim() && !(['image', 'embed'].includes(block.type) && /^https?:\/\//.test(block.src || ''))))) errors.push(`${id}: invalid or empty source blocks.`)
  }
  return errors
}

export function evaluateCandidate(candidate) {
  const errors = validateCandidate(candidate)
  const snapshotList = Array.isArray(candidate?.snapshots) ? candidate.snapshots : []
  const evidenceList = Array.isArray(candidate?.evidence) ? candidate.evidence : []
  if (snapshotList.some((snapshot) => snapshot?.blocked || snapshot?.truncated || snapshot?.status !== 200)) errors.push('Source capture was blocked, truncated, or unsuccessful.')
  if (errors.length) return { required: REQUIRED_SECTIONS.length, observed: 0, resolved: 0, missing: [...REQUIRED_SECTIONS], sourceAbsent: [], percent: 0, observedPercent: 0, errors: [...new Set(errors)], readyForReview: false, complete: false, state: 'blocked' }
  const snapshots = new Map(snapshotList.filter(Boolean).map((item) => [item.id, item]))
  const evidence = new Map(evidenceList.filter(Boolean).map((item) => [item.id, item]))
  if (!snapshotList.length) errors.push('At least one source snapshot is required.')
  for (const snapshot of snapshotList) {
    if (!snapshot?.id || !snapshot.url || !/^[a-f0-9]{64}$/.test(snapshot.contentHash || '') || !snapshot.retrievedAt) errors.push('Source snapshot metadata is incomplete.')
    if (snapshot?.url !== candidate?.sourceUrl || (snapshot.scope || 'global') !== (candidate?.scope || 'global')) errors.push('Source snapshot course or country scope mismatch.')
  }
  const missing = []
  const observed = []
  const sourceAbsent = []
  for (const id of REQUIRED_SECTIONS) {
    const section = candidate?.sections?.[id]
    if (section?.status === 'source_absent') {
      sourceAbsent.push(id)
      const inspected = snapshotList.some((snapshot) => snapshot?.url === candidate.sourceUrl && snapshot.status === 200 && !snapshot.blocked && !snapshot.truncated && (snapshot.scope || 'global') === (candidate.scope || 'global'))
      if (!section.reason?.trim() || !section.checkedSelectors?.length || !inspected || section.sourceItems !== 0 || section.totalExtractedItems !== 0 || section.evidenceIds?.length || section.value?.blocks?.length || section.omissions?.length) errors.push(`${id}: source absence requires an inspected successful snapshot, reason, checked selectors and zero extracted items.`)
      if (stableStringify(candidate?.record?.detailSections?.[id]) !== stableStringify(section.value)) errors.push(`${id}: normalized absence differs from reviewed section.`)
      continue
    }
    if (section?.status !== 'observed') {
      missing.push(id)
      continue
    }
    observed.push(id)
    if (!Array.isArray(section.value?.blocks) || !section.value.blocks.length) errors.push(`${id}: observed without extracted content blocks.`)
    if (!section.evidenceIds?.length) errors.push(`${id}: observed without citations.`)
    if (section.omissions?.length) errors.push(`${id}: unresolved omissions.`)
    if (section.sourceItems !== section.totalExtractedItems) errors.push(`${id}: source item count does not match extracted count.`)
    if (!Number.isInteger(section.sourceItems) || section.sourceItems < 1) errors.push(`${id}: invalid item count.`)
    const citedBlocks = []
    for (const citationId of section.evidenceIds || []) {
      const chunk = evidence.get(citationId)
      if (!chunk) { errors.push(`${id}: unknown citation ${citationId}.`); continue }
      if (chunk.courseSlug !== candidate.courseSlug || chunk.sectionId !== id) errors.push(`${id}: citation course or section mismatch.`)
      if ((chunk.scope || 'global') !== (candidate.scope || 'global')) errors.push(`${id}: citation country scope mismatch.`)
      if (!snapshots.has(chunk.snapshotId)) errors.push(`${id}: citation snapshot not found.`)
      if (!chunk.text?.trim()) errors.push(`${id}: empty cited text.`)
      if (!Array.isArray(chunk.items) || !chunk.items.length) errors.push(`${id}: citation has no source items.`)
      else citedBlocks.push(...chunk.items)
    }
    if (stableStringify(citedBlocks) !== stableStringify(section.value?.blocks)) errors.push(`${id}: extracted content differs from cited source items.`)
    if (section.sourceItems !== citedBlocks.length) errors.push(`${id}: source count differs from evidence items.`)
    if (stableStringify(candidate?.record?.detailSections?.[id]) !== stableStringify(section.value)) errors.push(`${id}: normalized record differs from reviewed section.`)
    if (id === 'modules') {
      const sourceModules = citedBlocks.filter((block) => block.type === 'module').map((block) => block.module)
      if (stableStringify(sourceModules) !== stableStringify(section.value?.modules)) errors.push('modules: structured modules differ from source evidence.')
      if (!section.value?.modules?.length) errors.push('modules: an observed curriculum requires structured source modules.')
    }
    if (id !== 'identity' && !citedBlocks.some((block) => !/^h[1-6]$/.test(block.type))) errors.push(`${id}: a heading alone is not section content.`)
  }
  const projection = projectSections(candidate?.sections)
  for (const [field, value] of Object.entries(projection)) {
    if (stableStringify(candidate?.record?.[field]) !== stableStringify(value)) errors.push(`${field}: public field differs from evidence projection.`)
  }
  for (const field of ['fee', 'monthly', 'duration', 'mode', 'university', 'administrativeFee', 'credits', 'paymentMonths']) {
    if (candidate?.record?.[field] !== undefined && projection[field] === undefined) errors.push(`${field}: unsupported uncited factual field. Retrieve its typed source evidence before publication.`)
  }
  if ((candidate?.unresolvedConflicts || []).length || (Array.isArray(candidate?.conflicts) && candidate.conflicts.some((item) => item.resolved !== true))) errors.push('Unresolved source conflicts.')
  if ((candidate?.review?.rounds || 0) >= MAX_REPAIR_ROUNDS) errors.push('Maximum repair rounds reached; unresolved work requires an explicit new review cycle.')
  const decisions = Array.isArray(candidate?.review?.decisions) ? candidate.review.decisions : []
  const current = decisions.filter((decision) => decision.candidateRevision === candidate?.contentRevision && decision.evidenceDigest === candidate?.evidenceDigest && decision.payloadFingerprint === reviewFingerprint(candidate))
  const approved = current.some((decision) => decision.role === 'verifier' && decision.verdict === 'approve' && decision.actor !== candidate.review.builderRunId)
  const rejected = current.some((decision) => decision.verdict === 'reject')
  const readyForReview = errors.length === 0 && missing.length === 0
  const complete = readyForReview && approved && !rejected
  return {
    required: REQUIRED_SECTIONS.length, observed: observed.length, resolved: observed.length + sourceAbsent.length, missing, sourceAbsent,
    percent: Math.round((observed.length + sourceAbsent.length) / REQUIRED_SECTIONS.length * 100), observedPercent: Math.round(observed.length / REQUIRED_SECTIONS.length * 100),
    errors: [...new Set(errors)], readyForReview, complete,
    state: complete ? 'verified' : rejected ? 'revision_required' : errors.length ? 'blocked' : 'draft',
  }
}

export function applyReview(candidate, decision) {
  if (!decision || !['verifier', 'challenger'].includes(decision.role) || !['approve', 'reject'].includes(decision.verdict)) throw new Error('A verifier or challenger decision is required.')
  if (!decision.actor || decision.actor === candidate.review?.builderRunId) throw new Error('The builder cannot review its own candidate.')
  if (decision.candidateRevision !== candidate.contentRevision || decision.evidenceDigest !== candidate.evidenceDigest) throw new Error('Review is bound to a stale candidate or evidence digest.')
  if (decision.verdict === 'reject' && !decision.reasons?.length) throw new Error('A rejection must explain the missing evidence or defect.')
  if (decision.verdict === 'approve' && !evaluateCandidate(candidate).readyForReview) throw new Error('Incomplete candidates cannot be approved.')
  const next = structuredClone(candidate)
  next.review.decisions = [...(next.review.decisions || []), { ...decision, payloadFingerprint: reviewFingerprint(candidate) }]
  if (decision.verdict === 'reject') next.review.rounds = (next.review.rounds || 0) + 1
  if (decision.role === 'verifier') next.review.verifierRunId = decision.actor
  next.coverage = evaluateCandidate(next)
  next.review.state = next.coverage.state
  return next
}
