import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout.jsx'
import SurfaceCard from '../components/molecules/SurfaceCard.jsx'
import { classes } from '../config/theme/tokens.js'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import QuestionSection from '../components/organisms/QuestionSection.jsx'
import { BsPlusCircle } from 'react-icons/bs'
import CategoryNameModal from '../components/molecules/CategoryNameModal.jsx'
import { categoriesApi } from '../lib/api.js'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import EmptyState from '../components/organisms/EmptyState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'

export const TutorManageQuestions = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      /* no-op */
    } finally {
      navigate(ROUTES.login, { replace: true })
    }
  }

  const navigationItems = buildTutorSidebar('MANAGE QUESTIONS', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK' : () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  // Categories and sections state (fetched from API)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([]) // [{id, name, packageCount}]
  const [sections, setSections] = useState([]) // [{id, name, items: []}]

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingCategory, setEditingCategory] = useState(null) // {id, name} when editing
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false)
  const [pendingName, setPendingName] = useState('')

  const showInitialLoading = useDelayedSpinner(loading, 700)

  // Map DB packages to card items (use DB title directly)
  const mapPackagesToItems = (packages = [], _categoryName = '') =>
    (packages.slice(0, 3) || []).map(pkg => ({
      id: pkg.id,
      title: pkg.title || '',
      totalQuestions: pkg.questionCount ?? 0,
      duration: pkg.durationMinutes ?? 0,
      isPublished: String(pkg.status || '').toUpperCase() === 'PUBLISHED'
    }))

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await categoriesApi.list()
      const cats = res?.data?.categories || []
      setCategories(cats)

      // Fetch detail per category to get packages (latest 3)
      const details = await Promise.all(
        cats.map(async (c) => {
          try {
            const d = await categoriesApi.detail(c.id)
            const cat = d?.data?.category
            return {
              id: cat.id,
              name: cat.name,
              items: mapPackagesToItems(cat.packages || [], cat.name)
            }
          } catch {
            return { id: c.id, name: c.name, items: [] }
          }
        })
      )
      setSections(details)
    } catch (e) {
      setError(e?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const openAddModal = () => {
    setModalMode('create')
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const openEditModal = (cat) => {
    setModalMode('edit')
    setEditingCategory(cat)
    setIsModalOpen(true)
  }

  // Validate unique name (case-insensitive) on client
  const validateUnique = (name) => {
    const needle = (name || '').trim().toLowerCase()
    const exists = categories.some(c => {
      if (modalMode === 'edit' && editingCategory && c.id === editingCategory.id) return false
      return (c.name || '').trim().toLowerCase() === needle
    })
    return exists ? 'Category name already exists' : null
  }

  const toTitleCase = (s) => (s || '').trim().replace(/\s+/g, ' ').split(' ').map(w => w ? (w[0].toUpperCase() + w.slice(1).toLowerCase()) : '').join(' ')

  const doSaveCategory = async (name) => {
    if (modalMode === 'create') {
      // Create then refresh one detail
      const created = await categoriesApi.create(name)
      const cat = created?.data?.category
      // Update list
      const newCategories = [...categories, { id: cat.id, name: cat.name, packageCount: 0 }]
      setCategories(newCategories)
      // Fetch detail to build items
      try {
        const d = await categoriesApi.detail(cat.id)
        const det = d?.data?.category
        setSections(prev => [...prev, { id: det.id, name: det.name, items: mapPackagesToItems(det.packages || []) }])
      } catch {
        setSections(prev => [...prev, { id: cat.id, name: cat.name, items: [] }])
      }
      setIsModalOpen(false)
    } else {
      // Edit
      const id = editingCategory.id
      const updated = await categoriesApi.update(id, name)
      const cat = updated?.data?.category
      // Update categories list
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, name: cat.name } : c)))
      // Update section title
      setSections(prev => prev.map(s => (s.id === id ? { ...s, name: cat.name } : s)))
      setIsModalOpen(false)
    }
  }

  const handleSaveCategory = async (name) => {
    const titled = toTitleCase(name)
    setPendingName(titled)
    setConfirmSaveOpen(true)
  }

  const onManage = (item) => {
    // Placeholder: navigate to create/edit questions for a package
    navigate(`/tutor/manage-questions/${encodeURIComponent(item?.id)}/create`)
  }

  const onViewAll = (categoryId) => {
    navigate(`/tutor/manage-questions/${encodeURIComponent(categoryId)}`)
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load questions"
          message={error}
          onRetry={() => fetchAll()}
        />
      </DashboardLayout>
    )
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading questions...'}
          minHeight="min-h-[calc(100vh-100px)]"
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
      <SurfaceCard className="w-full mb-10 overflow-x-auto pb-10">
        {/* Page Title */}
        <h1 className="text-center text-2xl font-semibold text-gray-700 underline">Manage Questions</h1>

        <div className="flex items-center justify-end mt-6">
          <button
            type="button"
            onClick={openAddModal}
            className={[classes.button.base, classes.button.outline, 'px-3 py-2 inline-flex items-center gap-2'].join(' ')}
            aria-label="Add Category"
          >
            <BsPlusCircle className="w-5 h-5" aria-hidden="true" />
            <span>Add Category</span>
          </button>
        </div>

        <div className="space-y-6 mt-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading categories…</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : sections.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No categories yet</div>
          ) : (
            sections.map((sec) => (
              <QuestionSection
                key={sec.id}
                title={sec.name}
                items={sec.items}
                onManage={onManage}
                onViewAll={() => onViewAll(sec.id)}
                onEdit={() => openEditModal({ id: sec.id, name: sec.name })}
              />
            ))
          )}
        </div>
      </SurfaceCard>

      {/* Category Name Modal */}
      <CategoryNameModal
        isOpen={isModalOpen}
        initialName={modalMode === 'edit' ? (editingCategory?.name || '') : ''}
        title={modalMode === 'edit' ? 'Rename Category' : 'Add Category'}
        confirmText="Save"
        onCancel={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        validateUnique={validateUnique}
      />

      <ConfirmDialog
        isOpen={confirmSaveOpen}
        onClose={() => { setConfirmSaveOpen(false); setPendingName(''); setIsModalOpen(false) }}
        onConfirm={async () => { setConfirmSaveOpen(false); await doSaveCategory(pendingName); setPendingName('') }}
        title={modalMode === 'edit' ? 'Confirm Rename' : 'Confirm Save'}
        message={modalMode === 'edit' ? `Rename category to "${pendingName}"?` : `Save new category "${pendingName}"?`}
        type="warning"
        confirmText="Save"
        cancelText="Cancel"
      />
    </DashboardLayout>
  )
}

export default TutorManageQuestions