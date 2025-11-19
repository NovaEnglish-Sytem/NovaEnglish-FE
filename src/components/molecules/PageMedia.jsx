import React from 'react'
import AudioPlayerMinimal from './AudioPlayerMinimal.jsx'

// Page-level media renderer (Atomic molecule)
// Props:
// - pageId: string
// - media: Array<{ type: 'IMAGE'|'AUDIO', url: string }>
// - audioCounts: Record<string, number>
// - onPlayAudio: (audioKey: string, url: string) => void
// - onImageClick: (url: string, alt?: string) => void
// - className: optional wrapper classes
export default function PageMedia({
  pageId,
  media = [],
  audioCounts = {},
  onCommitAudio,
  onImageClick,
  className = '',
  resolveSrc,
  maxPlays = 2,
  audioKeyPrefix = 'AUDIO'
}) {
  if (!Array.isArray(media) || media.length === 0) return null

  // Ensure consistent order: IMAGE first, then AUDIO
  const ordered = [...media].sort((a, b) => {
    const ta = String(a?.type || '').toUpperCase()
    const tb = String(b?.type || '').toUpperCase()
    if (ta === tb) return 0
    if (ta === 'IMAGE') return -1
    if (tb === 'IMAGE') return 1
    return 0
  })

  return (
    <div className={["rounded-md border border-gray-200 p-3 sm:p-4 bg-white flex flex-col gap-3", className].join(' ')}>
      {ordered.map((m, idx) => {
        if (!m || !m.type || !m.url) return null
        const type = String(m.type).toUpperCase()
        const src = resolveSrc ? resolveSrc(m) : m.url
        if (type === 'IMAGE') {
          return (
            <div key={`pm-${idx}`} className="flex justify-center">
              <button
                type="button"
                onClick={() => onImageClick?.(src, 'Page Image')}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              >
                <img
                  src={src}
                  alt="Page Image"
                  className="h-40 sm:h-48 w-auto object-contain rounded border border-gray-200"
                />
              </button>
            </div>
          )
        }
        if (type === 'AUDIO') {
          const audioKey = `page:${pageId}:${audioKeyPrefix}:${idx}`
          const cnt = audioCounts[audioKey] || 0
          // Use original src directly (native cross-origin audio playback is allowed).
          // Volume boost is automatically disabled for external sources in the player.
          const finalSrc = src
          return (
            <div key={`pm-${idx}`} className="w-full max-w-sm mx-auto">
              <AudioPlayerMinimal
                src={finalSrc}
                maxPlays={maxPlays}
                playedCount={cnt}
                onCommitPlay={() => onCommitAudio?.(audioKey)}
              />
            </div>
          )
        }
        return null
      })}
    </div>
  )
}
