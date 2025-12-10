// Base URL configuration
const getBaseUrl = () => {
  // 1) Prefer explicit environment variable when provided
  try {
    const envUrl = typeof import.meta !== 'undefined' && import.meta?.env?.VITE_API_URL
    if (envUrl && typeof envUrl === 'string') {
      return envUrl.replace(/\/+$/, '')
    }
  } catch (_) {}
  // 2) Dev auto-detect: if running on localhost, 127.0.0.1, or private LAN IP, target port 3001 on same host
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location
    const isVitePort = /^517\d$/.test(String(port || ''))
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
    const isPrivateLan = /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    if (isVitePort || isLocalHost || isPrivateLan) {
      const host = isLocalHost ? 'localhost' : hostname
      return `${protocol}//${host}:3001`
    }
  }
  // 3) Production: same-origin relative /api
  return ''
}

const BASE_URL = getBaseUrl()

// Global auth invalidation handler (set by app/pages)
let authInvalidHandler = null
export const setAuthInvalidHandler = (fn) => { authInvalidHandler = typeof fn === 'function' ? fn : null }

// Single in-flight refresh promise to deduplicate concurrent 401 refresh attempts
let refreshPromise = null

async function apiFetch(url, options = {}) {
  const isForm = typeof FormData !== 'undefined' && options && options.body instanceof FormData
  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers || {}),
  }
  const { __skipRefresh, ...restOptions } = options || {}
  const config = {
    credentials: 'include',
    headers,
    cache: 'no-store',
    ...restOptions,
  }

  const fullUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url

  try {
    const response = await fetch(fullUrl, config)
    const contentType = response.headers.get('content-type')
    let data
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
    } catch (_) {
      data = null
    }

    if (!response.ok) {
      const code = (data && typeof data === 'object') ? (data.code || data.error || data.message) : null
      const upperCode = String(code).toUpperCase()

      // SESSION_INVALIDATED: do NOT try refresh, immediately notify handler
      const isSessionInvalid = upperCode === 'SESSION_INVALIDATED'

      // 401 (not SESSION_INVALIDATED) – try silent refresh once unless explicitly skipped
      const shouldTryRefresh = response.status === 401 && !isSessionInvalid && !__skipRefresh

      if (shouldTryRefresh) {
        try {
          // Deduplicate refresh calls: share a single in-flight promise
          if (!refreshPromise) {
            refreshPromise = (async () => {
              try {
                return await fetch(`${BASE_URL}/api/auth/refresh`, {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  cache: 'no-store',
                })
              } finally {
                refreshPromise = null
              }
            })()
          }

          const refreshRes = await refreshPromise

          // If refresh succeeded, retry original request once with skip flag
          if (refreshRes.ok) {
            return apiFetch(url, { ...restOptions, headers, __skipRefresh: true })
          }
        } catch (_) {
          // Ignore refresh errors – fall through to invalidation handler
        }
      }

      // At this point either refresh was not attempted, or it failed – propagate auth invalidation
      const finalIsAuthError = response.status === 401 || isSessionInvalid
      if (finalIsAuthError && typeof authInvalidHandler === 'function') {
        try { authInvalidHandler({ status: response.status, code, data }) } catch (_) {}
      }
    }

    return { ok: response.ok, data, status: response.status, headers: response.headers, error: response.ok ? null : (data?.message || `HTTP ${response.status}`) }
  } catch (_) {
    // Network error: silent, non-throwing
    return { ok: false, data: null, status: 0, headers: new Headers(), error: 'NETWORK_ERROR' }
  }
}

export const api = {
  get: (url, options = {}) => apiFetch(url, { method: 'GET', ...options }),
  
  post: (url, body, options = {}) => apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  }),
  postForm: (url, formData, options = {}) => apiFetch(url, {
    method: 'POST',
    body: formData,
    ...options,
  }),
  
  put: (url, body, options = {}) => apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
  }),
  
  patch: (url, body, options = {}) => apiFetch(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options,
  }),
  
  delete: (url, options = {}) => apiFetch(url, { method: 'DELETE', ...options }),
}

