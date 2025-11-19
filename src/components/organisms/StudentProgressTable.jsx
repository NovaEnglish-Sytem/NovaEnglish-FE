import React from 'react'
import { classes } from '../../config/theme/tokens.js'
import { TbReport } from 'react-icons/tb'
import { HiArrowRight } from 'react-icons/hi'

export const StudentProgressTable = ({
  students = [],
  onViewDetails = () => {},
  className = '',
}) => {
  // Format date helper
  const formatLastUpdate = (date) => {
    if (!date) return 'N/A'
    
    const now = new Date()
    const updateDate = new Date(date)
    const diffMs = now - updateDate
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  }

  // Map students to rows format
  const rows = students.map(student => ({
    id: student.id,
    name: student.fullName,
    email: student.email,
    averageScore: student.bestAverageScore,
    totalAttempts: student.totalAttempts,
    lastUpdate: formatLastUpdate(student.lastUpdate)
  }))
  return (
    <section
      className={[
        'w-full',
        classes.surfaceCard,
        'p-5',
        className,
      ].filter(Boolean).join(' ')}
      aria-label="Student Progress"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TbReport className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-600">Student Progress</h2>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="hidden md:inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 underline cursor-pointer"
        >
          <span>View All</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr className={['border-b border-[#ececec]', classes.textSuccess].join(' ')}>
              <th className="py-3 px-4 font-medium whitespace-nowrap">Fullname</th>
              <th className="py-3 px-4 font-medium whitespace-nowrap">Email</th>
              <th className="py-3 px-4 font-medium whitespace-nowrap">Band Score</th>
              <th className="py-3 px-4 font-medium whitespace-nowrap">Total Attempts</th>
              <th className="py-3 px-4 font-medium whitespace-nowrap">Last Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-gray-500">
                  No student progress data available
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r.id || r.name + idx}
                  className={['border-t border-[#ececec]', idx % 2 === 1 ? 'bg-white/40' : 'bg-transparent']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.name}</td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.email}</td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{(r.averageScore || r.averageScore === 0) ? Math.round(Number(r.averageScore) || 0) : 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.totalAttempts}</td>
                  <td className="py-3 px-4 text-gray-700 whitespace-nowrap">{r.lastUpdate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
          type="button"
          onClick={onViewDetails}
          className="md:hidden inline-flex justify-center items-center gap-2 text-gray-500 hover:text-gray-700 underline w-full mt-8"
        >
          <span>View All</span>
          <HiArrowRight className="w-4 h-4" />
        </button>
    </section>
  )
}

export default StudentProgressTable