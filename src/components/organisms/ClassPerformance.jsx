import React from 'react'
import { classes } from '../../config/theme/tokens.js'
import { PiPencilRulerDuotone } from 'react-icons/pi'
import { HiArrowRight } from 'react-icons/hi'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts'

export const ClassPerformance = ({
  data = [
    { name: 'Listening', score: 100 },
    { name: 'Reading', score: 200 },
    { name: 'Use of English', score: 100 },
  ],
  kpis = { avgScore: 198, totalStudent: 100 },
  onManageQuestions = () => {},
  className = '',
}) => {
  const GREEN = '#76c043'
  const PANEL_BG = '#f8f8f8'
  const safeData = Array.isArray(data) ? data.map((d) => ({ ...d, score: Number(d.score) || 0 })) : []

  return (
    <section
      className={[
        'w-full',
        classes.surfaceCard,
        'px-5 pt-5 pb-8',
        className,
      ].filter(Boolean).join(' ')}
      aria-label="Class Performance"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiPencilRulerDuotone className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-600">Class Performance</h2>
        </div>

        <button
          type="button"
          onClick={onManageQuestions}
          className="hidden md:inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 underline cursor-pointer"
        >
          <span>Manage Questions</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart panel */}
        <div className="lg:col-span-2 rounded-[20px] p-5 bg-white border border-[#ececec] shadow-[0_6px_10px_#0000001a]">
          <h3 className="text-center text-gray-600 font-medium mb-2">Student Band Score by Category</h3>
          <div className="h-[280px]">
            {Array.isArray(safeData) && safeData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip />
                  <Bar dataKey="score" fill={GREEN} radius={[4, 4, 0, 0]} isAnimationActive={true}>
                    <LabelList dataKey="score" position="top" fill={GREEN} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data available
              </div>
            )}
          </div>
          <div className="mt-2 text-center text-xs text-gray-500">Average per Category</div>
        </div>

        {/* KPI cards */}
        <div className="flex flex-col gap-4 h-full">
          <div className="flex-1 flex flex-col justify-center rounded-[16px] py-5 bg-[#f3f3f3] border border-[#ececec] shadow-[0_6px_10px_#0000001a]">
            <div className="text-gray-600 text-center">Average Band Score</div>
            <div className={['mt-2 text-4xl font-semibold text-center', classes.textSuccess].join(' ')}>{kpis.avgScore}</div>
          </div>
          <div className="flex-1 flex flex-col justify-center rounded-[16px] p-5 bg-[#f3f3f3] border border-[#ececec] shadow-[0_6px_10px_#0000001a]">
            <div className="text-gray-600 text-center">Total Students</div>
            <div className={['mt-2 text-4xl font-semibold text-center', classes.textSuccess].join(' ')}>{kpis.totalStudent}</div>
          </div>
        </div>
      </div>

      <button
          type="button"
          onClick={onManageQuestions}
          className="md:hidden inline-flex justify-center items-center gap-2 text-gray-500 hover:text-gray-700 underline w-full mt-8"
        >
          <span>Manage Questions</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
    </section>
  )
}

export default ClassPerformance