export const authApi = {
  register: (userData) => api.post('/api/auth/register', userData),
  
  verifyEmail: (token, email) => api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),
  
  login: (credentials) => api.post('/api/auth/login', credentials),
  
  logout: () => api.post('/api/auth/logout'),
  
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (resetData) => api.post('/api/auth/reset-password', resetData),
  validateResetToken: (token, email) => api.get(`/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`),
  
  me: () => api.get('/api/auth/me'),
  refresh: () => api.post('/api/auth/refresh', {}),
  
  resendVerification: (email, extra = {}) => {
    const body = { email, ...(extra?.body || {}) }
    const options = {}
    if (extra?.headers) options.headers = extra.headers
    return api.post('/api/auth/resend-verification', body, options)
  },
}

export const accountApi = {
  updateProfile: (profileData) => api.patch('/api/account', profileData),
  
  changePassword: (passwordData) => api.patch('/api/account/password', passwordData),

  delete: () => api.delete('/api/account'),
}

export const usersApi = {
  list: (params = {}) => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value)
      }
    })
    const query = searchParams.toString()
    return api.get(`/api/users${query ? `?${query}` : ''}`)
  },

  create: (userData) => api.post('/api/users', userData),
  
  update: (userId, userData) => api.patch(`/api/users/${encodeURIComponent(userId)}`, userData),

  delete: (userId) => api.delete(`/api/users/${encodeURIComponent(userId)}`),
}

export const packagesApi = {
  get: (packageId) => api.get(`/api/tutor/packages/${encodeURIComponent(packageId)}`),
  
  update: (packageId, data) => api.put(`/api/tutor/packages/${encodeURIComponent(packageId)}`, data),
  
  delete: (packageId) => api.delete(`/api/tutor/packages/${encodeURIComponent(packageId)}`),
  
  publish: (packageId) => api.put(`/api/tutor/packages/${encodeURIComponent(packageId)}/publish`, {}),
  
  unpublish: (packageId) => api.put(`/api/tutor/packages/${encodeURIComponent(packageId)}/unpublish`, {}),
}

export const questionsApi = {
  // New page-based persistence for TestPaper via /api/questions
  saveDraft: (payload) =>
    api.post('/api/questions', { ...payload, meta: { ...(payload?.meta || {}), status: 'draft' } }),
  publish: (payload) =>
    api.post('/api/questions', { ...payload, meta: { ...(payload?.meta || {}), status: 'published' } }),

  // Legacy methods (kept for compatibility if used elsewhere)
  create: (packageId, questionData) =>
    api.post(`/api/tutor/packages/${encodeURIComponent(packageId)}/questions`, questionData),
  update: (packageId, questionId, questionData) =>
    api.put(`/api/tutor/packages/${encodeURIComponent(packageId)}/questions/${encodeURIComponent(questionId)}`, questionData),
  delete: (packageId, questionId) =>
    api.delete(`/api/tutor/packages/${encodeURIComponent(packageId)}/questions/${encodeURIComponent(questionId)}`),
  // Placeholders for immediate IDs
  createPagePlaceholder: (packageId, data = {}) =>
    api.post('/api/questions/page', { packageId, ...data }),
  createItemPlaceholder: (pageId, data = {}) =>
    api.post('/api/questions/item', { pageId, ...data }),
}

export const isAuthError = (error) => error?.status === 401
export const isForbiddenError = (error) => error?.status === 403
export const isNotFoundError = (error) => error?.status === 404
export const isValidationError = (error) => error?.status === 400
export const isRateLimitError = (error) => error?.status === 429

export const getErrorMessage = (error) => {
  if (isAuthError(error)) {
    return 'Please log in to continue'
  }
  if (isForbiddenError(error)) {
    return 'You do not have permission to perform this action'
  }
  if (isNotFoundError(error)) {
    return 'The requested resource was not found'
  }
  if (isValidationError(error)) {
    return error.message || 'Please check your input and try again'
  }
  if (isRateLimitError(error)) {
    return 'Too many requests. Please try again later'
  }
  return error.message || 'An unexpected error occurred'
}

export const categoriesApi = {
  list: () => api.get('/api/tutor/categories'),
  create: (name) => api.post('/api/tutor/categories', { name }),
  detail: (id) => api.get(`/api/tutor/categories/${encodeURIComponent(id)}`),
  update: (id, name) => api.put(`/api/tutor/categories/${encodeURIComponent(id)}`, { name }),
  createPackage: (id, payload = {}) =>
    api.post(`/api/tutor/categories/${encodeURIComponent(id)}/packages`, payload),
  delete: (id) => api.delete(`/api/tutor/categories/${encodeURIComponent(id)}`),
}

