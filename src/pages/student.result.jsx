import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/organisms/Header.jsx'
import { Button } from '../components/atoms/Button.jsx'
import LoadingState from '../components/organisms/LoadingState.jsx'
import ErrorState from '../components/organisms/ErrorState.jsx'
import { useDelayedSpinner } from '../hooks/useDelayedSpinner.js'
import ShieldSvg from '../assets/Shield.svg'
import { classes } from '../config/theme/tokens.js'
import { studentApi } from '../lib/api.js'
import { ROUTES } from '../config/routes.js'
import { useRouteGuard, isValidUUID } from '../hooks/useRouteGuard.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { ConfirmDialog } from '../components/molecules/ConfirmDialog.jsx'

export const ResultPage = () => {
  const navigate = useNavigate()
  const { attemptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ feedback: null, recordInfo: null })
  const [feedbackDraft, setFeedbackDraft] = useState('')
  const [savingFeedback, setSavingFeedback] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isEditingFeedback, setIsEditingFeedback] = useState(false)
  const [showConfirmSave, setShowConfirmSave] = useState(false)
  const { user } = useAuth()

  const role = String(user?.role || '').toUpperCase()
  const isStudent = role === 'STUDENT'
  const isTutorOrAdmin = role === 'TUTOR' || role === 'ADMIN'
  const homeRoute = (role === 'TUTOR' || role === 'ADMIN') ? ROUTES.tutorDashboard : ROUTES.studentDashboard

  const showInitialLoading = useDelayedSpinner(loading, 700)

  // SECURITY: Validate attemptId format
  useRouteGuard({
    paramName: 'attemptId',
    paramValue: attemptId,
    validator: isValidUUID,
    errorMessage: 'Invalid result attempt ID'
  })

  useEffect(() => {
    // Clear this specific test's localStorage (async to not block render)
    ;(async () => {
      try {
        const { TestStorage } = await import('../utils/testStorage.js')
        TestStorage.clearLocal(attemptId)
      } catch (e) {
        // Silent fail - cleanup is non-critical
      }
    })()
  }, [attemptId])

  useEffect(() => {
    if (!isStudent) return

    const handlePop = () => {
      navigate(ROUTES.studentTestRecord, { replace: true, state: { fromResult: true } })
    }

    // Push a new state so that the first browser back triggers our handler
    try {
      window.history.pushState(null, '', window.location.href)
    } catch {}

    window.addEventListener('popstate', handlePop)
    return () => {
      window.removeEventListener('popstate', handlePop)
    }
  }, [navigate, isStudent])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await studentApi.result(attemptId)

        if (!mounted) return

        // Check if API response is valid
        if (!res.ok) {
          // If 404 or attempt not found, redirect to dashboard
          if (res.status === 404 || res.error?.includes('not found')) {
            navigate(ROUTES.studentDashboard, { replace: true })
            return
          }
          // Other errors - show error message
          setError(res.error || 'Failed to load result')
          return
        }

        setData(res.data || {})
        setFeedbackDraft(res.data?.feedback || '')
      } catch (e) {

        if (!mounted) return
        // Network error or other exception - redirect to dashboard
        navigate(ROUTES.studentDashboard, { replace: true })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [attemptId, navigate])

  const recordAvg = Number(data?.recordInfo?.averageScore)
  const score = Number.isFinite(recordAvg) && recordAvg > 0 ? Math.round(recordAvg) : Math.round(Number(data?.totalScore) || 0)
  const feedbackText = data?.feedback || ''
  const recordInfo = data?.recordInfo || null
  const isRecordComplete = recordInfo?.isComplete || false
  const categoriesComplete = recordInfo?.categoriesComplete || 0
  const rawCategoriesTotal = recordInfo?.categoriesTotal || 0
  const categoriesTotal = Math.max(rawCategoriesTotal, categoriesComplete)

  const fillPct = (val) => `${Math.max(0, Math.min(100, Math.round(val)))}%`

  const handleClose = () => {
    if (isStudent) {
      navigate(ROUTES.studentTestRecord, { replace: true, state: { fromResult: true } })
    } else {
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate(ROUTES.tutorDashboard, { replace: true })
      }
    }
  }

  const handleSaveFeedback = async () => {
    if (!attemptId) return false
    try {
      setSavingFeedback(true)
      setSaveError(null)
      setSaveSuccess(false)
      const res = await studentApi.updateResultFeedback(attemptId, feedbackDraft)
      if (!res.ok) {
        setSaveError(res.error || 'Failed to save feedback')
        return false
      }
      const nextFeedback = res.data?.feedback || ''
      setData(prev => ({ ...(prev || {}), feedback: nextFeedback }))
      setFeedbackDraft(nextFeedback)
      setSaveSuccess(true)
      return true
    } catch (e) {
      setSaveError('Failed to save feedback')
      return false
    } finally {
      setSavingFeedback(false)
    }
  }

  const handleStartEdit = () => {
    setIsEditingFeedback(true)
    setFeedbackDraft(feedbackText || '')
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleCancelEdit = () => {
    setIsEditingFeedback(false)
    setFeedbackDraft(feedbackText || '')
    setSaveError(null)
    setShowConfirmSave(false)
  }

  if (loading) {
    return (
      <div className="bg-neutral-100 min-h-screen">
        <Header logoTo={homeRoute} />
        <LoadingState
          message={showInitialLoading ? 'Please wait...' : 'Loading result...'}
          fullPage
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-neutral-100 min-h-screen">
        <Header logoTo={homeRoute} />
        <ErrorState
          title="Failed to load result"
          message={error}
          onRetry={() => window.location.reload()}
          fullPage
        />
      </div>
    )
  }

  return (
    <div className="bg-neutral-100 min-h-screen">
      <Header logoTo={homeRoute} />

      <div className="grid justify-items-center [align-items:start]">
        <div className="max-w-[1440px] w-full px-4 box-border mt-14 sm:mt-16 md:mt-20 min-w-0">
          <section className="relative w-full max-w-[900px] mx-auto">
            <div className="absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 md:-top-10 w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] md:w-[107px] md:h-[107px]">
              <img src={ShieldSvg} alt="Score shield" className="w-full h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-white text-xs font-semibold">Score</span>
                <span className="text-white text-3xl font-semibold leading-none mt-1">{score}</span>
              </div>
            </div>

            <div className={[classes.surfaceCard, 'p-5 sm:pt-15 pt-16 md:pt-18'].join(' ')}>
              <div className="flex items-center justify-center mt-3">
                <h2 className="text-gray-600 text-xl font-medium">Category</h2>
              </div>
              <div className="my-4 border-t border-gray-300" />

              <div className="space-y-6">
                {(data?.recordInfo?.attempts || [])
                  .slice()
                  .sort((a, b) => String(a?.categoryName || '').localeCompare(String(b?.categoryName || ''), undefined, { sensitivity: 'base' }))
                  .map((a) => {
                    const val = Math.round(Number(a?.totalScore) || 0)
                    return (
                      <div key={a.id} className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div>
                          <div className="text-gray-500 text-base">{a.categoryName || 'Category'}</div>
                          <div className="mt-2 h-[5px] bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#76c043] rounded-full"
                              style={{ width: fillPct(val) }}
                              aria-label={`${a.categoryName || 'Category'} progress`}
                            />
                          </div>
                        </div>
                        <div className={[classes.textSuccess, 'text-base min-w-[36px] text-right'].join(' ')}>{val}</div>
                      </div>
                    )
                  })}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <div className="text-gray-500 text-sm sm:text-base text-center sm:text-left">
                  {recordInfo && categoriesTotal > 0 && (
                    <span>
                      Completed <span className="font-semibold">{categoriesComplete} of {categoriesTotal}</span> categories.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="w-full max-w-[900px] mx-auto mt-10">
            <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
              <h3 className="text-xl font-medium text-gray-600">
                Feedback from <span className={[classes.textSuccess].join(' ')}>Nova English</span>
              </h3>
              <div className="my-4 border-t border-gray-300" />
              {isTutorOrAdmin ? (
                <>
                  <textarea
                    className="w-full min-h-[160px] resize-vertical rounded-md border border-gray-300 px-3 py-2 text-gray-700 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:text-gray-500"
                    value={isEditingFeedback ? feedbackDraft : feedbackText}
                    onChange={(e) => {
                      setFeedbackDraft(e.target.value)
                      setSaveSuccess(false)
                    }}
                    placeholder="No feedback yet"
                    disabled={!isEditingFeedback}
                  />
                  {saveError && (
                    <p className="mt-2 text-sm text-red-600">{saveError}</p>
                  )}
                  {saveSuccess && !saveError && (
                    <p className="mt-2 text-sm text-green-600">Feedback saved.</p>
                  )}
                  <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3 w-full">
                    {isEditingFeedback ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full sm:w-auto sm:min-w-[90px]"
                          onClick={() => setShowConfirmSave(true)}
                          disabled={savingFeedback}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto sm:min-w-[90px]"
                          onClick={handleCancelEdit}
                          disabled={savingFeedback}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto sm:min-w-[90px]"
                        onClick={handleStartEdit}
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  <ConfirmDialog
                    isOpen={showConfirmSave}
                    onClose={() => setShowConfirmSave(false)}
                    onConfirm={async () => {
                      if (savingFeedback) return
                      const ok = await handleSaveFeedback()
                      if (ok) {
                        setIsEditingFeedback(false)
                        setShowConfirmSave(false)
                      }
                    }}
                    title="Save Feedback"
                    message="Are you sure you want to save this feedback?"
                    confirmText="Yes"
                    cancelText="Cancel"
                  />
                </>
              ) : (
                <p className="text-gray-500 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {feedbackText || 'No feedback yet'}
                </p>
              )}
            </div>
          </section>

          <div className="w-full flex justify-center my-10">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-[196px]"
              onClick={handleClose}
            >
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPage