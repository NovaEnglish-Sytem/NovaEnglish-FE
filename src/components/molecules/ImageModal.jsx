import React, { useEffect, useState, useRef } from 'react'
import PropTypes from 'prop-types'
import { HiX, HiZoomIn, HiZoomOut } from 'react-icons/hi'

const ImageModal = ({ isOpen, onClose, imageSrc, imageAlt }) => {
  const [scale, setScale] = useState(1)
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 })
  const [showTips, setShowTips] = useState(true)
  const containerRef = useRef(null)
  const imageRef = useRef(null)
  const lastTapRef = useRef(0)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setScale(1)
      // Always show tips on each open
      setShowTips(true)
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleContainerWheel = (e) => {
    // Shift + Scroll = horizontal, normal scroll = vertical
    if (e.shiftKey) {
      e.preventDefault()
      if (containerRef.current) {
        containerRef.current.scrollLeft += e.deltaY
      }
    }
    // Normal scroll uses default browser behavior for vertical scrolling
  }

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(2)
    } else {
      setScale(1)
      // Reset scroll to top-left when zooming out
      if (containerRef.current) {
        containerRef.current.scrollTop = 0
        containerRef.current.scrollLeft = 0
      }
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 5))
  }

  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.2, 0.5)
      return newScale
    })
  }

  const resetZoom = () => {
    setScale(1)
  }

  if (!isOpen) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/70"
      onClick={handleBackdropClick}
    >
      {/* Fixed UI Controls - Don't scroll with content */}
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2"
        aria-label="Close"
      >
        <HiX className="w-8 h-8" />
      </button>

      {/* Zoom Controls */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2"
          aria-label="Zoom In"
          title="Zoom In"
        >
          <HiZoomIn className="w-6 h-6" />
        </button>
        <button
          onClick={zoomOut}
          className="text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded-full p-2"
          aria-label="Zoom Out"
          title="Zoom Out"
        >
          <HiZoomOut className="w-6 h-6" />
        </button>
        {scale !== 1 && (
          <button
            onClick={resetZoom}
            className="text-white hover:text-gray-300 transition-colors bg-black/50 hover:bg-black/70 rounded px-3 py-1 text-xs"
            title="Reset Zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Zoom Indicator */}
      {scale !== 1 && (
        <div className="fixed bottom-4 left-4 z-50 text-white bg-black/50 rounded px-3 py-1 text-sm pointer-events-none">
          {Math.round(scale * 100)}%
        </div>
      )}

      {/* Instructions (dismissible, floating over image) */}
      {showTips && (
        <div className="absolute top-4 left-4 z-50 pointer-events-none">
          <div className="text-white bg-black/60 rounded px-3 py-2 text-xs space-y-1 pointer-events-auto relative max-w-[78vw] sm:max-w-sm shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              aria-label="Close tips"
              className="absolute -top-2 -right-2 bg-black/70 hover:bg-black/90 rounded-full p-1"
              onClick={() => { setShowTips(false) }}
            >
              <HiX className="w-4 h-4 text-white" />
            </button>
            <div>• Double-click image to toggle 2x zoom</div>
            <div>• Scroll to navigate vertically</div>
            <div>• Shift + Scroll to navigate horizontally</div>
          </div>
        </div>
      )}

      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="image-modal-scroll relative w-[calc(100%-2rem)] h-[calc(100%-2rem)] overflow-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) transparent',
          WebkitOverflowScrolling: 'touch'
        }}
        onWheel={handleContainerWheel}
      >

        {/* Image Wrapper - top aligned, center horizontally */}
        <div className="min-w-full min-h-full">
          <img
            ref={imageRef}
            src={imageSrc}
            alt={imageAlt}
            className="block select-none"
            style={{ 
              // When not zoomed, contain within viewport
              maxWidth: scale <= 1 ? '100%' : 'none',
              maxHeight: scale <= 1 ? '100%' : 'none',
              // When zoomed, use layout sizing based on natural dimensions
              width: scale > 1 && naturalSize.w ? `${naturalSize.w * scale}px` : 'auto',
              height: scale > 1 && naturalSize.h ? 'auto' : 'auto',
              marginLeft: 'auto',
              marginRight: 'auto',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
            draggable={false}
            onLoad={() => {
              const img = imageRef.current
              if (img) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
            }}
            onDoubleClick={handleDoubleClick}
            onTouchStart={() => {
              const now = Date.now()
              if (now - lastTapRef.current < 300) {
                // Double tap detected
                handleDoubleClick()
              }
              lastTapRef.current = now
            }}
          />
        </div>
      </div>
    </div>
  )
}

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageSrc: PropTypes.string,
  imageAlt: PropTypes.string,
}

export default ImageModal
