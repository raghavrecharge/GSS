import { useSyncExternalStore } from 'react'

const seedActivity = [
  { id: 'activity-1', area: 'Admissions', action: 'Application moved to review', detail: 'Executive MBA — Production & Operations', actor: 'Admissions team', time: '2026-11-01T09:48:00Z', outcome: 'Updated' },
  { id: 'activity-2', area: 'Content', action: 'Programme draft reviewed', detail: 'DBA in Project Management', actor: 'Content team', time: '2026-11-01T09:12:00Z', outcome: 'Reviewed' },
  { id: 'activity-3', area: 'Admissions', action: 'New qualified enquiry', detail: 'Masters of Business Administration', actor: 'Programme advisor', time: '2026-11-01T08:35:00Z', outcome: 'Created' },
  { id: 'activity-4', area: 'Content', action: 'Navigation draft saved', detail: 'Programmes menu', actor: 'Content team', time: '2026-10-31T16:20:00Z', outcome: 'Updated' },
  { id: 'activity-5', area: 'Workspace', action: 'Content quality review completed', detail: 'University and course link checks', actor: 'Workspace administrator', time: '2026-10-31T13:00:00Z', outcome: 'Reviewed' },
]

const initialState = {
  activity: seedActivity,
  notifications: [
    { id: 'notice-1', title: 'Three programme drafts need review', detail: 'Review academic content and links before publishing.', to: '/admin/cms/programmes', read: false },
    { id: 'notice-2', title: 'Two applications are waiting for documents', detail: 'Open the admissions pipeline to review the next action.', to: '/admin/crm/applications', read: false },
    { id: 'notice-3', title: 'November intake preparation', detail: 'Check programme availability and onboarding tasks.', to: '/admin/crm/intakes', read: false },
  ],
  preferences: { workspaceName: 'GSS operations', timezone: 'Europe/London', dateFormat: 'Day Month Year', weeklyDigest: true, contentReview: true },
}
let state = structuredClone(initialState)
const listeners = new Set()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener) }
const getSnapshot = () => state

export function useWorkspaceState() { return useSyncExternalStore(subscribe, getSnapshot, getSnapshot) }

export function recordWorkspaceActivity({ area = 'Workspace', action, detail = '', outcome = 'Updated' }) {
  if (!['Workspace', 'Admissions', 'Content'].includes(area) || typeof action !== 'string' || !action.trim() || action.length > 160 || String(detail).length > 500 || typeof outcome !== 'string' || !outcome.trim() || outcome.length > 40) return false
  state = { ...state, activity: [{ id: crypto.randomUUID(), area, action: action.trim(), detail: String(detail).trim(), actor: 'Demo workspace', time: new Date().toISOString(), outcome }, ...state.activity].slice(0, 200) }
  emit()
  return true
}

export function markNotificationRead(id) {
  state = { ...state, notifications: state.notifications.map((item) => id === 'all' || item.id === id ? { ...item, read: true } : item) }
  emit()
}

export function saveWorkspacePreferences(values) {
  const workspaceName = String(values.workspaceName || '').trim()
  if (!workspaceName || workspaceName.length > 80) throw new TypeError('Enter a workspace name using 1–80 characters.')
  if (!['Europe/London', 'Asia/Kolkata', 'Africa/Lagos', 'UTC'].includes(values.timezone)) throw new TypeError('Choose a supported time zone.')
  if (!['Day Month Year', 'Month Day Year', 'ISO 8601'].includes(values.dateFormat)) throw new TypeError('Choose a supported date format.')
  state = { ...state, preferences: { workspaceName, timezone: values.timezone, dateFormat: values.dateFormat, weeklyDigest: Boolean(values.weeklyDigest), contentReview: Boolean(values.contentReview) } }
  emit()
  recordWorkspaceActivity({ action: 'Workspace preferences saved', detail: workspaceName })
}

export function resetWorkspaceState() { state = structuredClone(initialState); emit() }
