<script setup>
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { usePostStore } from '@/stores/postStore'
import LayoutBase from '@/components/LayoutBase.vue'

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const isEditMode = computed(() => route.name === 'PostEdit')
const isSubmitting = ref(false)
const formError = ref('')
const canLeave = ref(false)
const form = ref({
  title: '',
  content: '',
  password: ''
})

onMounted(async () => {
  if (!isEditMode.value) return

  const post = await postStore.getPostById(route.params.id)
  if (!post) {
    canLeave.value = true
    router.replace({ name: 'Posts' })
    return
  }

  if (!postStore.isEditAuthorized(route.params.id)) {
    canLeave.value = true
    router.replace({ name: 'PostDetail', params: { id: route.params.id } })
    return
  }

  form.value = {
    title: post.title,
    content: post.content,
    password: ''
  }
})

onBeforeRouteLeave(() => {
  if (canLeave.value) return true
  if (isEditMode.value) postStore.clearEditAuthorization()
  return true
})

const validate = () => {
  if (!form.value.title.trim()) return '제목을 입력해주세요.'
  if (!form.value.content.trim()) return '내용을 입력해주세요.'
  if (!isEditMode.value && !form.value.password) return '비밀번호를 입력해주세요.'
  if (form.value.title.trim().length > 200) return '제목은 200자 이하로 입력해주세요.'
  return ''
}

const submit = async () => {
  formError.value = validate()
  if (formError.value) return

  isSubmitting.value = true

  if (isEditMode.value) {
    const updated = await postStore.updateAuthorizedPost(route.params.id, form.value)
    if (!updated) {
      formError.value = postStore.error || '게시글 수정에 실패했습니다.'
      isSubmitting.value = false
      return
    }
    canLeave.value = true
    router.push({ name: 'PostDetail', params: { id: route.params.id } })
    return
  }

  const createdPost = await postStore.createPost(form.value)
  if (!createdPost) {
    formError.value = postStore.error || '게시글 생성에 실패했습니다.'
    isSubmitting.value = false
    return
  }
  canLeave.value = true
  router.push({ name: 'PostDetail', params: { id: createdPost.id } })
}
</script>

<template>
  <LayoutBase>
    <section class="post-form-view">
      <header class="form-header">
        <h1>{{ isEditMode ? '게시글 수정' : '새 게시글 작성' }}</h1>
        <p>
          {{
            isEditMode
              ? '게시글 내용을 수정합니다.'
              : '수정과 삭제에 사용할 비밀번호를 반드시 기억해주세요.'
          }}
        </p>
      </header>

      <form class="post-form" @submit.prevent="submit">
        <div class="form-group">
          <label for="post-title">제목</label>
          <input
            id="post-title"
            v-model="form.title"
            type="text"
            maxlength="200"
            placeholder="제목을 입력하세요"
          />
        </div>

        <!-- category removed for anonymous board -->

        <div class="form-group">
          <label for="post-content">내용</label>
          <textarea
            id="post-content"
            v-model="form.content"
            rows="12"
            placeholder="공유할 내용을 입력하세요"
          ></textarea>
        </div>

        <div v-if="!isEditMode" class="form-group">
          <label for="post-password">비밀번호</label>
          <input
            id="post-password"
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            placeholder="수정·삭제 시 사용할 비밀번호"
          />
          <small>비밀번호는 화면에 다시 표시되지 않습니다.</small>
        </div>

        <p v-if="formError" class="form-error" role="alert">
          {{ formError }}
        </p>

        <div class="form-actions">
          <button
            type="button"
            class="cancel-btn"
            @click="router.push(isEditMode
              ? { name: 'PostDetail', params: { id: route.params.id } }
              : { name: 'Posts' })"
          >
            취소
          </button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            {{ isEditMode ? '수정 완료' : '등록하기' }}
          </button>
        </div>
      </form>
    </section>
  </LayoutBase>
</template>

<style scoped>
.post-form-view {
  width: min(820px, 100%);
  margin: 0 auto;
}

.form-header {
  margin-bottom: 28px;
}

.form-header h1 {
  margin: 0 0 8px;
  color: #222;
  font-size: 30px;
}

.form-header p {
  color: #777;
  font-size: 14px;
}

.post-form {
  padding: 32px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: white;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.05);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 22px;
}

.form-group label {
  color: #333;
  font-size: 14px;
  font-weight: 700;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  background: white;
  color: #333;
  font: inherit;
}

.form-group textarea {
  resize: vertical;
  line-height: 1.6;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: 3px solid rgba(23, 162, 184, 0.15);
  border-color: #17a2b8;
}

.form-group small {
  color: #888;
  font-size: 12px;
}

.form-error {
  margin: 0 0 18px;
  padding: 12px 14px;
  border-radius: 7px;
  background: #fff0f0;
  color: #c82333;
  font-size: 13px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 8px;
}

.form-actions button {
  padding: 11px 22px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.cancel-btn {
  border: 1px solid #ddd;
  background: white;
  color: #555;
}

.submit-btn {
  border: 1px solid #17a2b8;
  background: #17a2b8;
  color: white;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .post-form {
    padding: 24px 20px;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .form-actions button {
    width: 100%;
  }
}
</style>
