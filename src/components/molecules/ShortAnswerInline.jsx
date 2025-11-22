import React, { useMemo, useState } from 'react'

// Render a short-answer template with multiple blanks [ ... ] as inline inputs.
// Props:
// - template: string (e.g., "Jakarta adalah [Indonesia] yang ... [daerah]")
// - values: string[] (current answers per blank index)
// - onChange: (blankIndex: number, value: string) => void
// - numberStart: number (global question numbering start for the first blank)
// - inputClassName: optional extra class for inputs
// - readonly: optional
export default function ShortAnswerInline({ template, values = [], onChange, numberStart = 0, inputClassName = '', readonly = false }) {
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

  const handleChange = (i, e) => {
    const v = e?.target?.value ?? ''
    onChange?.(i, v)
  }

  const [focusedIndex, setFocusedIndex] = useState(null)
  let blankCounter = 0

  return (
    <div className="flex flex-wrap items-center gap-1">
      {parts.map((seg, i) => {
        if (seg.type === 'text') {
          const raw = String(seg.content || '')
          const lines = raw.split(/\n/)
          const nodes = []
          lines.forEach((ln, li) => {
            if (li > 0) {
              nodes.push(<div key={`br-${i}-${li}`} className="basis-full h-0" />)
            }
            if (ln) {
              nodes.push(
                <span key={`t-${i}-${li}`} className="whitespace-pre-wrap text-sm sm:text-base text-gray-700">{ln}</span>
              )
            }
          })
          return nodes
        }
        // blank
        const bIndex = seg.index
        const label = numberStart + blankCounter
        const val = String(values[bIndex] || '')
        const isActive = focusedIndex === bIndex || (val && val.trim().length > 0)
        const inputClasses = [
          'px-2 py-1 rounded-md border-2 text-sm sm:text-base min-w-[90px] focus:outline-none transition-colors',
          isActive ? 'border-green-300 bg-green-50 focus:border-[#007a33] focus:ring-1 focus:ring-[#007a33]' : 'border-gray-300 bg-gray-50 focus:border-green-300 focus:ring-1 focus:ring-[#007a33]',
          inputClassName
        ].join(' ')
        const badgeClasses = [
          'inline-flex items-center justify-center text-[10px] px-1.5 h-5 rounded-full border transition-colors',
          isActive ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'
        ].join(' ')
        const node = (
          <div key={`b-${i}`} className="inline-flex items-center gap-1">
            <span className={badgeClasses}>{label}</span>
            <input
              type="text"
              className={inputClasses}
              value={val}
              onChange={(e) => handleChange(bIndex, e)}
              onFocus={() => setFocusedIndex(bIndex)}
              onBlur={() => setFocusedIndex(null)}
              disabled={readonly}
            />
          </div>
        )
        blankCounter += 1
        return node
      })}
    </div>
  )
}
