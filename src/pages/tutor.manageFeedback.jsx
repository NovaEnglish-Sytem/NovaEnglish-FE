import DashboardLayout from '../layouts/DashboardLayout.jsx'
import TutorHeaderRight from '../components/organisms/TutorHeaderRight.jsx'
import { buildTutorSidebar } from '../config/nav/tutor.js'
import { ROUTES } from '../config/routes.js'
import { classes } from '../config/theme/tokens.js'
import { useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { Button } from '../components/atoms/Button.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { api } from '../lib/api.js'
import ConfirmDialog from '../components/molecules/ConfirmDialog.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

export const ManageFeedback = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  // State for levels
  const [levels, setLevels] = useState([])
  const [originalLevels, setOriginalLevels] = useState([])
  const [isEditingLevels, setIsEditingLevels] = useState(false)
  const [deletedLevels, setDeletedLevels] = useState([])
  const [renamedLevels, setRenamedLevels] = useState({})

  // State for feedback templates
  const [templates, setTemplates] = useState([])
  const [originalTemplates, setOriginalTemplates] = useState([])
  const [isEditingTemplates, setIsEditingTemplates] = useState(false)

  // Loading & error states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null) // generic/network failure banner (top)
  const [levelError, setLevelError] = useState(null) // inline banner for Level section
  const [templateError, setTemplateError] = useState(null) // inline banner for Feedback section
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'levels', // 'levels', 'templates', 'deleteLevel', or 'deleteTemplate'
    title: '',
    message: '',
    levelToDelete: null,
    indexToDelete: null,
    templateToDelete: null
  })

  const showInitialLoading = useDelayedSpinner(loading, 700)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      /* no-op */
    } finally {
      navigate(ROUTES.login, { replace: true })
    }
  }

  const navigationItems = buildTutorSidebar('MANAGE FEEDBACK', {
    'DASHBOARD': () => navigate(ROUTES.tutorDashboard),
    'STUDENT PROGRESS': () => navigate(ROUTES.tutorStudentProgress),
    'MANAGE QUESTIONS': () => navigate(ROUTES.tutorManageQuestions),
    'MANAGE FEEDBACK': () => navigate(ROUTES.tutorManageFeedback),
    'MANAGE USERS': () => navigate(ROUTES.adminManageUsers),
    'ACCOUNT SETTINGS': () => navigate(ROUTES.accountSettings),
  }, user?.role)

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [levelsRes, templatesRes] = await Promise.all([
        api.get('/api/tutor/feedback/levels'),
        api.get('/api/tutor/feedback/templates')
      ])

      if (levelsRes?.data?.ok) {
        setLevels(levelsRes.data.data.levels)
        setOriginalLevels(levelsRes.data.data.levels)
      }

      if (templatesRes?.data?.ok) {
        setTemplates(templatesRes.data.data.templates)
        setOriginalTemplates(templatesRes.data.data.templates)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Level handlers
  const handleLevelChange = (index, field, value) => {
    setLevels(prev => prev.map((level, i) => {
      if (i === index) {
        // Track renamed levels
        if (field === 'level' && level.id) {
          const oldName = originalLevels.find(ol => ol.id === level.id)?.level
          if (oldName && oldName !== value) {
            setRenamedLevels(prevRenamed => ({
              ...prevRenamed,
              [oldName]: value
            }))
          }
        }
        return { ...level, [field]: value }
      }
      return level
    }))
  }

  const handleAddLevel = () => {
    const newLevel = {
      level: '',
      minScore: 0,
      maxScore: 100,
      order: levels.length + 1
    }
    setLevels([...levels, newLevel])
  }

  const handleRemoveLevel = (index) => {
    const levelToRemove = levels[index]
    
    // Check if this level is used in feedback templates
    const templatesUsingLevel = templates.filter(t => t.level === levelToRemove.level)
    
    if (templatesUsingLevel.length > 0 && levelToRemove.id) {
      // Show warning modal
      setConfirmDialog({
        isOpen: true,
        type: 'deleteLevel',
        title: 'Delete Band Score?',
        message: `Deleting band score "${levelToRemove.level}" will permanently remove this level and ${templatesUsingLevel.length} associated feedback template(s). This action cannot be undone.\n\nDo you want to proceed?`,
        levelToDelete: levelToRemove,
        indexToDelete: index
      })
    } else {
      // Directly remove if no templates or new level (no id)
      if (levelToRemove.id) {
        setDeletedLevels(prev => [...prev, levelToRemove.level])
      }
      setLevels(prev => prev.filter((_, i) => i !== index))
    }
  }
  
  const confirmDeleteLevel = () => {
    const { levelToDelete, indexToDelete } = confirmDialog
    
    if (levelToDelete && indexToDelete !== null) {
      // Track deleted level
      if (levelToDelete.id) {
        setDeletedLevels(prev => [...prev, levelToDelete.level])
      }
      
      // Remove level
      setLevels(prev => prev.filter((_, i) => i !== indexToDelete))
      
      // Remove associated templates
      setTemplates(prev => prev.filter(t => t.level !== levelToDelete.level))
    }
    
    setConfirmDialog({ ...confirmDialog, isOpen: false, levelToDelete: null, indexToDelete: null })
  }

  const handleCancelLevels = () => {
    setLevels(originalLevels)
    setDeletedLevels([])
    setRenamedLevels({})
    setIsEditingLevels(false)
    setLevelError(null)
    setError(null)
  }

  const handleSaveLevels = () => {
    // Client-side validation
    setLevelError(null)

    // Check for empty level names
    const emptyLevels = levels.filter(l => !l.level || !l.level.trim())
    if (emptyLevels.length > 0) {
      setLevelError('Level name cannot be empty')
      return
    }

    // Check required fields: min, max
    const invalidForms = levels.filter(l => {
      const minOk = Number.isFinite(parseInt(l.minScore))
      const maxOk = Number.isFinite(parseInt(l.maxScore))
      return !(minOk && maxOk)
    })
    if (invalidForms.length > 0) {
      setLevelError('All fields are required. Please fill in Level, and Score Range (Min/Max).')
      return
    }

    // Check for duplicate level names (case-insensitive)
    const levelNames = levels.map(l => (l.level || '').trim().toUpperCase())
    const duplicates = levelNames.filter((name, index) => levelNames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      setLevelError(`Duplicate level names found: ${[...new Set(duplicates)].join(', ')}`)
      return
    }

    // Check for invalid ranges per row
    for (const level of levels) {
      const min = parseInt(level.minScore)
      const max = parseInt(level.maxScore)
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        setLevelError(`Level "${level.level}": Score range must be numeric`)
        return
      }
      if (min >= max) {
        setLevelError(`Level "${level.level}": minScore must be less than maxScore`)
        return
      }
    }

    // Enforce ascending and gap rule: next.min >= prev.max + 1
    const sortedLevels = [...levels].sort((a, b) => parseInt(a.minScore) - parseInt(b.minScore))
    for (let i = 0; i < sortedLevels.length - 1; i++) {
      const current = sortedLevels[i]
      const next = sortedLevels[i + 1]
      const currentMax = parseInt(current.maxScore)
      const nextMin = parseInt(next.minScore)
      if (nextMin < currentMax + 1) {
        setLevelError(`Invalid ranges: "${next.level}" must start at least from ${currentMax + 1} (previous max is ${currentMax}).`)
        return
      }
    }

    // Open confirm dialog
    setConfirmDialog({
      isOpen: true,
      type: 'levels',
      title: 'Save Level Changes?',
      message: 'Are you sure you want to save these changes to the level ranges?'
    })
  }

  // Template handlers
  const handleTemplateChange = (index, field, value) => {
    setTemplates(prev => prev.map((template, i) => 
      i === index ? { ...template, [field]: value } : template
    ))
  }

  const handleAddTemplate = () => {
    // Use first level from LevelRange as default
    const defaultLevel = levels.length > 0 ? levels[0].level : 'A1'
    const newTemplate = {
      level: defaultLevel,
      text: '',
      order: templates.length + 1
    }
    setTemplates([...templates, newTemplate])
  }

  const handleRemoveTemplate = (index) => {
    const templateToRemove = templates[index]
    
    setConfirmDialog({
      isOpen: true,
      type: 'deleteTemplate',
      title: 'Delete Feedback Template?',
      message: `Are you sure you want to delete this feedback template for band score "${templateToRemove.level}"? This action cannot be undone.`,
      templateToDelete: templateToRemove,
      indexToDelete: index
    })
  }
  
  const confirmDeleteTemplate = () => {
    const { indexToDelete } = confirmDialog
    
    if (indexToDelete !== null) {
      setTemplates(prev => prev.filter((_, i) => i !== indexToDelete))
    }
    
    setConfirmDialog({ ...confirmDialog, isOpen: false, templateToDelete: null, indexToDelete: null })
  }

  // Check for duplicate levels in templates
  const getDuplicateLevels = () => {
    const levelCounts = {}
    templates.forEach(template => {
      levelCounts[template.level] = (levelCounts[template.level] || 0) + 1
    })
    return Object.keys(levelCounts).filter(level => levelCounts[level] > 1)
  }

  const duplicateLevels = isEditingTemplates ? getDuplicateLevels() : []
  const hasDuplicates = duplicateLevels.length > 0

  // Levels that do not have a feedback template yet
  const missingFeedbackLevels = React.useMemo(() => {
    const levelSet = new Set(levels.map(l => l.level))
    const templSet = new Set(templates.map(t => t.level))
    return Array.from(levelSet).filter(lvl => !templSet.has(lvl))
  }, [levels, templates])

  const handleCancelTemplates = () => {
    setTemplates(originalTemplates)
    setIsEditingTemplates(false)
    setTemplateError(null)
    setError(null)
  }

  const handleSaveTemplates = () => {
    // Inline validation for Feedback section
    setTemplateError(null)

    // Check for duplicates before saving
    if (hasDuplicates) {
      setTemplateError(`Duplicate levels found: ${duplicateLevels.join(', ')}. Each level must be unique.`)
      return
    }

    // Check for empty fields
    const hasEmpty = templates.some(t => !t.level || !t.text || !t.text.trim())
    if (hasEmpty) {
      setTemplateError('All feedback templates must have a level and text.')
      return
    }

    setConfirmDialog({
      isOpen: true,
      type: 'templates',
      title: 'Save Feedback Changes?',
      message: 'Are you sure you want to save these changes to the feedback templates?'
    })
  }

  // Confirm save
  const handleConfirmSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      if (confirmDialog.type === 'deleteLevel') {
        // Handle delete level confirmation
        confirmDeleteLevel()
        setSaving(false)
        return
      }
      
      if (confirmDialog.type === 'deleteTemplate') {
        // Handle delete template confirmation
        confirmDeleteTemplate()
        setSaving(false)
        return
      }
      
      if (confirmDialog.type === 'levels') {
        const res = await api.put('/api/tutor/feedback/levels', { 
          levels,
          deletedLevels,
          renamedLevels
        })
        
        if (res?.data?.ok) {
          setOriginalLevels(res.data.data.levels)
          setLevels(res.data.data.levels)
          setDeletedLevels([])
          setRenamedLevels({})
          setIsEditingLevels(false)
          
          // Refresh templates to reflect renamed/deleted levels
          const templatesRes = await api.get('/api/tutor/feedback/templates')
          if (templatesRes?.data?.ok) {
            setTemplates(templatesRes.data.data.templates)
            setOriginalTemplates(templatesRes.data.data.templates)
          }
        } else if (res?.data?.error) {
          setError(res.data.error)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
          return
        }
      } else if (confirmDialog.type === 'templates') {
        const res = await api.put('/api/tutor/feedback/templates', { templates })
        if (res?.data?.ok) {
          setOriginalTemplates(res.data.data.templates)
          setTemplates(res.data.data.templates)
          setIsEditingTemplates(false)
        } else if (res?.data?.error) {
          setError(res.data.error)
          setConfirmDialog({ ...confirmDialog, isOpen: false })
          return
        }
      }
      
      setConfirmDialog({ ...confirmDialog, isOpen: false })
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to save changes')
      setConfirmDialog({ ...confirmDialog, isOpen: false })
    } finally {
      setSaving(false)
    }
  }

  // Error state (critical)
  if (error && loading) {
    return (
      <DashboardLayout
        rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
        sidebarItems={navigationItems}
        onLogout={handleLogout}
      >
        <ErrorState
          title="Failed to load feedback data"
          message={error}
          onRetry={() => fetchData()}
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
        <LoadingState message="Loading feedback data..." minHeight="min-h-[calc(100vh-100px)]" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      rightHeaderSlot={<TutorHeaderRight items={navigationItems} onLogout={handleLogout} />}
      sidebarItems={navigationItems}
      onLogout={handleLogout}
    >
      {error && (
        <div className="w-full max-w-[900px] mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Student Band Score Section */}
      <section className="w-full max-w-[900px] mx-auto">
        <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
          <h3 className="text-xl font-medium text-gray-600">Student Band Score</h3>
          <div className="my-4 border-t border-gray-300" />

          {!isEditingLevels ? (
            // Table View
            <div className="overflow-x-auto max-w-sm mx-auto">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr className="bg-white">
                    <th className="px-3 sm:px-4 py-3 text-gray-600 font-semibold border border-gray-200 whitespace-nowrap">Band Score</th>
                    <th className="px-3 sm:px-4 py-3 text-gray-600 font-semibold border border-gray-200 whitespace-nowrap">Range</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((level, idx) => (
                    <tr key={level.id || idx} className={idx % 2 === 1 ? 'bg-white/60' : 'bg-white'}>
                      <td className={["px-3 sm:px-4 py-3 border border-gray-200 font-semibold whitespace-nowrap", classes.textSuccess].join(' ')}>
                        {level.level}
                      </td>
                      <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-700 whitespace-nowrap">
                        {level.minScore} - {level.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // Form View (Edit Mode)
            <div className="space-y-4 max-w-2xl mx-auto">
              {levels.map((level, idx) => (
                <div key={idx} className="p-4 border border-gray-300 rounded-lg bg-white relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveLevel(idx)}
                    className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Delete band score"
                    title="Delete this band score"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Band</label>
                      <input
                        type="text"
                        value={level.level}
                        onChange={(e) => handleLevelChange(idx, 'level', e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g., A1, B2, C1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={level.minScore}
                          onChange={(e) => handleLevelChange(idx, 'minScore', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Min"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="number"
                          value={level.maxScore}
                          onChange={(e) => handleLevelChange(idx, 'maxScore', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddLevel}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Add Level</span>
              </button>
            </div>
          )}

          {/* Edit actions */}
          {isAdmin && (
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5 sm:justify-end">
              {!isEditingLevels ? (
                <Button onClick={() => setIsEditingLevels(true)} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                  EDIT
                </Button>
              ) : (
                <>
                  {levelError && (
                    <div className="w-full sm:w-auto sm:flex-1 mb-2 sm:mb-0 sm:mr-auto p-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs">
                      {levelError}
                    </div>
                  )}
                  <Button variant="outline" onClick={handleCancelLevels} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                    CANCEL
                  </Button>
                  <Button onClick={handleSaveLevels} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                    SAVE CHANGE
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Feedback Section */}
      <section className="w-full max-w-[900px] mx-auto mt-5 mb-20">
        <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
          <h3 className="text-xl font-medium text-gray-600">Feedback</h3>
          <div className="my-4 border-t border-gray-300" />
          {/* Always-visible notice so Tutor can see gaps without entering edit mode */}
          {missingFeedbackLevels.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <strong>Heads up:</strong> Some levels do not have feedback yet:
              <span className="font-semibold"> {missingFeedbackLevels.join(', ')}</span>. Please add feedback for these levels.
            </div>
          )}

          {/* Duplicate warning */}
          {isEditingTemplates && hasDuplicates && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <strong>Warning:</strong> Duplicate levels detected: {duplicateLevels.join(', ')}. Each level must be unique.
            </div>
          )}

          {/* Feedback rows */}
          <div className="space-y-4">
            {templates.map((template, idx) => {
              const isDuplicate = isEditingTemplates && duplicateLevels.includes(template.level)
              
              return (
                <div 
                  key={template.id || idx} 
                  className={[
                    'rounded-xl border relative',
                    isEditingTemplates 
                      ? isDuplicate 
                        ? 'bg-white border-red-400 shadow-sm' 
                        : 'bg-white border-[#76c043] shadow-sm'
                      : 'bg-white border-gray-300'
                  ].join(' ')}
                >
                  {isEditingTemplates && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTemplate(idx)}
                      className="absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors z-10"
                      aria-label="Delete feedback"
                      title="Delete this feedback template"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start">
                    {/* Level selector/badge */}
                    <div className="flex items-center min-w-[80px]">
                      {isEditingTemplates ? (
                        <select
                          value={template.level}
                          onChange={(e) => handleTemplateChange(idx, 'level', e.target.value)}
                          className={[
                            'px-3 py-2 border rounded-md font-semibold',
                            isDuplicate ? 'border-red-400 text-red-600' : 'border-gray-300 text-[#76c043]'
                          ].join(' ')}
                        >
                          {levels.map(level => (
                            <option key={level.id} value={level.level}>
                              {level.level}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={[classes.textSuccess, 'text-lg font-semibold'].join(' ')}>
                          {template.level}
                        </span>
                      )}
                    </div>
                    
                    {/* Feedback text (editable) */}
                    <div className="w-full">
                      <textarea
                        value={template.text}
                        onChange={(e) => handleTemplateChange(idx, 'text', e.target.value)}
                        disabled={!isEditingTemplates}
                        className={[
                          'w-full min-h-[150px] rounded-[5px] px-3 py-2 text-sm sm:text-base leading-relaxed border',
                          !isEditingTemplates 
                            ? 'bg-white text-gray-700 border-gray-300 cursor-default' 
                            : isDuplicate
                              ? 'bg-white text-gray-700 border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-400'
                              : 'bg-white text-gray-700 border-gray-300 focus:border-[#76c043] focus:ring-1 focus:ring-[#76c043]'
                        ].join(' ')}
                        placeholder={isEditingTemplates ? 'Enter feedback text...' : ''}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add template button */}
          {isEditingTemplates && (
            <button
              type="button"
              onClick={handleAddTemplate}
              className="w-full py-3 mt-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Feedback Template</span>
            </button>
          )}

          {/* Edit actions */}
          {isAdmin && (
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5 sm:justify-end">
              {!isEditingTemplates ? (
                <Button onClick={() => setIsEditingTemplates(true)} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                  EDIT
                </Button>
              ) : (
                <>
                  {/* Warning placed above Cancel/Save buttons (Feedback section) */}
                  <div className="w-full sm:w-auto sm:flex-1 sm:mr-auto space-y-2 mb-2 sm:mb-0">
                    {missingFeedbackLevels.length > 0 && (
                      <div className="p-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs">
                        <strong>Note:</strong> Some levels have no feedback:
                        <span className="font-semibold"> {missingFeedbackLevels.join(', ')}</span>. Please add feedback.
                      </div>
                    )}
                    {templateError && (
                      <div className="p-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs">
                        {templateError}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" onClick={handleCancelTemplates} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                    CANCEL
                  </Button>
                  <Button onClick={handleSaveTemplates} className="h-[31px] text-xs px-4 w-full sm:w-auto">
                    SAVE CHANGE
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false, levelToDelete: null, indexToDelete: null })}
        onConfirm={handleConfirmSave}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type === 'deleteLevel' ? 'warning' : 'info'}
        confirmText={confirmDialog.type === 'deleteLevel' ? 'Delete' : 'Save'}
        isLoading={saving}
      />
    </DashboardLayout>
  )
}

export default ManageFeedback
