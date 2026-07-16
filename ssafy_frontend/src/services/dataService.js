import { api, getApiErrorMessage } from '../api'

const DATA_TYPES = {
  ATTRACTION: 'attraction',
  CULTURE: 'culture',
  FESTIVAL: 'festival',
  TRAVEL_COURSE: 'travel_course',
  SPORTS: 'sports',
  ACCOMMODATION: 'accommodation',
  SHOPPING: 'shopping'
}

const PAGE_SIZE = 200
const dataCache = new Map()

// 백엔드 Location 응답을 기존 화면에서 사용하는 관광지 형태로 변환한다.
function normalizeItem(item) {
  return {
    id: item.id,
    contentid: String(item.id),
    source_content_id: item.content_id ?? '',
    title: item.name ?? '',
    addr1: item.address ?? '',
    addr2: '',
    first_image: item.description ?? '',
    lcls_systm1: item.category ?? '',
    gu_name: item.gu_name ?? '',
    mapx: item.mapx ?? '',
    mapy: item.mapy ?? ''
  }
}

async function fetchAllAttractions() {
  const items = []
  let skip = 0

  while (true) {
    const response = await api.get('/attractions', {
      params: { skip, limit: PAGE_SIZE }
    })
    const page = Array.isArray(response.data) ? response.data : []

    items.push(...page.map(normalizeItem))

    if (page.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }

  return { items }
}

export async function loadData(type) {
  if (dataCache.has(type)) {
    return dataCache.get(type)
  }

  try {
    // 현재 백엔드는 locations를 관광지 API 하나로 제공한다.
    // 지원하지 않는 기존 JSON 분류는 빈 목록으로 유지한다.
    const data = type === DATA_TYPES.ATTRACTION
      ? await fetchAllAttractions()
      : { items: [] }

    dataCache.set(type, data)
    return data
  } catch (error) {
    console.error(`Error loading data for ${type}:`, error)
    throw new Error(getApiErrorMessage(error))
  }
}

export async function loadAllData() {
  const attractionData = await loadData(DATA_TYPES.ATTRACTION)

  return Object.fromEntries(
    Object.values(DATA_TYPES).map(type => [
      type,
      type === DATA_TYPES.ATTRACTION ? attractionData : { items: [] }
    ])
  )
}

export async function getItems(type) {
  const data = await loadData(type)
  return data.items || []
}

export function filterByDistance(items, centerLat, centerLng, radiusKm = 1) {
  return items.filter(item => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      parseFloat(item.mapy),
      parseFloat(item.mapx)
    )
    return distance <= radiusKm
  })
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return deg * (Math.PI / 180)
}

export function searchByKeyword(items, keyword) {
  if (!keyword) return items

  const lowerKeyword = keyword.toLowerCase()
  return items.filter(item =>
    item.title.toLowerCase().includes(lowerKeyword) ||
    item.addr1.toLowerCase().includes(lowerKeyword)
  )
}

export { DATA_TYPES }
