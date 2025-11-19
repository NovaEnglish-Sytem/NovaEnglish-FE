import React, {useState} from 'react'
import { classes } from '../../config/theme/tokens.js'
import { TbReport } from 'react-icons/tb'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

export const StudentReport = ({
  bestScore = 175,
  maxScore = 200,
  bandLevel = 'A1',
  bandDesc = 'Beginner',
  className = '',
  variant = 'card',
}) => {
  const [showLabel] = useState(true);

  const GREEN = '#76c043'
  const GREEN_DARK = '#2e7d20'
  const GREY = '#E6E6E6'

  const pieData = [
    { name: 'Score', value: Math.max(0, Math.min(bestScore, maxScore)) },
    { name: 'Remainder', value: Math.max(0, maxScore - Math.max(0, Math.min(bestScore, maxScore))) },
  ]

  // Build the cards grid once
  const summaryGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Overall Average Score */}
      <article className={[classes.whiteCard, 'p-4'].join(' ')}>
        <h3 className="text-center text-xl font-medium text-gray-600 underline mb-5">Overall Average Score</h3>
        <div className="h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={85}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                isAnimationActive={false}
              >
                <Cell key="score" fill={GREEN} />
                <Cell key="remainder" fill={GREY} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span
              className={`text-lg font-bold transition-opacity duration-3000 ${showLabel ? "opacity-100" : "opacity-0"}`}
              style={{ color: GREEN_DARK }}
            >
              {pieData[0].value}
            </span>
          </div>
        </div>
      </article>

      {/* Best Band Score */}
      <article className={[classes.whiteCard, 'p-4 flex items-start justify-center'].join(' ')}>
        <div className="text-center">
          <h3 className="text-xl font-medium text-gray-600 underline mb-15">Best Band Score</h3>
          <div className="text-[80px] leading-none font-medium text-gray-500">{bandLevel}</div>
          <div className="mt-4 text-2xl font-medium" style={{ color: GREEN }}>
            {bandDesc}
          </div>
        </div>
      </article>
    </div>
  )

  // Variant: inner -> no outer SurfaceCard wrapper or header
  if (variant === 'inner') {
    return (
      <section
        aria-label="Your Report"
        className={[
          'w-full',
          className,
        ].filter(Boolean).join(' ')}
      >
        {summaryGrid}
      </section>
    )
  }

  return (
    <section
      aria-label="Your Report"
      className={[
        'w-full max-w-[1310px] mx-auto',
        classes.surfaceCard,
        'p-5',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Header */}
      <header className="flex items-center gap-2 mb-4">
        <TbReport className="w-6 h-6 text-gray-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-600">Your Report</h2>
      </header>
      {summaryGrid}
    </section>
  )
}

export default StudentReport