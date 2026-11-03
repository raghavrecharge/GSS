export function normaliseModules(modules = []) {
  return modules.map((module, index) => {
    const item = Array.isArray(module) ? { title: module[0], summary: module[1], meta: module[2], lessons: module[3] || [] } : module
    return { ...item, id: `module-${index}`, title: item.title || '', summary: item.summary || item.description || '', meta: item.meta || '', lectures: String(item.lectures || ''), quizzes: String(item.quizzes || ''), lessons: (item.lessons || []).map((lesson, lessonIndex) => ({ ...(typeof lesson === 'object' ? lesson : {}), id: `lesson-${index}-${lessonIndex}`, title: typeof lesson === 'string' ? lesson : lesson.title || '', type: typeof lesson === 'string' ? 'Lecture' : lesson.type || 'Lecture' })) }
  })
}

const withoutEditorId = value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'id'))

export function serialiseModules(modules = []) {
  return modules.map(module => ({ ...withoutEditorId(module), lectures: Number(module.lectures) || 0, quizzes: Number(module.quizzes) || 0, lessons: module.lessons.map(withoutEditorId) }))
}

export function validateStructuredDraft(draft) {
  if (draft.kind === 'programme' && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug || '') || draft.path !== `/programmes/${draft.slug}`)) return 'The programme slug must match its /programmes/ page path.'
  if ((draft.gettingStartedRecords || []).some(step => !step.title.trim())) return 'Every application or study step needs a title.'
  if ((draft.customSections || []).some(section => !section.label.trim())) return 'Every custom field or section needs a label.'
  if ((draft.customSections || []).some(section => section.type === 'Link' && section.value && !/^\/(?!\/)[a-zA-Z0-9/_#-]*$/.test(section.value))) return 'Custom links must use a local path, such as /contact.'
  if ((draft.customSections || []).some(section => section.type === 'Image' && section.value && !/^\/assets\/[a-zA-Z0-9/_.-]+$/.test(section.value))) return 'Images must reference an existing local asset under /assets/.'
  if ((draft.moduleRecords || []).some(module => !module.title.trim() || module.lessons.some(lesson => !lesson.title.trim()))) return 'Every module and lesson needs a title.'
  if ((draft.moduleRecords || []).some(module => [module.lectures, module.quizzes].some(value => value !== '' && !/^\d{1,5}$/.test(value)))) return 'Lecture and quiz counts must be non-negative whole numbers.'
  return ''
}
