import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { countries, findCourse, findLocation, getCompleteCourses, getCountryCourse, getCountryRegions, locations } from './data/msbmCatalog.js'

vi.mock('gsap', () => ({ default: { registerPlugin: vi.fn(), context: () => ({ revert: vi.fn() }), utils: { toArray: () => [] }, to: vi.fn(), fromTo: vi.fn() } }))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { refresh: vi.fn() } }))
vi.mock('swiper', () => ({ default: class { destroy() {} } }))
vi.mock('swiper/modules', () => ({ Autoplay: {}, EffectFade: {}, Navigation: {}, Pagination: {} }))

class TestIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.IntersectionObserver = TestIntersectionObserver
globalThis.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} })
globalThis.scrollTo = vi.fn()
afterEach(cleanup)

describe('site routes', () => {
  const routeCases = [
    ['/', 'Online Business School'], ['/online-learning', 'Online Learning'], ['/for-business', 'Global Careers'], ['/about', 'About GSS'],
    ['/accreditation', 'Accreditation'], ['/tuition', 'Fees'], ['/programmes', 'Programmes'], ['/programmes/mba', 'Masters of Business Administration'],
    ['/universities', 'Programmes'], ['/countries', 'Programmes'],
    ['/categories', 'Programmes'], ['/specializations', 'Programmes'],
    ['/learning', 'Learning with GSS'], ['/student-stories', 'Student Success'], ['/insights', 'Insights'],
    ['/insights/online-learning', 'Online Learning'], ['/contact', 'Contact The Global School of Skills (GSS)'],
  ]

  it.each(routeCases)('renders %s', (path, title) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    expect(document.title).toContain(title)
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
  })

  it('redirects a legacy HTML URL', async () => {
    render(<MemoryRouter initialEntries={['/about-us.html']}><App /></MemoryRouter>)
    expect((await screen.findAllByText('Explore Programmes')).length).toBeGreaterThan(0)
    expect(document.title).toContain('About GSS')
  })

  it('renders the dedicated GEIC-style administrator login and setup routes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, headers: new Headers({ 'content-type': 'application/json' }), json: async () => ({ authenticated: false }) })
    const { unmount } = render(<MemoryRouter initialEntries={['/admin/login']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Welcome back to GSS' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument()
    unmount()
    render(<MemoryRouter initialEntries={['/admin/login?setup=demo-token']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Create your GSS password' })).toBeInTheDocument()
    fetchMock.mockRestore()
  })

  it('renders the custom 404 page for unknown URLs', () => {
    render(<MemoryRouter initialEntries={['/not-a-real-page']}><App /></MemoryRouter>)
    expect(document.title).toContain('404')
  })

  it('renders the popular programme cards and catalogue links', () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    expect(screen.getAllByAltText('The Global School of Skills (GSS)').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Masters of Business Administration').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Azteca University').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Doctorate Degree' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Master’s Degree' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SEMP Online & SEP Upgradeable' })).toBeInTheDocument()
  })

  it('switches country from the persistent header control', async () => {
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Country/i }))
    const search = screen.getByRole('searchbox', { name: 'Find your country' })
    fireEvent.change(search, { target: { value: 'Portugal' } })
    fireEvent.click(screen.getByRole('link', { name: 'Portugal' }))
    expect(await screen.findByRole('heading', { name: /learners in Portugal/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Portugal/i })).toBeInTheDocument()
  })

  it('renders course, university and country detail routes', () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/programmes/executive-mba-production-operations-management']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Production And Operations Management/i })).toBeInTheDocument()
    unmount()
    const second = render(<MemoryRouter initialEntries={['/universities/azteca-university']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Azteca University' })).toBeInTheDocument()
    second.unmount()
    render(<MemoryRouter initialEntries={['/countries/ghana']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /learners in Ghana/i })).toBeInTheDocument()
  })

  it('renders all catalogue taxonomies and the full DBA detail page', () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/categories/doctorate-degree']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Doctorate Degree' })).toBeInTheDocument()
    expect(screen.getByText('DBA in Project Management (DBAPM)')).toBeInTheDocument()
    unmount()
    const subject = render(<MemoryRouter initialEntries={['/specializations/project-operations-management']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Project & Operations Management' })).toBeInTheDocument()
    subject.unmount()
    render(<MemoryRouter initialEntries={['/programmes/dba-in-project-management']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'DBA in Project Management (DBAPM)' })).toBeInTheDocument()
    expect(screen.getAllByText(/advanced research methods/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Entry requirements')).toBeInTheDocument()
  })

  it('renders the long-form production and operations programme', () => {
    render(<MemoryRouter initialEntries={['/programmes/executive-mba-production-operations-management']}><App /></MemoryRouter>)
    expect(screen.getByText('£ 1,750')).toBeInTheDocument()
    expect(screen.getAllByText(/strategic human resource management/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/thesis in production and operations management/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Programme experience and support' })).toBeInTheDocument()
  })

  it('renders the detailed university information architecture', () => {
    render(<MemoryRouter initialEntries={['/universities/azteca-university']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Azteca University' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What makes the partnership valuable' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'A clear route from enquiry to enrolment' })).toBeInTheDocument()
    expect(screen.getByText('Who awards the qualification?')).toBeInTheDocument()
  })

  it('keeps source-backed detail separate from explicitly labelled indicative data', () => {
    const allCourses = getCompleteCourses()
    const verifiedDegrees = allCourses.filter((course) => course.sourceUrl?.startsWith('https://msbm.org.uk/programme/'))
    expect(verifiedDegrees).toHaveLength(69)
    verifiedDegrees.forEach((course) => {
      expect(course.longDescription, `${course.slug} is missing an overview`).toBeTruthy()
      expect(course.courseDetails, `${course.slug} is missing course details`).toBeTruthy()
      if (course.sourceCoverage === 'complete') {
        expect(course.modules.length, `${course.slug} is missing its recorded curriculum`).toBeGreaterThan(0)
        expect(course.modulesIndicative, `${course.slug} should use recorded modules`).toBe(false)
        expect(course.entry?.length, `${course.slug} is missing source entry requirements`).toBeGreaterThan(0)
        expect(course.accreditation, `${course.slug} is missing source accreditation`).toBeTruthy()
      } else {
        expect(course.modulesIndicative, `${course.slug} should not infer modules for a linked source`).toBe(false)
      }
    })
    const mba = findCourse('masters-of-business-administration')
    expect(mba.modules).toHaveLength(15)
    expect(mba.sourceLessonCount).toBeGreaterThan(100)
  })

  it('renders all verified marketing programme sections and anchors', () => {
    render(<MemoryRouter initialEntries={['/programmes/masters-continuing-education-marketing']}><App /></MemoryRouter>)
    expect(screen.getByText('Complete source-verified programme information')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Course Details' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accreditation' })).toBeInTheDocument()
    expect(screen.getByText('Performance Marketing In Search And Social')).toBeInTheDocument()
    expect(screen.getByText('Search Engine Marketing (SEM)')).toBeInTheDocument()
    expect(screen.getAllByText('4 lectures · 1 quiz').length).toBeGreaterThanOrEqual(2)
  })

  it('redirects every official programme slug to its clean React route', async () => {
    render(<MemoryRouter initialEntries={['/programme/master-of-business-administration-3']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Masters of Business Administration' })).toBeInTheDocument()
    expect(screen.getByText('15 source-listed curriculum sections and 116 lesson or resource entries are included below.')).toBeInTheDocument()
  })

  it('includes the complete source country selector and filters it accessibly', () => {
    expect(countries).toHaveLength(249)
    expect(countries.map((country) => country.name)).toEqual(expect.arrayContaining(['Portugal', 'Puerto Rico', 'Réunion', 'Sierra Leone']))
    render(<MemoryRouter initialEntries={['/countries']}><App /></MemoryRouter>)
    const search = screen.getByRole('searchbox', { name: 'Find your country' })
    expect(screen.getAllByText('249 destinations').length).toBeGreaterThan(0)
    fireEvent.change(search, { target: { value: 'Sierra Leone' } })
    expect(screen.getByText('1 destination')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sierra Leone' })).toBeInTheDocument()
  })

  it('renders source-backed country catalogues without inventing local tuition', () => {
    const portugalMba = getCountryCourse('portugal', 'masters-of-business-administration')
    expect(portugalMba.fee).toBe('Confirm local fee')
    expect(portugalMba.locallyVerified).toBe(false)
    render(<MemoryRouter initialEntries={['/countries/portugal']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /learners in Portugal/i })).toBeInTheDocument()
    expect(screen.getByText('69')).toBeInTheDocument()
    expect(screen.getAllByText('Confirm local fee').length).toBeGreaterThan(0)
  })

  it('renders country-aware programme detail routes and source aliases', async () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/countries/portugal/programmes/masters-of-business-administration']}><App /></MemoryRouter>)
    expect(screen.getByText('Country destination: Portugal')).toBeInTheDocument()
    expect(screen.getAllByText('Confirm local fee').length).toBeGreaterThan(0)
    unmount()
    render(<MemoryRouter initialEntries={['/sierra-leone/programme/masters-degree-in-continuing-education-in-marketing-mba-mktg']}><App /></MemoryRouter>)
    expect(await screen.findByText('Country destination: Sierra Leone')).toBeInTheDocument()
    expect(screen.getAllByText('SLL 102,777,575').length).toBeGreaterThan(0)
  })

  it('renders the complete source-backed information and policy page registry', () => {
    const { unmount } = render(<MemoryRouter initialEntries={['/about-msbm/our-story']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Our Story' })).toBeInTheDocument()
    expect(screen.getByText(/Social Enterprise Edtech Pathway College/i)).toBeInTheDocument()
    unmount()
    render(<MemoryRouter initialEntries={['/terms/privacy-policy']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText('Source-backed information')).toBeInTheDocument()
  })

  it('supports every extracted regional location and regional programme route', async () => {
    expect(locations).toHaveLength(4542)
    expect(getCountryRegions('senegal')).toHaveLength(13)
    expect(findLocation('dakar')?.countrySlug).toBe('senegal')
    const { unmount } = render(<MemoryRouter initialEntries={['/dakar']}><App /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Programmes in Dakar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Choose a city or region')).toHaveValue('dakar')
    unmount()
    render(<MemoryRouter initialEntries={['/dakar/programme/master-of-business-administration-3']}><App /></MemoryRouter>)
    expect(await screen.findByText('Regional destination: Dakar, Senegal')).toBeInTheDocument()
    expect(screen.getAllByText('Confirm local fee').length).toBeGreaterThan(0)
  })
})
