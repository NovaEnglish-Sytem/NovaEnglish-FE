import React from 'react'
import PropTypes from 'prop-types'
import Spinner from '../atoms/Spinner.jsx'
import { classes } from '../../config/theme/tokens.js'

export default function LoadingFallback({ label = 'Loading...' }) {
  return (
    <div className="w-full min-h-screen grid place-items-center">
      <div className={[classes.surfaceCard, 'w-full max-w-[250px] mx-auto p-6 flex flex-col items-center gap-4'].join(' ')}>
        <Spinner size={44} thickness={4} />
        {label ? <p className="text-sm text-gray-600">{label}</p> : null}
      </div>
    </div>
  )
}

LoadingFallback.propTypes = {
  label: PropTypes.string,
}
