import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import QuestionSummaryCard from '../components/molecules/QuestionSummaryCard.jsx'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { HiArrowLeft } from 'react-icons/hi'
import { BsPlusCircle } from 'react-icons/bs'
import { categoriesApi } from '../lib/api.js'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import EmptyState from '../components/organisms/EmptyState.jsx'

export const TutorManageQuestionsDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try { await logout() } catch (_) {}
    navigate(ROUTES.login, { replace: true })
  }

  // Sidebar items with navigation handlers
  const navigationItems = buildTutorSidebar('MANAGE QUESTIONS', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  // Local states
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [_categoryName, setCategoryName] = useState('')
  const [packages, setPackages] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [confirmAddOpen, setConfirmAddOpen] = useState(false)
  const [blockAddOpen, setBlockAddOpen] = useState(false)
  const [showPublishedWarning, setShowPublishedWarning] = useState(false)
  const [publishedPackagesList, setPublishedPackagesList] = useState([])

  const showInitialLoading = useDelayedSpinner(loading && !isAdding && !isDeleting, 700)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await categoriesApi.detail(id)
        const cat = res?.data?.category
        if (!cat) throw new Error('Category not found')
        if (!mounted) return
        setCategoryName(cat.name)
        // Use DB title directly without local prefix formatting
        // API returns packages with fields: id, title, durationMinutes, isPublished/status, questionCount
        const mapped = (cat.packages || []).map(p => ({
          id: p.id,
          title: p.title || '',
          totalQuestions: p.questionCount ?? 0,
          duration: p.durationMinutes ?? 0,
          isPublished: (typeof p.isPublished === 'boolean') ? p.isPublished : (String(p.status || '').toUpperCase() === 'PUBLISHED')
        }))
        setPackages(mapped)
      } catch (e) {
        if (!mounted) return
        setError(e?.message || 'Failed to load category')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) run()
    return () => { mounted = false }
  }, [id])

  const onManage = (item) => {
    navigate(`/tutor/manage-questions/${encodeURIComponent(item?.id)}/create`)
  }

  const doCreatePackage = async () => {
    if (isAdding) return
    setIsAdding(true)
    try {
      const res = await categoriesApi.createPackage(id)
      const p = res?.data?.package
      if (p) {
        const mapped = {
          id: p.id,
          title: p.title || '',
          totalQuestions: p.questionCount ?? 0,
          duration: p.durationMinutes ?? 0,
        }
        setPackages(prev => [mapped, ...prev])
      }
    } catch (e) {
      setError(e?.message || 'Failed to create package')
    } finally {
      setIsAdding(false)
    }
  }

  const onAddPackage = () => {
    const hasEmpty = (packages || []).some(p => (Number(p.totalQuestions) === 0) || (Number(p.duration) === 0))
    if (hasEmpty) {
      setBlockAddOpen(true)
      return
    }
    setConfirmAddOpen(true)
  }

  const onDeleteCategory = async () => {
    setIsDeleting(true)
    // 1) Pre-check locally: if any package is published, block and show warning
    const publishedLocal = (packages || []).filter(p => p.isPublished)
    if (publishedLocal.length > 0) {
      setConfirmOpen(false)
      setIsDeleting(false)
      setPublishedPackagesList(publishedLocal.map(p => ({ id: p.id, title: p.title })))
      setShowPublishedWarning(true)
      return
    }
    // 2) Call API and handle standard response object
    const res = await categoriesApi.delete(id)
    setConfirmOpen(false)
    setIsDeleting(false)
    if (!res?.ok) {
      const code = res?.data?.code || res?.data?.error
      if (String(code).toUpperCase() === 'HAS_PUBLISHED_PACKAGES') {
        const publishedPkgs = res?.data?.publishedPackages || []
        setPublishedPackagesList(publishedPkgs)
        setShowPublishedWarning(true)
        return
      }
      setError(res?.data?.message || 'Failed to delete category')
      return
    }
    navigate(ROUTES.tutorManageQuestions)
  }

  // Error state
  if (error && loading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load category"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </DashboardLayout>
    )
  }

  // Loading state
  if (loading && !isAdding && !isDeleting) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading category...'}
          fullPage={true}
        />
      </DashboardLayout>
    )
  }

  if (isAdding || isDeleting) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState 
          message={isDeleting ? 'Deleting category...' : isAdding ? 'Adding package...' : 'Loading category...'} 
          fullPage={true}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
      sidebarItems={navigationItems}
      onLogout={handleLogout}
    >
      <SurfaceCard className="w-full">
        {/* Top bar: Back + Title (center) */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 w-max cursor-pointer"
            aria-label="Back"
          >
            <HiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

        <h1 className="justify-self-center text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 underline text-center">
            Manage Questions
          </h1>

          <div className="justify-self-end">
            <button
              type="button"
              onClick={onAddPackage}
              className={[classes.button.base, classes.button.outline, 'px-3 py-2 inline-flex items-center gap-2 disabled:opacity-60'].join(' ')}
              aria-label="Add Package"
              disabled={isAdding}
            >
              <BsPlusCircle className="w-5 h-5" aria-hidden="true" />
              <span>{isAdding ? 'Adding…' : 'Add Package'}</span>
            </button>
          </div>
        </div>

        {/* Removed search/sort/filter toolbar; keep spacing tidy */}
        <div className="mt-4" />

        {/* Packages grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {loading ? (
            <div className="col-span-full text-center text-gray-500 py-8">Loading packages…</div>
          ) : error ? (
            <div className="col-span-full text-center text-red-600 py-8">{error}</div>
          ) : packages.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">No packages yet</div>
          ) : (
            packages.map((it) => (
              <QuestionSummaryCard
                key={it.id}
                title={it.title}
                totalQuestions={it.totalQuestions}
                duration={it.duration}
                isPublished={it.isPublished}
                onManage={() => onManage(it)}
              />
            ))
          )}
        </div>

        {/* Add Package moved to top bar */}
      </SurfaceCard>

      {/* Delete This Category - separate SurfaceCard (center on md) */}
      <div className="rounded-[20px] border border-[#ececec] shadow-[4px_4px_2px_#0000000d] bg-[#fff4f4] p-5 flex flex-col sm:flex-row items-center justify-between gap-5 mt-15 mb-10">
        <div className="text-base font-medium text-[#ff5722] text-center sm:text-left">
          <p className='underline'>Delete This Category?</p>
          <p className='text-[11px] mt-2'>Deleting this category also removes all its question packages. This cannot be undone.</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={[classes.button.base, classes.button.danger, 'h-[34px] px-4'].join(' ')}
          aria-label="Delete this category"
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onDeleteCategory}
        title="Delete This Category?"
        message="Are you sure you want to delete this category? This action cannot be undone."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />

      {/* Confirm: Add Package */}
      <ConfirmDialog
        isOpen={confirmAddOpen}
        onClose={() => setConfirmAddOpen(false)}
        onConfirm={async () => { setConfirmAddOpen(false); await doCreatePackage() }}
        title="Create New Package?"
        message="This will create a new package with an auto-generated title."
        type="warning"
        confirmText="Create"
        cancelText="Cancel"
      />

      {/* Blocker: Add Package while there is an empty package */}
      <ConfirmDialog
        isOpen={blockAddOpen}
        onClose={() => setBlockAddOpen(false)}
        onConfirm={() => setBlockAddOpen(false)}
        title="Complete Existing Package"
        message="You already have a package with 0 questions and 0 duration. Please add questions or set a duration before creating a new package."
        type="info"
        confirmText="OK"
        cancelText="Close"
      />

      {/* Published packages warning modal */}
      <ConfirmDialog
        isOpen={showPublishedWarning}
        onClose={() => setShowPublishedWarning(false)}
        onConfirm={() => setShowPublishedWarning(false)}
        type="warning"
        title="Cannot Delete Category"
        message={`This category has ${publishedPackagesList.length} published package${publishedPackagesList.length > 1 ? 's' : ''} and cannot be deleted.\n\nPublished packages:\n${publishedPackagesList.map(p => `• ${p.title}`).join('\n')}\n\nPlease unpublish all packages first before deleting the category.`}
        confirmText="OK"
        cancelText=""
      />
    </DashboardLayout>
  )
}

export default TutorManageQuestionsDetail
