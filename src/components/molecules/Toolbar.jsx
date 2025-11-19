import React from 'react'
import { HiOutlineSearch } from 'react-icons/hi'
import { LuFilter } from 'react-icons/lu'
import { TbArrowsSort } from 'react-icons/tb'
import { FaChevronDown } from 'react-icons/fa6'

export const Toolbar = ({
  value = '',
  onChange = () => {},
  placeholder = 'Type Here',
  onFilterClick = () => {},
  onSortClick = () => {},
  className = '',
}) => {
  return (
    <div className={['flex items-center justify-between gap-3 my-5', className].filter(Boolean).join(' ')}>
      {/* Search */}
      <div className="flex items-center bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] h-[35px] w-full sm:w-auto px-3 py-1 min-w-0">
        <HiOutlineSearch className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" aria-hidden="true" />
        <span className="hidden sm:inline text-base text-gray-600 ml-2">Search</span>
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-[30px] w-full sm:w-[220px] flex-1 min-w-0 rounded-[3px] border border-gray-500 px-2 text-sm text-gray-600 bg-white focus:outline-none ml-2"
          aria-label="Search"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 w-auto justify-end">
        <button
          type="button"
          className="h-[35px] px-2 sm:px-3 bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] text-gray-600 hover:bg-gray-100 inline-flex items-center gap-0.5 sm:gap-2"
          aria-label="Filter"
          onClick={onFilterClick}
        >
          <LuFilter className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Filter</span>
          <FaChevronDown className="w-3 h-3" />
        </button>
        <button
          type="button"
          className="h-[35px] px-2 sm:px-3 bg-[#f8f8f8] rounded-[3px] shadow-[2px_2px_4px_#00000033] text-gray-600 hover:bg-gray-100 inline-flex items-center gap-0.5 sm:gap-2"
          aria-label="Sort"
          onClick={onSortClick}
        >
          <TbArrowsSort className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Sort</span>
          <FaChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
