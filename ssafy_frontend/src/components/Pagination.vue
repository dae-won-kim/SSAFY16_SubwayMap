<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['change'])

const goToPage = (page) => {
  if (page >= 1 && page <= props.totalPages) {
    emit('change', page)
  }
}

const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(props.totalPages, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})
</script>

<template>
  <div class="pagination">
    <!-- 이전 페이지 -->
    <button
      class="pag-btn prev"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      ‹ 이전
    </button>

    <!-- 페이지 번호 -->
    <div class="pag-numbers">
      <button
        v-if="pageNumbers[0] > 1"
        class="pag-btn"
        @click="goToPage(1)"
      >
        1
      </button>
      <span v-if="pageNumbers[0] > 2" class="ellipsis">...</span>

      <button
        v-for="page in pageNumbers"
        :key="page"
        class="pag-btn"
        :class="{ active: page === currentPage }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <span v-if="pageNumbers[pageNumbers.length - 1] < totalPages - 1" class="ellipsis">...</span>
      <button
        v-if="pageNumbers[pageNumbers.length - 1] < totalPages"
        class="pag-btn"
        @click="goToPage(totalPages)"
      >
        {{ totalPages }}
      </button>
    </div>

    <!-- 다음 페이지 -->
    <button
      class="pag-btn next"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      다음 ›
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 20px;
}

.pag-numbers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.pag-btn {
  padding: 8px 12px;
  min-width: 36px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.pag-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  border-color: #17a2b8;
  color: #17a2b8;
}

.pag-btn.active {
  background-color: #17a2b8;
  color: white;
  border-color: #17a2b8;
  font-weight: 600;
}

.pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ellipsis {
  color: #999;
}
</style>
