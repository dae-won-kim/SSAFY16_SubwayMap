import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCommonStore = defineStore('common', () => {
  // State
  const selectedStation = ref('')
  const radius = ref(1000) // 기본 1000m
  const selectedCategory = ref(null)

  // Actions
  const setSelectedStation = (station) => {
    selectedStation.value = station
  }

  const setRadius = (value) => {
    radius.value = value
  }

  const setSelectedCategory = (category) => {
    selectedCategory.value = category
  }

  const resetFilters = () => {
    selectedStation.value = ''
    radius.value = 1000
    selectedCategory.value = null
  }

  return {
    selectedStation,
    radius,
    selectedCategory,
    setSelectedStation,
    setRadius,
    setSelectedCategory,
    resetFilters
  }
})