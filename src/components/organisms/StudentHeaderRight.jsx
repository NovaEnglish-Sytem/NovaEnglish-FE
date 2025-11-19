import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../config/routes.js'
import RoleBadge from '../molecules/RoleBadge.jsx'
import HeaderMenu from '../molecules/HeaderMenu.jsx'
import ContactUsButton from '../molecules/ContactUsButton.jsx'
import useFooterContactHighlight from '../../hooks/useFooterContactHighlight.js'
import useMediaQuery from '../../hooks/useMediaQuery.js'

export const StudentHeaderRight = ({
  items = [],
  onLogout = null,
  className = '',
}) => {
  const navigate = useNavigate()
  const highlight = useFooterContactHighlight({ targetId: 'footer-contact' })
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")

  const menuItems = useMemo(() => {
    const lower = (s) => String(s || '').toLowerCase().trim()
    let arr = items.slice()

    if (!arr.some((it) => lower(it.label) === 'account settings')) {
      arr = [...arr, { label: 'Account Settings', onClick: () => navigate(ROUTES.accountSettings) }]
    }

    if (isDesktop) {
      arr = arr.filter((it) => !['dashboard', 'test record', 'contact us'].includes(lower(it.label)))
    }
    else if (!isTablet) {
      if (!arr.some((it) => lower(it.label) === 'contact us')) {
        arr = [...arr.slice(0, 2), { label: 'Contact Us', onClick: () => highlight() }, ...arr.slice(2)]
      }
    }

    return arr.map((it) => ({ ...it, isActive: it.isActive ?? it.active ?? false }))
  }, [items, isDesktop, isTablet, highlight, navigate])

  return (
    <div className={['relative flex items-center gap-6', className].filter(Boolean).join(' ')}>
      <ContactUsButton className="" />
      <div className="hidden md:block">
        <RoleBadge role="STUDENT" />
      </div>
      <HeaderMenu items={menuItems} onLogout={onLogout} role='Student'/>
    </div>
  )
}

StudentHeaderRight.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
  })),
  onLogout: PropTypes.func,
  className: PropTypes.string,
}

export default StudentHeaderRight