import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Header } from '../components/organisms/Header.jsx'
import { Sidebar } from '../components/organisms/Sidebar.jsx'
import { Footer } from '../components/organisms/Footer.jsx'
import { ROUTES } from '../config/routes.js'

export const DashboardLayout = ({
  sidebarItems = [],
  rightHeaderSlot = null,
  centerHeaderSlot = null,
  headerFullWidthBg = true,
  showFooter = false,
  footerProps = {},
  // New props:
  onLogout = () => {},
  useExternalLogoutConfirm = false,
  responsiveContainerBg = true,
  contentClassName = 'pt-14',
  className = '',
  logoTo = ROUTES.dashboardTutor,
  children,
}) => {
  // Ensure viewport-level scrollbar gutter is stable across ALL tutor pages without flicker
  // We use a ref-count so navigating between tutor pages doesn't remove the class momentarily.
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const w = window

    w.__tutorGutterMounts = (w.__tutorGutterMounts || 0) + 1
    if (w.__tutorGutterMounts === 1) {
      root.classList.add('scrollbar-stable')
      body.classList.add('scrollbar-stable')
    }

    return () => {
      w.__tutorGutterMounts = Math.max(0, (w.__tutorGutterMounts || 1) - 1)
      if (w.__tutorGutterMounts === 0) {
        root.classList.remove('scrollbar-stable')
        body.classList.remove('scrollbar-stable')
      }
    }
  }, [])

  return (
      <div className={["w-full overflow-x-auto min-h-screen lg:bg-[url('/leaf-bg-tutor.svg')] lg:bg-cover lg:bg-center lg:bg-fixed scrollbar-stable", className].filter(Boolean).join(' ')}
      >
        <Header
          rightSlot={rightHeaderSlot}
          centerSlot={centerHeaderSlot}
          fullWidthBg={headerFullWidthBg}
          logoTo={logoTo}
          responsiveContainerBg={responsiveContainerBg}
        />
        {/* <div className="grid justify-items-center [align-items:start]"> */}
        <div className="flex items-start justify-center">
          <div className="bg-neutral-100 max-w-[1440px] w-full box-border flex items-stretch lg:border-r-3 lg:border-[#e5e5e5]">
            <div className="hidden lg:block min-h-[calc(100vh-100px)]">
              <Sidebar
                fullHeight={true}
                items={sidebarItems.map((it) => ({ ...it, onClick: it.onClick ?? (() => {}) }))}
                onLogout={onLogout}
                useExternalLogoutConfirm={useExternalLogoutConfirm}
              />
            </div>
            <section className={['min-w-0 flex-1 px-6 min-h-[calc(100vh-100px)]', contentClassName].filter(Boolean).join(' ')}>
              {children}
            </section>
          </div>
        </div>
        {showFooter && (
          <Footer {...footerProps} responsiveContainerBg={responsiveContainerBg} />
        )}
      </div>
  )
}

DashboardLayout.propTypes = {
  sidebarItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
  })),
  rightHeaderSlot: PropTypes.node,
  centerHeaderSlot: PropTypes.node,
  headerFullWidthBg: PropTypes.bool,
  showFooter: PropTypes.bool,
  footerProps: PropTypes.object,
  contentClassName: PropTypes.string,
  className: PropTypes.string,
  logoTo: PropTypes.string,
  children: PropTypes.node,
}

export default DashboardLayout
