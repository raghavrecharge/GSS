import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import SiteShell from './components/SiteShell.jsx'
import ContentRenderer from './components/ContentRenderer.jsx'
import { CategoriesPage, CategoryPage, CountriesPage, CountryPage, CoursePage, FeaturedStudyLevels, LocationPage, PopularCourses, ProgrammesPage, SpecializationsPage, SpecializationPage, UniversitiesPage, UniversityPage } from './components/Catalog.jsx'
import {
  about,
  accreditation,
  contact,
  home,
  homeDark,
  homeSeo,
  insightDetails,
  insights,
  learning,
  notFound,
  programmes,
  stories,
  tuition,
} from './content/msbmContent.js'
import { categories, findCountry, findCourseBySourceSlug, findLocation, findUniversity, getCountryCourse, getLocationCourse, specializations } from './data/msbmCatalog.js'
import { useCourseRecord } from './data/courseApi.js'
import contentPages from './data/msbmContentPages.json'
import SourceContentPage from './components/SourceContentPage.jsx'
import AcademicPathways from './components/AcademicPathways.jsx'
import AdminShell from './admin/AdminShell.jsx'
import AdminDashboard, { AdminActivity, AdminReports, AdminSettings } from './admin/AdminDashboard.jsx'
import CrmWorkspace from './admin/crm/CrmWorkspace.jsx'
import CmsWorkspace from './admin/cms/index.jsx'
import AdminAuthGate from './admin/auth/AdminAuthGate.jsx'
import { CheckoutPage, CheckoutSuccessPage } from './components/Checkout.jsx'

const routes = [
  ['/online-learning', homeDark],
  ['/for-business', homeSeo],
  ['/about', about],
  ['/accreditation', accreditation],
  ['/tuition', tuition],
  ['/learning', learning],
  ['/student-stories', stories],
  ['/insights', insights],
  ['/insights/online-learning', insightDetails],
  ['/contact', contact],
]

const redirects = {
  '/index.html': '/',
  '/index-2.html': '/',
  '/index-dark.html': '/online-learning',
  '/index-3.html': '/for-business',
  '/about-us.html': '/about',
  '/team.html': '/accreditation',
  '/pricing.html': '/tuition',
  '/services.html': '/programmes',
  '/services-details.html': '/programmes/masters-of-business-administration',
  '/case-study.html': '/learning',
  '/case-study-details.html': '/student-stories',
  '/blog.html': '/insights',
  '/blog-details.html': '/insights/online-learning',
  '/contact-us.html': '/contact',
  '/404.html': '/404',
  '/home-dark': '/online-learning',
  '/home-seo': '/for-business',
  '/team': '/accreditation',
  '/pricing': '/tuition',
  '/services': '/programmes',
  '/services/seo-organic-growth': '/programmes/masters-of-business-administration',
  '/case-studies': '/learning',
  '/case-studies/fundwise': '/student-stories',
  '/blog': '/insights',
  '/blog/the-state-of-search-in-2026': '/insights/online-learning',
}

const cataloguePage = (title, description) => ({ ...programmes, title: `${title} | The Global School of Skills (GSS)`, description })

function CourseRoute() {
  const { courseSlug } = useParams()
  const { course, loading } = useCourseRecord(courseSlug)
  if (loading && !course) return <SiteShell page={programmes}><main className="msbm-course-loading" aria-busy="true">Loading programme information…</main></SiteShell>
  if (!course) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(course.title, course.description)}><CoursePage courseOverride={course} /></SiteShell>
}

function SourceProgrammeRoute() {
  const { countrySlug, sourceSlug } = useParams()
  const course = findCourseBySourceSlug(sourceSlug)
  const country = countrySlug ? findCountry(countrySlug) : null
  const location = countrySlug ? findLocation(countrySlug) : null
  if (!course) return <Navigate to="/404" replace />
  return <Navigate to={location ? `/locations/${location.slug}/programmes/${course.slug}` : country ? `/countries/${country.slug}/programmes/${course.slug}` : `/programmes/${course.slug}`} replace />
}

function CategoryRoute() {
  const { categorySlug } = useParams()
  const category = categories.find((item) => item.slug === categorySlug)
  if (!category) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${category.name} Programmes`, category.description)}><CategoryPage /></SiteShell>
}

function SpecializationRoute() {
  const { specializationSlug } = useParams()
  const specialization = specializations.find((item) => item.slug === specializationSlug)
  if (!specialization) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${specialization.name} Programmes`, `Explore programmes in ${specialization.name}.`)}><SpecializationPage /></SiteShell>
}

