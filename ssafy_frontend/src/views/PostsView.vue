<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePostStore } from '@/stores/postStore'
import LayoutBase from '@/components/LayoutBase.vue'
import PostTable from '@/components/PostTable.vue'
import Pagination from '@/components/Pagination.vue'

const postStore = usePostStore()
const showCreateForm = ref(false)

// 폼 데이터
const formData = ref({
  title: '',
  content: '',
  category: '질문',
  password: ''
})

// Mock 데이터 초기화
onMounted(() => {
  if (postStore.posts.length === 0) {
    const mockPosts = [
      {
        id: 12,
        title: '경주공원 아기길 잔디기는 최고네요',
        content: '지난주에 경주공원에 가봤는데 정말 좋았어요!',
        category: '질문',
        createdAt: new Date('2026-07-14'),
        views: 42,
        password: '1234'
      },
      {
        id: 11,
        title: '홍대 같은 구멍 추천요',
        content: '홍대 같은 분위기의 장소를 찾고 있어요',
        category: '공유',
        createdAt: new Date('2026-07-13'),
        views: 15,
        password: '1234'
      },
      {
        id: 10,
        title: '이런 공원 핫스팟 추천해',
        content: '서울에서 숨겨진 공원을 찾고 있습니다',
        category: '정보',
        createdAt: new Date('2026-07-12'),
        views: 108,
        password: '1234'
      },
      {
        id: 9,
        title: '관광지중 숨겨진 맛집 말고 경치 좋은 곳',
        content: '경치 좋은 관광지를 찾고 있어요',
        category: '기타',
        createdAt: new Date('2026-07-10'),
        views: 256,
        password: '1234'
      },
      {
        id: 8,
        title: '번산 정원 심싱실은 잘 모르겠어',
        content: '번산 정원에 대해 알고 싶습니다',
        category: '정보',
        createdAt: new Date('2026-07-09'),
        views: 33,
        password: '1234'
      },
      {
        id: 7,
        title: '실제 가본 경험기 공유',
        content: '저의 경험을 공유합니다',
        category: '공유',
        createdAt: new Date('2026-07-08'),
        views: 47,
        password: '1234'
      },
      {
        id: 6,
        title: '서울에서 제일 조용한',
        content: '조용한 장소를 찾고 있어요',
        category: '질문',
        createdAt: new Date('2026-07-07'),
        views: 89,
        password: '1234'
      },
      {
        id: 5,
        title: '가족 여행 좋은 곳',
        content: '가족과 함께 가기 좋은 관광지',
        category: '정보',
        createdAt: new Date('2026-07-06'),
        views: 201,
        password: '1234'
      }
    ]
    postStore.setPosts(mockPosts)
  }
})

// 페이지네이션
const pageSize = 10
const currentPage = ref(1)

const totalPages = computed(() => {
  return Math.ceil(postStore.posts.length / pageSize)
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return postStore.posts.slice(start, end)
})

const handlePageChange = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 게시글 작성
const handleCreatePost = () => {
  if (!formData.value.title.trim() || !formData.value.content.trim()) {
    alert('제목과 내용을 입력해주세요')
    return
  }

  if (!formData.value.password.trim()) {
    alert('비밀번호를 입력해주세요')
    return
  }

  const newPost = {
    id: Math.max(...postStore.posts.map(p => p.id), 0) + 1,
    title: formData.value.title,
    content: formData.value.content,
    category: formData.value.category,
    createdAt: new Date(),
    views: 0,
    password: formData.value.password
  }

  postStore.addPost(newPost)
  resetForm()
  showCreateForm.value = false
  alert('게시글이 작성되었습니다')
}

const resetForm = () => {
  formData.value = {
    title: '',
    content: '',
    category: '질문',
    password: ''
  }
}

const handleViewPost = (post) => {
  alert(`제목: ${post.title}\n\n내용: ${post.content}`)
}

const handleEditPost = (post) => {
  const password = prompt('비밀번호를 입력해주세요:')
  if (password === post.password) {
    alert('수정 기능은 준비 중입니다')
  } else if (password !== null) {
    alert('비밀번호가 맞지 않습니다')
  }
}

const handleDeletePost = (id) => {
  const password = prompt('비밀번호를 입력해주세요:')
  const post = postStore.posts.find(p => p.id === id)

  if (password === post.password) {
    if (confirm('정말 삭제하시겠습니까?')) {
      postStore.deletePost(id)
      alert('게시글이 삭제되었습니다')
    }
  } else if (password !== null) {
    alert('비밀번호가 맞지 않습니다')
  }
}
</script>

<template>
  <LayoutBase>
    <div class="posts-view">
      <!-- 글쓰기 버튼 -->
      <div class="posts-header">
        <h2 class="posts-title">익명 게시판</h2>
        <button class="create-btn" @click="showCreateForm = !showCreateForm">
          ✏️ 글쓰기
        </button>
      </div>

      <!-- 글쓰기 폼 -->
      <div v-if="showCreateForm" class="create-form-container">
        <div class="create-form">
          <h3>새 게시글 작성</h3>

          <div class="form-group">
            <label>제목</label>
            <input
              v-model="formData.title"
              type="text"
              placeholder="제목을 입력하세요"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>분류</label>
            <select v-model="formData.category" class="form-select">
              <option>질문</option>
              <option>공유</option>
              <option>정보</option>
              <option>기타</option>
            </select>
          </div>

          <div class="form-group">
            <label>내용</label>
            <textarea
              v-model="formData.content"
              placeholder="내용을 입력하세요"
              class="form-textarea"
              rows="6"
            ></textarea>
          </div>

          <div class="form-group">
            <label>비밀번호 (수정/삭제 시 필요)</label>
            <input
              v-model="formData.password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              class="form-input"
            />
          </div>

          <div class="form-actions">
            <button class="btn-submit" @click="handleCreatePost">
              작성하기
            </button>
            <button class="btn-cancel" @click="showCreateForm = false">
              취소
            </button>
          </div>
        </div>
      </div>

      <!-- 게시글 테이블 -->
      <div class="posts-table-wrapper">
        <PostTable
          :posts="paginatedPosts"
          @view="handleViewPost"
          @edit="handleEditPost"
          @delete="handleDeletePost"
        />
      </div>

      <!-- 페이지네이션 -->
      <Pagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="handlePageChange"
      />
    </div>
  </LayoutBase>
</template>

<style scoped>
.posts-view {
  width: 100%;
}

/* 헤더 */
.posts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.posts-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #333;
}

.create-btn {
  padding: 12px 24px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background-color: #138496;
  transform: translateY(-2px);
}

/* 글쓰기 폼 */
.create-form-container {
  background-color: #f9f9f9;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 40px;
}

.create-form {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
}

.create-form h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.form-input,
.form-select,
.form-textarea {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #17a2b8;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.form-textarea {
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-submit {
  flex: 1;
  padding: 12px;
  background-color: #17a2b8;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-submit:hover {
  background-color: #138496;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background-color: #e9ecef;
  color: #333;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background-color: #dee2e6;
}

/* 테이블 래퍼 */
.posts-table-wrapper {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 30px;
}

/* 반응형 */
@media (max-width: 768px) {
  .posts-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
  }

  .posts-title {
    font-size: 22px;
  }

  .create-btn {
    width: 100%;
  }

  .create-form {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>