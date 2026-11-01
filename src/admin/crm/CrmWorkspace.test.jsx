import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CrmWorkspace from './CrmWorkspace.jsx'

afterEach(cleanup)

describe('CRM preview workflows', () => {
  it('shares a contact lifecycle change with the enquiry list', () => {
    render(<CrmWorkspace />)
    fireEvent.click(screen.getByRole('button', { name: 'Contacts', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: /Alex Morgan.*alex.morgan/ }))
    fireEvent.change(screen.getByLabelText('Contact lifecycle'), { target: { value: 'Qualified' } })
    fireEvent.change(screen.getByLabelText('Add a contact note'), { target: { value: 'Discuss evening study availability.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save contact note' }))
    expect(screen.getByText('Discuss evening study availability.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Leads', exact: true }))
    const row = screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }).closest('tr')
    expect(within(row).getByText('Qualified')).toBeInTheDocument()
  })

  it('saves an escaped reply draft and updates inbox status', () => {
    render(<CrmWorkspace section="communications" />)
    const message = '<img src=x onerror=alert(1)>'
    fireEvent.change(screen.getByLabelText('Draft response'), { target: { value: message } })
    fireEvent.click(screen.getByRole('button', { name: 'Save reply draft' }))
    const thread = screen.getByRole('region', { name: 'Conversation: MBA study options and next steps' })
    expect(within(thread).getByText(message)).toBeInTheDocument()
    expect(thread.querySelector('img')).toBeNull()
    expect(screen.getByLabelText('Draft response')).toHaveValue('')
    fireEvent.change(screen.getByLabelText('Thread status'), { target: { value: 'Resolved' } })
    fireEvent.change(screen.getByLabelText('Conversation status'), { target: { value: 'Needs response' } })
    expect(screen.getByRole('heading', { name: 'Inbox clear' })).toBeInTheDocument()
    expect(thread).toBeInTheDocument()
  })

  it('requires admission readiness before confirming enrolment and updates reporting', () => {
    render(<CrmWorkspace />)
    fireEvent.click(screen.getByRole('button', { name: 'Intakes & enrolment', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Review admission for Drew Parker' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm enrolment' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Complete the document checklist and all admissions reviews')
    for (const label of ['Qualification review', 'Identity review', 'English language review', 'Offer acceptance']) fireEvent.click(screen.getByRole('checkbox', { name: label }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm enrolment' }))
    expect(screen.getByRole('button', { name: 'Enrolment confirmed' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Students', exact: true }))
    expect(screen.getByText('Drew Parker')).toBeInTheDocument()
    expect(screen.getByText('5 of 5 students')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reports', exact: true }))
    expect(screen.getByText('Application conversion').parentElement).toHaveTextContent('40%')
    fireEvent.click(screen.getByRole('button', { name: 'Preview report export' }))
    expect(screen.getByLabelText('Report CSV').value).toContain('"Programme","Enquiries","Applications","Enrolled"')
  })

  it('rejects enrolment before an offer and supports an empty intake', () => {
    render(<CrmWorkspace section="intakes" />)
    fireEvent.click(screen.getByRole('button', { name: 'Review admission for Casey Williams' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm enrolment' }))
    expect(screen.getByRole('alert')).toHaveTextContent('An offer must be issued')
    fireEvent.click(screen.getByRole('button', { name: /PlanningApril 2027/ }))
    expect(screen.getByRole('heading', { name: 'No applications for this intake' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Admissions review for Casey Williams' })).not.toBeInTheDocument()
  })
  it('retains a selected enquiry when a status change moves it out of a filtered list', () => {
    render(<CrmWorkspace section="leads" />)
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'New enquiry' } })
    fireEvent.click(screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }))
    fireEvent.change(screen.getByLabelText('Enquiry status'), { target: { value: 'Qualified' } })

    expect(screen.getByText('1 of 6 enquiries')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View enquiry for Alex Morgan' })).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Enquiry details for Alex Morgan' })).toBeInTheDocument()
    expect(screen.getByLabelText('Enquiry status')).toHaveValue('Qualified')

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'All statuses' } })
    const row = screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }).closest('tr')
    expect(within(row).getByText('Qualified')).toBeInTheDocument()
  })

  it('creates a new enquiry and shows its details while clearing list filters', () => {
    render(<CrmWorkspace section="leads" />)
    fireEvent.change(screen.getByLabelText('Search enquiries'), { target: { value: 'not found' } })
    fireEvent.click(screen.getByRole('button', { name: 'New enquiry' }))
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Preview Learner' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'preview@example.com' } })
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'United Kingdom' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create enquiry' }))

    expect(screen.getByLabelText('Search enquiries')).toHaveValue('')
    expect(screen.getByText('7 of 7 enquiries')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Enquiry details for Preview Learner' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create enquiry' })).not.toBeInTheDocument()
  })

  it('moves an application between named stages with the keyboard-accessible select', () => {
    render(<CrmWorkspace section="applications" />)
    const started = screen.getByRole('region', { name: 'Started applications' })
    fireEvent.change(within(started).getByLabelText('Move to stage'), { target: { value: 'Under review' } })

    expect(within(started).queryByText('Casey Williams')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Under review applications' })).getByText('Casey Williams')).toBeInTheDocument()
  })

  it('completes and reopens a follow-up without losing its title', () => {
    render(<CrmWorkspace section="tasks" />)
    const title = 'Follow up on Alex’s MBA enquiry'
    fireEvent.click(screen.getByRole('checkbox', { name: title }))
    expect(screen.queryByRole('checkbox', { name: title })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Show tasks'), { target: { value: 'Completed' } })
    expect(screen.getByRole('checkbox', { name: title })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: title }))
    expect(screen.queryByRole('checkbox', { name: title })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Show tasks'), { target: { value: 'Open' } })
    expect(screen.getByRole('checkbox', { name: title })).not.toBeChecked()
  })

  it('keeps enquiry changes while moving between local workspace sections', () => {
    render(<CrmWorkspace />)
    fireEvent.click(screen.getByRole('button', { name: 'Leads', exact: true }))
    fireEvent.click(screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }))
    fireEvent.change(screen.getByLabelText('Enquiry status'), { target: { value: 'Enrolled' } })
    fireEvent.click(screen.getByRole('button', { name: 'Overview', exact: true }))
    expect(screen.getByText('Active enquiries').parentElement).toHaveTextContent('4')
    fireEvent.click(screen.getByRole('button', { name: 'Leads', exact: true }))
    const row = screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }).closest('tr')
    expect(within(row).getByText('Enrolled')).toBeInTheDocument()
  })
})
