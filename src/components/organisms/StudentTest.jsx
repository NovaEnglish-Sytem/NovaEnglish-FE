import React from 'react'
import { Link } from 'react-router-dom'
import { PiPencilRulerDuotone } from 'react-icons/pi'
import { HiArrowRight } from 'react-icons/hi2'
import ShieldSvg from '../../assets/Shield.svg'
import { Button } from '../atoms/Button.jsx'
import { classes } from '../../config/theme/tokens.js'

export const StudentTest = ({
  sections = [
    { id: 1, title: 'Listening', score: '-' },
    { id: 2, title: 'Reading', score: '-' },
    { id: 3, title: 'Use of English', score: '-' },
  ],
  progress = 0,
  onStartAll = () => {},
  onStart = (_id) => {},
  testRecordTo = '#',
  retakeMode = false,
  allComplete = false,
  className = '',
}) => {
  const GREEN = '#76c043'
  const GREEN_DARK = '#4da32f'
  const isScrollable = Array.isArray(sections) && sections.length > 3

  const hasSections = Array.isArray(sections) && sections.length > 0
  const isRetakeContext = retakeMode || allComplete
  const hasNewCategory = Array.isArray(sections) && sections.some(sec => sec.hasHistory === false)
  const showRetakeAll = isRetakeContext && !hasNewCategory

  return (
    <section
      aria-label="Take Your Test"
      className={[
        'w-full max-w-[1310px] mx-auto',
        classes.surfaceCard,
        'p-5',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiPencilRulerDuotone className="w-7 h-7 text-gray-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-gray-600">Take Your Test</h2>
        </div>

        <Link
          to={testRecordTo}
          className="hidden md:flex items-center gap-2 text-gray-500 underline hover:text-gray-700"
        >
          <span>Test Record</span>
          <HiArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
      </header>

      {/* Inner card */}
      <div className={[classes.whiteCard, 'p-6'].join(' ')}>

        {/* Section title */}
        <h3 className="text-lg font-medium text-gray-600 mb-6 lg:mb-15 text-center md:text-left">Select Category</h3>

        {/* Test cards */}
        {hasSections ? (
          <div 
            className={[
              isScrollable 
                ? 'grid grid-cols-1 gap-6 max-h-[650px] overflow-y-auto md:max-h-none md:overflow-y-visible md:flex md:flex-row md:flex-nowrap md:overflow-x-auto md:gap-6 md:pb-4 md:pr-1 scroll-smooth' 
                : 'grid grid-cols-1 md:grid-cols-3 gap-6'
            ].join(' ')}
          >
            {sections.map((sec) => (
              <article 
                key={sec.id} 
                className={[
                  'rounded-[20px] border-2 py-6 px-4 transition-all',
                  (!allComplete && sec.completed) 
                    ? 'border-[#007a33]/30 bg-white/80' 
                    : 'border-gray-400/70 bg-[#f8f8f8]',
                  isScrollable ? 'md:flex-shrink-0 md:min-w-[300px] md:max-w-[300px]' : ''
                ].join(' ')}
              >
                <div className="text-center">
                  <div 
                    className="text-[18px] font-medium" 
                    style={{ color: GREEN_DARK }}
                  >
                    {sec.title}
                  </div>
                  {/* Score display removed per spec */}

                  <div className="mt-5">
                    {(!allComplete && sec.completed) ? (
                      <div className="flex items-center justify-center gap-2" style={{ color: '#007a33' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#007a33' }}>
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold">Completed</span>
                      </div>
                    ) : (
                      (() => {
                        const showRetake = isRetakeContext && !!sec.hasHistory
                        return (
                          <Button 
                            size="sm" 
                            variant={showRetake ? 'outline' : 'primary'}
                            onClick={() => (sec.onStart ? sec.onStart(sec.id) : onStart(sec.id))} 
                            className='w-[120px]'
                          >
                            {showRetake ? 'Retake' : 'Start'}
                          </Button>
                        )
                      })()
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-gray-600">
            No tests available yet.
          </div>
        )}

        {/* Start All + Progress */}
        {hasSections ? (
          <div className="mt-8 flex justify-end">
            <div className="flex flex-col md:flex-row items-end md:items-center gap-5 md:gap-8">
              {/* Progress Block (left) */}
              <div className="flex flex-col items-start w-full md:w-auto">
                <div className="text-xs text-gray-600 mb-2 tracking-wide">Your Progress</div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Progress bar */}
                  <div className="relative w-full md:w-[280px]">
                    {/* Track */}
                    <div className="h-2 rounded-full bg-gray-200 shadow-sm overflow-hidden" aria-label="Progress bar">
                      {/* Fill */}
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, Number(progress) || 0))}%`,
                          background: `linear-gradient(90deg, ${GREEN} 0%, #5fb834 60%, #2e7d20 100%)`,
                          transition: 'width 600ms ease-out',
                        }}
                      />
                    </div>
                  </div>
                  {/* Percent label on the right */}
                  <span className="text-sm font-medium text-gray-700 select-none whitespace-nowrap">
                    {`${Math.max(0, Math.min(100, Number(progress) || 0))}%`}
                  </span>
                </div>
              </div>

              {/* Button (right) */}
              <div className="flex items-center">
                <Button 
                  size="md" 
                  variant={showRetakeAll ? 'outline' : 'primary'}
                  onClick={onStartAll}
                >
                  {showRetakeAll ? 'Retake All' : 'Start All'}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

      </div>

      {/* Mobile: Test Record below test card (outside inner card) */}
      <div className="mt-4 md:hidden flex justify-center">
        <Link to={testRecordTo} className="flex items-center gap-2 text-gray-500 underline hover:text-gray-700">
          <span>Test Record</span>
          <HiArrowRight className="w-5 h-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export default StudentTest