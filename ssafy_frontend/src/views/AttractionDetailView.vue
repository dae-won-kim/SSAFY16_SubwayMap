<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import LayoutBase from '@/components/LayoutBase.vue'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const categoryNames = {
  VE: '자연·경관',
  HS: '역사·문화',
  EX: '체험·레포츠',
  NA: '자연생태'
}

const attraction = computed(() => {
  return dataStore.attractions.find(
    (item) => String(item.contentid) === String(route.params.id)
  )
})

const categoryName = computed(() => {
  return categoryNames[attraction.value?.lcls_systm1] || '기타'
})

const mapUrl = computed(() => {
  if (!attraction.value) return '#'

  const keyword = [attraction.value.title, attraction.value.addr1]
    .filter(Boolean)
    .join(' ')
  return `https://map.naver.com/p/search/${encodeURIComponent(keyword)}`
})

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'Attractions' })
  }
}

onMounted(() => {
  if (dataStore.attractions.length === 0) {
    dataStore.loadAllDataAction()
  }
})
</script>

<template>
  <LayoutBase>
    <section class="detail-view">
      <button type="button" class="back-btn" @click="goBack">
        ← 이전 탐색으로
      </button>

      <div v-if="dataStore.isLoading" class="state-box">
        관광지 정보를 불러오는 중입니다...
      </div>

      <div v-else-if="dataStore.error" class="state-box error">
        {{ dataStore.error }}
      </div>

      <article v-else-if="attraction" class="detail-card">
        <div class="detail-image-wrap">
          <img
            v-if="attraction.first_image"
            class="detail-image"
            :src="attraction.first_image"
            :alt="attraction.title"
          />
          <div v-else class="image-placeholder">이미지가 없습니다</div>
        </div>

        <div class="detail-content">
          <span class="category-badge">{{ categoryName }}</span>
          <h1>{{ attraction.title }}</h1>

          <dl class="info-list">
            <div>
              <dt>주소</dt>
              <dd>{{ attraction.addr1 || '주소 정보 없음' }} {{ attraction.addr2 }}</dd>
            </div>
            <div v-if="attraction.tel">
              <dt>전화</dt>
              <dd>{{ attraction.tel }}</dd>
            </div>
            <div v-if="attraction.zipcode">
              <dt>우편번호</dt>
              <dd>{{ attraction.zipcode }}</dd>
            </div>
            <div>
              <dt>콘텐츠 ID</dt>
              <dd>{{ attraction.contentid }}</dd>
            </div>
          </dl>

          <a
            class="map-link"
            :href="mapUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 지도에서 보기 ↗
          </a>
        </div>
      </article>

      <div v-else class="state-box">
        <h2>관광지 정보를 찾을 수 없습니다.</h2>
        <router-link :to="{ name: 'Attractions' }">관광지 목록으로 이동</router-link>
      </div>
    </section>
  </LayoutBase>
</template>

<style scoped>
.detail-view {
  width: 100%;
}

.back-btn {
  margin-bottom: 24px;
  padding: 10px 16px;
  border: 1px solid #d7d7d7;
  border-radius: 8px;
  background: white;
  color: #444;
  cursor: pointer;
}

.back-btn:hover {
  border-color: #17a2b8;
  color: #17a2b8;
}

.detail-card {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  overflow: hidden;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.detail-image-wrap {
  min-height: 480px;
  background: #f2f2f2;
}

.detail-image {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 480px;
  object-fit: cover;
}

.image-placeholder {
  display: grid;
  min-height: 480px;
  place-items: center;
  color: #999;
}

.detail-content {
  padding: 48px 40px;
}

.category-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e8f4f8;
  color: #138496;
  font-size: 13px;
  font-weight: 700;
}

.detail-content h1 {
  margin: 18px 0 32px;
  color: #222;
  font-size: 32px;
  line-height: 1.35;
}

.info-list {
  margin: 0 0 32px;
}

.info-list > div {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #eee;
}

.info-list dt {
  color: #777;
  font-size: 14px;
  font-weight: 600;
}

.info-list dd {
  margin: 0;
  color: #333;
  line-height: 1.6;
}

.map-link {
  display: inline-flex;
  padding: 12px 18px;
  border-radius: 8px;
  background: #17a2b8;
  color: white;
  font-weight: 600;
  text-decoration: none;
}

.state-box {
  padding: 80px 20px;
  border-radius: 12px;
  background: #f8f9fa;
  color: #555;
  text-align: center;
}

.state-box.error {
  color: #b42318;
}

@media (max-width: 820px) {
  .detail-card {
    grid-template-columns: 1fr;
  }

  .detail-image-wrap,
  .detail-image,
  .image-placeholder {
    min-height: 300px;
  }

  .detail-content {
    padding: 30px 24px;
  }

  .detail-content h1 {
    font-size: 26px;
  }
}
</style>
