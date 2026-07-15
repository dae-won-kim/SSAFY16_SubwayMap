<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/postStore'
import LayoutBase from '@/components/LayoutBase.vue'
import PasswordModal from '@/components/PasswordModal.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const modalMode = ref('edit')
const modalVisible = ref(false)
const passwordError = ref('')
const post = computed(() => postStore.getPostById(route.params.id))

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

onMounted(() => {
  postStore.initializeMockPosts()
  postStore.incrementViews(route.params.id)
})

const openPasswordModal = (mode) => {
  modalMode.value = mode
  passwordError.value = ''
  modalVisible.value = true
}

const closePasswordModal = () => {
  modalVisible.value = false
  passwordError.value = ''
}

const handlePasswordConfirm = (password) => {
  if (!post.value) return

  if (modalMode.value === 'edit') {
    if (!postStore.authorizeEdit(post.value.id, password)) {
      passwordError.value = '비밀번호가 일치하지 않습니다.'
      return
    }
    closePasswordModal()
    router.push({ name: 'PostEdit', params: { id: post.value.id } })
    return
  }

  if (!postStore.deleteWithPassword(post.value.id, password)) {
    passwordError.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  closePasswordModal()
  router.push({ name: 'Posts' })
}
</script>

<template>
  <LayoutBase>
    <section class="post-detail-view">
      <router-link :to="{ name: 'Posts' }" class="back-link">
        ← 게시글 목록
      </router-link>

      <article v-if="post" class="post-card">
        <header class="post-header">
          <span class="category">{{ post.category }}</span>
          <h1>{{ post.title }}</h1>
          <div class="metadata">
            <span>{{ formatDate(post.createdAt) }}</span>
            <span>조회 {{ post.views }}</span>
          </div>
        </header>

        <div class="post-content">{{ post.content }}</div>

        <footer class="post-actions">
          <button type="button" class="edit-btn" @click="openPasswordModal('edit')">
            수정
          </button>
          <button type="button" class="delete-btn" @click="openPasswordModal('delete')">
            삭제
          </button>
        </footer>
      </article>

      <div v-else class="not-found">
        <h1>게시글을 찾을 수 없습니다.</h1>
        <router-link :to="{ name: 'Posts' }">목록으로 돌아가기</router-link>
      </div>

      <PasswordModal
        :visible="modalVisible"
        :mode="modalMode"
        :error-message="passwordError"
        @confirm="handlePasswordConfirm"
        @cancel="closePasswordModal"
      />
    </section>
  </LayoutBase>
</template>

<style scoped>
.post-detail-view {
  width: 100%;
}

.back-link {
  display: inline-block;
  margin-bottom: 22px;
  color: #138496;
  text-decoration: none;
}

.post-card {
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: white;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.post-header {
  padding: 32px 36px;
  border-bottom: 1px solid #eee;
}

.category {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 999px;
  background: #e8f4f8;
  color: #138496;
  font-size: 12px;
  font-weight: 700;
}

.post-header h1 {
  margin: 16px 0;
  color: #222;
  font-size: 30px;
  line-height: 1.4;
}

.metadata {
  display: flex;
  gap: 18px;
  color: #888;
  font-size: 13px;
}

.post-content {
  min-height: 280px;
  padding: 36px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.post-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 36px;
  border-top: 1px solid #eee;
}

.post-actions button {
  padding: 10px 18px;
  border-radius: 7px;
  background: white;
  cursor: pointer;
}

.edit-btn {
  border: 1px solid #17a2b8;
  color: #138496;
}

.delete-btn {
  border: 1px solid #dc3545;
  color: #dc3545;
}

.not-found {
  padding: 80px 20px;
  border-radius: 12px;
  background: #f8f9fa;
  text-align: center;
}

@media (max-width: 640px) {
  .post-header,
  .post-content {
    padding: 24px 20px;
  }

  .post-header h1 {
    font-size: 24px;
  }

  .post-actions {
    padding: 18px 20px;
  }
}
</style>
