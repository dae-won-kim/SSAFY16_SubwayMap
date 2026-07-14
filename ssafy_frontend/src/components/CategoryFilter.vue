<script setup>
import { useCommonStore } from '@/stores/commonStore'

const commonStore = useCommonStore()

const categories = [
  { code: 'VE', label: '자연·경관', icon: '🏞️', count: 353 },
  { code: 'HS', label: '역사·문화', icon: '🏛️', count: 228 },
  { code: 'EX', label: '체험·레포츠', icon: '🎢', count: 111 },
  { code: 'NA', label: '자연생태', icon: '🌿', count: 91 }
]

const toggleCategory = (code) => {
  if (commonStore.selectedCategory === code) {
    commonStore.setSelectedCategory(null)
  } else {
    commonStore.setSelectedCategory(code)
  }
}
</script>

<template>
  <div class="category-filter">
    <label class="label">분류</label>
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.code"
        class="category-btn"
        :class="{ active: commonStore.selectedCategory === cat.code }"
        @click="toggleCategory(cat.code)"
      >
        <span class="icon">{{ cat.icon }}</span>
        <span class="name">{{ cat.label }}</span>
        <span class="count">{{ cat.count }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.category-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.category-btn:hover {
  background-color: #f0f8fa;
  border-color: #17a2b8;
}

.category-btn.active {
  background-color: #e8f4f8;
  border-color: #17a2b8;
}

.icon {
  font-size: 18px;
  min-width: 24px;
}

.name {
  flex: 1;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.count {
  color: #999;
  font-size: 12px;
}

.category-btn.active .name {
  color: #17a2b8;
  font-weight: 600;
}
</style>