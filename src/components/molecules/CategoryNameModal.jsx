import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Modal from '../atoms/Modal.jsx'
import { classes } from '../../config/theme/tokens.js'

export const CategoryNameModal = ({
  isOpen,
  initialName = '',
  title = 'Category',
  confirmText = 'Save',
  onCancel,
  onSave,
  validateUnique = () => null,
}) => {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '')
      setError(null)
      setSaving(false)
    }
  }, [isOpen, initialName])

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    const trimmed = (name || '').trim()
    // FE validations
    if (!trimmed) {
      setError('Category name is required')
      return
    }
    const uniqueErr = validateUnique(trimmed)
    if (uniqueErr) {
      setError(uniqueErr)
      return
    }

    try {
      setSaving(true)
      await Promise.resolve(onSave(trimmed))
    } catch (err) {
      setError(err?.message || 'Failed to save')
      setSaving(false)
      return
    }
    setSaving(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => (!saving ? onCancel?.() : null)}
      className="p-5"
      ariaLabelledby="category-modal-title"
      lockScroll={false}
    >
      <form onSubmit={handleSubmit}>
        <h2 id="category-modal-title" className="text-lg font-semibold text-gray-700 mb-3">
          {title}
        </h2>

        <label className="block text-sm text-gray-600 mb-2">
          Category Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (error) setError(null)
          }}
          placeholder="Enter category name"
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#76c043]"
          disabled={saving}
        />

        {error && (
          <div className="mt-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={[classes.button.base, classes.button.outline, 'h-[34px] px-4'].join(' ')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={[classes.button.base, classes.button.primary, 'h-[34px] px-4'].join(' ')}
          >
            {saving ? 'Saving...' : confirmText}
          </button>
        </div>
      </form>
    </Modal>
  )
}

CategoryNameModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  initialName: PropTypes.string,
  title: PropTypes.string,
  confirmText: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  validateUnique: PropTypes.func,
}

export default CategoryNameModal
