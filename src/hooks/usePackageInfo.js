import { useEffect, useState, useCallback } from 'react'
import { packagesApi } from '../lib/api.js'

export default function usePackageInfo(packageId) {
  const [packageTitle, setPackageTitle] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const refresh = useCallback(async () => {
    if (!packageId) return
    setLoading(true)
    setError(null)
    try {
      const res = await packagesApi.get(packageId)
      const p = res?.data?.package || res?.data || {}
      setPackageTitle(p.title || '')
      setCategoryName(p.categoryName || p.category?.name || '')
      // Backend now returns `status` enum; keep legacy fallback for safety
      setIsPublished((p.status && String(p.status).toUpperCase() === 'PUBLISHED') || !!p.isPublished)
    } catch (e) {
      setError(e?.message || 'Failed to load package info')
    } finally {
      setLoading(false)
    }
  }, [packageId])

  useEffect(() => { refresh() }, [refresh])

  const publish = useCallback(async () => {
    await packagesApi.publish(packageId)
    setIsPublished(true)
  }, [packageId])

  const unpublish = useCallback(async () => {
    await packagesApi.unpublish(packageId)
    setIsPublished(false)
  }, [packageId])

  const deletePkg = useCallback(async () => {
    setDeleting(true)
    try {
      await packagesApi.delete(packageId)
    } finally {
      setDeleting(false)
    }
  }, [packageId])

  return {
    packageTitle,
    categoryName,
    isPublished,
    loading,
    error,
    deleting,
    refresh,
    publish,
    unpublish,
    deletePackage: deletePkg,
  }
}
