import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { HiOutlineMenu } from 'react-icons/hi'
import { FiLogOut } from 'react-icons/fi'
import useDismissableOverlay from '../../hooks/useDismissableOverlay'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import LoadingState from '../organisms/LoadingState.jsx'

export const HeaderMenu = ({ items = [], onLogout = null, className = '', role='Tutor', useExternalLogoutConfirm = false }) => {
  const [open, setOpen] = useState(false)
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const menuRef = useRef(null)

  function toSentenceCase(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  useDismissableOverlay({
    ref: menuRef,
    when: open,
    onClose: () => setOpen(false),
  })

  return (
    <div className={['relative', className].filter(Boolean).join(' ')} ref={menuRef}>
      {/* Mobile-only menu button */}
      <button
        className={[
          `${role === 'Tutor' ? 'lg:hidden' : ''}`,
          'w-[41px] h-[41px] rounded-[5px] shadow-[1px_2px_4px_#0000001a] flex items-center justify-center',
          'hover:bg-[#497049] transform transition-transform duration-90 active:scale-95',
          open ? 'bg-[#216821]' : 'bg-transparent',
        ].join(' ')}
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : 'false'}
        onClick={() => setOpen((s) => !s)}
      >
        <HiOutlineMenu className="w-7 h-7 text-white" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1"
        >
          {items.map((it, idx) => (
            <button
              key={`${it.label}-${idx}`}
              role="menuitem"
              className={[
                'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100',
                it.isActive ? 'font-semibold' : '',
              ].join(' ')}
              onClick={() => {
                setOpen(false)
                try { it.onClick && it.onClick() } catch (_) {}
              }}
            >
              {toSentenceCase(it.label)}
            </button>
          ))}

          {onLogout && (
            <button
              role="menuitem"
              className="w-full text-left px-4 py-2 text-sm inline-flex items-center gap-2 text-[#ff5722] hover:bg-red-50"
              onClick={() => {
                setOpen(false)
                if (useExternalLogoutConfirm) {
                  try { onLogout && onLogout() } catch (_) {}
                } else {
                  setConfirmLogoutOpen(true)
                }
              }}
            >
              <FiLogOut className="w-4 h-4" aria-hidden="true" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      )}
      {!useExternalLogoutConfirm && (
      <ConfirmDialog
        isOpen={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        onConfirm={async () => {
          setConfirmLogoutOpen(false)
          setLoggingOut(true)
          try {
            const p = onLogout && onLogout()
            if (p && typeof p.then === 'function') {
              await p
            }
          } catch (_) {
          } finally {
            setLoggingOut(false)
          }
        }}
        type="logout"
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
      />)}
      {loggingOut && (
        <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <LoadingState message="Signing out..." size="md" fullPage />
        </div>
      )}
    </div>
  )
}

HeaderMenu.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
  })),
  onLogout: PropTypes.func,
  className: PropTypes.string,
  useExternalLogoutConfirm: PropTypes.bool,
}

export default HeaderMenu
