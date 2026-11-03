import { useDeferredValue, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { categories, countries, courses, findCountry, findCourse, findLocation, findUniversity, getCountryCourses, getCountryRegions, getLocationCourses, specializations, universities } from '../data/msbmCatalog.js'
import { useCourseCatalogue } from '../data/courseApi.js'
import { checkoutUrl } from './checkoutUtils.js'
import { CourseRichContent, courseSection, hasCourseSection } from './CourseRichContent.jsx'

export function CourseCard({ course, basePath = '/programmes' }) {
  const hasPreviousPrice = /^Was\s+/i.test(course.monthly || '')
  const detailUrl = `${basePath}/${course.slug}`
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)
  const descriptionId = `course-description-${course.slug}`
  const hasExpandableDescription = course.description.length > 140
  return (
    <article className="msbm-course-card wow fadeInUp2">
      <Link className="msbm-course-card__image" to={detailUrl} aria-label={`View ${course.title}`}>
        <img src={course.image} alt="" loading="lazy" /><span className="msbm-course-card__level">{course.level}</span>
      </Link>
      <div className="msbm-course-card__body">
        {course.universitySlug
          ? <Link className="msbm-course-card__university" to={`/universities/${course.universitySlug}`}>{course.university}</Link>
          : <span className="msbm-course-card__university">{course.university}</span>}
        <h3><Link to={detailUrl}>{course.title}</Link></h3>
        <p id={descriptionId} className={hasExpandableDescription && !descriptionExpanded ? 'is-collapsed' : undefined}>{course.description}</p>
        {hasExpandableDescription && <button className="msbm-course-card__description-toggle" type="button" aria-controls={descriptionId} aria-expanded={descriptionExpanded} onClick={() => setDescriptionExpanded((expanded) => !expanded)}>{descriptionExpanded ? 'View less' : 'View more'} <i className={`ph ${descriptionExpanded ? 'ph-caret-up' : 'ph-caret-down'}`} aria-hidden="true" /></button>}
        <dl className="msbm-course-card__facts">
          <div><dt><i className="ph ph-hourglass" /> Duration</dt><dd>{course.duration}</dd></div>
          <div><dt><i className="ph ph-desktop" /> Study mode</dt><dd>{course.mode}</dd></div>
          <div><dt><i className="ph ph-tag" /> Programme fee</dt><dd>{course.fee}</dd></div>
          {course.monthly && <div><dt><i className="ph ph-wallet" /> {hasPreviousPrice ? 'Previous fee' : 'Instalments'}</dt><dd>{course.monthly.replace(/^Was\s+/i, '')}</dd></div>}
        </dl>
        <div className="msbm-course-card__actions"><Link to={detailUrl}>View details</Link><Link className="msbm-course-card__buy" to={checkoutUrl(course)}>Buy now <i className="ph ph-arrow-right" aria-hidden="true" /></Link></div>
      </div>
    </article>
  )
}

const GRID_PAGE_SIZE = 48

export function CourseGrid({ items = courses, basePath = '/programmes' }) {
  const [visible, setVisible] = useState(GRID_PAGE_SIZE)
  const [pagedItems, setPagedItems] = useState(items)
  if (pagedItems !== items) { setPagedItems(items); setVisible(GRID_PAGE_SIZE) }
  const shown = items.length > GRID_PAGE_SIZE ? items.slice(0, visible) : items
  return <>
    <div className="msbm-course-grid">{shown.map((course) => <CourseCard key={course.slug} course={course} basePath={basePath} />)}</div>
    {shown.length < items.length && <div className="msbm-course-grid__more"><p aria-live="polite">Showing {shown.length} of {items.length} programmes</p><button type="button" className="ma-pr-btn-2" onClick={() => setVisible((count) => count + GRID_PAGE_SIZE)}><span>Load more programmes</span><i className="ph ph-arrow-down" aria-hidden="true" /></button></div>}
  </>
}

export function PopularCourses() {
  const highlighted = ['masters-of-business-administration', 'executive-mba-tourism-hospitality-management', 'executive-mba-production-operations-management', 'masters-continuing-education-marketing']
    .map((slug) => courses.find((course) => course.slug === slug))
  return <section className="msbm-catalog-section msbm-catalog-section--popular"><div className="container ma-container-1">
    <div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge">Featured Degrees</span><h2 className="ma-sec-title-1">Popular degree <span className="title-mark">programmes</span></h2></div><div className="right-content"><p className="ma-p-1">Explore sought-after degree programmes designed to provide exceptional education and prepare you for a successful career.</p><Link className="ma-link-1" to="/programmes"><span>View all programmes</span><i className="ph ph-arrow-right" /></Link></div></div>
    <CourseGrid items={highlighted} />
  </div></section>
}

