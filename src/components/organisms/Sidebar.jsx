import React, { useState } from 'react'
import { FiLogOut } from 'react-icons/fi'
import { classes } from '../../config/theme/tokens.js'
import { ConfirmDialog } from '../molecules/ConfirmDialog.jsx'
import LoadingState from '../organisms/LoadingState.jsx'

export const Sidebar = ({ items = [], className = '', onLogout = () => {}, useExternalLogoutConfirm = false }) => {
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  return (
    <aside className={['relative w-64 self-stretch h-full', classes.sidebar.bg, className].filter(Boolean).join(' ')}>
      <div className={'w-64 h-full flex flex-col'}>
        <nav className="pt-14 flex flex-col gap-3">
          {items.map((item, idx) => (
            <button
              key={item.label + idx}
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className={[
                'w-full h-12 text-left font-semibold text-white text-sm md:text-base leading-normal hover:opacity-80 transition-opacity px-5',
                item.isActive ? classes.sidebar.active : '',
              ].filter(Boolean).join(' ')}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-20 px-5 pb-6">
          <button
            className="group hover:opacity-80 transition-opacity"
            onClick={() => {
              if (useExternalLogoutConfirm) {
                try { onLogout && onLogout() } catch (_) {}
              } else {
                setConfirmLogoutOpen(true)
              }
            }}
          >
            <span className="font-bold text-[#ff6161] text-base leading-normal whitespace-nowrap flex gap-3">
              LOG OUT
              <FiLogOut className="w-5 h-5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>

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
        />
      )}
      {loggingOut && (
        <div className="fixed inset-0 z-[100] bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <LoadingState message="Signing out..." size="md" fullPage />
        </div>
      )}
    </aside>
  )
}
