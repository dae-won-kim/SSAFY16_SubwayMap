<script setup>
defineProps({
  posts: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['view', 'edit', 'delete'])

const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
</script>

<template>
  <div class="post-table-wrapper">
    <div v-if="posts.length === 0" class="empty-state">
      <p>작성된 게시글이 없습니다.</p>
    </div>

    <table v-else class="post-table">
      <thead>
        <tr>
          <th class="col-number">번호</th>
          <th class="col-title">제목</th>
          <th class="col-date">작성일</th>
          <th class="col-views">조회</th>
          <th class="col-actions">관리</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(post, index) in posts" :key="post.id" class="post-row">
          <td class="col-number">{{ index + 1 }}</td>
          <td class="col-title">
            <a href="#" @click.prevent="$emit('view', post)" class="post-link">
              {{ post.title }}
            </a>
          </td>
          <td class="col-date">{{ formatDate(post.createdAt) }}</td>
          <td class="col-views">{{ post.views }}</td>
          <td class="col-actions">
            <button class="action-btn edit" @click="$emit('edit', post)">수정</button>
            <button class="action-btn delete" @click="$emit('delete', post.id)">삭제</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.post-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.post-table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
}

.post-table thead {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
}

.post-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #495057;
}

.post-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #dee2e6;
  font-size: 13px;
}

.post-row:hover {
  background-color: #f8f9fa;
}

.col-number {
  width: 50px;
  text-align: center;
}

.col-title {
  flex: 1;
}

.col-date {
  width: 100px;
  text-align: center;
}

.col-views {
  width: 60px;
  text-align: center;
}

.col-actions {
  width: 120px;
  text-align: center;
}

.post-link {
  color: #17a2b8;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s ease;
}

.post-link:hover {
  color: #138496;
  text-decoration: underline;
}

.action-btn {
  padding: 4px 8px;
  margin: 0 2px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: #17a2b8;
  color: #17a2b8;
}

.action-btn.delete:hover {
  border-color: #dc3545;
  color: #dc3545;
}
</style>
