import { allProgrammeTitles } from '../services/programmeLinks.js'

export const leadStatuses = ['New enquiry', 'Contacted', 'Qualified', 'Application started', 'Enrolled', 'Closed']
export const applicationStages = ['Started', 'Documents pending', 'Under review', 'Offer issued', 'Enrolled']
export const leadSources = ['Website enquiry', 'Programme page', 'Referral', 'Event']
export const admissionsOwners = ['Admissions team', 'Programme advisor', 'Student support']
export const programmeOptions = [
  'Masters of Business Administration',
  'DBA in Project Management',
  'Executive MBA in Human Resource Management',
  'Professional Certificate in Business Management',
  ...allProgrammeTitles.filter(title => !['Masters of Business Administration', 'DBA in Project Management', 'Executive MBA in Human Resource Management', 'Professional Certificate in Business Management'].includes(title)),
]

export const initialLeads = [
  { id: 'GSS-L001', name: 'Alex Morgan', email: 'alex.morgan@example.com', country: 'United Kingdom', programme: programmeOptions[0], status: 'New enquiry', source: 'Website enquiry', owner: 'Admissions team', created: '2026-11-01', notes: [], activities: [{ id: 'a1', text: 'Programme enquiry received', date: '2026-11-01' }] },
  { id: 'GSS-L002', name: 'Sam Taylor', email: 'sam.taylor@example.com', country: 'India', programme: programmeOptions[1], status: 'Qualified', source: 'Programme page', owner: 'Programme advisor', created: '2026-10-31', notes: [], activities: [{ id: 'a2', text: 'Eligibility conversation completed', date: '2026-11-01' }] },
  { id: 'GSS-L003', name: 'Jordan Lee', email: 'jordan.lee@example.com', country: 'Nigeria', programme: programmeOptions[2], status: 'Contacted', source: 'Referral', owner: 'Programme advisor', created: '2026-10-30', notes: [], activities: [{ id: 'a3', text: 'Programme information shared', date: '2026-10-31' }] },
  { id: 'GSS-L004', name: 'Casey Williams', email: 'casey.williams@example.com', country: 'Ghana', programme: programmeOptions[0], status: 'Application started', source: 'Website enquiry', owner: 'Admissions team', created: '2026-10-29', notes: [], activities: [{ id: 'a4', text: 'Application opened', date: '2026-10-31' }] },
  { id: 'GSS-L005', name: 'Robin Davis', email: 'robin.davis@example.com', country: 'United Arab Emirates', programme: programmeOptions[3], status: 'New enquiry', source: 'Event', owner: 'Admissions team', created: '2026-11-01', notes: [], activities: [{ id: 'a5', text: 'Event enquiry received', date: '2026-11-01' }] },
  { id: 'GSS-L006', name: 'Jamie Wilson', email: 'jamie.wilson@example.com', country: 'Sierra Leone', programme: programmeOptions[1], status: 'Enrolled', source: 'Referral', owner: 'Student support', created: '2026-10-20', notes: [], activities: [{ id: 'a6', text: 'Enrolment confirmed', date: '2026-10-30' }] },
]

export const initialApplications = [
  { id: 'GSS-A001', name: 'Casey Williams', programme: programmeOptions[0], stage: 'Started', documents: 1, requiredDocuments: 4, intake: 'January 2027', owner: 'Admissions team' },
  { id: 'GSS-A002', name: 'Sam Taylor', programme: programmeOptions[1], stage: 'Documents pending', documents: 2, requiredDocuments: 4, intake: 'January 2027', owner: 'Programme advisor' },
  { id: 'GSS-A003', name: 'Taylor Brooks', programme: programmeOptions[2], stage: 'Under review', documents: 4, requiredDocuments: 4, intake: 'January 2027', owner: 'Admissions team' },
  { id: 'GSS-A004', name: 'Drew Parker', programme: programmeOptions[0], stage: 'Offer issued', documents: 4, requiredDocuments: 4, intake: 'January 2027', owner: 'Programme advisor' },
  { id: 'GSS-A005', name: 'Jamie Wilson', programme: programmeOptions[1], stage: 'Enrolled', documents: 4, requiredDocuments: 4, intake: 'October 2026', owner: 'Student support' },
]

export const initialStudents = [
  { id: 'GSS-S001', name: 'Jamie Wilson', email: 'jamie.wilson@example.com', country: 'Sierra Leone', programme: programmeOptions[1], intake: 'October 2026', status: 'Active', advisor: 'Student support' },
  { id: 'GSS-S002', name: 'Cameron Ellis', email: 'cameron.ellis@example.com', country: 'United Kingdom', programme: programmeOptions[0], intake: 'October 2026', status: 'Active', advisor: 'Student support' },
  { id: 'GSS-S003', name: 'Avery Reed', email: 'avery.reed@example.com', country: 'India', programme: programmeOptions[3], intake: 'July 2026', status: 'Completed', advisor: 'Programme advisor' },
  { id: 'GSS-S004', name: 'Riley Bennett', email: 'riley.bennett@example.com', country: 'Nigeria', programme: programmeOptions[2], intake: 'July 2026', status: 'On hold', advisor: 'Student support' },
]

export const initialTasks = [
  { id: 'GSS-T001', title: 'Follow up on Alex’s MBA enquiry', related: 'Alex Morgan', owner: 'Admissions team', due: '2026-11-01', priority: 'High', completed: false },
  { id: 'GSS-T002', title: 'Review Sam’s supporting documents', related: 'Sam Taylor', owner: 'Programme advisor', due: '2026-11-02', priority: 'High', completed: false },
  { id: 'GSS-T003', title: 'Confirm January intake availability', related: 'Casey Williams', owner: 'Admissions team', due: '2026-11-03', priority: 'Normal', completed: false },
  { id: 'GSS-T004', title: 'Complete student welcome call', related: 'Jamie Wilson', owner: 'Student support', due: '2026-10-31', priority: 'Normal', completed: true },
]

export function localDate() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function displayDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}
