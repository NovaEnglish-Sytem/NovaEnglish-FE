export const TUTOR_SIDEBAR_LABELS = [
  'DASHBOARD',
  'STUDENT PROGRESS',
  'MANAGE QUESTIONS',
  'MANAGE FEEDBACK',
  'ACCOUNT SETTINGS',
]

export const ADMIN_SIDEBAR_LABELS = [
  'DASHBOARD',
  'STUDENT PROGRESS',
  'MANAGE QUESTIONS',
  'MANAGE FEEDBACK',
  'MANAGE USERS',
  'ACCOUNT SETTINGS',
]

export function buildTutorSidebar(activeLabel = '', handlers = {}, userRole = 'TUTOR') {
  const labels = userRole === 'ADMIN' ? ADMIN_SIDEBAR_LABELS : TUTOR_SIDEBAR_LABELS
  
  return labels.map((label) => ({
    label,
    isActive: label === activeLabel,
    onClick: handlers[label] ?? (() => {}),
  }))
}

export default { TUTOR_SIDEBAR_LABELS, ADMIN_SIDEBAR_LABELS, buildTutorSidebar }
