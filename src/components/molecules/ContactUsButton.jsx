import React from 'react'
import PropTypes from 'prop-types'
import { HiPhone } from 'react-icons/hi2'
import useFooterContactHighlight from '../../hooks/useFooterContactHighlight'

export const ContactUsButton = ({
  targetId = 'footer-contact',
  label = 'Contact Us',
  className = '',
  icon = <HiPhone className="w-5 h-5" aria-hidden="true" />,
}) => {
  const highlight = useFooterContactHighlight({ targetId })

  return (
    <button
      type="button"
      onClick={highlight}
      className={[
        'hidden md:flex justify-center items-center gap-2 h-[41px] py-2 px-3 text-white rounded-[5px]',
        'hover:bg-[#497049] transform transition-transform duration-90 active:scale-95 active:bg-[#216821]',
        className,
      ].filter(Boolean).join(' ')}
      aria-label={label}
    >
      {icon}
      <span className="font-medium text-sm leading-none">{label}</span>
    </button>
  )
}

ContactUsButton.propTypes = {
  targetId: PropTypes.string,
  label: PropTypes.string,
  className: PropTypes.string,
  icon: PropTypes.node,
}

export default ContactUsButton
