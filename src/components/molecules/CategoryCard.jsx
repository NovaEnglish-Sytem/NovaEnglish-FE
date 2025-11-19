import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'

const CategoryCard = ({ name, score, className = '' }) => {
  return (
    <div
      className={[
        'rounded-[20px] border border-[#7d8797] bg-[#f8f8f8] px-6 py-6 min-h-[110px] flex flex-col items-center justify-center',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className={['font-medium text-center'].join(' ')}>
        {typeof name === 'string' ? (
          <span className={classes.textSuccess}>{name}</span>
        ) : (
          name
        )}
      </div>
      <div className={['mt-2', classes.textSuccess, 'text-2xl font-semibold'].join(' ')}>{score}</div>
    </div>
  )
}

CategoryCard.propTypes = {
  name: PropTypes.node.isRequired,
  score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
}

export default CategoryCard
