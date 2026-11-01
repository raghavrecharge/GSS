import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminShell from './AdminShell.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import CrmWorkspace from './crm/CrmWorkspace.jsx'
import CmsWorkspace from './cms/index.jsx'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  // jsdom has the dialog element but does not implement its browser methods.
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open') } })
})

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('admin shell', () => {
  it('exposes the two workspace destinations and restores the public body class on unmount', () => {
    document.body.className = 'existing-public-theme'
    const view = render(<MemoryRouter initialEntries={['/admin']}><AdminShell><AdminDashboard /></AdminShell></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Admin overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open CRM' })).toHaveAttribute('href', '/admin/crm')
    expect(screen.getByRole('link', { name: 'Open CMS' })).toHaveAttribute('href', '/admin/cms')
    expect(document.body).toHaveClass('gss-admin-body')
    view.unmount()
    expect(document.body).toHaveClass('existing-public-theme')
  })

  it('opens mobile navigation and closes it using Escape', () => {
    render(<MemoryRouter initialEntries={['/admin/crm/leads']}><AdminShell><p>Workspace</p></AdminShell></MemoryRouter>)
    const toggle = screen.getByRole('button', { name: 'Open admin navigation' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Leads' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('CRM workspace behavior', () => {
  it('combines enquiry filters, exposes an empty state, and recovers when filters clear', () => {
    render(<CrmWorkspace section="leads" showNavigation={false} />)
    const search = screen.getByRole('searchbox', { name: 'Search enquiries' })
    fireEvent.change(search, { target: { value: 'Sam Taylor' } })
    expect(screen.getByText('1 of 6 enquiries')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'New enquiry' } })
    expect(screen.getByRole('heading', { name: 'No enquiries match these filters' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'All statuses' } })
    expect(screen.getByRole('button', { name: 'View enquiry for Sam Taylor' })).toBeInTheDocument()
    expect(screen.queryByText('Alex Morgan')).not.toBeInTheDocument()
  })

  it('updates a lead status in the detail panel and reflects it in the list', () => {
    render(<CrmWorkspace section="leads" showNavigation={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'View enquiry for Alex Morgan' }))
    fireEvent.change(screen.getByLabelText('Enquiry status'), { target: { value: 'Qualified' } })
    const row = screen.getByText('Alex Morgan', { selector: 'strong' }).closest('tr')
    expect(within(row).getByText('Qualified')).toBeInTheDocument()
    expect(screen.getByText('Status changed to Qualified')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Alex Morgan: status changed to qualified.')
  })

  it('moves an application between pipeline stages', () => {
    render(<CrmWorkspace section="applications" showNavigation={false} />)
    const started = screen.getByRole('region', { name: 'Started applications' })
    fireEvent.change(within(started).getByLabelText('Move to stage'), { target: { value: 'Under review' } })
    expect(within(started).queryByText('Casey Williams')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Under review applications' })).getByText('Casey Williams')).toBeInTheDocument()
  })
})

describe('CMS structured editing', () => {
  it('rejects invalid page data then saves a valid draft in the workspace', () => {
    render(<CmsWorkspace initialView="pages" />)
    fireEvent.click(screen.getByRole('button', { name: 'New page' }))
    const editor = screen.getByRole('dialog', { name: 'New page' })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    expect(within(editor).getByText('Enter a title.')).toBeInTheDocument()
    expect(within(editor).getByText('Add the main page content.')).toBeInTheDocument()
    fireEvent.change(within(editor).getByLabelText(/^Title/), { target: { value: 'Learner support' } })
    fireEvent.change(within(editor).getByLabelText(/^Page path/), { target: { value: 'https://outside.example' } })
    fireEvent.change(within(editor).getByLabelText(/^Main content/), { target: { value: 'Talk to our learner support team.' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    expect(within(editor).getByText('Use a local path, such as /about or /programmes/my-course.')).toBeInTheDocument()
    fireEvent.change(within(editor).getByLabelText(/^Page path/), { target: { value: '/learner-support' } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Save changes' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learner support' })).toBeInTheDocument()
    expect(screen.getByText('“Learner support” saved in this session.')).toBeInTheDocument()
  })

  it('renders editor input as plain text in the preview', () => {
    render(<CmsWorkspace initialView="pages" />)
    fireEvent.click(screen.getByRole('button', { name: 'New page' }))
    const editor = screen.getByRole('dialog', { name: 'New page' })
    const text = '<img src=x onerror="alert(1)">'
    fireEvent.change(within(editor).getByLabelText(/^Main content/), { target: { value: text } })
    fireEvent.click(within(editor).getByRole('button', { name: 'Preview content' }))
    expect(within(editor).getByText(text)).toBeInTheDocument()
    expect(editor.querySelector('img')).toBeNull()
    expect(within(editor).getByRole('button', { name: 'Continue editing' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('prevents external menu destinations from being saved', () => {
    render(<CmsWorkspace initialView="navigation" />)
    fireEvent.change(screen.getAllByLabelText('Destination')[0], { target: { value: '//outside.example' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save navigation' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Each item needs a label and a valid local path')
    fireEvent.change(screen.getAllByLabelText('Destination')[0], { target: { value: '/' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save navigation' }))
    expect(screen.getByText('Navigation saved in this session.')).toBeInTheDocument()
  })
})
