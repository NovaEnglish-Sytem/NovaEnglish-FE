import React from 'react'
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
  return (
    <div
      className={[
        "w-full h-screen overflow-hidden overflow-x-auto lg:bg-[url('/leaf-bg-tutor.svg')] lg:bg-cover lg:bg-center lg:bg-fixed",
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Header
          rightSlot={rightHeaderSlot}
          centerSlot={centerHeaderSlot}
          fullWidthBg={headerFullWidthBg}
          logoTo={logoTo}
          responsiveContainerBg={responsiveContainerBg}
        />
        {/* <div className="grid justify-items-center [align-items:start]"> */}
      <div className="flex items-start justify-center h-[calc(100vh-100px)]">
        <div className="bg-neutral-100 max-w-[1440px] w-full box-border flex items-stretch lg:border-r-3 lg:border-[#e5e5e5] h-full">
          <div className="hidden lg:block h-full">
            <Sidebar
              fullHeight={true}
              items={sidebarItems.map((it) => ({ ...it, onClick: it.onClick ?? (() => {}) }))}
              onLogout={onLogout}
              useExternalLogoutConfirm={useExternalLogoutConfirm}
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto tutor-scroll">
            <section className={['min-w-0 px-6', contentClassName].filter(Boolean).join(' ')}>
              {children}
            </section>
            {showFooter && (
              <Footer {...footerProps} responsiveContainerBg={responsiveContainerBg} />
            )}
          </div>
        </div>
      </div>
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
