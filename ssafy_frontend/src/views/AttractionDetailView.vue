<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import LayoutBase from '@/components/LayoutBase.vue'
import { getCategoryName } from '@/utils/category'
import { loadKakaoMapSdk } from '@/utils/kakaoMapLoader'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const attraction = computed(() => {
  return dataStore.attractions.find(
    (item) => String(item.contentid) === String(route.params.id)
  )
})

const categoryName = computed(() => getCategoryName(attraction.value?.lcls_systm1))

let map = null
let marker = null
const mapError = ref('')

const createMap = (position) => {
  const container = document.getElementById('kakao-map')
  if (!container) return

  if (!map) {
    map = new window.kakao.maps.Map(container, {
      center: position,
      level: 3
    })
    marker = new window.kakao.maps.Marker({
      position,
      map
    })
  } else {
    map.setCenter(position)
    marker.setPosition(position)
  }
}

const geocodeAddress = (address) => {
  if (!window.kakao?.maps?.services) return

  const geocoder = new window.kakao.maps.services.Geocoder()
  geocoder.addressSearch(address, (result, status) => {
    if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
      const position = new window.kakao.maps.LatLng(result[0].y, result[0].x)
      createMap(position)
    }
  })
}

const renderMap = async () => {
  if (!attraction.value) return

  mapError.value = ''

  try {
    await loadKakaoMapSdk()
  } catch (error) {
    mapError.value = error.message
    console.error('카카오 지도 SDK 로딩 실패:', error)
    return
  }

  await nextTick()

  const lat = Number(attraction.value.mapy)
  const lng = Number(attraction.value.mapx)
  const address = attraction.value.addr1 || attraction.value.title

  if (lat && lng) {
    const position = new window.kakao.maps.LatLng(lat, lng)
    createMap(position)
  } else if (address) {
    geocodeAddress(address)
  } else {
    mapError.value = '표시할 좌표 또는 주소 정보가 없습니다.'
  }
}

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push({ name: 'Attractions' })
  }
}

onMounted(async () => {
  if (dataStore.attractions.length === 0) {
    await dataStore.loadAllDataAction()
  }
  await renderMap()
})

watch(() => route.params.id, () => {
  map = null
  marker = null
  renderMap()
})
</script>

<template>
  <LayoutBase>
    <section class="detail-view">
      <button type="button" class="back-btn" @click="goBack">
        ← 이전 탐색으로
      </button>

      <article v-if="attraction" class="detail-card">
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
          </dl>

          <div class="map-panel">
            <div v-if="mapError" class="map-error" role="alert">
              {{ mapError }}
            </div>
            <div id="kakao-map" class="kakao-map" :class="{ 'is-hidden': mapError }"></div>
          </div>
        </div>
      </article>
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

.kakao-map {
  width: 100%;
  height: 320px;
  border-radius: 12px;
}

.kakao-map.is-hidden {
  display: none;
}

.map-error {
  display: grid;
  min-height: 320px;
  padding: 24px;
  place-items: center;
  border-radius: 12px;
  background: #fff3f3;
  color: #b42318;
  line-height: 1.6;
  text-align: center;
}
</style>
