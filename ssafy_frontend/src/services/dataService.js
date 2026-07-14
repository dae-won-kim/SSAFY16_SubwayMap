const DATA_TYPES = {
  ATTRACTION: 'attraction',
  CULTURE: 'culture',
  FESTIVAL: 'festival',
  TRAVEL_COURSE: 'travel_course',
  SPORTS: 'sports',
  ACCOMMODATION: 'accommodation',
  SHOPPING: 'shopping'
}

const DATA_FILES = {
  [DATA_TYPES.ATTRACTION]: '/data/서울_관광지.json',
  [DATA_TYPES.CULTURE]: '/data/서울_문화시설.json',
  [DATA_TYPES.FESTIVAL]: '/data/서울_축제공연행사.json',
  [DATA_TYPES.TRAVEL_COURSE]: '/data/서울_여행코스.json',
  [DATA_TYPES.SPORTS]: '/data/서울_레포츠.json',
  [DATA_TYPES.ACCOMMODATION]: '/data/서울_숙박.json',
  [DATA_TYPES.SHOPPING]: '/data/서울_쇼핑.json'
}

const dataCache = new Map()

export async function loadData(type) {
  if (dataCache.has(type)) {
    return dataCache.get(type)
  }

  try {
    const filePath = DATA_FILES[type]
    if (!filePath) {
      throw new Error(`Unknown data type: ${type}`)
    }

    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`Failed to load ${type} data`)
    }

    const data = await response.json()
    dataCache.set(type, data)
    return data
  } catch (error) {
    console.error(`Error loading data for ${type}:`, error)
    throw error
  }
}

export async function loadAllData() {
  try {
    const promises = Object.values(DATA_TYPES).map(type => loadData(type))
    const results = await Promise.all(promises)
    
    const allData = {}
    Object.values(DATA_TYPES).forEach((type, index) => {
      allData[type] = results[index]
    })
    
    return allData
  } catch (error) {
    console.error('Error loading all data:', error)
    throw error
  }
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

export { DATA_TYPES, DATA_FILES }