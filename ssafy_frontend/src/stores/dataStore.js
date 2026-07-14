import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  loadData,
  loadAllData,
  getItems,
  filterByDistance,
  searchByKeyword,
  DATA_TYPES
} from '../services/dataService'

export const useDataStore = defineStore('data', () => {
  const allData = ref({})
  const isLoading = ref(false)
  const error = ref(null)

  const searchKeyword = ref('')
  const selectedCenter = ref({ lat: 37.5665, lng: 126.9780 })
  const selectedRadius = ref(1)

  const attractions = computed(() => allData.value[DATA_TYPES.ATTRACTION]?.items || [])
  const cultures = computed(() => allData.value[DATA_TYPES.CULTURE]?.items || [])
  const festivals = computed(() => allData.value[DATA_TYPES.FESTIVAL]?.items || [])
  const travelCourses = computed(() => allData.value[DATA_TYPES.TRAVEL_COURSE]?.items || [])
  const sports = computed(() => allData.value[DATA_TYPES.SPORTS]?.items || [])
  const accommodations = computed(() => allData.value[DATA_TYPES.ACCOMMODATION]?.items || [])
  const shopping = computed(() => allData.value[DATA_TYPES.SHOPPING]?.items || [])

  const allItems = computed(() => {
    return [
      ...attractions.value,
      ...cultures.value,
      ...festivals.value,
      ...travelCourses.value,
      ...sports.value,
      ...accommodations.value,
      ...shopping.value
    ]
  })

  const searchedItems = computed(() => {
    return searchByKeyword(allItems.value, searchKeyword.value)
  })

  const nearbyItems = computed(() => {
    return filterByDistance(
      searchedItems.value,
      selectedCenter.value.lat,
      selectedCenter.value.lng,
      selectedRadius.value
    )
  })

  const loadAllDataAction = async () => {
    isLoading.value = true
    error.value = null
    try {
      const data = await loadAllData()
      allData.value = data
    } catch (err) {
      error.value = err.message
      console.error('Failed to load all data:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadDataByType = async (type) => {
    isLoading.value = true
    error.value = null
    try {
      const data = await loadData(type)
      allData.value[type] = data
    } catch (err) {
      error.value = err.message
      console.error(`Failed to load ${type}:`, err)
    } finally {
      isLoading.value = false
    }
  }

  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
  }

  const setSelectedCenter = (lat, lng) => {
    selectedCenter.value = { lat, lng }
  }

  const setSelectedRadius = (radius) => {
    selectedRadius.value = radius
  }

  const getItemsByType = (type) => {
    return allData.value[type]?.items || []
  }

  const getItemById = (id) => {
    return allItems.value.find(item => item.contentid === id)
  }

  const resetFilters = () => {
    searchKeyword.value = ''
    selectedCenter.value = { lat: 37.5665, lng: 126.9780 }
    selectedRadius.value = 1
  }

  return {
    allData,
    isLoading,
    error,
    searchKeyword,
    selectedCenter,
    selectedRadius,
    attractions,
    cultures,
    festivals,
    travelCourses,
    sports,
    accommodations,
    shopping,
    allItems,
    searchedItems,
    nearbyItems,
    loadAllDataAction,
    loadDataByType,
    setSearchKeyword,
    setSelectedCenter,
    setSelectedRadius,
    getItemsByType,
    getItemById,
    resetFilters
  }
})