import React from 'react'
import PropTypes from 'prop-types'
import RoleBadge from '../molecules/RoleBadge.jsx'
import HeaderMenu from '../molecules/HeaderMenu.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

export const TutorHeaderRight = ({ items = [], onLogout = null, className = '', useExternalLogoutConfirm = false, displayRole = null }) => {
  const { user } = useAuth()

  const effectiveRole = (() => {
    if (displayRole) return displayRole
    if (user?.role === 'ADMIN') return 'TUTOR'
    return user?.role || 'TUTOR'
  })()
  
  return (
    <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <div className="hidden md:block">
        <RoleBadge role={effectiveRole} />
      </div>
      <HeaderMenu items={items} onLogout={onLogout} useExternalLogoutConfirm={useExternalLogoutConfirm} />
    </div>
  )
}

TutorHeaderRight.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
  })),
  onLogout: PropTypes.func,
  className: PropTypes.string,
  useExternalLogoutConfirm: PropTypes.bool,
  displayRole: PropTypes.string,
}

export default TutorHeaderRight
