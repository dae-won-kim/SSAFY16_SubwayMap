<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import { useCommonStore } from '@/stores/commonStore'
import LayoutBase from '@/components/LayoutBase.vue'
import StationSearch from '@/components/StationSearch.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import AttractionCard from '@/components/AttractionCard.vue'
import Pagination from '@/components/Pagination.vue'

const dataStore = useDataStore()
const commonStore = useCommonStore()
const route = useRoute()
const router = useRouter()

const currentPage = ref(1)
const pageSize = 6
const sortOption = ref('title')
const sortDirection = ref('asc')
let isApplyingRoute = false

const firstQueryValue = (value) => {
  return Array.isArray(value) ? value[0] : value
}

const buildQuery = () => {
  const query = {}

  if (commonStore.selectedStation) {
    query.q = commonStore.selectedStation
  }
  if (commonStore.selectedCategory) {
    query.category = commonStore.selectedCategory
  }
  if (sortOption.value !== 'title') {
    query.sort = sortOption.value
  }
  if (sortDirection.value !== 'asc') {
    query.direction = sortDirection.value
  }
  if (currentPage.value > 1) {
    query.page = String(currentPage.value)
  }

  return query
}

const queriesMatch = (left, right) => {
  const leftEntries = Object.entries(left)
  const rightEntries = Object.entries(right)

  return leftEntries.length === rightEntries.length &&
    leftEntries.every(([key, value]) => firstQueryValue(right[key]) === value)
}

const syncRoute = () => {
  if (isApplyingRoute) return

  const query = buildQuery()
  if (!queriesMatch(query, route.query)) {
    router.push({ name: 'Attractions', query })
  }
}

const applyRouteQuery = async (query) => {
  isApplyingRoute = true

  const category = firstQueryValue(query.category)
  const querySort = firstQueryValue(query.sort)
  const direction = firstQueryValue(query.direction)
  const page = Number.parseInt(firstQueryValue(query.page), 10)

  commonStore.setSelectedStation(firstQueryValue(query.q) || '')
  commonStore.setSelectedCategory(
    typeof category === 'string' && category ? category : null
  )
  sortOption.value = ['title', 'category'].includes(querySort)
    ? querySort
    : 'title'
  sortDirection.value = direction === 'desc' ? 'desc' : 'asc'
  currentPage.value = Number.isInteger(page) && page > 0 ? page : 1

  await nextTick()
  isApplyingRoute = false
}

watch(
  () => route.query,
  (query) => applyRouteQuery(query),
  { deep: true, immediate: true }
)

watch(
  () => [
    commonStore.selectedCategory,
    commonStore.selectedStation,
    sortOption.value,
    sortDirection.value
  ],
  () => {
    if (isApplyingRoute) return
    currentPage.value = 1
    syncRoute()
  }
)

watch(currentPage, () => {
  syncRoute()
})

onMounted(() => {
  dataStore.loadAllDataAction()
})

const filteredLocations = computed(() => {
  let items = dataStore.allItems

  if (commonStore.selectedCategory) {
    items = items.filter(
      item => item.lcls_systm1 === commonStore.selectedCategory
    )
  }

  if (commonStore.selectedStation) {
    items = items.filter(item =>
      item.title
        .toLowerCase()
        .includes(commonStore.selectedStation.toLowerCase()) ||
      item.addr1
        .toLowerCase()
        .includes(commonStore.selectedStation.toLowerCase())
    )
  }

  return items
})

const sortedLocations = computed(() => {
  return [...filteredLocations.value].sort((a, b) => {
    const getField = (item) => {
      if (sortOption.value === 'category') {
        return item.lcls_systm1 || ''
      }
      return item.title || ''
    }

    const aVal = getField(a).toString()
    const bVal = getField(b).toString()
    const result = aVal.localeCompare(bVal, 'ko', {
      numeric: true,
      sensitivity: 'base'
    })

    return sortDirection.value === 'asc' ? result : -result
  })
})

const totalPages = computed(() => {
  return Math.ceil(sortedLocations.value.length / pageSize)
})

const paginatedLocations = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return sortedLocations.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSearch = () => {
  currentPage.value = 1
  syncRoute()
}

const handleSortChange = () => {
  currentPage.value = 1
  syncRoute()
}

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
}
</script>

