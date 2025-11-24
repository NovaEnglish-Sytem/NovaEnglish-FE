import React, { useMemo, useState } from 'react'

// Render a matching-dropdown template with multiple blanks [ ... ] as inline <select> inputs.
// Props:
// - template: string (e.g., "11 walking ... [entertainment]\n12 helping ... [publicity]")
// - options: array of strings or objects (display options for dropdown)
// - values: string[] (current selected value per blank index)
// - onChange: (blankIndex: number, value: string) => void
// - numberStart: number (global question numbering start for the first blank)
// - readonly: optional boolean (affects styling)
// - disabled: optional boolean (prevents interaction without changing styling)
export default function MatchingDropdownInline({ template, options = [], values = [], onChange, numberStart = 0, readonly = false, disabled = false }) {
  const parts = useMemo(() => {
    const segments = []
    const regex = /\[[^\]]*\]/g
    let lastIndex = 0
    let m
    let idx = 0

    const tpl = String(template || '')
    while ((m = regex.exec(tpl)) !== null) {
      const before = tpl.slice(lastIndex, m.index)
      if (before) segments.push({ type: 'text', content: before })
      segments.push({ type: 'blank', index: idx })
      idx += 1
      lastIndex = m.index + m[0].length
    }
    const tail = tpl.slice(lastIndex)
    if (tail) segments.push({ type: 'text', content: tail })
    return segments
  }, [template])

  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return []
    const mapped = options.map((opt, idx) => {
      if (typeof opt === 'string') {
        const raw = String(opt || '').trim()
        const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : ''
        return { key: raw, label, id: idx }
      }
      const raw = String(opt.value ?? opt.key ?? opt.text ?? '').trim()
      const baseLabel = String(opt.label ?? opt.text ?? opt.value ?? raw)
      const label = baseLabel ? baseLabel.charAt(0).toUpperCase() + baseLabel.slice(1) : ''
      return { key: raw, label, id: idx }
    })

    return mapped.sort((a, b) => {
      const la = a.label || ''
      const lb = b.label || ''
      return la.localeCompare(lb, undefined, { sensitivity: 'base' })
    })
  }, [options])

  const [focusedIndex, setFocusedIndex] = useState(null)
  let blankCounter = 0

  const handleChange = (i, value) => {
    onChange?.(i, value)
  }

  const containerClasses = 'flex flex-wrap items-center gap-1'

  return (
    <div className={containerClasses}>
      {parts.map((seg, i) => {
        if (seg.type === 'text') {
          const raw = String(seg.content || '')
          const lines = raw.split(/\n/)
          const nodes = []
          lines.forEach((ln, li) => {
            if (li > 0) {
              // Force next content onto a new flex line
              nodes.push(<div key={`br-${i}-${li}`} className="basis-full h-0" />)
            }
            if (ln) {
              nodes.push(
                <span key={`t-${i}-${li}`} className="text-sm sm:text-base text-gray-700">
                  {ln}
                </span>
              )
            }
          })
          return nodes
        }
        const bIndex = seg.index
        const labelNum = numberStart + blankCounter
        const current = String(values[bIndex] || '')
        const hasValue = current && current.trim().length > 0
        const isFocused = focusedIndex === bIndex
        const isActive = hasValue || isFocused

        const selectClasses = readonly
          // Builder preview: mimic ShortAnswer preview input size/font (readonly)
          ? 'inline-block w-32 h-7 px-2 rounded border border-gray-300 bg-white text-sm text-gray-700 focus:outline-none'
          // Student: mirror ShortAnswerInline border behaviour, bg green only when already answered, bold text when answered
          : [
              'inline-block px-2 py-1 rounded-md border-2 text-sm sm:text-base min-w-[90px] text-gray-800 focus:outline-none transition-colors cursor-pointer',
              hasValue
                ? 'bg-green-50 border-green-300 font-medium focus:border-[#007a33] focus:ring-1 focus:ring-[#007a33]'
                : 'bg-white border-gray-300 focus:border-green-300 focus:ring-1 focus:ring-[#007a33]'
            ].join(' ')

        const badgeClasses = [
          'inline-flex items-center justify-center text-[10px] px-1.5 h-5 rounded-full border transition-colors',
          readonly
            // Match ShortAnswerEditor preview badge
            ? 'bg-white text-gray-600 border-gray-300'
            : (isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'),
        ].join(' ')

        const node = (
          <div key={`b-${i}`} className="inline-flex items-center gap-1">
            <span className={badgeClasses}>{labelNum}</span>
            <select
              className={selectClasses}
              value={current}
              onChange={(e) => handleChange(bIndex, e.target.value)}
              onFocus={() => setFocusedIndex(bIndex)}
              onBlur={() => setFocusedIndex(null)}
              disabled={readonly || disabled}
            >
              {!current && <option value="" disabled hidden />}
              {normalizedOptions.map((opt) => (
                <option key={opt.id} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        )
        blankCounter += 1
        return node
      })}
    </div>
  )
}
