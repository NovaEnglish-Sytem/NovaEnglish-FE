import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Header } from '../components/organisms/Header.jsx'
import { Footer } from '../components/organisms/Footer.jsx'
import { ROUTES } from '../config/routes.js'

export const AppLayout = ({
  children,
  rightHeaderSlot = null,
  centerHeaderSlot = null,
  footerProps = {},
  className = '',
  headerFullWidthBg = true,
  showFooter = true,
  logoSrc = '',
  logoTo = ROUTES.dashboardStudent,
  onLogoClick,
  enableStableScrollbar = true,
}) => {
  // Ensure viewport-level scrollbar gutter is stable across student pages only
  useEffect(() => {
    if (!enableStableScrollbar) return

    const root = document.documentElement
    const w = window

    w.__studentGutterMounts = (w.__studentGutterMounts || 0) + 1
    if (w.__studentGutterMounts === 1) {
      root.classList.add('scrollbar-stable')
    }

    return () => {
      w.__studentGutterMounts = Math.max(0, (w.__studentGutterMounts || 1) - 1)
      if (w.__studentGutterMounts === 0) {
        root.classList.remove('scrollbar-stable')
      }
    }
  }, [enableStableScrollbar])

  return (
    <div className={['bg-neutral-100 w-full overflow-x-hidden', className].filter(Boolean).join(' ')}>
      {/* Header outside container to allow full-width background */}
      <Header
        rightSlot={rightHeaderSlot}
        centerSlot={centerHeaderSlot}
        fullWidthBg={headerFullWidthBg}
        logoSrc={logoSrc}
        logoTo={logoTo}
        onLogoClick={onLogoClick}
      />
      <main className="max-w-[1440px] box-border mx-auto px-6">
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer {...footerProps} />}
    </div>
  )
}

AppLayout.propTypes = {
  children: PropTypes.node,
  rightHeaderSlot: PropTypes.node,
  centerHeaderSlot: PropTypes.node,
  footerProps: PropTypes.shape({
    information: PropTypes.arrayOf(PropTypes.string),
    contact: PropTypes.shape({
      email: PropTypes.string,
      phone: PropTypes.string,
    }),
    social: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      icon: PropTypes.string,
      href: PropTypes.string,
      alt: PropTypes.string,
    })),
  }),
  className: PropTypes.string,
  headerFullWidthBg: PropTypes.bool,
  showFooter: PropTypes.bool,
  logoSrc: PropTypes.string,
  logoTo: PropTypes.string,
  onLogoClick: PropTypes.func,
  enableStableScrollbar: PropTypes.bool,
}