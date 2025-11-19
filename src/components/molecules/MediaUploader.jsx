import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'
import { mediaApi } from '../../lib/api.js'
import { ConfirmDialog } from './ConfirmDialog.jsx'
import { Spinner } from '../atoms/Spinner.jsx'

export default function MediaUploader({
  value = { imageFile: null, audioFile: null, imageUrl: '', audioUrl: '' },
  onChange,
  allowImage = true,
  allowAudio = true,
  label = 'Attach media (optional)',
  className = '',
  isPublished = false,
  onRequireUnpublish,
  scope,
  targetId,
  onMediaUploaded,
}) {
  const [dragOver, setDragOver] = React.useState(false)
  const [errorModal, setErrorModal] = React.useState({ open: false, title: '', message: '' })
  const inFlightRef = React.useRef(false)
  
  // Media size limits from env
  const envImageMb = React.useMemo(() => Number(typeof import.meta !== 'undefined' && import.meta?.env?.VITE_MEDIA_MAX_IMAGE_MB) || 5, [])
  const envAudioMb = React.useMemo(() => Number(typeof import.meta !== 'undefined' && import.meta?.env?.VITE_MEDIA_MAX_AUDIO_MB) || 15, [])
  
  // Allowed formats from env (with fallback defaults)
  const allowedImageMimes = React.useMemo(() => {
    const types = typeof import.meta !== 'undefined' && import.meta?.env?.VITE_MEDIA_ALLOWED_IMAGE_TYPES
    const list = types ? types.split(',').map(t => t.trim().toLowerCase()) : ['image/jpeg', 'image/png']
    return new Set(list)
  }, [])
  
  const allowedAudioMimes = React.useMemo(() => {
    const types = typeof import.meta !== 'undefined' && import.meta?.env?.VITE_MEDIA_ALLOWED_AUDIO_TYPES
    const list = types ? types.split(',').map(t => t.trim().toLowerCase()) : ['audio/mpeg', 'audio/mp3']
    return new Set(list)
  }, [])
  
  // Human-readable format lists for error messages
  const imageFormatsText = React.useMemo(() => 
    Array.from(allowedImageMimes).map(m => m.replace('image/', '').toUpperCase()).join(', '),
    [allowedImageMimes]
  )
  const audioFormatsText = React.useMemo(() => 
    Array.from(allowedAudioMimes).map(m => m.replace('audio/', '').toUpperCase()).join(', '),
    [allowedAudioMimes]
  )
  const [uploadingImage, setUploadingImage] = React.useState(false)
  const [uploadingAudio, setUploadingAudio] = React.useState(false)
  const [failedModal, setFailedModal] = React.useState({ open: false, message: '' })
  const [waitingForId, setWaitingForId] = React.useState(false)
  const imgPreview = React.useMemo(() => {
    if (value?.imageFile instanceof File) return URL.createObjectURL(value.imageFile)
    return value?.imageUrl || ''
  }, [value?.imageFile, value?.imageUrl])

  const audioPreview = React.useMemo(() => {
    if (value?.audioFile instanceof File) return URL.createObjectURL(value.audioFile)
    return value?.audioUrl || ''
  }, [value?.audioFile, value?.audioUrl])

  // If user selected a file but targetId is missing, show saving state and wait without erroring
  React.useEffect(() => {
    const hasLocalFile = (value?.imageFile instanceof File) || (value?.audioFile instanceof File)
    if (hasLocalFile && (!scope || !targetId)) {
      setWaitingForId(true)
    } else {
      setWaitingForId(false)
    }
  }, [value?.imageFile, value?.audioFile, scope, targetId])

  React.useEffect(() => {
    // Cleanup object URLs if they were created
    return () => {
      try {
        if (value?.imageFile instanceof File) URL.revokeObjectURL(imgPreview)
        if (value?.audioFile instanceof File) URL.revokeObjectURL(audioPreview)
      } catch (_) {}
    }
  }, [imgPreview, audioPreview, value?.imageFile, value?.audioFile])

  const handleFiles = (files) => {
    if (!files || files.length === 0) return
    let changed = false
    const next = { ...value }
    for (const f of files) {
      const type = (f.type || '').toLowerCase()
      const name = (f.name || '').toLowerCase()
      if (allowImage && type.startsWith('image/')) {
        if (!allowedImageMimes.has(type)) {
          setErrorModal({
            open: true,
            title: 'Unsupported Image Format',
            message: `Only ${imageFormatsText} formats are supported for images.`
          })
          continue
        }
        const tooBig = Number(f.size || 0) > envImageMb * 1024 * 1024
        if (tooBig) {
          setErrorModal({
            open: true,
            title: 'File Too Large',
            message: `Image size exceeds maximum allowed (${envImageMb}MB).`
          })
          continue
        }
        next.imageFile = f
        next.imageUrl = ''
        changed = true
      } else if (allowAudio && type.startsWith('audio/')) {
        if (!allowedAudioMimes.has(type)) {
          setErrorModal({
            open: true,
            title: 'Unsupported Audio Format',
            message: `Only ${audioFormatsText} formats are supported for audio.`
          })
          continue
        }
        const tooBig = Number(f.size || 0) > envAudioMb * 1024 * 1024
        if (tooBig) {
          setErrorModal({
            open: true,
            title: 'File Too Large',
            message: `Audio size exceeds maximum allowed (${envAudioMb}MB).`
          })
          continue
        }
        next.audioFile = f
        next.audioUrl = ''
        changed = true
      } else if (allowAudio && (type === 'audio/webm' || type === 'video/webm' || name.endsWith('.webm'))) {
        setErrorModal({
          open: true,
          title: 'Unsupported Format',
          message: `WebM format is not supported. Please use ${audioFormatsText} formats.`
        })
        continue
      } else if (allowAudio && type.startsWith('video/')) {
        setErrorModal({
          open: true,
          title: 'Invalid File Type',
          message: `Video files are not supported. Please use ${audioFormatsText} audio formats.`
        })
        continue
      } else {
        if (f && (allowImage || allowAudio)) {
          const supported = []
          if (allowImage) supported.push(`Images (${imageFormatsText})`)
          if (allowAudio) supported.push(`Audio (${audioFormatsText})`)
          setErrorModal({
            open: true,
            title: 'Unsupported File Type',
            message: `Supported formats: ${supported.join(' or ')}`
          })
        }
        continue
      }
    }
    if (changed) onChange?.(next)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    if (isPublished) { onRequireUnpublish?.(); return }
    const dt = e.dataTransfer
    if (!dt) return
    const files = dt.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isPublished) setDragOver(true)
  }

  const onDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const removeImage = async () => {
    if (isPublished) { onRequireUnpublish?.(); return }
    
    // If there's a server URL, delete from server first
    if (value?.imageUrl && scope && targetId) {
      try {
        await mediaApi.delete(targetId, { scope, type: 'IMAGE' })
      } catch (e) {
        console.warn('Failed to delete image from server:', e)
      }
    }
    
    onChange?.({ ...value, imageFile: null, imageUrl: '' })
    // Notify parent to persist once after delete
    onMediaUploaded?.()
  }

  const removeAudio = async () => {
    if (isPublished) { onRequireUnpublish?.(); return }
    
    // If there's a server URL, delete from server first
    if (value?.audioUrl && scope && targetId) {
      try {
        await mediaApi.delete(targetId, { scope, type: 'AUDIO' })
      } catch (e) {
        console.warn('Failed to delete audio from server:', e)
      }
    }
    
    onChange?.({ ...value, audioFile: null, audioUrl: '' })
    // Notify parent to persist once after delete
    onMediaUploaded?.()
  }

  const openFileDialog = (accept) => {
    if (isPublished) { onRequireUnpublish?.(); return }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = true
    input.onchange = (ev) => {
      const files = ev.target.files
      if (files) handleFiles(files)
    }
    input.click()
  }

  const acceptTypes = [
    allowImage ? Array.from(allowedImageMimes).join(',') : null,
    allowAudio ? Array.from(allowedAudioMimes).join(',') : null,
  ].filter(Boolean).join(',')

  const upload = async (file, type) => {
      const fd = new FormData()
      fd.append('file', file)
      if (scope) fd.append('scope', scope)
      if (targetId) fd.append('targetId', String(targetId))
      if (type) fd.append('mediaType', type)
      // retry up to 2 times on transient network/server errors
      const transient = new Set([0, 502, 503, 504])
      let attempt = 0
       
      while (true) {
        const res = await mediaApi.upload(fd)
        if (res?.ok && res.data?.asset?.publicUrl) {
          return res.data.asset.publicUrl
        }
        if (res && res.status === 413) {
          setErrorModal({
            open: true,
            title: 'File Too Large',
            message: res?.error || 'File exceeds maximum allowed size.'
          })
          return null
        }
        if (attempt < 2 && transient.has(res?.status || 0)) {
          attempt += 1
          await new Promise(r => setTimeout(r, 400 * attempt))
          continue
        }
        throw new Error(res?.error || 'UPLOAD_FAILED')
      }
  }

  const doUpload = React.useCallback(async () => {
    if (isPublished) return
    // Avoid uploading without identifier; wait until targetId becomes available
    const hasLocalFile = (value?.imageFile instanceof File) || (value?.audioFile instanceof File)
    if (hasLocalFile && (!scope || !targetId)) {
      setWaitingForId(true)
      return
    }
    setWaitingForId(false)
    if (inFlightRef.current) return
    inFlightRef.current = true
    try {
      let changed = false
      let hadSuccess = false
      let next = { ...value }
      if (value?.imageFile instanceof File) {
        const t = (value.imageFile.type || '').toLowerCase()
        if (!allowedImageMimes.has(t)) {
          setErrorModal({
            open: true,
            title: 'Unsupported Image Format',
            message: `Only ${imageFormatsText} formats are supported for images.`
          })
          next.imageFile = null
          next.imageUrl = next.imageUrl || ''
          changed = true
        } else {
          const tooBig = value.imageFile.size > envImageMb * 1024 * 1024
          if (tooBig) {
            setErrorModal({
              open: true,
              title: 'File Too Large',
              message: `Image size exceeds maximum allowed (${envImageMb}MB).`
            })
            next.imageFile = null
            next.imageUrl = next.imageUrl || ''
            changed = true
          } else {
            setUploadingImage(true)
            const url = await upload(value.imageFile, 'IMAGE')
            if (url) {
              next.imageUrl = url
              next.imageFile = null
              changed = true
              hadSuccess = true
            } else {
              next.imageFile = null
              next.imageUrl = next.imageUrl || ''
              changed = true
            }
            setUploadingImage(false)
          }
        }
      }
      if (value?.audioFile instanceof File) {
        const t = (value.audioFile.type || '').toLowerCase();
        if (!allowedAudioMimes.has(t)) {
          setErrorModal({
            open: true,
            title: 'Unsupported Audio Format',
            message: `Only ${audioFormatsText} formats are supported for audio.`
          });
          next.audioFile = null;
          next.audioUrl = next.audioUrl || '';
          changed = true;
        } else {
          const tooBig = value.audioFile.size > envAudioMb * 1024 * 1024;
          if (tooBig) {
            setErrorModal({
              open: true,
              title: 'File Too Large',
              message: `Audio size exceeds maximum allowed (${envAudioMb}MB).`
            });
            next.audioFile = null;
            next.audioUrl = next.audioUrl || '';
            changed = true;
          } else {
            setUploadingAudio(true);
            const url = await upload(value.audioFile, 'AUDIO');
            if (url) {
              next.audioUrl = url;
              next.audioFile = null;
              changed = true;
              hadSuccess = true;
            } else {
              next.audioFile = null;
              next.audioUrl = next.audioUrl || '';
              changed = true;
            }
            setUploadingAudio(false);
          }
        }
      }
      if (changed) onChange?.(next);
      if (hadSuccess) onMediaUploaded?.();
    } catch (_) {
      setUploadingImage(false);
      setUploadingAudio(false);
      setFailedModal({ open: true, message: 'Upload failed' });
      // clear files to avoid repeated auto-retry loop
      try {
        const cleared = { ...value }
        if (cleared.imageFile instanceof File) { cleared.imageFile = null }
        if (cleared.audioFile instanceof File) { cleared.audioFile = null }
        onChange?.(cleared)
      } catch (_) {}
    }
    finally { inFlightRef.current = false }
  }, [
    isPublished,
    value,
    scope,
    targetId,
    allowedImageMimes,
    allowedAudioMimes,
    envImageMb,
    envAudioMb,
    imageFormatsText,
    audioFormatsText,
    upload,
    onChange,
    onMediaUploaded
  ]);

  React.useEffect(() => {
    doUpload();
  }, [doUpload]);

  // Lightweight retry while waiting for ID: if user already selected a file but targetId isn't ready yet,
  // re-attempt upload periodically so it starts as soon as IDs arrive (without reload)
  React.useEffect(() => {
    if (!waitingForId) return undefined
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      if (scope && targetId) {
        await doUpload()
        return
      }
      // re-check shortly
      timer = setTimeout(tick, 700)
    }
    let timer = setTimeout(tick, 700)
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [waitingForId, scope, targetId])

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
    <ConfirmDialog
      open={errorModal.open}
      onClose={() => setErrorModal({ open: false, title: '', message: '' })}
      onConfirm={() => setErrorModal({ open: false, title: '', message: '' })}
      title={errorModal.title || 'Error'}
      message={errorModal.message}
      confirmText="OK"
      hideCancel
    />
    <ConfirmDialog
      isOpen={failedModal.open}
      onClose={() => setFailedModal({ open: false, message: '' })}
      onConfirm={() => setFailedModal({ open: false, message: '' })}
      type="info"
      title="Media failed to load"
      message={failedModal.message || 'Unable to load the media.'}
      confirmText="OK"
      cancelText=""
    />
    {label && (
      <div className="mb-2 text-sm font-medium text-gray-700">{label}</div>
    )}

      <div
        className={[
          'rounded-[10px] border border-dashed transition-colors',
          dragOver ? 'border-[#007a33] bg-[#f6fffa]' : 'border-gray-300 bg-white',
          'p-4'
        ].join(' ')}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openFileDialog(acceptTypes)
          }
        }}
      >
        <div className="text-center text-gray-500">
          <p className="text-sm">Drag and drop image/audio here, or click to browse.</p>
          {waitingForId && (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <Spinner size={16} />
              <span>Waiting for question id…</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-center gap-2">
            {allowImage && (
              <button
                type="button"
                className={[classes.button.base, classes.button.ghost, 'h-9 px-3 text-sm'].join(' ')}
                onClick={(e) => { e.stopPropagation(); openFileDialog('image/*') }}
              >
                Upload Image
              </button>
            )}
            {allowAudio && (
              <button
                type="button"
                className={[classes.button.base, classes.button.ghost, 'h-9 px-3 text-sm'].join(' ')}
                onClick={(e) => { e.stopPropagation(); openFileDialog('audio/*') }}
              >
                Upload Audio
              </button>
            )}
          </div>
        </div>

        {allowImage && (uploadingImage || imgPreview) && (
          <div className="mt-4 flex items-start gap-3">
            <div className="relative h-24 w-32 bg-gray-50 border border-gray-200 rounded-md overflow-hidden">
              {imgPreview && (
                <img
                  src={imgPreview}
                  alt="Uploaded"
                  className="w-full h-full object-contain"
                  onError={() => {
                    setFailedModal({ open: true, message: 'Failed to load image' })
                    onChange?.({ ...value, imageFile: null, imageUrl: '' })
                  }}
                />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 grid place-items-center rounded-md bg-white/70">
                  <Spinner size={24} />
                </div>
              )}
            </div>
            <button
              type="button"
              className={[classes.button.base, classes.button.outline, 'h-9 px-3 text-sm'].join(' ')}
              onClick={(e) => { e.stopPropagation(); removeImage() }}
            >
              Remove Image
            </button>
          </div>
        )}

        {allowAudio && (uploadingAudio || audioPreview) && (
          <div className="mt-4 flex items-start gap-3">
            <div className="relative h-10 w-72">
              {audioPreview && (
                <audio
                  controls
                  src={audioPreview}
                  preload="metadata"
                  controlsList="nodownload noplaybackrate noremoteplayback"
                  onContextMenu={(e) => e.preventDefault()}
                  className="h-10 w-72"
                  onSeeking={(e) => { try { if (e?.target) { e.target.currentTime = e.target._lastTime || 0 } } catch(_) {} }}
                  onTimeUpdate={(e) => { try { if (e?.target) { e.target._lastTime = e.target.currentTime } } catch(_) {} }}
                  onError={() => {
                    setFailedModal({ open: true, message: 'Failed to load audio' })
                    onChange?.({ ...value, audioFile: null, audioUrl: '' })
                  }}
                >
                  Your browser does not support the audio element.
                </audio>
              )}
              {uploadingAudio && (
                <div className="absolute inset-0 grid place-items-center rounded-md bg-white/70">
                  <Spinner size={24} />
                </div>
              )}
            </div>
            <button
              type="button"
              className={[classes.button.base, classes.button.outline, 'h-9 px-3 text-sm shrink-0'].join(' ')}
              onClick={(e) => { e.stopPropagation(); removeAudio() }}
            >
              Remove Audio
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

MediaUploader.propTypes = {
  value: PropTypes.shape({
    imageFile: PropTypes.any,
    audioFile: PropTypes.any,
    imageUrl: PropTypes.string,
    audioUrl: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  allowImage: PropTypes.bool,
  allowAudio: PropTypes.bool,
  label: PropTypes.string,
  className: PropTypes.string,
  isPublished: PropTypes.bool,
  onRequireUnpublish: PropTypes.func,
}