function UniversityRoute() {
  const { universitySlug } = useParams()
  const university = findUniversity(universitySlug)
  if (!university) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${university.name} Programmes`, university.summary)}><UniversityPage /></SiteShell>
}

function CountryRoute() {
  const { countrySlug } = useParams()
  const country = findCountry(countrySlug)
  if (!country) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${country.name} Programmes`, `Explore available programmes and admissions guidance for learners in ${country.name}.`)}><CountryPage /></SiteShell>
}

function CountryCourseRoute() {
  const { countrySlug, courseSlug } = useParams()
  const course = getCountryCourse(countrySlug, courseSlug)
  if (!course) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${course.title} in ${course.localCountry.name}`, course.description)}><CoursePage courseOverride={course} /></SiteShell>
}

function LocationRoute() {
  const { locationSlug } = useParams()
  const location = findLocation(locationSlug)
  if (!location) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${location.name} Programmes`, `Explore GSS programmes for learners in ${location.name}, ${location.countryName}.`)}><LocationPage /></SiteShell>
}

function LocationCourseRoute() {
  const { locationSlug, courseSlug } = useParams()
  const course = getLocationCourse(locationSlug, courseSlug)
  if (!course) return <Navigate to="/404" replace />
  return <SiteShell page={cataloguePage(`${course.title} in ${course.localLocation.name}`, course.description)}><CoursePage courseOverride={course} /></SiteShell>
}

function LocationAliasRoute() {
  const { locationSlug } = useParams()
  const country = findCountry(locationSlug)
  const location = findLocation(locationSlug)
  return country ? <Navigate to={`/countries/${country.slug}`} replace /> : location ? <Navigate to={`/locations/${location.slug}`} replace /> : <SourceContentRoute />
}

function HomePage() {
  const marker = '</section>'
  const markerIndex = home.body.indexOf(marker)
  const hero = home.body.slice(0, markerIndex + marker.length)
  const remainder = home.body
    .slice(markerIndex + marker.length)
    .replace(/<div class="ma-partner-1-area">[\s\S]*?(?=<section class="ma-services-1-area">)/, '')
  return <SiteShell page={home}><><ContentRenderer html={hero} /><FeaturedStudyLevels /><PopularCourses /><AcademicPathways /><ContentRenderer html={remainder} /></></SiteShell>
}

function SourceContentRoute() {
  const location = useLocation()
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const contentPage = contentPages.find((page) => page.path === path)
  if (!contentPage) return <SiteShell page={notFound} noFooter />
  const page = cataloguePage(contentPage.title, contentPage.description || `GSS information about ${contentPage.title}.`)
  return <SiteShell page={page}><SourceContentPage page={contentPage} /></SiteShell>
}

const crmAdminPaths = {
  overview: '/admin/crm', leads: '/admin/crm/leads', contacts: '/admin/crm/contacts',
  communications: '/admin/crm/communications', applications: '/admin/crm/applications',
  intakes: '/admin/crm/intakes', students: '/admin/crm/students', tasks: '/admin/crm/tasks',
  programmes: '/admin/crm/programmes', reports: '/admin/crm/reports',
}
const cmsAdminPaths = {
  overview: '/admin/cms', pages: '/admin/cms/pages', programmes: '/admin/cms/programmes',
  universities: '/admin/cms/universities', countries: '/admin/cms/countries',
  taxonomies: '/admin/cms/taxonomies', testimonials: '/admin/cms/testimonials',
  faqs: '/admin/cms/faqs', forms: '/admin/cms/forms', blocks: '/admin/cms/blocks',
  media: '/admin/cms/media', navigation: '/admin/cms/navigation',
  publishing: '/admin/cms/publishing', settings: '/admin/cms/settings',
  'course-review': '/admin/cms/course-review',
}

function CrmAdminRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const section = Object.entries(crmAdminPaths).find(([, path]) => path === location.pathname)?.[0]
  if (!section) return <Navigate to="/admin/crm" replace />
  return <AdminShell><CrmWorkspace section={section} showNavigation={false} onNavigate={(next) => navigate(crmAdminPaths[next] || '/admin/crm')} /></AdminShell>
}

