import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../../assets/Banner/banner-white.svg'
import { classes } from '../../config/theme/tokens.js'

export const Header = ({
  rightSlot = null,
  centerSlot = null,
  className = '',
  logoSrc = '',
  logoTo = '',
  onLogoClick,
  fullWidthBg = true,
  responsiveContainerBg = false, // when true: full bg on mobile, container bg on lg+
}) => {
  const img = (
    <img
      className="h-[50px] w-auto object-contain"
      alt="Nova English Logo"
      src={logoSrc || logo}
    />
  )

  const useResponsive = !!responsiveContainerBg

  return (
    <header className={['w-full relative z-50', className].filter(Boolean).join(' ')}>
      {/* Background strategy */}
      {useResponsive ? (
        // Mobile/tablet: full-bleed background; Desktop (lg+): background moves to inner container
        <div className={['absolute inset-0 lg:hidden', classes.headerBg].join(' ')} aria-hidden="true" />
      ) : (
        fullWidthBg && (
          <div className={['absolute inset-0', classes.headerBg].join(' ')} aria-hidden="true" />
        )
      )}

      <div
        className={[
          'relative max-w-[1440px] mx-auto h-[100px] px-6 flex items-center',
          useResponsive
            ? 'lg:bg-[#003900] lg:shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
            : (!fullWidthBg ? classes.headerBg : ''),
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {logoTo ? (
          <Link to={logoTo} aria-label="Home">
            {img}
          </Link>
        ) : onLogoClick ? (
          <button type="button" onClick={onLogoClick} aria-label="Home" className="p-0 bg-transparent border-0">
            {img}
          </button>
        ) : (
          img
        )}

        {centerSlot && <div className="flex-1 flex justify-center">{centerSlot}</div>}

        {rightSlot && <div className="ml-auto flex items-center gap-4">{rightSlot}</div>}
      </div>
    </header>
  )
}
