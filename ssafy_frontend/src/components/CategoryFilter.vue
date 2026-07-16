<script setup>
import { computed } from 'vue'
import { useCommonStore } from '@/stores/commonStore'
import { useDataStore } from '@/stores/dataStore'
import { CATEGORY_ORDER, getCategoryIcon, getCategoryName } from '@/utils/category'

const commonStore = useCommonStore()
const dataStore = useDataStore()

const categories = computed(() => {
  const counts = new Map()

  dataStore.allItems.forEach(item => {
    const code = item.lcls_systm1
    if (!code) return
    counts.set(code, (counts.get(code) || 0) + 1)
  })

  return Array.from(counts, ([code, count]) => ({
    code,
    label: getCategoryName(code),
    icon: getCategoryIcon(code),
    count
  })).sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.code)
    const bIndex = CATEGORY_ORDER.indexOf(b.code)
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) -
      (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex)
  })
})

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
