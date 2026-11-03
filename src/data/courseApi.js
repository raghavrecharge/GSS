import { useEffect, useState } from 'react'
import { courses as staticCourses, findCourse } from './msbmCatalog.js'

const API_ROOT = '/api/courses'
let catalogueCache = null

async function readJson(url, signal) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal })
  if (!response.ok) throw new Error(`Catalogue request failed (${response.status})`)
  return response.json()
}

export function useCourseCatalogue() {
  const [courses, setCourses] = useState(catalogueCache || staticCourses)
  const [source, setSource] = useState(catalogueCache ? 'database' : 'static')
  useEffect(() => {
    const controller = new AbortController()
    readJson(API_ROOT, controller.signal).then(payload => {
      if (!Array.isArray(payload.data) || !payload.data.length) return
      catalogueCache = payload.data
      setCourses(payload.data)
      setSource('database')
    }).catch(() => {})
    return () => controller.abort()
  }, [])
  return { courses, source }
}

// Light index entries carry card data only; full records (verified catalogue, database payloads,
// static detail files) always include entry requirements, a curriculum or course details.
const hasFullDetail = (course) => Boolean(course?.entry?.length || course?.modules?.length || course?.courseDetails)

// Programmes outside the bundled verified set ship as a light index entry plus a static
// detail file under /data/programmes/<slug>.json. Merge that file in when the record
// is still light (database unavailable, or the catalogue listing only returned summaries).
export async function loadStaticDetail(course, signal) {
  if (!course?.detailPath || hasFullDetail(course)) return course
  const detail = await readJson(course.detailPath, signal)
  return { ...course, ...detail }
}

export function useCourseRecord(slug) {
  const fallback = findCourse(slug)
  const [course, setCourse] = useState(() => catalogueCache?.find(item => item.slug === slug) || fallback || null)
  const [loading, setLoading] = useState(!course)
  useEffect(() => {
    const controller = new AbortController()
    readJson(`${API_ROOT}/${encodeURIComponent(slug)}`, controller.signal)
      .then(payload => payload.data || null)
      .catch(() => null)
      .then(async (record) => {
        const base = record || fallback
        if (!base) return
        if (record) setCourse(record)
        if (hasFullDetail(base) || !base.detailPath) return
        try { setCourse(await loadStaticDetail(base, controller.signal)) } catch { /* keep the light record */ }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])
  return { course, loading }
}
