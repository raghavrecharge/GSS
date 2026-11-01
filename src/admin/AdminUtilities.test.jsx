import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminShell from './AdminShell.jsx'
import { AdminActivity, AdminReports, AdminSettings } from './AdminDashboard.jsx'
import { recordWorkspaceActivity, resetWorkspaceState } from './services/workspaceState.js'

beforeEach(() => {
  resetWorkspaceState()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', '') } })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open') } })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })
const shell = (children) => render(<MemoryRouter initialEntries={['/admin']}><AdminShell>{children}</AdminShell></MemoryRouter>)

describe('admin workspace utilities', () => {
  it('opens search from the keyboard, filters destinations and restores focus on close', () => {
    shell(<p>Workspace</p>)
    const searchButton = screen.getByRole('button', { name: 'Search admin workspace' })
    searchButton.focus()
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const dialog = screen.getByRole('dialog', { name: 'Find a workspace' })
    fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'university-not-found' } })
    expect(within(dialog).getByText('No destinations match. Try a different keyword.')).toBeInTheDocument()
    fireEvent.change(within(dialog).getByRole('searchbox'), { target: { value: 'Universities' } })
    expect(within(dialog).getByRole('link', { name: /Universities/ })).toHaveAttribute('href', '/admin/cms/universities')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close workspace panel' }))
    expect(searchButton).toHaveFocus()
  })

  it('marks notifications read and preserves their state after reopening the panel', () => {
    shell(<p>Workspace</p>)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 3 unread' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(screen.getByRole('button', { name: 'Notifications, 0 unread' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close workspace panel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 0 unread' }))
    expect(screen.getByText('0 unread updates')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
  })

  it('saves shared preferences and records the change in the activity trail', () => {
    const view = render(<AdminSettings />)
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Admissions operations' } })
    fireEvent.change(screen.getByLabelText('Time zone'), { target: { value: 'UTC' } })
    fireEvent.change(screen.getByLabelText('Date display preference'), { target: { value: 'ISO 8601' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save workspace preferences' }))
    expect(screen.getByRole('status')).toHaveTextContent('saved for this session')
    view.unmount()
    render(<AdminActivity />)
    expect(screen.getByText('Workspace preferences saved')).toBeInTheDocument()
    expect(screen.getByText('Admissions operations')).toBeInTheDocument()
    expect(screen.getByText('2026-11-01 09:48')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search activity' }), { target: { value: 'nothing matches' } })
    expect(screen.getByRole('heading', { name: 'No matching events' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear activity filters' }))
    expect(screen.getByText('Workspace preferences saved')).toBeInTheDocument()
  })

  it('updates reporting period totals and chart alternatives together', () => {
    render(<MemoryRouter><AdminReports /></MemoryRouter>)
    expect(screen.getByRole('img', { name: /enquiries by week/ })).toHaveAttribute('aria-label', expect.stringContaining('Week 1: 18'))
    fireEvent.change(screen.getByLabelText('Reporting period'), { target: { value: 'Last 2 weeks' } })
    expect(screen.getByRole('img', { name: /enquiries by week/ })).not.toHaveAttribute('aria-label', expect.stringContaining('Week 1'))
    expect(screen.getByText('49')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Metric'), { target: { value: 'enrolments' } })
    expect(screen.getByRole('img', { name: /enrolments by week/ })).toHaveAttribute('aria-label', expect.stringContaining('Week 4: 7'))
  })

  it('rejects invalid audit events at the session service boundary', () => {
    expect(recordWorkspaceActivity({ area: 'Injected area', action: 'Bad event' })).toBe(false)
    expect(recordWorkspaceActivity({ action: 'a'.repeat(161) })).toBe(false)
    expect(recordWorkspaceActivity({ area: 'Content', action: 'Draft saved', detail: '<script>plain text</script>' })).toBe(true)
    render(<AdminActivity />)
    expect(screen.getByText('<script>plain text</script>')).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })
})
