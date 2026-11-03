import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { CoursePage } from './Catalog.jsx'

afterEach(cleanup)
const course = {
  slug: 'course-renderer-test', title: 'Course renderer test', description: 'Programme introduction',
  university: 'Partner University', level: 'Master’s Degree', categorySlug: 'masters-degree',
  duration: '24 months', mode: 'Online', fee: '£3,600', modules: [],
}
const block = (text) => ({ blocks: [{ type: 'p', text }] })
const renderCourse = (record) => render(<MemoryRouter><CoursePage courseOverride={record} /></MemoryRouter>)

describe('course detail rendering', () => {
  it('renders every section even when longDescription is missing and shows pending states', () => {
    renderCourse(course)
    for (const id of ['overview', 'details', 'course-details', 'accreditation', 'university', 'entry', 'workshop', 'visa', 'tuition', 'about', 'library', 'outcomes', 'getting-started', 'modules', 'certificate', 'testimonial']) {
      expect(document.getElementById(id), id).toBeInTheDocument()
    }
    expect(screen.getByText('Learning outcomes pending source verification.')).toBeInTheDocument()
    expect(screen.getByText('Course Details pending source verification.')).toBeInTheDocument()
  })

  it('renders rich exact-section content, source modules and lesson descriptions instead of stale fields', () => {
    renderCourse({ ...course, courseDetails: 'Old detail', modules: [{ title: 'Old module' }], detailSections: {
      programmeDetails: block('Full programme description'),
      courseDetails: { blocks: [{ type: 'p', text: 'Source detail paragraph' }, { type: 'li', text: 'First detail point' }, { type: 'li', text: 'Second detail point' }, { type: 'table', text: 'Module credits', rows: [['Module', 'Credits'], ['Research', '20']] }] },
      modules: { blocks: [], modules: [{ title: 'Research module', summary: 'Research module summary', lectures: 2, quizzes: 1, lessons: [{ title: 'Research methods lesson', description: 'The full source lesson description.', type: 'lecture' }] }] },
      learningOutcomes: { blocks: [{ type: 'li', text: 'Analyze campaign outcomes' }] },
      about: block('Source learning support'), library: block('Source library policy'),
      gettingStarted: block('Upload your academic documents'), certificate: block('Source award and certificate details'),
      testimonials: { blocks: [{ type: 'blockquote', text: 'Source learner feedback' }] },
    } })
    expect(screen.queryByText('Old detail')).not.toBeInTheDocument()
    expect(screen.queryByText('Old module')).not.toBeInTheDocument()
    for (const text of ['Source detail paragraph', 'First detail point', 'Second detail point', 'Research module summary', 'The full source lesson description.', 'Source learning support', 'Source library policy', 'Upload your academic documents', 'Source award and certificate details', 'Source learner feedback']) expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Course Details table' })).toContainElement(screen.getByText('20'))
    const details = document.querySelector('#modules details')
    expect(details.open).toBe(true)
    fireEvent.click(within(details).getByText('Research module'))
    expect(details.open).toBe(false)
    fireEvent.click(within(details).getByText('Research module'))
    expect(details.open).toBe(true)
    expect(screen.getAllByText('2 lectures · 1 quiz')).toHaveLength(2)
  })

  it('keeps source strings as text and rejects unsafe source media URLs', () => {
    renderCourse({ ...course, detailSections: { courseDetails: { blocks: [
      { type: 'p', text: '<script>unsafe()</script>' }, { type: 'embed', src: 'javascript:unsafe()', text: 'Unsafe media' },
      { type: 'image', src: 'data:text/html,unsafe', text: 'Unsafe image' },
    ] } } })
    expect(screen.getByText('<script>unsafe()</script>')).toBeInTheDocument()
    expect(document.querySelector('#course-details script')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Unsafe media' })).not.toBeInTheDocument()
    expect(screen.queryByAltText('Unsafe image')).not.toBeInTheDocument()
  })

  it('does not substitute a module-count sentence for the course description or infer a module summary by title', () => {
    renderCourse({ ...course, courseDetails: '9 source-listed curriculum sections and 59 lesson or resource entries are included below.', modules: [{ title: 'STRATEGIC MANAGEMENT', lessons: [] }] })
    expect(screen.getByText('Course Details pending source verification.')).toBeInTheDocument()
    expect(screen.queryByText(/Develop critical-thinking skills to evaluate/)).not.toBeInTheDocument()
  })
})
