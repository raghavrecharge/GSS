import { courses } from '../../data/msbmCatalog.js'

export function resolveProgramme(record, catalogue = courses) {
  const slug = record.courseSlug || record.programmeSlug
  if (slug) return catalogue.find(course => course.slug === slug) || null
  const title = String(record.programme || '').trim().toLowerCase()
  return catalogue.find(course => course.title.trim().toLowerCase() === title) || null
}

export const allProgrammeTitles = [...new Set(courses.map(course => course.title))].sort((a, b) => a.localeCompare(b))
