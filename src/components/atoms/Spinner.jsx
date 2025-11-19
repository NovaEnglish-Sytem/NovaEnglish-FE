import React from 'react'
import PropTypes from 'prop-types'
import { colors } from '../../config/theme/tokens.js'

export const Spinner = ({
  size = 40,
  thickness = 4,
  color = colors.brand.headerBg, // navbar green (#003900)
  trackColor = '#e5e7eb', // tailwind gray-200
  className = '',
  label = 'Loading',
}) => {
  const style = {
    width: size,
    height: size,
    borderWidth: thickness,
    borderTopColor: color,
    borderRightColor: trackColor,
    borderBottomColor: trackColor,
    borderLeftColor: trackColor,
  }

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={['inline-block rounded-full animate-spin border-solid', className].filter(Boolean).join(' ')}
      style={style}
    />
  )
}

Spinner.propTypes = {
  size: PropTypes.number,
  thickness: PropTypes.number,
  color: PropTypes.string,
  trackColor: PropTypes.string,
  className: PropTypes.string,
  label: PropTypes.string,
}

export default Spinner
