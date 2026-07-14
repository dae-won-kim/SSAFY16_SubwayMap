<script setup>
import { ref } from 'vue'
import { useCommonStore } from '@/stores/commonStore'

const commonStore = useCommonStore()
const stationInput = ref('')

const popularStations = [
  '홍대입구',
  '강남역',
  '명동역',
  '동대문역',
  '명동',
  '종로3가',
  '이태원',
  '여의도'
]

const handleSearch = () => {
  if (stationInput.value.trim()) {
    commonStore.setSelectedStation(stationInput.value)
  }
}

const selectStation = (station) => {
  stationInput.value = station
  commonStore.setSelectedStation(station)
}

const handleKeyup = (e) => {
  if (e.key === 'Enter') {
    handleSearch()
  }
}
</script>

<template>
  <div class="station-search">
    <div class="search-box">
      <label class="label">지하철역 기준 검색</label>
      <div class="input-wrapper">
        <input
          v-model="stationInput"
          type="text"
          placeholder="역명 입력 (예: 홍대입구)"
          class="search-input"
          @keyup="handleKeyup"
        />
        <button class="search-btn" @click="handleSearch">
          🔍 검색
        </button>
      </div>
    </div>

    <!-- 인기 역 -->
    <div class="popular-stations">
      <p class="subtitle">인기 검색역</p>
      <div class="station-tags">
        <button
          v-for="station in popularStations"
          :key="station"
          class="station-tag"
          @click="selectStation(station)"
        >
          {{ station }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.station-search {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #17a2b8;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.search-btn {
  padding: 10px 20px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.search-btn:hover {
  background-color: #138496;
}

.popular-stations {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subtitle {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.station-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.station-tag {
  padding: 6px 12px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.station-tag:hover {
  background-color: #e8f4f8;
  border-color: #17a2b8;
  color: #17a2b8;
}
</style>