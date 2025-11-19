import React from 'react'
import PropTypes from 'prop-types'
import { Header } from '../components/organisms/Header.jsx'
import { ROUTES } from '../config/routes.js'

export const AuthLayout = ({
  children,
  rightHeaderSlot = null,
  className = '',
  headerFullWidthBg = true,
  logoTo = ROUTES.login,
}) => {
  return (
    <div className={['bg-neutral-100 w-full overflow-x-auto', className].filter(Boolean).join(' ')}>
      {/* Header outside container to allow full-width background */}
      <Header rightSlot={rightHeaderSlot} fullWidthBg={headerFullWidthBg} logoTo={logoTo} />
      <main className="max-w-[1440px] box-border mx-auto min-h-[calc(100vh-100px)] px-6 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}

AuthLayout.propTypes = {
  children: PropTypes.node,
  rightHeaderSlot: PropTypes.node,
  className: PropTypes.string,
  headerFullWidthBg: PropTypes.bool,
  logoTo: PropTypes.string,
}
