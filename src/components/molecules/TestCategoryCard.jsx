import React from 'react'

const TestCategoryCard = ({ title, questions, minutes, completed = false, _checkpoint = false, className = '' }) => {
  const qText = completed ? 'Completed' : (typeof questions === 'number' ? `${questions} Questions` : (questions || ''))
  const mText = completed ? 'Completed' : (typeof minutes === 'number' ? `${minutes} Minutes` : (minutes || ''))

  return (
    <div
      className={[
        'w-[166px] h-[79px] rounded-xl shadow-[0_4px_4px_#00000040] px-3 py-2',
        'flex flex-col items-center justify-center relative',
        completed 
          ? 'bg-[#a5d6a7] text-gray-700 opacity-80' // darker green and slightly dimmed
          : 'bg-[#f4f9f3] text-gray-700',
        className,
      ].filter(Boolean).join(' ')}
      role="group"
      aria-label={title}
    >
      {completed && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#007a33] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className="text-base leading-none text-center">{title}</div>
      <div className="text-[10px] mt-1 leading-none">
        {qText}
      </div>
      <div className="text-[10px] mt-[6px] leading-none">
        {mText}
      </div>
    </div>
  )
}

export default TestCategoryCard
