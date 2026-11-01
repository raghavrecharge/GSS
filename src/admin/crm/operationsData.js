export const initialConversations = [
  { id: 'GSS-C001', leadId: 'GSS-L001', subject: 'MBA study options and next steps', channel: 'Email', state: 'Needs response', owner: 'Admissions team', updated: '2026-11-01', messages: [{ id: 'cm1', direction: 'Inbound', body: 'I would like to understand the study schedule and entry requirements before applying.', date: '2026-11-01' }] },
  { id: 'GSS-C002', leadId: 'GSS-L002', subject: 'Supporting documents checklist', channel: 'Email', state: 'Waiting for learner', owner: 'Programme advisor', updated: '2026-11-01', messages: [{ id: 'cm2', direction: 'Internal note', body: 'Qualification review is pending the final supporting documents.', date: '2026-11-01' }] },
  { id: 'GSS-C003', leadId: 'GSS-L006', subject: 'Welcome and induction', channel: 'Phone', state: 'Resolved', owner: 'Student support', updated: '2026-10-31', messages: [{ id: 'cm3', direction: 'Internal note', body: 'Welcome call completed. Learner received the induction schedule.', date: '2026-10-31' }] },
]

export const initialIntakes = [
  { id: 'GSS-I001', name: 'January 2027', start: '2027-01-18', deadline: '2027-01-04', capacity: 40, state: 'Open', owner: 'Admissions team' },
  { id: 'GSS-I002', name: 'April 2027', start: '2027-04-12', deadline: '2027-03-29', capacity: 30, state: 'Planning', owner: 'Programme advisor' },
  { id: 'GSS-I003', name: 'October 2026', start: '2026-10-12', deadline: '2026-09-28', capacity: 35, state: 'Closed', owner: 'Student support' },
]

export const reviewChecklist = ['Qualification review', 'Identity review', 'English language review', 'Offer acceptance']

export function csvCell(value) {
  const text = String(value ?? '')
  // Prefix formula-like values so exported files stay inert when opened in spreadsheets.
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function reportCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n')
}