<template>
  <LayoutBase>
    <div class="attraction-view">
      <div class="attraction-container">
        <aside class="sidebar">
          <StationSearch @search="handleSearch" />
          <hr class="divider" />
          <CategoryFilter />

          <div class="additional-info">
            <p class="info-text">💡 팁: 역 이름이나 장소명을 입력하세요</p>
          </div>
        </aside>

        <main class="main-content">
          <div class="result-header">
            <div class="result-header-top">
              <div>
                <h2 class="result-title">검색 결과</h2>
                <p class="result-count">
                  총 <strong>{{ filteredLocations.length }}</strong>개의 서울 지역 정보
                </p>
              </div>

              <div class="result-controls">
                <label class="sort-label">
                  정렬
                  <select v-model="sortOption" @change="handleSortChange">
                    <option value="title">이름순</option>
                    <option value="category">카테고리순</option>
                  </select>
                </label>

                <button
                  type="button"
                  class="sort-direction-btn"
                  @click="toggleSortDirection"
                >
                  {{ sortDirection === 'asc' ? '오름차순' : '내림차순' }}
                </button>
              </div>
            </div>
          </div>

          <div v-if="dataStore.isLoading" class="loading">
            <p>데이터를 불러오는 중입니다...</p>
          </div>

          <div v-else-if="dataStore.error" class="error">
            <p>❌ {{ dataStore.error }}</p>
          </div>

          <div v-else-if="filteredLocations.length === 0" class="empty">
            <p>검색 결과가 없습니다.</p>
            <p class="empty-hint">다른 키워드나 필터를 시도해보세요.</p>
          </div>

          <div v-else class="attractions-grid">
            <AttractionCard
              v-for="location in paginatedLocations"
              :key="location.contentid"
              :attraction="location"
            />
          </div>

          <Pagination
            v-if="totalPages > 1"
            :current-page="currentPage"
            :total-pages="totalPages"
            @change="handlePageChange"
          />
        </main>
      </div>
    </div>
  </LayoutBase>
</template>

<style scoped>
.attraction-view {
  width: 100%;
  min-width: 0;
}

.attraction-container {
  display: grid;
  grid-template-columns: minmax(240px, 280px) minmax(0, 1fr);
  gap: 40px;
  width: 100%;
  min-width: 0;
}

.sidebar {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 12px;
  height: fit-content;
  position: sticky;
  top: 100px;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 30px 0;
}

.additional-info {
  margin-top: 30px;
  padding: 20px;
  background-color: #e8f4f8;
  border-radius: 8px;
  border-left: 4px solid #17a2b8;
}

.info-text {
  margin: 0;
  font-size: 12px;
  color: #333;
  line-height: 1.5;
}

.main-content {
  width: 100%;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.result-header {
  margin-bottom: 30px;
}

.result-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  min-width: 0;
}

.result-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-left: auto;
  min-width: 0;
}

.sort-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
}

.sort-label select {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 8px 10px;
  background: white;
  color: #333;
  font-size: 14px;
}

.sort-direction-btn {
  border: 1px solid #17a2b8;
  background: #e8f4f8;
  color: #17a2b8;
  border-radius: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.sort-direction-btn:hover {
  background: #d0eef5;
  transform: translateY(-1px);
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
}

.result-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.result-count strong {
  color: #17a2b8;
  font-weight: 700;
}

.loading,
.error,
.empty {
  padding: 60px 20px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 40px;
}

.loading p,
.error p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.empty p {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.empty-hint {
  font-size: 13px;
  color: #999;
  margin-top: 8px !important;
}

.attractions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 24px;
  grid-auto-rows: 1fr;
  align-items: start;
  margin-bottom: 40px;
  width: 100%;
  min-width: 0;
}

.attractions-grid > * {
  align-self: stretch;
}

@media (max-width: 1024px) {
  .attraction-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }

  .sidebar {
    position: static;
    width: 100%;
  }

  .attractions-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  }
}

@media (max-width: 768px) {
  .sidebar {
    padding: 20px;
  }

  .result-title {
    font-size: 20px;
  }

  .result-header-top {
    align-items: stretch;
  }

  .result-controls {
    width: 100%;
    margin-left: 0;
  }

  .attractions-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
