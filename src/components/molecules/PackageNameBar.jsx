import React from 'react'
import PropTypes from 'prop-types'

const PackageNameBar = ({ _categoryName, code, label = 'Package name:' }) => {
  const displayName = code || ''
  return (
    <div className="mt-3 mb-2">
      <div className="text-gray-700 text-sm sm:text-base font-semibold">
        <span>{label} </span>
        <span className="text-[#2E7D20]">{displayName}</span>
      </div>
    </div>
  )
}

PackageNameBar.propTypes = {
  categoryName: PropTypes.string,
  code: PropTypes.string,
  label: PropTypes.string,
}

export default PackageNameBar
