import React, { useState, useEffect } from 'react'
import { classes } from '../../config/theme/tokens.js'
import { ROUTES } from '../../config/routes.js'
import { VscCopy } from 'react-icons/vsc';
import banner from '../../assets/Banner/banner-colorfull.svg'
import facebook from '../../assets/Social Media/facebook.svg'
import instagram from '../../assets/Social Media/instagram.svg'
import tiktok from '../../assets/Social Media/tiktok.svg'
import whatsapp from '../../assets/Social Media/whatsapp.svg'
import gmail from '../../assets/Social Media/gmail.svg'
import { ConfirmDialog } from '../molecules/ConfirmDialog.jsx'

export const Footer = ({
  information = ['Privacy Policy', 'Terms &amp; Conditions'],
  contact = { email: 'dikhaarianda@gmail.com', phone: '081219540704' },
  social = [
    {name: 'instagram', icon:instagram, href:'https://www.instagram.com/withnovaenglish?igsh=OXdtYTVnOWE1dHhx', alt:'instagram'},
    {name: 'tiktok', icon:tiktok, href:'#', alt:'tiktok'},
    {name: 'facebook', icon:facebook, href:'#', alt:'facebook'}
  ],
  className = '',
  gmailSubject = 'Question for Nova English',
  whatsappMessage = 'Hi Nova English, I have a question.',
  // When true: mobile/tablet bg is full-bleed; desktop (lg+) bg follows max-width container
  responsiveContainerBg = false,
}) => {
  // Copy functionality state
  const [copyStatus, setCopyStatus] = useState({ show: false, message: '', type: '' })
  const [confirm, setConfirm] = useState({ open: false, href: '', label: '' })

  // Copy to clipboard function
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus({
        show: true,
        message: `${type} copied to clipboard!`,
        type: 'success'
      })
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopyStatus({
          show: true,
          message: `${type} copied to clipboard!`,
          type: 'success'
        })
      } catch (fallbackErr) {
        setCopyStatus({
          show: true,
          message: 'Failed to copy to clipboard',
          type: 'error'
        })
      }
      document.body.removeChild(textArea)
    }
  }

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (copyStatus.show) {
      const timer = setTimeout(() => {
        setCopyStatus({ show: false, message: '', type: '' })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [copyStatus.show])

  // informations
  const infoItems = (Array.isArray(information) ? information : []).map((it) =>
    typeof it === 'string'
      ? {
          label: it,
          href: (() => {
            const l = it.toLowerCase()
            if (l.includes('privacy')) return ROUTES.privacyPolicy
            if (l.includes('term')) return ROUTES.terms
            if (l.includes('guide')) return ROUTES.root
            return '#'
          })(),
        }
      : it
  )

  // Contact Us
  const encode = (s) => encodeURIComponent(s)
  const buildGmailCompose = (to, subject) =>
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encode(subject)}`

  const normalizePhone = (p) => {
    const digits = String(p).replace(/\D/g, '')
    if (digits.startsWith('0')) return '62' + digits.slice(1)
    if (digits.startsWith('62')) return digits
    if (digits.startsWith('8')) return '62' + digits
    return digits
  }

  const buildWhatsApp = (phone, text) =>
    `https://wa.me/${normalizePhone(phone)}?text=${encode(text)}`

  // Confirm dialog handlers for external links (Gmail / WhatsApp)
  const handleConfirmExternal = () => {
    const { href } = confirm
    setConfirm({ open: false, href: '', label: '' })
    try { window.open(href, '_blank', 'noopener,noreferrer') } catch (_) { window.location.href = href }
  }

  const handleCloseDialog = () => setConfirm(prev => ({ ...prev, open: false }))

  // Trigger confirm dialog instead of window.confirm
  const onExternalClick = (e, href, label = 'this link') => {
    try { e.preventDefault() } catch (_) {}
    setConfirm({ open: true, href, label })
  }

  const wrapperBgClass = responsiveContainerBg ? 'bg-[#e5e5e5] lg:bg-transparent' : 'bg-[#e5e5e5]'
  const containerBgClass = responsiveContainerBg ? 'lg:bg-[#e5e5e5]' : ''

  return (
    <footer className={['w-full text-black', wrapperBgClass, className].filter(Boolean).join(' ')} role="contentinfo">
      <div className={['max-w-[1440px] mx-auto lg:px-6 py-8 sm:py-10', containerBgClass].filter(Boolean).join(' ')}>
        <div className="flex flex-col items-center lg:flex-row lg:items-start lg:justify-center">
          {/* Logo + tagline */}
          <div className="order-2 lg:order-1 flex flex-col items-center lg:items-start gap-2 p-3">
            <img
            className="h-9 sm:h-14 md:h-[60px] w-auto object-contain"
            alt="Nova English Logo"
            src={banner}
            />
          </div>

          <div className="order-1 lg:order-2 grid grid-cols-1 sm:grid-cols-3 gap-x-10 lg:gap-x-25 gap-y-6 items-start w-full lg:w-auto lg:ml-auto">
            {/* Information */}
            <nav aria-label="Information" className='flex flex-col items-center text-center p-5'>
              <h3 className="text-lg font-semibold mb-4">Information</h3>
              <ul className="space-y-3">
                {infoItems.map((item, idx) => (
                <li key={idx}>
                  <a
                  href={item.href}
                  className={['text-sm', classes.linkHoverSuccess, 'transition-colors'].join(' ')}
                  dangerouslySetInnerHTML={{ __html: item.label }}
                  />
                </li>
                ))}
              </ul>
            </nav>

            {/* Contact Us */}
            <div id="footer-contact" className="flex flex-col border-2 border-transparent rounded-[10px] p-5 transition-[border-color] duration-300">
              <h3 className="text-lg font-semibold mb-4 text-center">Contact Us</h3>
              <ul className="space-y-3 text-center lg:text-left">
                <li className='flex items-center gap-2 justify-center lg:justify-start'>
                  <a
                  href={buildGmailCompose(contact.email, gmailSubject)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => onExternalClick(e, buildGmailCompose(contact.email, gmailSubject), 'your email (Gmail)')}>
                    <div className={['inline-flex items-center gap-3 min-w-0 overflow-x-auto', classes.linkHoverSuccess, 'transition-colors'].join(' ')}>
                      <img src={gmail} alt="email" className="w-5 h-5 object-contain" />
                      <span className="text-sm">{contact.email}</span>
                    </div>
                  </a>
                  <button
                    className={['p-1 rounded hover:bg-gray-200', classes.linkHoverSuccess, 'transition-colors'].join(' ')}
                    onClick={() => copyToClipboard(contact.email, 'Email')}
                    title="Copy email address"
                    >
                    <VscCopy className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
                <li className='flex items-center gap-2 justify-center lg:justify-start'>
                  <a
                  href={buildWhatsApp(contact.phone, whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={['inline-flex items-center gap-3', classes.linkHoverSuccess, 'transition-colors'].join(' ')}
                  onClick={(e) => onExternalClick(e, buildWhatsApp(contact.phone, whatsappMessage), 'WhatsApp')}
                  >
                    <img src={whatsapp} alt="phone" className="w-5 h-5 object-contain" />
                    <span className="text-sm">{contact.phone}</span>
                  </a>
                  <button
                    className={['p-1 rounded hover:bg-gray-200', classes.linkHoverSuccess, 'transition-colors'].join(' ')}
                    onClick={() => copyToClipboard(contact.phone, 'Phone number')}
                    title="Copy phone number"
                    >
                    <VscCopy className="w-4 h-4" aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div className="flex flex-col items-center p-5">
              <h3 className="text-lg font-semibold mb-4">Social Media</h3>
              <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12">
              {social.map(({ name, icon, href = '#', alt }, idx) => (
                <a
                  key={name + idx}
                  href={href}
                  className="hover:opacity-80 transition-opacity"
                  aria-label={alt ?? name}
                  onClick={(e) => onExternalClick(e, href, (alt || name || 'this link'))}
                >
                  <img className="w-6 h-6 sm:w-8 sm:h-8 object-contain" alt={alt ?? name} src={icon} />
                </a>
              ))}
              </div>
            </div>
          </div>
      </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-black/10 pt-4 text-center">
          <p className="text-sm">
            © 2025 Nova English. All rights reserved. <br/>
            <span className="text-gray-500 ml-2"> v1.00</span>
          </p>
        </div>
      </div>

      {/* Copy Notification Popup */}
      {copyStatus.show && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className={[
            'px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 min-w-[200px] max-w-[400px]',
            copyStatus.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          ].join(' ')}>
            {copyStatus.type === 'success' ? (
              <svg
                className='w-3 h-3 pointer-events-none text-green-800'
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-hidden={true}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <VscCopy className="w-4 h-4 text-red-600" />
            )}
            <span className="text-sm font-medium">{copyStatus.message}</span>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirm.open}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmExternal}
        type="external"
        title="Open external link"
        message={`You are about to open ${confirm.label || 'this link'} in a new tab. Continue?`}
        confirmText="Continue"
        cancelText="Cancel"
      />
    </footer>
  )
}
