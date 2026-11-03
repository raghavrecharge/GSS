import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ProgrammeRelations from './ProgrammeRelations.jsx'

vi.mock('../../data/msbmCatalog.js', () => ({ courses: [{ slug: 'mba', title: 'Master of Business Administration' }, { slug: 'dba', title: 'Doctor of Business Administration' }] }))
afterEach(cleanup)

describe('CRM programme relationships', () => {
  it('links by catalogue ID and updates the learner lists when selecting another course', () => {
    render(<ProgrammeRelations leads={[{ id: 'L1', name: 'Learner One', courseSlug: 'mba', programme: 'Old MBA title', status: 'Qualified' }]} applications={[{ id: 'A1', name: 'Learner Two', courseSlug: 'dba', stage: 'Under review' }]} students={[]} />)
    expect(screen.getByText(/Learner One · L1/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open checkout ↗' })).toHaveAttribute('href', '/checkout/mba')
    fireEvent.change(screen.getByLabelText('Programme'), { target: { value: 'dba' } })
    expect(screen.queryByText(/Learner One · L1/)).not.toBeInTheDocument()
    expect(screen.getByText(/Learner Two · A1/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open programme details ↗' })).toHaveAttribute('href', '/programmes/dba')
  })

  it('surfaces unresolved records without inventing catalogue relationships', () => {
    render(<ProgrammeRelations leads={[{ id: 'L1', name: 'Unknown learner', courseSlug: 'deleted', programme: 'Master of Business Administration' }]} applications={[]} students={[]} />)
    expect(screen.getByText(/1 admissions records need catalogue reconciliation/)).toBeInTheDocument()
    expect(screen.queryByText(/Unknown learner · L1/)).not.toBeInTheDocument()
  })
})
