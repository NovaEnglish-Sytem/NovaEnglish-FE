import React from 'react'
import { LuFilter } from 'react-icons/lu'
import { TbArrowsSort } from 'react-icons/tb'
import { FaChevronDown } from 'react-icons/fa6'
import { classes } from '../../config/theme/tokens.js'

export const FilterSortToolbar = ({
  onFilter = () => {},
  onSort = () => {},
  filterLabel = 'Filter',
  sortLabel = 'Sort',
  className = '',
}) => {
  const btnCls = ['h-[35px] px-2 sm:px-3 text-gray-600 hover:bg-gray-100 inline-flex items-center gap-2', classes.controlSoft]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={['flex items-center gap-3', className].filter(Boolean).join(' ')}>
      <button type="button" className={btnCls} aria-label="Filter" onClick={onFilter}>
        <LuFilter className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{filterLabel}</span>
        <FaChevronDown className="w-3 h-3" />
      </button>
      <button type="button" className={btnCls} aria-label="Sort" onClick={onSort}>
        <TbArrowsSort className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">{sortLabel}</span>
        <FaChevronDown className="w-3 h-3" />
      </button>
    </div>
  )
}

export default FilterSortToolbar
