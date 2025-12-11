import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '../atoms/Button.jsx'
import TestCategoryCard from '../molecules/TestCategoryCard.jsx'
import { classes } from '../../config/theme/tokens.js'

export default function TestOverviewPanel({
  sections = [],
  countdownStart = 20,
  onExit = () => {},
  onStart = () => {},
  countdownRef,
  checkpoint = false,
  className = '',
  pauseCountdown = false,
}) {
  // normalize sections to numbers
  const normalized = useMemo(
    () =>
      (sections || []).map((s) => ({
        title: s.title,
        questions: typeof s.questions === 'string' ? parseInt(String(s.questions).replace(/\D+/g, '') || '0', 10) : (s.questions ?? 0),
        minutes: typeof s.minutes === 'string' ? parseInt(String(s.minutes).replace(/\D+/g, '') || '0', 10) : (s.minutes ?? 0),
        completed: s.completed || false,
        unavailable: s.unavailable || false,
      })),
    [sections]
  )

  const total = useMemo(() => {
    // In checkpoint mode, only count remaining (not completed and not unavailable) categories
    const relevantSections = checkpoint
      ? normalized.filter((s) => !s.completed && !s.unavailable)
      : normalized.filter((s) => !s.unavailable)
    const tq = relevantSections.reduce((acc, s) => acc + (Number.isFinite(s.questions) ? s.questions : 0), 0)
    const tm = relevantSections.reduce((acc, s) => acc + (Number.isFinite(s.minutes) ? s.minutes : 0), 0)
    return { questions: tq, minutes: tm }
  }, [normalized, checkpoint])

  const [countdown, setCountdown] = useState(
    Number.isFinite(countdownStart) && countdownStart >= 0 ? countdownStart : 20
  )

  useEffect(() => {
    if (pauseCountdown) return
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Countdown reached 0, auto-start test
          clearInterval(id)
          onStart()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    // Store interval ID in ref for cleanup from parent
    if (countdownRef) {
      countdownRef.current = id
    }
    
    return () => clearInterval(id)
  }, [pauseCountdown])

  const isScrollable = normalized.length > 3

  return (
    <div className={['w-full', classes.surfaceCard, 'max-w-[640px] p-6 md:p-8', className].filter(Boolean).join(' ')}>
      <h2 className="text-center text-2xl font-semibold text-gray-700">Test Overview</h2>

      {/* Categories */}
      <div className="mt-6">
        {/* Mobile/Tablet: center all */}
        <div
          className={[
            'md:hidden grid grid-cols-1 place-items-center gap-3',
            isScrollable ? 'max-h-[320px] overflow-y-auto tutor-scroll scroll-smooth' : '',
          ].filter(Boolean).join(' ')}
        >
          {normalized.map((s, idx) => (
            <TestCategoryCard 
              key={idx} 
              title={s.title} 
              questions={s.questions} 
              minutes={s.minutes}
              completed={s.completed}
              unavailable={s.unavailable}
              checkpoint={checkpoint}
            />
          ))}
        </div>

        {/* Desktop: overflow-x if > 3, else centered row */}
        <div className={isScrollable ? 'hidden md:flex md:flex-row md:flex-nowrap md:gap-4 md:overflow-x-auto md:pb-2 md:pr-1 tutor-scroll scroll-smooth' : 'hidden md:flex md:justify-center md:gap-6'}>
          {normalized.map((s, idx) => (
            <div key={idx} className={isScrollable ? 'md:min-w-[180px]' : ''}>
              <TestCategoryCard 
                title={s.title} 
                questions={s.questions} 
                minutes={s.minutes}
                completed={s.completed}
                unavailable={s.unavailable}
                checkpoint={checkpoint}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mt-6 text-center text-gray-600">
        <span>Total: {total.questions} Questions - {total.minutes} Minutes</span>
        {checkpoint && <span className="text-red-500 ml-1">(left)</span>}
      </div>

      {/* Countdown */}
      <div className="mt-3 text-center text-[#ff5722]" role="timer" aria-live="polite">
        Starting in {countdown}s...
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-center sm:justify-between gap-6 sm:gap-0 mx-0 sm:mx-30">
        <Button variant="outline" onClick={onExit} aria-label="Exit test">
          EXIT
        </Button>
        <Button onClick={onStart} aria-label="Start test">
          START
        </Button>
      </div>
    </div>
  )
}