export function FeaturedStudyLevels() {
  const featured = ['doctorate-degree', 'masters-degree', 'semp-online-sep-upgradeable']
    .map((slug) => categories.find((category) => category.slug === slug))
  return <section className="msbm-study-levels"><div className="container ma-container-1"><div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge has-dark">Choose your pathway</span><h2 className="ma-sec-title-1">Programmes for every <span className="title-mark">career stage</span></h2></div><div className="right-content"><p className="ma-p-1">Progress from focused executive study to internationally relevant master’s and doctoral programmes.</p><Link className="ma-link-1" to="/categories"><span>Explore all categories</span><i className="ph ph-arrow-right" /></Link></div></div><div className="msbm-study-levels__grid">{featured.map((category, index) => <Link className="msbm-study-level-card" to={`/categories/${category.slug}`} key={category.slug}><span className="msbm-study-level-card__number">0{index + 1}</span><span className="msbm-study-level-card__icon"><i className={`ph ${index === 0 ? 'ph-medal' : index === 1 ? 'ph-graduation-cap' : 'ph-briefcase'}`} /></span><h3>{category.name}</h3><p>{category.description}</p><span className="msbm-study-level-card__link">View programmes <i className="ph ph-arrow-up-right" /></span></Link>)}</div></div></section>
}

export function PageIntro({ eyebrow, title, description, parent = 'Home' }) {
  const parentPaths = { Categories: '/categories', Specializations: '/specializations', Countries: '/countries', Universities: '/universities', Programmes: '/programmes' }
  return <section className="msbm-page-intro"><div className="container ma-container-1"><nav aria-label="Breadcrumb"><Link to={parentPaths[parent] || '/'}>{parent}</Link><i className="ph ph-caret-right" /><span>{eyebrow}</span></nav><span className="ma-sec-badge">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section>
}

export function ProgrammesPage() {
  const { courses: catalogueCourses, source } = useCourseCatalogue()
  const [query, setQuery] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase()
    return catalogueCourses.filter((course) => (!categorySlug || course.categorySlug === categorySlug)
      && (!needle || `${course.title} ${course.description} ${course.university}`.toLowerCase().includes(needle)))
  }, [catalogueCourses, deferredQuery, categorySlug])
  return <><PageIntro eyebrow="Programmes" title="Find the right programme for your ambition" description="Browse flexible degree programmes, executive education, diplomas and professional courses." /><BrowseLinks /><section className="msbm-catalog-section"><div className="container ma-container-1" data-catalogue-source={source}>
    <form className="msbm-catalogue-filters" role="search" onSubmit={(event) => event.preventDefault()}>
      <div><label htmlFor="programme-search">Search programmes</label><input id="programme-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by title, subject or partner" autoComplete="off" /></div>
      <div><label htmlFor="programme-category">Category</label><select id="programme-category" value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)}><option value="">All categories</option>{categories.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select></div>
      <p aria-live="polite">{filtered.length === 1 ? '1 programme' : `${filtered.length} programmes`}</p>
    </form>
    {filtered.length ? <CourseGrid items={filtered} /> : <EmptyCatalogue />}
  </div></section></>
}

function BrowseLinks() {
  return <section className="msbm-browse-links"><div className="container ma-container-1"><div><span>Browse by category</span><Link to="/categories">View all categories <i className="ph ph-arrow-right" /></Link></div><div><span>Browse by specialization</span><Link to="/specializations">View all specializations <i className="ph ph-arrow-right" /></Link></div></div></section>
}

export function CategoriesPage() {
  return <><PageIntro eyebrow="Programme Categories" title="Choose your level of study" description="Explore every Global School of Skills programme category inside the GSS catalogue." /><DirectoryGrid items={categories} base="categories" icon="ph-graduation-cap" /></>
}

export function CategoryPage() {
  const { categorySlug } = useParams(); const category = categories.find((item) => item.slug === categorySlug)
  if (!category) return <MissingRecord />
  const available = courses.filter((course) => course.categorySlug === category.slug)
  return <><PageIntro eyebrow="Programme Category" title={category.name} description={category.description} parent="Categories" /><section className="msbm-catalog-section"><div className="container ma-container-1">{available.length ? <CourseGrid items={available} /> : <EmptyCatalogue />}</div></section></>
}

export function SpecializationsPage() {
  const items = specializations.map((item) => ({ ...item, description: `Explore programmes and courses in ${item.name}.` }))
  return <><PageIntro eyebrow="Specializations" title="Find programmes by subject" description="Browse all available subject areas and discover courses aligned with your professional goals." /><DirectoryGrid items={items} base="specializations" icon="ph-books" /></>
}

export function SpecializationPage() {
  const { specializationSlug } = useParams(); const subject = specializations.find((item) => item.slug === specializationSlug)
  if (!subject) return <MissingRecord />
  const available = courses.filter((course) => course.subjects?.includes(subject.slug))
  return <><PageIntro eyebrow="Specialization" title={subject.name} description={`Explore doctorate, degree, diploma and professional courses connected to ${subject.name}.`} parent="Specializations" /><section className="msbm-catalog-section"><div className="container ma-container-1">{available.length ? <CourseGrid items={available} /> : <EmptyCatalogue />}</div></section></>
}

function DirectoryGrid({ items, base, icon }) {
  return <section className="msbm-catalog-section"><div className="container ma-container-1"><div className="msbm-directory-grid">{items.map((item) => <Link className="msbm-directory-card" to={`/${base}/${item.slug}`} key={item.slug}><span className="msbm-directory-card__icon"><i className={`ph ${icon}`} /></span><small>Explore courses</small><h2>{item.name}</h2><p>{item.description}</p><span className="ma-link-1">View catalogue <i className="ph ph-arrow-right" /></span></Link>)}</div></div></section>
}

