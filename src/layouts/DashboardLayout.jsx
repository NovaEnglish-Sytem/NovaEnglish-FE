import React, { useEffect, useRef, useState } from 'react'
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
  const [isHeaderHidden, setIsHeaderHidden] = useState(false)
  const scrollContainerRef = useRef(null)

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    let lastScrollTop = 0

    const handleScroll = () => {
      const isMobile = window.innerWidth < 768 // Tailwind md breakpoint
      const current = el.scrollTop || 0

      const viewportHeight = el.clientHeight
      const scrollDelta = el.scrollHeight - viewportHeight
      const minScrollableDistance = viewportHeight // require at least one extra "screen" of content
      const canScrollVertically = scrollDelta > minScrollableDistance

      if (!isMobile || !canScrollVertically) {
        setIsHeaderHidden(false)
        lastScrollTop = current
        return
      }

      const diff = current - lastScrollTop
      const threshold = 4
      if (Math.abs(diff) < threshold) {
        lastScrollTop = current
        return
      }

      if (diff > 0 && current > 0) {
        // Scroll down
        setIsHeaderHidden(true)
      } else if (diff < 0) {
        // Scroll up
        setIsHeaderHidden(false)
      }

      lastScrollTop = current
    }

    el.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      el.removeEventListener('scroll', handleScroll)
    }
  }, [])

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
          className={[
            'transition-transform duration-300',
            isHeaderHidden ? '-translate-y-full' : 'translate-y-0',
            'md:translate-y-0 md:transition-none',
          ].join(' ')}
        />
        {/* <div className="grid justify-items-center [align-items:start]"> */}
      <div
        className={[
          'flex items-start justify-center',
          isHeaderHidden ? 'h-screen -mt-[100px]' : 'h-[calc(100vh-100px)]',
          'md:h-[calc(100vh-100px)] md:mt-0',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="bg-neutral-100 max-w-[1440px] w-full box-border flex items-stretch lg:border-r-3 lg:border-[#e5e5e5] h-full">
          <div className="hidden lg:block h-full">
            <Sidebar
              fullHeight={true}
              items={sidebarItems.map((it) => ({ ...it, onClick: it.onClick ?? (() => {}) }))}
              onLogout={onLogout}
              useExternalLogoutConfirm={useExternalLogoutConfirm}
            />
          </div>
          <div
            ref={scrollContainerRef}
            className="min-w-0 flex-1 flex flex-col h-full overflow-y-auto tutor-scroll"
            data-dashboard-scroll="true"
          >
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
