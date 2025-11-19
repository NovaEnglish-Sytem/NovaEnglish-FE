import React from 'react'
import PropTypes from 'prop-types'
import RoleBadge from '../molecules/RoleBadge.jsx'
import HeaderMenu from '../molecules/HeaderMenu.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'

export const TutorHeaderRight = ({ items = [], onLogout = null, className = '', useExternalLogoutConfirm = false }) => {
  const { user } = useAuth()
  
  return (
    <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <div className="hidden md:block">
        <RoleBadge role={user?.role || 'TUTOR'} />
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
}

export default TutorHeaderRight
