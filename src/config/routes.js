export const ROUTES = {
  // Root and Auth
  root: '/',
  login: '/login',
  register: '/register',

  // Account Management
  accountVerifyEmail: '/account/verify-email',
  accountRequestReset: '/account/request-reset',
  accountResetPassword: '/account/reset-password',
  accountSettings: '/account/settings',

  // Legal
  privacyPolicy: '/privacy-policy',
  terms: '/terms',

  // Role-based Dashboards (Industry Standard)
  studentDashboard: '/student/dashboard',
  tutorDashboard: '/tutor/dashboard',
  adminDashboard: '/tutor/dashboard',

  // Student Routes
  studentTestRecord: '/student/test-record',
  studentTestOverview: '/student/test-overview',
  studentTest: '/student/test/:attemptId',
  studentResult: '/student/result/:attemptId',

  // Tutor Routes
  tutorStudentProgress: '/tutor/student-progress',
  tutorStudentProgressDetails: '/tutor/student-progress/:id',
  tutorManageQuestions: '/tutor/manage-questions',
  tutorManageQuestionsDetail: '/tutor/manage-questions/:id',
  tutorCreateQuestions: '/tutor/manage-questions/:id/create',
  tutorManageFeedback: '/tutor/manage-feedback',

  // Admin Routes
  adminManageUsers: '/admin/manage-users',

  // Legacy support (will be redirected)
  dashboardStudent: '/student/dashboard',
  dashboardTutor: '/tutor/dashboard',
  tutorManageUsers: '/admin/manage-users',
  result: '/student/result',
}

export default ROUTES
