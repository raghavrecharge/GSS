// Only editorial presentation fields may survive replacement by a reviewed record.
const EDITORIAL_FIELDS = ['image', 'universitySlug', 'categorySlug', 'level', 'subjects', 'tags']

export function applyPublishedRecord(base, published) {
  if (!published || published.slug !== base.slug || published.ragProvenance?.coverage?.complete !== true) return base
  const editorial = Object.fromEntries(EDITORIAL_FIELDS.filter(key => base[key] !== undefined).map(key => [key, base[key]]))
  const detailSections = Object.fromEntries(Object.entries(published.detailSections || {}).map(([id, section]) => {
    const provenance = published.ragProvenance?.sections?.[id]
    return [id, { ...section, ...(provenance?.status ? { status: provenance.status } : {}), ...(provenance?.reason ? { reason: provenance.reason } : {}) }]
  }))
  return {
    ...editorial,
    ...published,
    detailSections,
    description: published.description || published.longDescription?.split('\n\n')[0] || '',
    sourceCoverage: 'complete',
    sourceVerified: true,
    modulesIndicative: false,
    sourceLessonCount: published.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0,
  }
}

export function publishedRecordFor(records, slug, scope = 'global') {
  return records.find(record => record.slug === slug && (record.sourceScope || 'global') === scope)
}
