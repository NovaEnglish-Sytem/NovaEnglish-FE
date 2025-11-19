import React from 'react'
import PropTypes from 'prop-types'
import ShieldSvg from '../../assets/Shield.svg'

const ScoreShield = ({ value, className = '', imgAlt = '' }) => {
  return (
    <div className={['relative w-[70px] h-[80px]', className].filter(Boolean).join(' ')}>
      <img src={ShieldSvg} alt={imgAlt} className="w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="text-white text-xs font-semibold">Score</span>
        <span className="text-white text-lg font-semibold">{value}</span>
      </div>
    </div>
  )
}

ScoreShield.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  className: PropTypes.string,
  imgAlt: PropTypes.string,
}

export default ScoreShield
