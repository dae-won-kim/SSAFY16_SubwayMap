<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePostStore } from '@/stores/postStore'
import LayoutBase from '@/components/LayoutBase.vue'
import Pagination from '@/components/Pagination.vue'
import PasswordModal from '@/components/PasswordModal.vue'
import PostTable from '@/components/PostTable.vue'

const router = useRouter()
const postStore = usePostStore()
const currentPage = ref(1)
const pageSize = 10
const selectedPost = ref(null)
const modalMode = ref('edit')
const modalVisible = ref(false)
const passwordError = ref('')

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(postStore.posts.length / pageSize))
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return postStore.posts.slice(start, start + pageSize)
})

onMounted(() => {
  postStore.initializeMockPosts()
})

const openPasswordModal = (mode, post) => {
  selectedPost.value = post
  modalMode.value = mode
  passwordError.value = ''
  modalVisible.value = true
}

const closePasswordModal = () => {
  modalVisible.value = false
  selectedPost.value = null
  passwordError.value = ''
}

const handlePasswordConfirm = (password) => {
  const post = selectedPost.value
  if (!post) return

  if (modalMode.value === 'edit') {
    if (!postStore.authorizeEdit(post.id, password)) {
      passwordError.value = '비밀번호가 일치하지 않습니다.'
      return
    }
    closePasswordModal()
    router.push({ name: 'PostEdit', params: { id: post.id } })
    return
  }

  if (!postStore.deleteWithPassword(post.id, password)) {
    passwordError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  closePasswordModal()
}

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <LayoutBase>
    <section class="post-list-view">
      <header class="page-header">
        <div>
          <h1>익명 게시판</h1>
          <p>로그인 없이 서울 지역 정보를 자유롭게 공유해보세요.</p>
        </div>
        <router-link :to="{ name: 'PostCreate' }" class="create-link">
          ✏️ 글쓰기
        </router-link>
      </header>

      <div class="notice">
        수정과 삭제에는 게시글 작성 시 입력한 비밀번호가 필요합니다.
      </div>

      <div class="table-card">
        <PostTable
          :posts="paginatedPosts"
          @view="router.push({ name: 'PostDetail', params: { id: $event.id } })"
          @edit="openPasswordModal('edit', $event)"
          @delete="openPasswordModal('delete', postStore.getPostById($event))"
        />
      </div>

      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="handlePageChange"
      />

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
.post-list-view {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 8px;
  color: #222;
  font-size: 30px;
}

.page-header p {
  color: #777;
  font-size: 14px;
}

.create-link {
  flex: 0 0 auto;
  padding: 12px 22px;
  border-radius: 8px;
  background: #17a2b8;
  color: white;
  font-weight: 600;
  text-decoration: none;
}

.notice {
  margin-bottom: 18px;
  padding: 13px 16px;
  border-left: 4px solid #17a2b8;
  border-radius: 6px;
  background: #eaf6f8;
  color: #456;
  font-size: 13px;
}

.table-card {
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 12px;
  background: white;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .create-link {
    width: 100%;
    text-align: center;
  }
}
</style>
