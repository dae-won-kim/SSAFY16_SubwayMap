<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/dataStore'
import { useCommonStore } from '@/stores/commonStore'
import LayoutBase from '@/components/LayoutBase.vue'
import StationSearch from '@/components/StationSearch.vue'
import CategoryFilter from '@/components/CategoryFilter.vue'
import AttractionCard from '@/components/AttractionCard.vue'
import Pagination from '@/components/Pagination.vue'

const dataStore = useDataStore()
const commonStore = useCommonStore()

const currentPage = ref(1)
const pageSize = 6

onMounted(() => {
  dataStore.loadAllDataAction()
})

const filteredAttractions = computed(() => {
  let items = dataStore.attractions

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

const totalPages = computed(() => {
  return Math.ceil(filteredAttractions.value.length / pageSize)
})

const paginatedAttractions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredAttractions.value.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSearch = () => {
  currentPage.value = 1
}
</script>

<template>
  <LayoutBase>
    <div class="attraction-view">
      <div class="attraction-container">
        <!-- 왼쪽 사이드바 -->
        <aside class="sidebar">
          <StationSearch @search="handleSearch" />
          <hr class="divider" />
          <CategoryFilter />

          <div class="additional-info">
            <p class="info-text">💡 팁: 역 이름이나 장소명을 입력하세요</p>
          </div>
        </aside>

        <!-- 메인 콘텐츠 -->
        <main class="main-content">
          <!-- 결과 헤더 -->
          <div class="result-header">
            <h2 class="result-title">검색 결과</h2>
            <p class="result-count">
              총 <strong>{{ filteredAttractions.length }}</strong>개의 관광지
            </p>
          </div>

          <!-- 로딩 상태 -->
          <div v-if="dataStore.isLoading" class="loading">
            <p>데이터를 불러오는 중입니다...</p>
          </div>

          <!-- 에러 상태 -->
          <div v-else-if="dataStore.error" class="error">
            <p>❌ {{ dataStore.error }}</p>
          </div>

          <!-- 결과 없음 -->
          <div v-else-if="filteredAttractions.length === 0" class="empty">
            <p>검색 결과가 없습니다.</p>
            <p class="empty-hint">다른 키워드나 필터를 시도해보세요.</p>
          </div>

          <!-- 관광지 그리드 -->
          <div v-else class="attractions-grid">
            <AttractionCard
              v-for="attraction in paginatedAttractions"
              :key="attraction.contentid"
              :attraction="attraction"
            />
          </div>

          <!-- 페이지네이션 -->
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
}

.attraction-container {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 40px;
}

/* 사이드바 */
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

/* 메인 콘텐츠 */
.main-content {
  width: 100%;
}

.result-header {
  margin-bottom: 30px;
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

/* 상태 메시지 */
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

/* 관광지 그리드 */
.attractions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* 반응형 */
@media (max-width: 1024px) {
  .attraction-container {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }

  .attractions-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .sidebar {
    padding: 20px;
  }

  .result-title {
    font-size: 20px;
  }

  .attractions-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
}
</style>