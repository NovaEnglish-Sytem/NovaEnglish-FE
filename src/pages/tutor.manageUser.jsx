import React, { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import { SectionHeading as SectionTitle } from '../components/molecules/SectionHeading.jsx'
import { Button } from '../components/atoms/Button.jsx'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { authApi, usersApi, getErrorMessage } from '../lib/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { AuthModal } from '../components/molecules/AuthModal.jsx'
import { validateFullName, validateEmail, validatePassword, validatePhone, formatPhoneE164 } from '../utils/validators.js'
import UserFormModal from '../components/molecules/UserFormModal.jsx'
import { TbArrowsSort, TbArrowUp, TbArrowDown } from 'react-icons/tb'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import Pagination from '../components/molecules/Pagination.jsx'

const ManageUsers = () => {
  const navigate = useNavigate()
  const { user: authUser, logout } = useAuth()

  // Access and data
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState([])

  // Search & Pagination
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, _setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const scrollToTop = () => {
    try {
      const container = document.querySelector('[data-dashboard-scroll="true"]')
      if (container && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: 0 })
      } else {
        window.scrollTo({ top: 0 })
      }
    } catch (_) {
      // ignore
    }
  }

  const goToPage = (nextPage) => {
    scrollToTop()
    setPage(nextPage)
  }

  // Global feedback modal
  const [showMsg, setShowMsg] = useState(false)
  const [msg, setMsg] = useState({ type: 'info', title: '', message: '' })

  // Create modal state
  const [showCreate, setShowCreate] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    role: 'STUDENT',
    password: '',
    confirmPassword: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: '',
    isEmailVerified: false,
  })
  const [createCountry, setCreateCountry] = useState({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
  const [createErrors, setCreateErrors] = useState({})

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    email: '',
    fullName: '',
    phoneNumber: '',
    role: 'STUDENT',
    isEmailVerified: false,
    password: '',
    confirmPassword: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: '',
  })
  const [editCountry, setEditCountry] = useState({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
  const [editErrors, setEditErrors] = useState({})

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showInitialLoading = useDelayedSpinner(isLoading, 700)

  // Sorting state (matching Student Progress pattern)
  const [sortField, setSortField] = useState('fullName') // Default sort by fullName
  const [sortOrder, setSortOrder] = useState('asc') // Default ascending

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const headerSortIndicator = (field) => {
    const isActive = sortField === field
    if (!isActive) return <TbArrowsSort className="inline ml-1 text-gray-500" />
    return sortOrder === 'asc'
      ? <TbArrowUp className="inline ml-1 text-gray-500" />
      : <TbArrowDown className="inline ml-1 text-gray-500" />
  }

  const compareUsers = (a, b) => {
    if (!sortField) return 0
    const va = String(a[sortField] || '').toLowerCase()
    const vb = String(b[sortField] || '').toLowerCase()
    const cmp = va.localeCompare(vb)
    return sortOrder === 'asc' ? cmp : -cmp
  }

  // Nav items
  const navigationItems = buildTutorSidebar('MANAGE USERS', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, authUser?.role)

  const handleLogout = async () => {
    try { await logout() } catch { /* no-op */ }
    navigate(ROUTES.login, { replace: true })
  }

  // Access control and initial load
  useEffect(() => {
    const run = async () => {
      try {
        const me = await authApi.me()
        const { user } = me.data
        setCurrentUser(user)
        if (user.role !== 'ADMIN') {
          navigate(ROUTES.tutorDashboard)
          return
        }
        await loadUsers()
      } catch (err) {
        if (err.status === 401) {
          navigate(ROUTES.login)
        } else {
          // console.error(err)
        }
      } finally {
        setIsLoading(false)
      }
    }
    run()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await usersApi.list({ page, size: pageSize, q: debouncedQ })
      const data = res?.data || {}
      const list = Array.isArray(data.users) ? data.users : []
      setUsers(list)

      const totalCount = typeof data.total === 'number' ? data.total : list.length
      setTotal(totalCount)

      if (typeof data.totalPages === 'number') {
        setTotalPages(Math.max(1, data.totalPages))
      } else {
        setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)))
      }
    } catch {
      setMsg({ type: 'error', title: 'Error', message: 'Failed to load users. Please try again.' })
      setShowMsg(true)
    }
  }

  // Debounce search input for smoother UX
  useEffect(() => {
    const h = setTimeout(() => setDebouncedQ(q), 500)
    return () => clearTimeout(h)
  }, [q])

  useEffect(() => {
    loadUsers()
  }, [page, pageSize, debouncedQ])

  // Client-side filtering fallback (in case backend does not filter by q)
  const query = debouncedQ.toLowerCase()
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return []
    if (!debouncedQ) return users
    return users.filter((u) => [u.fullName, u.email].join(' ').toLowerCase().includes(query))
  }, [users, debouncedQ, query])

  const adminUsers = useMemo(
    () => filteredUsers.filter((u) => u.role === 'ADMIN'),
    [filteredUsers],
  )
  const tutorUsers = useMemo(
    () => filteredUsers.filter((u) => u.role === 'TUTOR'),
    [filteredUsers],
  )
  const studentUsers = useMemo(
    () => filteredUsers.filter((u) => u.role === 'STUDENT'),
    [filteredUsers],
  )

  // Row actions
  // removed: changeRole (role change via dropdown) as per new requirement

  // Create handlers
  const openCreate = () => {
    setCreateForm({
      email: '',
      fullName: '',
      phoneNumber: '',
      role: 'STUDENT',
      password: '',
      confirmPassword: '',
      placeOfBirth: '',
      dateOfBirth: '',
      gender: '',
      isEmailVerified: false,
    })
    setCreateCountry({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
    setCreateErrors({})
    setShowCreate(true)
  }

  const submitCreate = async () => {
    const errs = {}
    const em = validateEmail(createForm.email)
    if (!em.valid) errs.email = em.message

    const fn = validateFullName(createForm.fullName)
    if (!fn.valid) errs.fullName = fn.message

    // no nickname

    // phone required + validation
    if (!createForm.phoneNumber) {
      errs.phoneNumber = 'Phone number is required'
    } else {
      const ph = validatePhone(createForm.phoneNumber, createCountry.code)
      if (!ph.valid) errs.phoneNumber = ph.message
    }

    // place of birth required min 3
    {
      const t = String(createForm.placeOfBirth || '').trim()
      if (!t) errs.placeOfBirth = 'Place of Birth is required.'
      else if (t.length < 3) errs.placeOfBirth = 'Place of Birth must be at least 3 characters.'
    }
    // date of birth required
    if (!createForm.dateOfBirth) {
      errs.dateOfBirth = 'Date of Birth is required.'
    }

    // gender required
    if (!createForm.gender) {
      errs.gender = 'Please select gender.'
    }

    const pw = validatePassword(createForm.password)
    if (!pw.valid) errs.password = pw.message

    // confirm password required and must match
    if (!createForm.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password'
    } else if (createForm.confirmPassword !== createForm.password) {
      errs.confirmPassword = 'Passwords do not match'
    }

    setCreateErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsCreating(true)
    try {
      const payload = {
        email: createForm.email,
        fullName: createForm.fullName,
        phoneE164: createForm.phoneNumber ? formatPhoneE164(createForm.phoneNumber, createCountry.code) : null,
        role: createForm.role,
        password: createForm.password,
        placeOfBirth: createForm.placeOfBirth || null,
        dateOfBirth: createForm.dateOfBirth ? new Date(createForm.dateOfBirth).toISOString() : null,
        gender: createForm.gender ? String(createForm.gender).toUpperCase() : null,
        isEmailVerified: !!createForm.isEmailVerified,
      }
      const res = await usersApi.create(payload)
      if (!res.ok) {
        // Extract proper error message from response
        let errorMsg = 'Failed to create user.'
        if (res.data?.error) {
          errorMsg = res.data.error
        } else if (res.error) {
          errorMsg = res.error
        }
        // Make user-friendly messages
        if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('already')) {
          errorMsg = 'This email address is already registered. Please use a different email.'
        }
        return { ok: false, type: 'error', title: 'Create Failed', message: errorMsg }
      }
      const newUser = res.data.user
      setUsers((prev) => [newUser, ...prev])
      return { ok: true, type: 'success', title: 'Success', message: 'User created successfully.' }
    } catch (err) {
      console.error('Create user error:', err)
      let errorMsg = 'Failed to create user.'
      if (err?.response?.data?.error) {
        errorMsg = err.response.data.error
      } else if (err?.message) {
        errorMsg = err.message
      }
      // Make user-friendly messages
      if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('already')) {
        errorMsg = 'This email address is already registered. Please use a different email.'
      }
      return { ok: false, type: 'error', title: 'Create Failed', message: errorMsg }
    } finally {
      setIsCreating(false)
    }
  }

  // Edit handlers
  const openEdit = (u) => {
    setEditForm({
      id: u.id,
      email: u.email,
      fullName: u.fullName || '',
      phoneNumber: u.phoneE164 || '',
      role: u.role || 'STUDENT',
      isEmailVerified: !!u.isEmailVerified,
      password: '',
      confirmPassword: '',
      placeOfBirth: u.placeOfBirth || '',
      dateOfBirth: u.dateOfBirth ? String(u.dateOfBirth).slice(0,10) : '',
      gender: u.gender || '',
    })
    setEditCountry({ code: 'ID', dial_code: '+62', name: 'Indonesia' })
    setEditErrors({})
    setShowEdit(true)
  }

  const submitEdit = async () => {
    const errs = {}

    const fn = validateFullName(editForm.fullName)
    if (!fn.valid) errs.fullName = fn.message

    // no nickname

    // phone required + validation
    if (!editForm.phoneNumber) {
      errs.phoneNumber = 'Phone number is required'
    } else {
      const ph = validatePhone(editForm.phoneNumber, editCountry.code)
      if (!ph.valid) errs.phoneNumber = ph.message
    }

    // place/gender/dob validations
    {
      const t = String(editForm.placeOfBirth || '').trim()
      if (!t) errs.placeOfBirth = 'Place of Birth is required.'
      else if (t.length < 3) errs.placeOfBirth = 'Place of Birth must be at least 3 characters.'
    }
    if (!editForm.dateOfBirth) {
      errs.dateOfBirth = 'Date of Birth is required.'
    }

    if (!editForm.gender) {
      errs.gender = 'Please select gender.'
    }

    // password optional; if provided must be valid and match confirm
    if (editForm.password) {
      const pw = validatePassword(editForm.password)
      if (!pw.valid) errs.password = pw.message
      if (!editForm.confirmPassword) {
        errs.confirmPassword = 'Please confirm the new password'
      } else if (editForm.confirmPassword !== editForm.password) {
        errs.confirmPassword = 'Passwords do not match'
      }
    }

    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsUpdating(true)
    try {
      const payload = {
        fullName: editForm.fullName,
        phoneE164: editForm.phoneNumber ? formatPhoneE164(editForm.phoneNumber, editCountry.code) : null,
        role: editForm.role,
        placeOfBirth: editForm.placeOfBirth || null,
        dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : null,
        gender: editForm.gender ? String(editForm.gender).toUpperCase() : null,
        isEmailVerified: !!editForm.isEmailVerified,
      }
      if (editForm.password) payload.password = editForm.password

      const res = await usersApi.update(editForm.id, payload)
      if (!res.ok) {
        return { ok: false, type: 'error', title: 'Update Failed', message: res.data?.error || getErrorMessage(res) || 'Failed to update user.' }
      }
      const updated = res.data.user
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
      return { ok: true, type: 'success', title: 'Success', message: 'User updated successfully.' }
    } catch (err) {
      console.error('Update user error:', err)
      return { ok: false, type: 'error', title: 'Update Failed', message: err?.response?.data?.error || err?.message || 'Failed to update user.' }
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete handlers
  const requestDelete = (userId) => {
    setDeleteUserId(userId)
    setShowDeleteConfirm(true)
  }
  const confirmDelete = async () => {
    if (!deleteUserId) return
    setIsDeleting(true)
    try {
      await usersApi.delete(deleteUserId)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUserId))
      setShowDeleteConfirm(false)
      setDeleteUserId(null)
      setMsg({ type: 'success', title: 'Deleted', message: 'User deleted successfully.' })
      setShowMsg(true)
    } catch (err) {
      
      setShowDeleteConfirm(false)
      setDeleteUserId(null)
      setMsg({ type: 'error', title: 'Delete Failed', message: getErrorMessage(err) })
      setShowMsg(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const closeMsg = () => setShowMsg(false)

  // UI components
  const HeaderRow = () => (
    <div
      className={[
        'w-full px-6',
        // Use a consistent wide grid so small screens scroll horizontally instead of breaking layout
        'grid grid-cols-[2fr_2fr_1fr_1.2fr_1.6fr_150px]',
        'items-center text-center gap-x-6 sm:gap-x-4',
        classes.textSuccess,
        'font-medium text-sm md:text-base py-4 border-b border-[#e5e7eb] min-w-[768px] md:min-w-[1023px]'
      ].join(' ')}
    >
      <button
        type="button"
        className="whitespace-nowrap flex items-center justify-center cursor-pointer"
        onClick={() => handleSort('fullName')}
        aria-label="Sort by Full Name"
      >
        Fullname
        {headerSortIndicator('fullName')}
      </button>
      <button
        type="button"
        className="whitespace-nowrap flex items-center justify-center cursor-pointer"
        onClick={() => handleSort('email')}
        aria-label="Sort by Email"
      >
        Email
        {headerSortIndicator('email')}
      </button>
      <div className="whitespace-nowrap">Role</div>
      <div className="whitespace-nowrap">Gender</div>
      <div className="whitespace-nowrap">Birth</div>
      <div className="whitespace-nowrap" />
    </div>
  )

  const Row = ({ u, adminSection = false }) => (
    <div
      className={[
        'rounded-[12px] shadow-[0_4px_4px_#0000001a] px-6 py-6 mb-6',
        'w-full min-w-[768px] md:min-w-[1023px] overflow-visible',
        'bg-white',
      ].join(' ')}
    >
      <div
        className={[
          'grid grid-cols-[2fr_2fr_1fr_1.2fr_1.6fr_150px]',
          'items-center text-center gap-x-6 sm:gap-x-4',
        ].join(' ')}
      >
        <div className="text-gray-700 truncate min-w-0 text-sm md:text-base">{u.fullName}</div>
        <div className="min-w-0 text-sm md:text-base">
          <div className="flex items-center justify-center gap-2 text-gray-700">
            <span className="truncate max-w-[220px] sm:max-w-[260px] md:max-w-[320px]">{u.email}</span>
            <span
              className={[
                'whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium border',
                u.isEmailVerified
                  ? 'bg-[#E6F4E7] text-[#1E7F37] border-[#B7E1C0]'
                  : 'bg-[#F3F4F6] text-gray-600 border-gray-300'
              ].join(' ')}
              aria-label={u.isEmailVerified ? 'Verified email' : 'Unverified email'}
            >
              {u.isEmailVerified ? 'Verified' : 'Unverified'}
            </span>
          </div>
        </div>
        <div className="min-w-0 text-gray-700">{u.role}</div>
        <div className="text-gray-700 truncate min-w-0 text-sm md:text-base">{u.gender || '-'}</div>
        <div className="text-gray-700 truncate min-w-0 text-sm md:text-base">
          {(() => {
            const place = u.placeOfBirth || '-'
            const d = u.dateOfBirth ? new Date(u.dateOfBirth) : null
            const pad = (n) => String(n).padStart(2, '0')
            const dateStr = d ? `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}` : '-'
            return `${place}, ${dateStr}`
          })()}
        </div>
        <div className="flex items-center justify-end pr-3">
          {adminSection ? (
            // In Admin section, do not allow editing/deleting any admin via UI
            u.id === currentUser?.id ? (
              <span className="text-gray-500 text-sm">(You)</span>
            ) : null
          ) : (
            u.id === currentUser?.id ? (
              <span className="text-gray-500 text-sm">(You)</span>
            ) : (
              <div className="flex items-center gap-6">
                <button
                  className="text-blue-600 font-medium hover:underline text-center cursor-pointer whitespace-nowrap"
                  type="button"
                  onClick={() => openEdit(u)}
                  disabled={isUpdating}
                  aria-label="Edit user"
                >
                  Edit
                </button>
                <button
                  className="text-red-600 font-medium hover:underline text-center cursor-pointer whitespace-nowrap"
                  type="button"
                  onClick={() => requestDelete(u.id)}
                  disabled={isUpdating || isDeleting}
                  aria-label="Delete user"
                >
                  Delete
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )

  // Loading / Access checks
  if (isLoading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} displayRole="ADMIN" />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading users...'}
          minHeight="min-h-[calc(100vh-100px)]"
        />
      </DashboardLayout>
    )
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <div className="w-full flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} displayRole="ADMIN" />}
      sidebarItems={navigationItems}
      onLogout={handleLogout}
    >
      <SurfaceCard className="w-full mb-8">
        {/* Title */}
        <h1 className="text-center text-2xl font-semibold text-gray-700 underline">Manage Users</h1>

        {/* Utilities */}
        <div className="flex items-center justify-between gap-3 my-5">
          <div className="flex items-center bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] h-[35px] w-full sm:w-auto px-3 py-1 min-w-0">
            <span className="text-gray-600">Search</span>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); goToPage(1) }}
              placeholder="Type Here"
              className="h-[30px] w-full sm:w-[220px] flex-1 min-w-0 rounded-[3px] border border-gray-500 px-2 text-sm text-gray-600 bg-white focus:outline-none ml-2"
              aria-label="Search"
            />
          </div>
          <Button onClick={openCreate} className="h-[31px] text-xs px-4">CREATE USER</Button>
        </div>

        <div className="mt-5 overflow-x-auto px-0">
          {/* Header columns */}
          <HeaderRow />

          {/* Section: Admin */}
          {adminUsers.length > 0 && (
            <>
              <SectionTitle>Admin</SectionTitle>
              <div className="mb-2 space-y-4">
                {[...adminUsers].sort(compareUsers).map((u) => (
                  <Row key={u.id} u={u} adminSection />
                ))}
              </div>
            </>
          )}

          {/* Section: Tutor */}
          {tutorUsers.length > 0 && (
            <>
              <SectionTitle>Tutor</SectionTitle>
              <div className="mb-2 space-y-4">
                {[...tutorUsers].sort(compareUsers).map((u) => (
                  <Row key={u.id} u={u} />
                ))}
              </div>
            </>
          )}

          {/* Section: Student */}
          {studentUsers.length > 0 && (
            <>
              <SectionTitle>Student</SectionTitle>
              <div className="mt-2 space-y-4">
                {[...studentUsers].sort(compareUsers).map((u) => (
                  <Row key={u.id} u={u} />
                ))}
              </div>
            </>
          )}

          {/* No users found */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {debouncedQ ? `No users found matching "${debouncedQ}"` : 'No users found'}
              </p>
            </div>
          )}
        </div>
        {/* Pagination footer inside card but outside the horizontal scroller */}
        <Pagination
          page={page}
          totalPages={totalPages}
          label={`Page ${page} of ${totalPages} • Total ${total} Data`}
          onPageChange={goToPage}
          className="mt-4 px-2 sm:px-0"
        />
      </SurfaceCard>

      {/* Create User Modal */}
      <UserFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create User"
        mode="create"
        form={createForm}
        setForm={setCreateForm}
        errors={createErrors}
        setErrors={setCreateErrors}
        country={createCountry}
        setCountry={setCreateCountry}
        onSubmit={submitCreate}
        submitLabel={isCreating ? 'CREATING...' : 'CREATE'}
        saving={isCreating}
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit User"
        mode="edit"
        form={editForm}
        setForm={setEditForm}
        errors={editErrors}
        setErrors={setEditErrors}
        country={editCountry}
        setCountry={setEditCountry}
        onSubmit={submitEdit}
        submitLabel={isUpdating ? 'UPDATING...' : 'SAVE'}
        saving={isUpdating}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        type="delete"
        isLoading={isDeleting}
      />

      {/* Global feedback modal */}
      <AuthModal
        isOpen={showMsg}
        onClose={closeMsg}
        type={msg.type}
        title={msg.title}
        message={msg.message}
      />
    </DashboardLayout>
  )
}

export default ManageUsers