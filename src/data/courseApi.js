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
  const [result, setResult] = useState(() => ({
    slug,
    course: catalogueCache?.find(item => item.slug === slug) || fallback || null,
    loading: !(catalogueCache?.find(item => item.slug === slug) || fallback),
  }))
  const currentFallback = catalogueCache?.find(item => item.slug === slug) || fallback || null
  const course = result.slug === slug ? result.course : currentFallback
  const loading = result.slug === slug ? result.loading : !currentFallback
  useEffect(() => {
    const controller = new AbortController()
    const nextFallback = catalogueCache?.find(item => item.slug === slug) || findCourse(slug) || null
    readJson(`${API_ROOT}/${encodeURIComponent(slug)}`, controller.signal)
      .then(payload => setResult({ slug, course: payload.data || nextFallback, loading: false }))
      .catch(() => { if (!controller.signal.aborted) setResult({ slug, course: nextFallback, loading: false }) })
    return () => controller.abort()
  }, [slug])
  return { course, loading }
}
