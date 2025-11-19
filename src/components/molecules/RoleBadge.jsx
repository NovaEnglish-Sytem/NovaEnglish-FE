import React from 'react'
import PropTypes from 'prop-types'

export const RoleBadge = ({ role = 'TUTOR', className = '' }) => {
  return (
    <div className={['flex items-center', className].filter(Boolean).join(' ')}>
      <div className="w-[111px] h-[41px]">
        <div className="w-[109px] h-[41px] bg-[#216821] rounded-[5px] shadow-[1px_2px_4px_#0000001a] flex items-center justify-center">
          <span className="text-white text-base font-medium leading-normal select-none cursor-default">
            {role}
          </span>
        </div>
      </div>
    </div>
  )
}

RoleBadge.propTypes = {
  role: PropTypes.string,
  className: PropTypes.string,
}

export default RoleBadge
