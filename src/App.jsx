import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ThemePage from './components/ThemePage.jsx'
import SearchOverlay from './components/SearchOverlay.jsx'
import DashboardPage from './components/DashboardPage.jsx'
import { dashboardFileFromPath, normalizePath, pageRoutes } from './routes.js'
import { useCourseCatalogue } from './data/courseApi.js'
import { findCountry, findLocation, getCountryCourse, getCountryCourses, getLocationCourse, getLocationCourses } from './data/msbmCatalog.js'
import { useSharedData } from './data/sharedDataApi.js'

export default function App() {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))
  const [, setLocationVersion] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const { courses } = useCourseCatalogue()
  const sharedData = useSharedData()

  useEffect(() => {
    const updatePath = () => {
      setPath(normalizePath(window.location.pathname))
      setLocationVersion((value) => value + 1)
    }
    window.addEventListener('popstate', updatePath)
    return () => window.removeEventListener('popstate', updatePath)
  }, [])

  let courseSlug = ''
  if (path.startsWith('/courses/') && !['/courses/details', '/courses/filter'].includes(path)) {
    try { courseSlug = decodeURIComponent(path.replace('/courses/', '')) } catch { courseSlug = '__invalid__' }
  }
  const urlCourseSlug = new URLSearchParams(window.location.search).get('course')
  if (urlCourseSlug && courses.some((course) => course.slug === urlCourseSlug)) sessionStorage.setItem('gss_selected_course', urlCourseSlug)
  const queryCourseSlug = urlCourseSlug || (['/cart', '/checkout'].includes(path) ? sessionStorage.getItem('gss_selected_course') : '')
  const countryMatch = path.match(/^\/countries\/([^/]+)\/courses$/)
  const locationMatch = path.match(/^\/locations\/([^/]+)\/courses$/)
  const countryCourseMatch = path.match(/^\/countries\/([^/]+)\/courses\/([^/]+)$/)
  const locationCourseMatch = path.match(/^\/locations\/([^/]+)\/courses\/([^/]+)$/)
  const contentPage = sharedData.content.find((page) => page.path === path)
  const publishedBySlug = new Map(courses.map((course) => [course.slug, course]))
  const localCourses = countryMatch ? getCountryCourses(countryMatch[1]) : locationMatch ? getLocationCourses(locationMatch[1]) : null
  const regionalCourses = localCourses ? localCourses.filter((course) => publishedBySlug.has(course.slug)).map((course) => ({ ...publishedBySlug.get(course.slug), ...course })) : courses
  const regionName = countryMatch ? findCountry(countryMatch[1])?.name : locationMatch ? findLocation(locationMatch[1])?.name : ''
  const staticLocalizedCourse = countryCourseMatch ? getCountryCourse(countryCourseMatch[1], countryCourseMatch[2]) : locationCourseMatch ? getLocationCourse(locationCourseMatch[1], locationCourseMatch[2]) : null
  const localizedCourse = staticLocalizedCourse && publishedBySlug.has(staticLocalizedCourse.slug) ? { ...publishedBySlug.get(staticLocalizedCourse.slug), ...staticLocalizedCourse } : null
  const requestedCourseSlug = courseSlug || queryCourseSlug || countryCourseMatch?.[2] || locationCourseMatch?.[2] || ''
  const selectedCourse = localizedCourse || (requestedCourseSlug ? courses.find((course) => course.slug === requestedCourseSlug) : null) || (!requestedCourseSlug ? regionalCourses[0] || courses[0] : null)
  const geographyDirectory = path === '/countries' || /^\/countries\/[^/]+$/.test(path)
  const isCourseDetail = Boolean(courseSlug || countryCourseMatch || locationCourseMatch)
  const sourceFile = isCourseDetail ? (selectedCourse ? 'course-details.html' : pageRoutes['/404']) : (countryMatch || locationMatch || geographyDirectory) ? 'course.html' : contentPage ? 'about.html' : (pageRoutes[path] || pageRoutes['/404'])

  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    const dashboardSlug = new URLSearchParams(window.location.search).get('course')
    const dashboardCourse = courses.find((course) => course.slug === dashboardSlug) || courses[0] || null
    return <DashboardPage key={`${path}:${dashboardSlug || ''}`} path={path} sourceFile={dashboardFileFromPath(path)} courses={courses} course={dashboardCourse} />
  }

  return (
    <div className="mindu-app">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header activePath={path} onSearch={() => setSearchOpen(true)} />
      <ThemePage key={`${sourceFile}:${path}`} sourceFile={sourceFile} path={path} courses={regionalCourses} course={selectedCourse} regionName={regionName} sharedData={sharedData} />
      <Footer />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <BackToTop />
    </div>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      className={`react-back-to-top ${visible ? 'is-visible' : ''}`}
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fa-regular fa-arrow-up" aria-hidden="true" />
    </button>
  )
}
