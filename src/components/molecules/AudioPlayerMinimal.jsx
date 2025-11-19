import React, { useEffect, useId, useRef, useState } from 'react'
import { audioGate } from '../../lib/audioGate.js'

export default function AudioPlayerMinimal({
  src,
  maxPlays = null,
  playedCount = 0,
  onCommitPlay,
  className = '',
  releaseOnPause = true
}) {
  const audioRef = useRef(null)
  const gateId = useId()
  const [lockedByOther, setLockedByOther] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)


  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.muted = muted
    // Native element volume only (0..1)
    el.volume = Math.max(0, Math.min(1, volume))
  }, [muted, volume])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onEnded = async () => {
      setIsPlaying(false)
      // small delay to avoid race conditions with browser state
      await new Promise(r => setTimeout(r, 150))
      try {
        setIsCommitting(true)
        await onCommitPlay?.()
      } finally {
        setIsCommitting(false)
      }
      // Always release gate on ended so others can play
      audioGate.release(gateId)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    el.addEventListener('ended', onEnded)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    return () => {
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
    }
  }, [onCommitPlay, gateId])

  // Subscribe to global audio gate to reflect lock state and clean up on unmount
  useEffect(() => {
    const update = () => setLockedByOther(audioGate.isLockedByOther(gateId))
    const unsub = audioGate.subscribe(update)
    // initialize once
    update()
    return () => {
      unsub?.()
      // Best-effort release if this player owns the gate during unmount
      audioGate.release(gateId)
    }
  }, [gateId])

  const canPlayMore = maxPlays == null || Number(playedCount || 0) < Number(maxPlays)

  const handlePlay = async () => {
    const el = audioRef.current
    if (!el) return
    if (!canPlayMore) return
    if (isPlaying || isCommitting) return
    // Acquire global audio gate before starting playback
    if (!audioGate.tryAcquire(gateId)) {
      // Another audio is playing; do nothing
      return
    }
    try {
      await el.play()
      // isPlaying will be set by event listener
    } catch {
      // On failure, release the gate so others aren't blocked
      audioGate.release(gateId)
    }
  }

  const handlePause = () => {
    const el = audioRef.current
    if (!el) return
    try { el.pause() } catch {}
    // Optionally release gate on pause based on prop
    if (releaseOnPause) {
      audioGate.release(gateId)
    }
  }

  return (
    <div className={["w-full", className].join(' ')}>
      <div className="w-full max-w-sm mx-auto bg-gray-100 border border-gray-200 rounded-full p-4">
        <audio ref={audioRef} src={src} preload="metadata" />
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={isPlaying ? handlePause : handlePlay}
            disabled={isPlaying || isCommitting || !canPlayMore || lockedByOther}
            className={[
              'px-3 py-1 rounded border text-sm',
              (isPlaying || isCommitting || !canPlayMore || lockedByOther) ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ].join(' ')}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => setMuted(m => !m)}
            className="px-2 py-1 rounded border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 text-sm"
            aria-pressed={muted}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <div className="flex flex-col items-start">
            <span className="text-xs text-gray-600">Volume</span>
            <input
              type="range"
              min="0"
              max={1}
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
              className="w-28"
              aria-label={"Volume (0-100%)"}
            />
          </div>
        </div>
        <div className="mt-1 text-center text-xs text-gray-600">
          {maxPlays == null
            ? 'Unlimited plays'
            : `Audio limit reached (${Math.min(Number(playedCount||0), Number(maxPlays||2))}/${maxPlays})`}
        </div>
      </div>
    </div>
  )
}