function CmsAdminRoute() {
  const location = useLocation()
  const navigate = useNavigate()
  const view = Object.entries(cmsAdminPaths).find(([, path]) => path === location.pathname)?.[0]
  if (!view) return <Navigate to="/admin/cms" replace />
  return <AdminShell><CmsWorkspace view={view} hideNavigation onNavigate={(next) => navigate(cmsAdminPaths[next] || '/admin/cms')} /></AdminShell>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<AdminAuthGate loginPage />} />
      <Route path="/admin" element={<AdminAuthGate><AdminShell><AdminDashboard /></AdminShell></AdminAuthGate>} />
      <Route path="/admin/activity" element={<AdminAuthGate><AdminShell><AdminActivity /></AdminShell></AdminAuthGate>} />
      <Route path="/admin/reports" element={<AdminAuthGate><AdminShell><AdminReports /></AdminShell></AdminAuthGate>} />
      <Route path="/admin/settings" element={<AdminAuthGate><AdminShell><AdminSettings /></AdminShell></AdminAuthGate>} />
      <Route path="/admin/crm/*" element={<AdminAuthGate><CrmAdminRoute /></AdminAuthGate>} />
      <Route path="/admin/cms/*" element={<AdminAuthGate><CmsAdminRoute /></AdminAuthGate>} />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      <Route path="/checkout/success" element={<SiteShell page={cataloguePage('Payment confirmation', 'Demo payment confirmation for GSS programme enrolment.')}><CheckoutSuccessPage /></SiteShell>} />
      <Route path="/checkout/:courseSlug" element={<SiteShell page={cataloguePage('Secure checkout', 'Complete your GSS programme enrolment through the secure demo checkout.')}><CheckoutPage /></SiteShell>} />
      <Route path="/programmes" element={<SiteShell page={cataloguePage('Programmes', programmes.description)}><ProgrammesPage /></SiteShell>} />
      <Route path="/programmes/mba" element={<Navigate to="/programmes/masters-of-business-administration" replace />} />
      <Route path="/programmes/:courseSlug" element={<CourseRoute />} />
      <Route path="/programme/:sourceSlug" element={<SourceProgrammeRoute />} />
      <Route path="/:countrySlug/programme/:sourceSlug" element={<SourceProgrammeRoute />} />
      <Route path="/programme/dba-in-project-management" element={<Navigate to="/programmes/dba-in-project-management" replace />} />
      <Route path="/programme/master-of-business-administration-3" element={<Navigate to="/programmes/masters-of-business-administration" replace />} />
      <Route path="/birmingham/programme/executive-master-of-business-administration-in-production-and-operations-management" element={<Navigate to="/programmes/executive-mba-production-operations-management" replace />} />
      <Route path="/sierra-leone/programme/masters-degree-in-continuing-education-in-marketing-mba-mktg" element={<Navigate to="/countries/sierra-leone/programmes/masters-continuing-education-marketing" replace />} />
      <Route path="/categories" element={<SiteShell page={cataloguePage('Programmes by Category', 'Browse programmes by level of study.')}><CategoriesPage /></SiteShell>} />
      <Route path="/categories/:categorySlug" element={<CategoryRoute />} />
      <Route path="/category/:categorySlug" element={<CategoryRoute />} />
      <Route path="/specializations" element={<SiteShell page={cataloguePage('Programmes by Specialization', 'Browse programmes by subject area.')}><SpecializationsPage /></SiteShell>} />
      <Route path="/specializations/:specializationSlug" element={<SpecializationRoute />} />
      <Route path="/subject/:specializationSlug" element={<SpecializationRoute />} />
      <Route path="/universities" element={<SiteShell page={cataloguePage('University Programmes', 'Explore university partners and connected programmes.')}><UniversitiesPage /></SiteShell>} />
      <Route path="/universities/:universitySlug" element={<UniversityRoute />} />
      <Route path="/countries" element={<SiteShell page={cataloguePage('Country Programmes', 'Explore study and admissions information by country.')}><CountriesPage /></SiteShell>} />
      <Route path="/countries/united-states" element={<Navigate to="/countries/usa" replace />} />
      <Route path="/countries/:countrySlug/programmes/:courseSlug" element={<CountryCourseRoute />} />
      <Route path="/countries/:countrySlug" element={<CountryRoute />} />
      <Route path="/locations/:locationSlug/programmes/:courseSlug" element={<LocationCourseRoute />} />
      <Route path="/locations/:locationSlug" element={<LocationRoute />} />
      {routes.map(([path, page]) => <Route key={path} path={path} element={<SiteShell page={page} />} />)}
      {Object.entries(redirects).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
      <Route path="/404" element={<SiteShell page={notFound} noFooter />} />
      <Route path="/:locationSlug" element={<LocationAliasRoute />} />
      <Route path="*" element={<SourceContentRoute />} />
    </Routes>
  )
}
