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

export function useCourseRecord(slug) {
  const fallback = findCourse(slug)
  const [course, setCourse] = useState(() => catalogueCache?.find(item => item.slug === slug) || fallback || null)
  const [loading, setLoading] = useState(!course)
  useEffect(() => {
    const controller = new AbortController()
    readJson(`${API_ROOT}/${encodeURIComponent(slug)}`, controller.signal)
      .then(payload => { if (payload.data) setCourse(payload.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [slug])
  return { course, loading }
}
