import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'

export const SurfaceCard = ({ className = '', padding = true, children, ...rest }) => {
  return (
    <section
      className={[
        classes.surfaceCard,
        padding ? 'p-6' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </section>
  )
}

SurfaceCard.propTypes = {
  className: PropTypes.string,
  padding: PropTypes.bool,
  children: PropTypes.node,
}

SurfaceCard.defaultProps = {
  className: '',
  padding: true,
}

export default SurfaceCard
