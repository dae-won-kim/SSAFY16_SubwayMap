<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'edit',
    validator: value => ['edit', 'delete'].includes(value)
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['confirm', 'cancel'])
const password = ref('')
const passwordInput = ref(null)

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    password.value = ''
    await nextTick()
    passwordInput.value?.focus()
  }
)

const submit = () => {
  if (!password.value) return
  emit('confirm', password.value)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="modal-backdrop"
      role="presentation"
      @click.self="$emit('cancel')"
    >
      <section
        class="password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        <h2 id="password-modal-title">
          {{ mode === 'delete' ? '게시글 삭제' : '게시글 수정' }}
        </h2>
        <p class="modal-description">
          작성할 때 등록한 비밀번호를 입력해주세요.
        </p>

        <form @submit.prevent="submit">
          <label for="post-password">비밀번호</label>
          <input
            id="post-password"
            ref="passwordInput"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="비밀번호 입력"
          />
          <p v-if="errorMessage" class="error-message" role="alert">
            {{ errorMessage }}
          </p>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="$emit('cancel')">
              취소
            </button>
            <button
              type="submit"
              class="confirm-btn"
              :class="{ danger: mode === 'delete' }"
              :disabled="!password"
            >
              {{ mode === 'delete' ? '삭제하기' : '확인' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.45);
}

.password-modal {
  width: min(420px, 100%);
  padding: 28px;
  border-radius: 14px;
  background: white;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.password-modal h2 {
  margin: 0 0 10px;
  color: #222;
  font-size: 22px;
}

.modal-description {
  margin: 0 0 24px;
  color: #666;
  font-size: 14px;
}

.password-modal label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.password-modal input {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #d8d8d8;
  border-radius: 8px;
  font: inherit;
}

.password-modal input:focus {
  outline: 3px solid rgba(23, 162, 184, 0.15);
  border-color: #17a2b8;
}

.error-message {
  margin: 10px 0 0;
  color: #dc3545;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.modal-actions button {
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  border: 1px solid #ddd;
  background: white;
  color: #555;
}

.confirm-btn {
  border: 1px solid #17a2b8;
  background: #17a2b8;
  color: white;
}

.confirm-btn.danger {
  border-color: #dc3545;
  background: #dc3545;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
