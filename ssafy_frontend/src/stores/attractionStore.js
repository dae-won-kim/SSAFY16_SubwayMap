import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAttractionStore = defineStore('attraction', () => {
  // State
  const attractions = ref([])
  const filteredAttractions = ref([])
  const selectedAttraction = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(6) // 페이지당 6개
  const totalCount = ref(0)

  // Getters
  const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
  })

  const paginatedAttractions = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredAttractions.value.slice(start, end)
  })

  // Actions
  const setAttractions = (data) => {
    attractions.value = data
    filteredAttractions.value = data
    totalCount.value = data.length
  }

  const setFilteredAttractions = (data) => {
    filteredAttractions.value = data
    totalCount.value = data.length
    currentPage.value = 1 // 필터 적용 시 첫 페이지로
  }

  const setSelectedAttraction = (attraction) => {
    selectedAttraction.value = attraction
  }

  const setIsLoading = (value) => {
    isLoading.value = value
  }

  const setError = (message) => {
    error.value = message
  }

  const setCurrentPage = (page) => {
    currentPage.value = page
  }

  const resetAttractions = () => {
    attractions.value = []
    filteredAttractions.value = []
    selectedAttraction.value = null
    currentPage.value = 1
    totalCount.value = 0
    error.value = null
  }

  return {
    attractions,
    filteredAttractions,
    selectedAttraction,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    paginatedAttractions,
    setAttractions,
    setFilteredAttractions,
    setSelectedAttraction,
    setIsLoading,
    setError,
    setCurrentPage,
    resetAttractions
  }
})