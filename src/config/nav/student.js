export const STUDENT_TOP_NAV_LABELS = [
  'DASHBOARD',
  'TEST RECORD',
]

export function buildStudentTopNav(activeLabel = '', handlers = {}) {
  return STUDENT_TOP_NAV_LABELS.map((label) => ({
    label,
    isActive: label === activeLabel,
    onClick: handlers[label] ?? (() => {}),
  }))
}

export default { STUDENT_TOP_NAV_LABELS, buildStudentTopNav }