import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import useDismissableOverlay from '../../hooks/useDismissableOverlay.js'
import { COUNTRIES as LOCAL_COUNTRIES } from '../../lib/countries.js'

export const CountryCodeSelect = ({
  value,
  onChange,
  countries,
  countriesUrl,
  defaultCode = 'ID',
  disabled = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [data, setData] = useState([])
  const containerRef = useRef(null)

  // Close on outside click/scroll
  useDismissableOverlay({
    ref: containerRef,
    when: open,
    onClose: () => setOpen(false),
    options: { closeOnScroll: true }
  })

  // Fetch or use provided countries
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (Array.isArray(countries) && countries.length) {
          if (mounted) setData(countries)
          return
        }
        if (countriesUrl) {
          const res = await fetch(countriesUrl)
          if (!res.ok) throw new Error('Failed to fetch countries')
          const json = await res.json()
          if (mounted) setData(Array.isArray(json) ? json : LOCAL_COUNTRIES)
          return
        }
        if (mounted) setData(LOCAL_COUNTRIES)
      } catch (e) {
        if (mounted) setData(LOCAL_COUNTRIES)
      }
    }
    load()
    return () => { mounted = false }
  }, [countriesUrl, countries])

  const getFlagUrl = (code) =>
    `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/flags/4x3/${String(code || '').toLowerCase()}.svg`

  const normalized = useMemo(() => {
    return (data || []).map(c => ({
      ...c,
      search: `${c.name || ''} ${c.dial_code || ''} ${c.code || ''}`.toLowerCase(),
    }))
  }, [data])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return normalized
    return normalized.filter(c =>
      c.search.includes(q)
      || (c.code || '').toLowerCase() === q
      || (c.dial_code || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))
    )
  }, [normalized, query])

  const selected = useMemo(() => {
    const code = value || defaultCode
    return normalized.find(c => (c.code || '').toUpperCase() === String(code).toUpperCase()) || normalized[0]
  }, [normalized, value, defaultCode])

  const handleSelect = (c) => {
    setOpen(false)
    if (typeof onChange === 'function') onChange(c)
  }

  return (
    <div ref={containerRef} className={['relative min-w-0', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        className={[
          'inline-flex items-center gap-2 h-12 px-2 rounded-[5px] border border-gray-400',
          disabled ? 'bg-[#e7e7e7b2] text-gray-500 cursor-not-allowed' : 'hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-[#007a33] focus:ring-offset-1',
          buttonClassName
        ].filter(Boolean).join(' ')}
      >
        {selected && (
          <>
            <img
              src={getFlagUrl(selected.code)}
              alt={selected.code}
              className="w-5 h-[15px] object-cover rounded-sm"
              loading="lazy"
              width="20"
              height="15"
            />
            <span className={disabled ? 'text-gray-500' : 'text-gray-800'}>{selected.dial_code}</span>
          </>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className={["w-4 h-4 ml-1", disabled ? 'text-gray-500' : 'text-gray-600'].join(' ')} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className={[
            'absolute z-50 mt-2 w-[280px] max-h-80 overflow-auto rounded-md border border-gray-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
            dropdownClassName
          ].filter(Boolean).join(' ')}
        >
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              className="w-full h-9 px-2 rounded-[4px] border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#007a33]"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.map((c) => {
              const isSelected = selected && c.code === selected.code
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={[
                      'w-full flex items-center gap-3 px-3 py-2 text-left',
                      isSelected ? 'bg-[#F0FDF4]' : 'hover:bg-[#F5F5F5]'
                    ].join(' ')}
                  >
                    <img
                      src={getFlagUrl(c.code)}
                      alt={c.code}
                      className="w-6 h-[18px] object-cover rounded-[2px]"
                      loading="lazy"
                      width="24"
                      height="18"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.code}</div>
                    </div>
                    <div className="text-sm font-medium text-gray-800">{c.dial_code}</div>
                  </button>
                </li>
              )
            })}
            {!filtered.length && (
              <li className="px-3 py-3 text-sm text-gray-500">No results</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

CountryCodeSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  countries: PropTypes.array,
  countriesUrl: PropTypes.string,
  defaultCode: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  buttonClassName: PropTypes.string,
  dropdownClassName: PropTypes.string,
}

export default CountryCodeSelect