export const studentApi = {
  dashboardSummary: () => api.get('/api/student/dashboard/summary'),
  testRecords: (params = {}) => {
    const sp = new URLSearchParams()
    if (params.page) sp.set('page', String(params.page))
    if (params.pageSize) sp.set('pageSize', String(params.pageSize))
    if (params.sort) sp.set('sort', String(params.sort))
    const qs = sp.toString()
    return api.get(`/api/student/test-records${qs ? `?${qs}` : ''}`)
  },
  result: (attemptId) => api.get(`/api/student/result/${encodeURIComponent(attemptId)}`),
  updateResultFeedback: (attemptId, feedback) =>
    api.put(`/api/student/result/${encodeURIComponent(attemptId)}`, { feedback }),
  checkActiveSession: () => api.get('/api/student/active-session'),
}

export const testApi = {
  get: (attemptId, sessionToken = null) => {
    const headers = sessionToken ? { 'x-session-token': sessionToken } : {}
    return api.get(`/api/test/${encodeURIComponent(attemptId)}`, { headers })
  },
  
  submit: (attemptId, payload, sessionToken = null) => {
    const headers = sessionToken ? { 'x-session-token': sessionToken } : {}
    return api.post(`/api/test/${encodeURIComponent(attemptId)}/submit`, payload, { headers })
  },
  
  // Prepare test: Randomize packages/papers before showing test overview
  // Optional: createNewRecord to force a fresh TestRecord (for retake flows)
  prepare: (categoryIds, recordId = null, createNewRecord = false) => 
    api.post('/api/test/prepare', { 
      categoryIds, 
      ...(recordId && { recordId }), 
      ...(createNewRecord ? { createNewRecord: true } : {})
    }),
  
  // Start test: Create attempt from prepared data (no paperId)
  start: (packageId, categoryId, turnNumber, recordId = null, preparedCategories = [], testMeta = null) => 
    api.post('/api/test/start', { 
      packageId, 
      categoryId, 
      ...(typeof turnNumber === 'number' ? { turnNumber } : {}), 
      ...(recordId && { recordId }),
      ...(preparedCategories.length > 0 && { preparedCategories }),
      ...(testMeta && { testMeta })
    }),
  
  // Hybrid auto-save: Batch sync to database
  saveAnswers: (attemptId, payload, sessionToken = null) => {
    const headers = sessionToken ? { 'x-session-token': sessionToken } : {}
    return api.post(`/api/test/${encodeURIComponent(attemptId)}/save-answers`, payload, { headers })
  },
  
  // Beacon save: Emergency save on page unload
  beaconSave: (attemptId, payload) => {
    const url = `${BASE_URL}/api/test/${encodeURIComponent(attemptId)}/beacon-save`
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    if (navigator.sendBeacon) {
      return navigator.sendBeacon(url, blob)
    }
    return false
  },
  
  // Force cleanup active session (emergency use)
  forceCleanup: () => api.post('/api/test/force-cleanup'),

  // Check current package status for an attempt (PUBLISHED/DRAFT)
  checkPackageStatus: (attemptId) => api.get(`/api/test/${encodeURIComponent(attemptId)}/package-status`),

  // Cleanup attempt (hard delete ActiveTestSession, TestAttempt, TemporaryAnswer)
  cleanupAttempt: (attemptId) => api.post(`/api/test/${encodeURIComponent(attemptId)}/cleanup`, {}),

  // Beacon cleanup on unload (best-effort)
  beaconCleanup: (attemptId) => {
    const url = `${BASE_URL}/api/test/${encodeURIComponent(attemptId)}/cleanup`
    try {
      const blob = new Blob([JSON.stringify({})], { type: 'application/json' })
      if (navigator.sendBeacon) return navigator.sendBeacon(url, blob)
    } catch (_) {}
    return false
  },
}

export const mediaApi = {
  upload: (formData) => api.postForm('/api/media/upload', formData),
  delete: (id, params = {}) => {
    const { scope, type } = params
    const queryString = scope && type 
      ? `?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(type)}`
      : ''
    return api.delete(`/api/media/${encodeURIComponent(id)}${queryString}`)
  },
}

export default api