<script setup>
import { ref, watch } from 'vue'
import { getCategoryName } from '@/utils/category'

const props = defineProps({
  attraction: {
    type: Object,
    required: true
  },
  distance: {
    type: Number,
    default: null
  }
})

const imageFailed = ref(false)

watch(
  () => props.attraction.first_image,
  () => {
    imageFailed.value = false
  }
)

const handleImageError = () => {
  imageFailed.value = true
}

const formatAddress = (addr = '') => {
  return addr.split(' ').slice(0, 3).join(' ')
}
</script>

<template>
  <router-link
    class="attraction-card"
    :to="{ name: 'AttractionDetail', params: { id: attraction.contentid } }"
    :aria-label="`${attraction.title} 상세보기`"
  >
    <!-- 이미지 -->
    <div class="card-image">
      <img
        v-if="attraction.first_image && !imageFailed"
        :src="attraction.first_image"
        :alt="attraction.title"
        @error="handleImageError"
      />
      <div v-else class="image-fallback">
        <span aria-hidden="true">🗺️</span>
        <span>이미지 없음</span>
      </div>
      <div v-if="distance" class="distance-badge">
        {{ Math.round(distance * 100) / 100 }} km
      </div>
    </div>

    <!-- 콘텐츠 -->
    <div class="card-content">
      <h3 class="title">{{ attraction.title }}</h3>
      <p class="address">
        📍 {{ formatAddress(attraction.addr1) }}
      </p>
      <p class="category">
        {{ getCategoryName(attraction.lcls_systm1) }}
      </p>
    </div>
  </router-link>
</template>

<style scoped>
.attraction-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.attraction-card:focus-visible {
  outline: 3px solid rgba(23, 162, 184, 0.35);
  outline-offset: 3px;
}

.attraction-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-image {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-content: center;
  gap: 6px;
  background: #eef4f5;
  color: #789;
  text-align: center;
  font-size: 13px;
}

.image-fallback span:first-child {
  font-size: 32px;
}

.attraction-card:hover .card-image img {
  transform: scale(1.05);
}

.distance-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(23, 162, 184, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.card-content {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.address {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category {
  margin: 0;
  font-size: 11px;
  color: #17a2b8;
  font-weight: 500;
}
</style>