export function UniversitiesPage() {
  return <><PageIntro eyebrow="University Partners" title="Study through trusted academic partnerships" description="Explore GSS university partners and the programmes connected to each institution." /><section className="msbm-catalog-section"><div className="container ma-container-1"><div className="msbm-directory-grid">{universities.map((item) => <Link className="msbm-directory-card" to={`/universities/${item.slug}`} key={item.slug}><span className="msbm-directory-card__icon"><i className="ph ph-buildings" /></span><small>{item.location}</small><h2>{item.name}</h2><p>{item.summary}</p><span className="ma-link-1">View programmes <i className="ph ph-arrow-right" /></span></Link>)}</div></div></section></>
}

export function CountriesPage() {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const filteredCountries = useMemo(() => {
    const normalise = (value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    const term = normalise(deferredQuery.trim())
    return term ? countries.filter((country) => normalise(country.name).includes(term)) : countries
  }, [deferredQuery])

  return <><PageIntro eyebrow="Study by Country" title="GSS programmes around the world" description="Choose from every country destination published in the official GSS country selector. Local availability and fees are clearly identified on each page." /><section className="msbm-catalog-section"><div className="container ma-container-1"><div className="msbm-country-search"><div><label htmlFor="country-search">Find your country</label><div className="msbm-country-search__input"><i className="ph ph-magnifying-glass" aria-hidden="true" /><input id="country-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 249 country destinations" autoComplete="off" /></div></div><output aria-live="polite">{filteredCountries.length} {filteredCountries.length === 1 ? 'destination' : 'destinations'}</output></div>{filteredCountries.length ? <div className="msbm-directory-grid msbm-country-grid">{filteredCountries.map((item) => <Link className="msbm-directory-card" to={`/countries/${item.slug}`} key={item.slug}><span className="msbm-directory-card__icon" aria-hidden="true"><i className="ph ph-globe-hemisphere-west" /></span><small>{item.city}{item.currency !== 'Confirm locally' ? ` · ${item.currency}` : ' · Local fees on request'}</small><h2>{item.name}</h2><span className="ma-link-1">Browse programmes <i className="ph ph-arrow-right" /></span></Link>)}</div> : <div className="msbm-empty"><h2>No matching country</h2><p>Try a country name from the official GSS selector.</p></div>}</div></section></>
}

export function UniversityPage() {
  const { universitySlug } = useParams(); const university = findUniversity(universitySlug)
  if (!university) return <MissingRecord />
  const available = courses.filter((course) => course.universitySlug === university.slug)
  return <>
    <section className="msbm-university-hero"><div className="container ma-container-1"><div><nav aria-label="Breadcrumb"><Link to="/universities">University Partners</Link><i className="ph ph-caret-right" /><span>{university.location}</span></nav><span className="ma-sec-badge">Academic partner · {university.location}</span><h1>{university.name}</h1><p>{university.summary}</p><div className="msbm-course-hero__actions"><Link className="ma-pr-btn-1" to="/contact"><span>Request information</span><i className="ph ph-arrow-right" /></Link><a className="ma-pr-btn-2" href="#partner-programmes"><span>View programmes</span></a></div></div><aside><span>Partner overview</span><dl><div><dt>Location</dt><dd>{university.location}</dd></div><div><dt>Available pathways</dt><dd>{available.length || 'Advisor confirmed'}</dd></div><div><dt>Study options</dt><dd>Online and blended</dd></div><div><dt>Application support</dt><dd>GSS advisors</dd></div></dl></aside></div></section>
    <UniversityNav />
    <section className="msbm-university-overview" id="partner-overview"><div className="container ma-container-1"><div><span className="ma-sec-badge">About the institution</span><h2 className="ma-sec-title-1">A pathway designed for international learners</h2></div><div><p>{university.about || university.summary}</p><div className="msbm-university-focus">{university.focus?.map((item) => <span key={item}><i className="ph ph-check" />{item}</span>)}</div></div></div></section>
    <UniversityValue />
    <section className="msbm-university-programmes" id="partner-programmes"><div className="container ma-container-1"><div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge">Available pathways</span><h2 className="ma-sec-title-1">Programmes connected to <span className="title-mark">{university.name}</span></h2></div><div className="right-content"><p className="ma-p-1">Review current programme information, delivery format and fees, then speak with an advisor about your eligibility.</p></div></div>{available.length ? <CourseGrid items={available} /> : <EmptyCatalogue />}</div></section>
    <UniversityAdmissions />
    <UniversityFaq university={university} />
  </>
}

function UniversityNav() {
  return <nav className="msbm-course-nav" aria-label="University page sections"><div className="container ma-container-1"><a href="#partner-overview">Overview</a><a href="#partner-value">Why this partner</a><a href="#partner-programmes">Programmes</a><a href="#partner-admissions">Admissions</a><a href="#partner-faq">FAQs</a></div></nav>
}

function UniversityValue() {
  const items = [['ph-globe-hemisphere-west', 'International perspective', 'Develop knowledge alongside a diverse professional learning community.'], ['ph-laptop', 'Flexible learning', 'Online and blended formats help professionals balance study with work.'], ['ph-briefcase', 'Career-relevant study', 'Programmes connect management theory with practical organisational challenges.'], ['ph-student', 'Academic support', 'Receive structured learning resources and guidance throughout the programme.'], ['ph-path', 'Progression pathways', 'Explore routes across executive, postgraduate and degree-level study.'], ['ph-shield-check', 'Clear verification', 'Programme, partner and certificate information can be confirmed before enrolment.']]
  return <section className="msbm-university-value" id="partner-value"><div className="container ma-container-1"><div className="msbm-centered-heading"><span className="ma-sec-badge has-dark">The learning experience</span><h2 className="ma-sec-title-1">What makes the partnership valuable</h2></div><div>{items.map(([icon, title, description]) => <article key={title}><i className={`ph ${icon}`} /><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
}

function UniversityAdmissions() {
  const steps = [['01', 'Choose a programme', 'Compare programme level, duration, delivery and intended outcomes.'], ['02', 'Request information', 'An advisor can clarify fees, documents and current partner availability.'], ['03', 'Submit your application', 'Provide your academic background and any requested professional evidence.'], ['04', 'Receive your decision', 'Eligible applicants receive guidance on enrolment and the next intake.']]
  return <section className="msbm-university-admissions" id="partner-admissions"><div className="container ma-container-1"><div><span className="ma-sec-badge">Admissions process</span><h2 className="ma-sec-title-1">A clear route from enquiry to enrolment</h2><p>Requirements vary by programme. The academic team reviews qualifications, professional experience and English-language readiness where applicable.</p><Link className="ma-pr-btn-1" to="/contact"><span>Speak to an advisor</span><i className="ph ph-arrow-right" /></Link></div><ol>{steps.map(([number, title, text]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol></div></section>
}

function UniversityFaq({ university }) {
  const questions = [['Who awards the qualification?', `Award information is shown on each programme page. An advisor can confirm the current arrangement with ${university.name} before enrolment.`], ['Can I study while working?', 'Most featured pathways use online or blended delivery designed to fit around professional commitments.'], ['Are entry requirements the same for every programme?', 'No. Requirements depend on programme level, prior qualifications, experience and English-language readiness.'], ['How can I confirm current fees and intakes?', 'Use the request-information form to receive the latest fee, instalment and intake details for your location.']]
  return <section className="msbm-university-faq" id="partner-faq"><div className="container ma-container-1"><div className="msbm-centered-heading"><span className="ma-sec-badge">Frequently asked questions</span><h2 className="ma-sec-title-1">Questions about this university pathway</h2></div><div className="msbm-module-list">{questions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>0{index + 1}</span><strong>{question}</strong><i className="ph ph-plus" /></summary><p>{answer}</p></details>)}</div></div></section>
}

export function CountryPage() {
  const { countrySlug } = useParams(); const country = findCountry(countrySlug)
  if (!country) return <MissingRecord />
  const available = getCountryCourses(country.slug)
  const locallyVerifiedCount = available.filter((course) => course.locallyVerified).length
  return <><PageIntro eyebrow={`Study in ${country.name}`} title={`Programmes for learners in ${country.name}`} description={`Explore the source-backed degree catalogue for ${country.name}. Programme structure is preserved from GSS; country availability, intake and local tuition are only marked verified when the source publishes them.`} parent="Countries" /><section className="msbm-country-summary"><div className="container ma-container-1"><div><span>Official selector destination</span><strong>{country.name}</strong></div><div><span>Source-backed degree programmes</span><strong>{available.length}</strong></div><div><span>Locally priced listings</span><strong>{locallyVerifiedCount}</strong></div><a href={country.sourceUrl} target="_blank" rel="noreferrer">View GSS country source <i className="ph ph-arrow-up-right" /></a></div></section><RegionalSelector countrySlug={country.slug} /><section className="msbm-catalog-section"><div className="container ma-container-1"><div className="msbm-country-notice"><i className="ph ph-info" /><p>{locallyVerifiedCount ? `${locallyVerifiedCount} programme listing has recorded local pricing. Remaining cards require a local fee and intake confirmation.` : 'These programmes are available in the global source catalogue. Local fee, intake and enrolment availability have not been inferred; confirm them with an advisor.'}</p></div>{available.length ? <CourseGrid items={available} basePath={`/countries/${country.slug}/programmes`} /> : <CountryAvailabilityNotice country={country} />}</div></section></>
}

function RegionalSelector({ countrySlug, currentSlug = '' }) {
  const navigate = useNavigate()
  const regions = getCountryRegions(countrySlug)
  if (!regions.length) return null
  return <section className="msbm-regional-switch"><div className="container ma-container-1"><div><span>Regional study sites</span><strong>{regions.length} locations available</strong></div><label htmlFor={`regional-switch-${countrySlug}`}>Choose a city or region</label><select id={`regional-switch-${countrySlug}`} value={currentSlug} onChange={(event) => event.target.value && navigate(`/locations/${event.target.value}`)}><option value="">Select a location</option>{regions.map((region) => <option value={region.slug} key={region.slug}>{region.name}</option>)}</select></div></section>
}

export function LocationPage() {
  const { locationSlug } = useParams()
  const location = findLocation(locationSlug)
  if (!location) return <MissingRecord />
  const available = getLocationCourses(location.slug)
  return <><PageIntro eyebrow={`Study in ${location.countryName}`} title={`Programmes in ${location.name}`} description={`Explore GSS programme pathways for learners in ${location.name}, ${location.countryName}. Local tuition and intake must be confirmed for this regional site.`} parent={location.countryName} /><RegionalSelector countrySlug={location.countrySlug} currentSlug={location.slug} /><section className="msbm-catalog-section"><div className="container ma-container-1"><div className="msbm-country-notice"><i className="ph ph-map-pin" /><p>This is an official GSS regional destination. Programme content is source-backed; regional tuition, delivery and intake details are not inferred.</p></div><CourseGrid items={available} basePath={`/locations/${location.slug}/programmes`} /></div></section></>
}

export function CoursePage({ courseOverride }) {
  const { courseSlug } = useParams(); const course = findCourse(courseSlug)
  const resolvedCourse = courseOverride || course
  if (!resolvedCourse) return <MissingRecord />
  const courseData = resolvedCourse
  return <>
    <section className="msbm-course-hero"><div className="container ma-container-1"><div className="msbm-course-hero__copy"><nav aria-label="Breadcrumb"><Link to={courseData.localLocation ? `/locations/${courseData.localLocation.slug}` : courseData.localCountry ? `/countries/${courseData.localCountry.slug}` : '/programmes'}>{courseData.localLocation?.name || courseData.localCountry?.name || 'Programmes'}</Link><i className="ph ph-caret-right" /><span>{courseData.level}</span></nav><span className="ma-sec-badge">{courseData.localLocation ? `Regional destination: ${courseData.localLocation.name}, ${courseData.localLocation.countryName}` : courseData.localCountry ? `Country destination: ${courseData.localCountry.name}` : courseData.universitySlug ? `In partnership with ${courseData.university}` : `Programme provider: ${courseData.university}`}</span><h1>{courseData.title}</h1><p>{courseData.description}</p><div className="msbm-course-hero__actions"><Link className="ma-pr-btn-1" to={checkoutUrl(courseData)}><span>Buy now</span><i className="ph ph-arrow-right" /></Link><Link className="ma-pr-btn-2" to="/contact"><span>Request information</span></Link></div></div><div className="msbm-course-hero__panel">{courseData.sourceImages?.hero && <img className="msbm-course-hero__source-image" src={courseData.sourceImages.hero} alt="" />}{courseData.sourceImages?.partners?.[0] && <img className="msbm-course-hero__partner-image" src={courseData.sourceImages.partners[0]} alt={`${courseData.university} partner`} />}<h2>Programme at a glance</h2><dl><div><dt>Duration</dt><dd>{courseData.duration}</dd></div><div><dt>Pedagogy</dt><dd>{courseData.mode}</dd></div><div><dt>{courseData.localCountry ? 'Local tuition' : 'Tuition fee'}</dt><dd>{courseData.fee}</dd></div>{courseData.monthly && <div><dt>{/^Was\s+/i.test(courseData.monthly) ? 'Previous fee' : 'Payment plan'}</dt><dd>{courseData.monthly.replace(/^Was\s+/i, '')}</dd></div>}{courseData.credits && <div><dt>Study credits</dt><dd>{courseData.credits}</dd></div>}{courseData.administrativeFee && !courseData.localCountry && <div><dt>Administrative fee</dt><dd>{courseData.administrativeFee}</dd></div>}</dl><Link className="ma-pr-btn-1 msbm-course-hero__panel-button" to={checkoutUrl(courseData)}><span>Continue to checkout</span><i className="ph ph-arrow-right" /></Link></div></div></section>
    <CourseSectionNav />
    {courseData.localCountry && <CountryCourseNotice course={courseData} />}
    <CourseSourceStatus course={courseData} />
    <section className="msbm-course-overview" id="overview"><div className="container ma-container-1"><div><span className="ma-sec-badge">Programme overview</span><h2 className="ma-sec-title-1">Programme information</h2></div><div><p>{courseData.longDescription || courseData.description}</p>{courseData.universitySlug && <Link className="ma-link-1" to={`/universities/${courseData.universitySlug}`}>About {courseData.university} <i className="ph ph-arrow-right" /></Link>}</div></div></section>
    <ProgrammeInformation course={courseData} />
    <TuitionPanel course={courseData} />
    <ProgrammeAdvantages course={courseData} />
    <ProgrammeLibrary course={courseData} />
    <CourseOutcomes course={courseData} />
    <LearningJourney course={courseData} />
    {courseData.entry && <EntryRequirements items={courseData.entry} />}
    {getCourseModules(courseData).length ? <CourseModules course={courseData} /> : <CourseCurriculumPending />}
    <ProgrammeCredentials course={courseData} />
    <CourseTestimonials course={courseData} />
    <ProgrammeTestimonials course={courseData} />
  </>
}

function CountryCourseNotice({ course }) {
  const destination = course.localLocation || course.localCountry
  const destinationPath = course.localLocation ? `/locations/${course.localLocation.slug}` : `/countries/${course.localCountry.slug}`
  return <div className={`msbm-country-course-notice ${course.locallyVerified ? 'is-verified' : ''}`}><div className="container ma-container-1"><i className={`ph ${course.locallyVerified ? 'ph-seal-check' : 'ph-map-pin'}`} /><div><strong>{course.locallyVerified ? `Local listing verified for ${destination.name}` : `Local route available for ${destination.name}`}</strong><p>{course.locallyVerified ? 'The local fee shown on this route comes from the recorded country programme listing.' : 'Programme content comes from the verified global listing. Local tuition, intake and enrolment availability still require confirmation.'}</p></div><Link to={destinationPath}>Back to {destination.name} programmes</Link></div></div>
}

function CourseSourceStatus({ course }) {
  const isComplete = course.sourceCoverage === 'complete'
  const isLinked = Boolean(course.sourceUrl)
  return <div className={`msbm-source-status ${isComplete ? 'is-verified' : 'is-indicative'}`}><div className="container ma-container-1"><i className={`ph ${isComplete ? 'ph-seal-check' : 'ph-info'}`} /><div><strong>{isComplete ? 'Complete source-verified programme information' : isLinked ? 'Source-linked information; completeness pending' : 'Programme structure awaiting source verification'}</strong><p>{isComplete ? 'Every academic section on this page was checked against the official programme listing.' : isLinked ? 'The source link and recorded facts are available, but missing sections remain visibly marked pending rather than being inferred.' : 'Catalogue facts are shown as supplied. Indicative curriculum themes are labelled and missing detail is not invented.'}</p></div>{course.sourceUrl && <a href={course.sourceUrl} target="_blank" rel="noreferrer">View official source <i className="ph ph-arrow-up-right" /></a>}</div></div>
}

function CourseSectionNav() {
  return <nav className="msbm-course-nav" aria-label="Programme page sections"><div className="container ma-container-1"><a href="#overview">Course Overview</a><a href="#tuition">Tuition</a><a href="#about">About</a><a href="#library">Library</a><a href="#getting-started">How to get started</a><a href="#certificate">Certificate</a><a href="#testimonial">Testimonial</a></div></nav>
}

function ProgrammeInformation({ course }) {
  const sectionValue = (sectionId) => sectionId === 'universityProgression' && course.progressionStatus === 'source_absent'
    ? { status: 'source_absent', blocks: [], reason: course.progressionReason }
    : courseSection(course, sectionId)
  const sections = [
    ['details', 'Programme details', course.longDescription, 'programmeDetails'],
    ['course-details', 'Course Details', /^\d+ source-listed curriculum sections and \d+ lesson or resource entries/i.test(course.courseDetails || '') ? '' : course.courseDetails, 'courseDetails'],
    ['accreditation', 'Accreditation', course.accreditation, 'accreditation'],
    ['university', 'University Progression', course.progression, 'universityProgression'],
    ['entry', 'Entry Requirements', course.entry, 'entryRequirements'],
    ['workshop', 'Workshops', course.workshops, 'workshops'],
    ['visa', 'Visa Requirements', course.visa, 'visa'],
  ]
  return <section className="msbm-programme-info"><div className="container ma-container-1"><ProgrammeSectionLinks sections={sections} /><div className="msbm-programme-info__content">{sections.map(([id, title, text, sectionId]) => <article id={id} key={id}><span>{title}</span><h2>{title}</h2><CourseRichContent section={sectionValue(sectionId)} label={title} fallback={Array.isArray(text) ? text.length > 0 && <ul>{text.map((item, index) => <li key={index}>{item}</li>)}</ul> : text && <p>{text}</p>} />{id === 'accreditation' && text && <Link className="ma-link-1" to="/accreditation">View accreditation and partners <i className="ph ph-arrow-right" /></Link>}</article>)}</div></div></section>
}

function ProgrammeSectionLinks({ sections }) {
  const links = sections || [['details', 'Programme details'], ['course-details', 'Course Details'], ['accreditation', 'Accreditation'], ['university', 'University Progression'], ['entry', 'Entry Requirements'], ['workshop', 'Workshops'], ['visa', 'Visa Requirements']]
  return <aside aria-label="Course overview sections">{links.map(([id, title]) => <a href={`#${id}`} key={id}>{title}</a>)}<a href="#outcomes">Learning outcomes</a><a href="#modules">Modules</a></aside>
}

function TuitionPanel({ course }) {
  const hasPreviousPrice = /^Was\s+/i.test(course.monthly || '')
  return <section className="msbm-tuition-panel" id="tuition"><div className="container ma-container-1">{course.monthly && <div><span>{hasPreviousPrice ? 'Previous programme fee' : 'Interest-free instalments'}</span><strong>{course.monthly.replace(/^Was\s+/i, '')}</strong><small>{hasPreviousPrice ? 'Shown for price comparison' : `Pay across ${course.paymentMonths || course.duration?.toLowerCase() || 'the published payment plan'}`}</small></div>}<div className="is-featured"><span>Current programme fee</span><strong>{course.fee || 'Confirm current fee'}</strong><small>Confirm the current local fee before enrolment</small></div><div><span>Ready to invest in yourself?</span><Link className="ma-pr-btn-1" to={checkoutUrl(course)}><span>Buy now</span><i className="ph ph-arrow-right" /></Link></div>{hasCourseSection(course, 'tuition') && <div className="msbm-tuition-detail"><CourseRichContent section={courseSection(course, 'tuition')} label="Tuition" /></div>}</div></section>
}

function ProgrammeAdvantages({ course }) {
  const items = course.advantages || []
  return <section className="msbm-advantages" id="about"><div className="container ma-container-1"><div className="msbm-centered-heading"><span className="ma-sec-badge">About this programme</span><h2 className="ma-sec-title-1">Programme experience and support</h2></div><CourseRichContent section={courseSection(course, 'about')} label="About and learning experience" fallback={items.length > 0 && <div className="msbm-advantages__grid">{items.map(([icon, title, description]) => <article key={title}><i className={`ph ${icon}`} /><h3>{title}</h3><p>{description}</p></article>)}</div>} /></div></section>
}

function ProgrammeLibrary({ course }) {
  return <section className="msbm-library" id="library"><div className="container ma-container-1"><div className="msbm-library__visual"><i className="ph ph-books" /><span>Online learning resources</span>{course.libraryMetric && <><strong>{course.libraryMetric}</strong><small>{course.libraryMetricLabel}</small></>}</div><div><span className="ma-sec-badge has-dark">Digital library</span><h2 className="ma-sec-title-1">Research beyond the course materials</h2><CourseRichContent section={courseSection(course, 'library')} label="Library access" fallback={course.library && <p>{course.library}</p>} /><Link className="ma-pr-btn-1" to="/contact"><span>Request information</span><i className="ph ph-arrow-right" /></Link></div></div></section>
}

function CourseOutcomes({ course }) {
  return <section className="msbm-detail-section msbm-detail-section--dark" id="outcomes"><div className="container ma-container-1"><div><span className="ma-sec-badge has-dark">What you’ll learn</span><h2 className="ma-sec-title-1">{course.outcomesTitle || 'Programme learning outcomes'}</h2>{course.outcomesIntro && <p>{course.outcomesIntro}</p>}</div><CourseRichContent section={courseSection(course, 'learningOutcomes')} label="Learning outcomes" fallback={course.outcomes?.length > 0 && <ul>{course.outcomes.map((outcome) => <li key={outcome}><i className="ph ph-check-circle" />{outcome}</li>)}</ul>} /></div></section>
}

function LearningJourney({ course }) {
  const steps = course.gettingStarted || []
  return <section className="msbm-learning-journey" id="getting-started"><div className="container ma-container-1"><div><span className="ma-sec-badge">How to get started</span><h2 className="ma-sec-title-1">Your application and study journey</h2>{course.gettingStartedIntro && <p>{course.gettingStartedIntro}</p>}</div><CourseRichContent section={courseSection(course, 'gettingStarted')} label="Application steps" fallback={steps.length > 0 && <ol>{steps.map((step, index) => { const item = typeof step === 'string' ? { title: step } : step; return <li key={`${index}-${item.title}`}><span>{index + 1}</span><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li> })}</ol>} /></div></section>
}

function EntryRequirements({ items }) {
  return <section className="msbm-detail-section" id="admissions"><div className="container ma-container-1"><div><span className="ma-sec-badge">Admissions</span><h2 className="ma-sec-title-1">Entry requirements</h2><p>Applications are reviewed against academic background, professional experience and English-language readiness.</p></div><ol>{items.map((item) => <li key={item}>{item}</li>)}</ol></div></section>
}

function CourseModules({ course }) {
  const additionalNotes = getAdditionalModuleNotes(course)
  return <section className="msbm-modules" id="modules"><div className="container ma-container-1"><div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge">{course.modulesIndicative ? 'Indicative curriculum' : 'Recorded curriculum'}</span><h2 className="ma-sec-title-1">What you’ll <span className="title-mark">learn</span></h2></div><div className="right-content"><p className="ma-p-1">{course.modulesIndicative ? 'These themes are not the official module list. Request the current validated curriculum before enrolment.' : 'Available module titles, descriptions and resource counts are shown below. Unlisted lesson names are not inferred.'}</p></div></div><div className="msbm-module-layout"><ProgrammeSectionLinks /><div className="msbm-module-list">{getCourseModules(course).map((module, index) => { const item = normaliseModule(module); return <details key={`${index}-${item.title}`} open={index === 0}><summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong>{item.meta && <small>{item.meta}</small>}<i className="ph ph-plus" /></summary>{item.meta && <p className="msbm-module-counts">{item.meta}</p>}{item.description && <p>{item.description}</p>}{item.lessons?.length > 0 && <ul>{item.lessons.map((lesson, lessonIndex) => { const entry = typeof lesson === 'string' ? { title: lesson } : lesson; return <li key={`${lessonIndex}-${entry.title}`}><div><strong>{entry.title}</strong>{entry.description && <p>{entry.description}</p>}</div>{entry.type && <small>{entry.type}</small>}</li> })}</ul>}</details> })}</div>{additionalNotes.length > 0 && <section className="msbm-module-notes" aria-labelledby="additional-module-objectives"><h3 id="additional-module-objectives">Additional module learning objectives</h3><ul>{additionalNotes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}</ul></section>}</div></div></section>
}

function CourseCurriculumPending() {
  return <section className="msbm-modules" id="modules"><div className="container ma-container-1"><div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge">Curriculum status</span><h2 className="ma-sec-title-1">Official module list <span className="title-mark">pending verification</span></h2></div><div className="right-content"><p className="ma-p-1">The current official module curriculum has not yet been verified for this programme. Request the current curriculum before enrolment.</p></div></div></div></section>
}

function ProgrammeCredentials({ course }) {
  const items = course.certificateDetails || []
  return <section className="msbm-credentials" id="certificate"><div className="container ma-container-1">{hasCourseSection(course, 'certificate') ? <CourseRichContent section={courseSection(course, 'certificate')} label="Certificate" /> : items.length ? items.map(([icon, title, text]) => <article key={title}><i className={`ph ${icon}`} /><h3>{title}</h3><p>{text}</p></article>) : <article><i className="ph ph-info" /><h3>Certificate information pending</h3><p>The current award, certificate and transcript details have not yet been source-verified for this programme.</p></article>}</div></section>
}

function CourseTestimonials({ course }) {
  const reviews = course.testimonials || []
  return <section className="msbm-testimonials" id="testimonial"><div className="container ma-container-1"><div className="msbm-centered-heading"><span className="ma-sec-badge has-dark">Learner feedback</span><h2 className="ma-sec-title-1">Learner stories</h2></div><CourseRichContent section={courseSection(course, 'testimonials')} label="Programme testimonials" fallback={reviews.length > 0 && <div>{reviews.map(([name, review]) => <blockquote key={name}><p>“{review}”</p><footer>{name}<span>Learner feedback</span></footer></blockquote>)}</div>} /></div></section>
}

function ProgrammeTestimonials({ course }) {
  const related = courses.filter((item) => item.slug !== course.slug && item.categorySlug === course.categorySlug).slice(0, 3)
  return <section className="msbm-related"><div className="container ma-container-1"><div className="ma-sec-title-wrap"><div className="left-content"><span className="ma-sec-badge">Continue exploring</span><h2 className="ma-sec-title-1">Related <span className="title-mark">programmes</span></h2></div><div className="right-content"><p className="ma-p-1">Compare other flexible master’s pathways aligned with your career goals.</p></div></div><CourseGrid items={related} /></div></section>
}

function EmptyCatalogue() { return <div className="msbm-empty"><h2>Programme information is being updated</h2><p>Contact an advisor for the current pathways available through this partner.</p><Link className="ma-pr-btn-1" to="/contact"><span>Speak to an advisor</span></Link></div> }
function MissingRecord() { return <div className="msbm-empty msbm-empty--page"><h1>We couldn’t find that catalogue page</h1><Link className="ma-pr-btn-1" to="/programmes"><span>Browse programmes</span></Link></div> }
function CountryAvailabilityNotice({ country }) { return <div className="msbm-empty"><h2>Local catalogue verification in progress</h2><p>No programme has yet been individually verified for availability and pricing in {country.name}. Contact an advisor for the current local catalogue.</p><Link className="ma-pr-btn-1" to="/contact"><span>Confirm local availability</span></Link></div> }
function getCourseModules(course) {
  const section = courseSection(course, 'modules')
  return section?.modules || section?.blocks?.filter((block) => block.type === 'module').map((block) => block.module).filter(Boolean) || course.modules || []
}
function getAdditionalModuleNotes(course) {
  const section = courseSection(course, 'modules')
  const rendered = getCourseModules(course).map((module) => {
    const item = normaliseModule(module)
    return [item.title, item.description, ...(item.lessons || []).flatMap((lesson) => {
      const entry = typeof lesson === 'string' ? { title: lesson } : lesson
      return [entry.title, entry.description]
    })].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toLowerCase()
  }).join(' ')
  return (section?.blocks || [])
    .filter((block) => block.type === 'li' && block.text)
    .map((block) => block.text.replace(/\s+/g, ' ').trim())
    .filter((text, index, all) => text && !rendered.includes(text.toLowerCase()) && all.indexOf(text) === index)
}
function normaliseModule(module) {
  if (Array.isArray(module)) return { title: module[0], description: module[1], meta: module[2], lessons: module[3] || [] }
  const counts = [module.lectures ? `${module.lectures} lecture${module.lectures === 1 ? '' : 's'}` : '', module.quizzes ? `${module.quizzes} quiz${module.quizzes === 1 ? '' : 'zes'}` : ''].filter(Boolean).join(' · ')
  return { ...module, description: module.description || module.summary, meta: module.meta || counts, lessons: module.lessons || [] }
}
