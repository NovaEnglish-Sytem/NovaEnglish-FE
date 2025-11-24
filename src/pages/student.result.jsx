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

export const ResultPage = () => {
  const navigate = useNavigate()
  const { attemptId } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ attempt: null, categories: [], level: null, avgScore: 0, feedback: null, levels: [], recordInfo: null })
  
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
        
        // Check if attempt data exists and is completed
        if (!res.data || !res.data.completedAt) {
          // Attempt not completed or invalid - redirect to dashboard
          navigate(ROUTES.studentDashboard, { replace: true })
          return
        }
        
        setData(res.data || {})
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

  useEffect(() => {
    const handlePopState = () => {
      // When back is pressed, immediately go to test record list
      navigate(ROUTES.studentTestRecord, { replace: true })
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  const recordAvg = Number(data?.recordInfo?.averageScore)
  const score = Number.isFinite(recordAvg) && recordAvg > 0 ? Math.round(recordAvg) : Math.round(Number(data?.totalScore) || 0)
  const levelRows = (Array.isArray(data?.levels) ? data.levels : []).map(r => ({ level: r.band, range: `${r.minScore} - ${r.maxScore}` }))
  const practiceLevel = data?.bandScore || '-'
  const practiceStatus = '' // Band score doesn't have status
  const feedbackText = data?.feedback || ''
  const recordInfo = data?.recordInfo || null
  const isRecordComplete = recordInfo?.isComplete || false
  const categoriesComplete = recordInfo?.categoriesComplete || 0
  const categoriesTotal = recordInfo?.categoriesTotal || 0

  const fillPct = (val) => `${Math.max(0, Math.min(100, Math.round(val)))}%`

  if (loading) {
    return (
      <div className="bg-neutral-100 min-h-screen">
        <Header logoTo={ROUTES.studentDashboard} />
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
        <Header logoTo={ROUTES.studentDashboard} />
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
    <div className="bg-neutral-100 min-h-screen overflow-x-auto">
      <Header logoTo={ROUTES.studentDashboard} />

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
                <div className="text-gray-500 text-lg sm:text-xl">Your Practice Level :</div>
                <div className="flex items-end gap-2">
                  <div className="text-[32px] md:text-[50px] font-medium text-gray-500 leading-none">{practiceLevel}</div>
                  <div className="text-[20px] md:text-[25px] font-medium text-[#4da32f] leading-none pb-1">{practiceStatus ? `.${practiceStatus}` : ''}</div>
                </div>
              </div>
              
              {recordInfo && !isRecordComplete && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 text-center">
                    You have completed <span className="font-semibold">{categoriesComplete} of {categoriesTotal}</span> categories. Complete all categories to see your overall band score.
                  </p>
                </div>
              )}
              
              {recordInfo && isRecordComplete && recordInfo.overallBandScore && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800 text-center">
                    Overall Band Score: <span className="font-bold text-lg">{recordInfo.overallBandScore}</span>
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="w-full max-w-[900px] mx-auto mt-10">
            <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
              <h3 className="text-xl font-medium text-gray-600">
                Feedback from <span className={[classes.textSuccess].join(' ')}>Nova English</span>
              </h3>
              <div className="my-4 border-t border-gray-300" />
              <p className="text-gray-500 text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                {feedbackText || 'No feedback available.'}
              </p>
            </div>
          </section>

          <section className="w-full max-w-[900px] mx-auto mt-10">
            <div className={[classes.surfaceCard, 'p-6'].join(' ')}>
              <h3 className="text-xl font-medium text-gray-600">Score Level Details</h3>
              <div className="my-4 border-t border-gray-300" />

              <div className="overflow-x-auto max-w-sm mx-auto">
                <table className="w-full border-collapse text-center ">
                  <thead>
                    <tr className="bg-white">
                      <th className="px-3 sm:px-4 py-3 text-gray-600 font-semibold border border-gray-200 whitespace-nowrap">Level</th>
                      <th className="px-3 sm:px-4 py-3 text-gray-600 font-semibold border border-gray-200 whitespace-nowrap">Score Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelRows.map((r, idx) => (
                      <tr key={r.level} className={idx % 2 === 1 ? 'bg-white/60' : 'bg-white'}>
                        <td className={["px-3 sm:px-4 py-3 border border-gray-200 font-semibold whitespace-nowrap", classes.textSuccess].join(' ')}>{r.level}</td>
                        <td className="px-3 sm:px-4 py-3 border border-gray-200 text-gray-700 whitespace-nowrap">{r.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="w-full flex justify-center my-10">
            <Button variant="primary" size="md" className="w-full sm:w-[196px]" onClick={() => navigate(ROUTES.studentTestRecord, { replace: true, state: { fromResult: true } })}>
              CLOSE
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPage