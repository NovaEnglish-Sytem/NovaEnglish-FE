import React from 'react'
import PropTypes from 'prop-types'
import { classes } from '../../config/theme/tokens.js'

const ActionsFooter = ({ onCancel, onSaveDraft, onPreview, onPublish, onUnpublish, canPublish, isPublishing, isSaving, isPublished, hasUnsavedChanges, saveStatus, lastSavedAt }) => {
  const statusText = React.useMemo(() => {
    if (saveStatus === 'saving') return 'Saving…'
    if (saveStatus === 'saved' && lastSavedAt) {
      try {
        const d = new Date(lastSavedAt)
        const h = String(d.getHours()).padStart(2, '0')
        const m = String(d.getMinutes()).padStart(2, '0')
        const s = String(d.getSeconds()).padStart(2, '0')
        return `Saved at ${h}:${m}:${s}`
      } catch { return 'Saved' }
    }
    if (saveStatus === 'offline') return 'Offline – autosave paused'
    if (saveStatus === 'error') return 'Autosave failed'
    if (hasUnsavedChanges) return 'Unsaved changes'
    return ''
  }, [saveStatus, lastSavedAt, hasUnsavedChanges])

  return (
    <div className="sticky bottom-0 border-t border-gray-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75 px-4 py-3 rounded-b-[12px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-gray-500 min-h-[20px]">
          {statusText}
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap">
        <button
          type="button"
          onClick={onCancel}
          className={[classes.button.base, classes.button.ghost, 'h-10 px-4'].join(' ')}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={isSaving || isPublished || !hasUnsavedChanges}
          className={[
            classes.button.base,
            classes.button.outline,
            'h-10 px-4',
            (isSaving || isPublished || !hasUnsavedChanges) ? 'opacity-50 cursor-not-allowed' : ''
          ].join(' ')}
          title={isPublished ? 'Unpublish to edit and save changes' : (!hasUnsavedChanges ? 'No changes to save' : undefined)}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          type="button"
          onClick={onPreview}
          className={[classes.button.base, classes.button.outline, 'h-10 px-4'].join(' ')}
        >
          Preview
        </button>
        {isPublished ? (
          <button
            type="button"
            onClick={onUnpublish}
            disabled={isPublishing}
            className={[classes.button.base, classes.button.outline, 'h-10 px-4'].join(' ')}
          >
            {isPublishing ? 'Working...' : 'Unpublish'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish || isPublishing}
            className={[
              classes.button.base,
              classes.button.primary,
              'h-10 px-4',
              (!canPublish || isPublishing) ? 'opacity-50 cursor-not-allowed' : ''
            ].join(' ')}
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        )}
        </div>
      </div>
    </div>
  )
}

ActionsFooter.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUnpublish: PropTypes.func.isRequired,
  canPublish: PropTypes.bool.isRequired,
  isPublishing: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  isPublished: PropTypes.bool.isRequired,
  hasUnsavedChanges: PropTypes.bool.isRequired,
  saveStatus: PropTypes.string,
  lastSavedAt: PropTypes.any,
}

export default ActionsFooter
