export const formatPackageName = (categoryName, code, prefixLen = 4) => {
  const cat = String(categoryName || '').replace(/\s+/g, '').toLowerCase().slice(0, prefixLen)
  const suffix = String(code || '').replace(/\s+/g, '').toLowerCase()
  return cat && suffix ? `${cat}-${suffix}` : (suffix || cat || '-')
}

export default {
  formatPackageName,
}
