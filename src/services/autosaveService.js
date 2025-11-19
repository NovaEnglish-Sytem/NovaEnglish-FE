import { questionsApi } from '../lib/api.js'

const typeMap = {
  MCQ: 'MULTIPLE_CHOICE',
  TFNG: 'TRUE_FALSE_NOT_GIVEN',
  SHORT: 'SHORT_ANSWER',
}

// Ensure a page has a server ID; creates placeholder if needed
export async function ensurePageId(packageId, page) {
  if (page?.id) return { id: page.id, created: false }
  const res = await questionsApi.createPagePlaceholder(packageId, {})
  if (!res?.ok || !res?.data?.page?.id) throw new Error(res?.error || 'FAILED_CREATE_PAGE')
  return { id: res.data.page.id, created: true, page: res.data.page }
}

// Ensure a question item has a server ID under a page; creates placeholder if needed
export async function ensureItemId(pageId, feType) {
  const dbType = typeMap[feType] || 'MULTIPLE_CHOICE'
  const res = await questionsApi.createItemPlaceholder(pageId, { type: dbType })
  if (!res?.ok || !res?.data?.item?.id) throw new Error(res?.error || 'FAILED_CREATE_ITEM')
  return { id: res.data.item.id, created: true, item: res.data.item }
}
