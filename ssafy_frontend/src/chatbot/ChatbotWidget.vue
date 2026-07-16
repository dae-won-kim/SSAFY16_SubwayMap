<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from './chatStore'
import { useCommonStore } from '../stores/commonStore'

const chatStore = useChatStore()
const commonStore = useCommonStore()
const router = useRouter()
const userInput = ref('')
const messageListRef = ref(null)
const showHistoryPanel = ref(false)
const showClearConfirm = ref(false)
const showClearNotice = ref(false)
let clearNoticeTimer = null

onMounted(() => {
  chatStore.initChat()
  chatStore.loadSessions()
})

onBeforeUnmount(() => {
  if (clearNoticeTimer) clearTimeout(clearNoticeTimer)
})

// 메시지 추가 시 자동 스크롤
const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTo({
      top: messageListRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// 메시지 목록 변화 감지하여 자동 스크롤
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom()
  }
)

// 위젯 열림 감지하여 자동 스크롤
watch(
  () => chatStore.isOpen,
  (val) => {
    if (val) {
      scrollToBottom()
    }
  }
)

const handleSend = () => {
  const text = userInput.value.trim()
  if (!text || chatStore.isLoading) return

  chatStore.sendMessage(text)
  userInput.value = ''
}

const toggleChat = () => {
  chatStore.isOpen = !chatStore.isOpen
  if (!chatStore.isOpen) {
    showClearConfirm.value = false
  }
}

const requestClearHistory = () => {
  if (chatStore.isLoading) return
  showClearConfirm.value = true
}

const cancelClearHistory = () => {
  showClearConfirm.value = false
}

const confirmClearHistory = () => {
  showClearConfirm.value = false
  showHistoryPanel.value = false
  chatStore.clearHistory()
  showClearNotice.value = true

  if (clearNoticeTimer) clearTimeout(clearNoticeTimer)
  clearNoticeTimer = setTimeout(() => {
    showClearNotice.value = false
    clearNoticeTimer = null
  }, 1800)
}

const toggleHistoryPanel = () => {
  showHistoryPanel.value = !showHistoryPanel.value
  if (showHistoryPanel.value) {
    chatStore.loadSessions()
  }
}

const handleLoadSession = (sessionId) => {
  chatStore.loadSession(sessionId)
  showHistoryPanel.value = false
}

// 텍스트 마크다운 양식 제거 및 정제 헬퍼
const renderMarkdown = (text) => {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // ###, ##, # 등 제목 마크다운 기호 제거
    .replace(/^(?:#{1,6})\s+/gm, '')
    .replace(/(?:#{1,6})\s+/g, '')
    // ** 볼드체 기호 제거
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // * 또는 - 형태의 리스트 불릿 기호를 정갈한 특수문자 점으로 치환
    .replace(/^\s*[\*\-]\s+/gm, '• ')
    // 인라인 코드 백틱(`) 제거
    .replace(/`(.*?)`/g, '$1')
    // 줄바꿈을 HTML 개행 태그로 치환
    .replace(/\n/g, '<br>')
}

// 출처 클릭 시 액션 (해당 지하철역이나 검색어로 설정)
const handleSourceClick = (source) => {
  if (source.title) {
    commonStore.setSelectedStation(source.title)
    chatStore.isOpen = false
    router.push({
      name: 'Attractions',
      query: { q: source.title }
    })
  }
}
</script>

<template>
  <div class="chatbot-container">
    <!-- 1. 플로팅 버튼 (닫혀있을 때 표시) -->
    <button
      v-if="!chatStore.isOpen"
      class="chat-floating-btn"
      @click="toggleChat"
      aria-label="챗봇 열기"
    >
      <span class="chat-btn-icon">🤖</span>
      <span class="chat-btn-badge">AI</span>
    </button>

    <!-- 2. 대화창 (열려있을 때 표시) -->
    <div v-else class="chat-window-wrapper">
      <div class="chat-window">
        <!-- 헤더 -->
        <header class="chat-header">
          <div class="chat-header-info">
            <span class="chat-avatar">🤖</span>
            <div>
              <h3 class="chat-header-title">AI 비서 로컬이</h3>
              <p class="chat-header-subtitle">LocalHub 지역 정보 가이드</p>
            </div>
          </div>
          <div class="chat-header-actions">
            <button
              v-if="!showHistoryPanel"
              class="chat-action-btn"
              :disabled="chatStore.isLoading"
              @click="requestClearHistory"
              title="대화 초기화"
            >
              🧹
            </button>
          
            <button
              class="chat-action-btn"
              @click="toggleHistoryPanel"
              :title="showHistoryPanel ? '대화창으로 돌아가기' : '이전 기록 보기'"
            >
              {{ showHistoryPanel ? '◀' : '📜' }}
            </button>
          
            <button class="chat-action-btn close-btn" @click="toggleChat" title="닫기">
              ✕
            </button>
          </div>
        </header>

        <div
          v-if="showClearConfirm"
          class="clear-confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-confirm-title"
        >
          <div class="clear-confirm-dialog">
            <h4 id="clear-confirm-title">대화를 초기화하겠습니까?</h4>
            <p>현재 대화 내용이 삭제되고 새 대화로 시작합니다.</p>
            <div class="clear-confirm-actions">
              <button type="button" class="clear-cancel-btn" @click="cancelClearHistory">
                취소
              </button>
              <button type="button" class="clear-accept-btn" @click="confirmClearHistory">
                확인
              </button>
            </div>
          </div>
        </div>

        <div v-if="showClearNotice" class="clear-success-notice" role="status">
          대화가 초기화되었습니다.
        </div>

        <template v-if="showHistoryPanel">
          <div class="chat-history-panel">
            <div class="history-panel-header">
              <span>이전 기록</span>
            </div>
            <ul class="history-list">
              <li v-if="chatStore.sessions.length === 0" class="history-empty">
                저장된 이전 기록이 없습니다.
              </li>
              <li
                v-for="session in chatStore.sessions"
                :key="session.session_id"
                class="history-item"
              >
                <button
                  class="history-load-btn"
                  @click="handleLoadSession(session.session_id)"
                >
                  {{ session.title || '새 대화' }}
                </button>
                <div class="history-meta">
                  {{ session.updated_at ? new Date(session.updated_at).toLocaleString() : '' }}
                </div>
              </li>
            </ul>
          </div>
        </template>

        <template v-else>
          <div ref="messageListRef" class="chat-messages-area">
            <div
              v-for="msg in chatStore.messages"
              :key="msg.id"
              :class="['chat-bubble-row', msg.role === 'user' ? 'user-row' : 'bot-row']"
            >
            <!-- 아바타 -->
            <div v-if="msg.role !== 'user'" class="chat-msg-avatar">🤖</div>

            <!-- 내용 묶음 -->
            <div class="chat-bubble-container">
              <div class="chat-bubble" v-html="renderMarkdown(msg.text)"></div>

              <!-- 출처 명소 목록 (RAG 결과물) -->
              <div
                v-if="msg.sources && msg.sources.length > 0"
                class="chat-sources-container"
              >
                <p class="sources-title">📍 연관 서울 추천 정보</p>
                <div class="sources-list">
                  <div
                    v-for="src in msg.sources"
                    :key="src.contentid"
                    class="source-card"
                    @click="handleSourceClick(src)"
                  >
                    <img
                      v-if="src.firstimage2"
                      :src="src.firstimage2"
                      alt="thumbnail"
                      class="source-thumb"
                    />
                    <div v-else class="source-thumb-empty">🗺️</div>
                    <div class="source-info">
                      <span class="source-name">{{ src.title }}</span>
                      <span class="source-category">{{ src.contentType || '명소' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 시간 표시 -->
              <span class="chat-time">
                {{
                  new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }}
              </span>
            </div>
          </div>

          <!-- 로딩 상태 표시 -->
          <div v-if="chatStore.isLoading" class="chat-bubble-row bot-row loading-row">
            <div class="chat-msg-avatar">🤖</div>
            <div class="chat-bubble-container">
              <div class="chat-bubble loading-bubble">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 입력 영역 -->
        <footer class="chat-input-area">
          <input
            v-model="userInput"
            type="text"
            placeholder="질문을 입력하세요..."
            class="chat-input-field"
            @keyup.enter="handleSend"
            :disabled="chatStore.isLoading"
          />
          <button
            class="chat-send-btn"
            @click="handleSend"
            :disabled="!userInput.trim() || chatStore.isLoading"
          >
            ✈️
          </button>
        </footer>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbot-container {
  font-family: 'Inter', 'Outfit', sans-serif;
  z-index: 9999;
  position: fixed;
  bottom: 24px;
  right: 24px;
}

/* 1. 플로팅 버튼 */
.chat-floating-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  border: none;
  box-shadow: 0 8px 24px rgba(23, 162, 184, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chat-floating-btn:hover {
  transform: scale(1.1) translateY(-4px);
  box-shadow: 0 12px 28px rgba(23, 162, 184, 0.5);
}

.chat-btn-icon {
  font-size: 28px;
}

.chat-btn-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #ffc107;
  color: #333;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 6px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 1px solid white;
}

/* 2. 대화창 윈도우 */
.chat-window-wrapper {
  animation: slideUp 0.35s cubic-bezier(0.075, 0.82, 0.165, 1) forwards;
  transform-origin: bottom right;
}

.chat-window {
  width: 380px;
  height: 560px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 헤더 영역 */
.chat-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.15);
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-avatar {
  font-size: 24px;
}

.chat-header-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.chat-header-subtitle {
  font-size: 11px;
  opacity: 0.85;
  margin: 2px 0 0 0;
}

.chat-header-actions {
  display: flex;
  gap: 8px;
}

.chat-action-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  font-size: 14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.chat-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn {
  font-size: 12px;
}

.chat-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.clear-confirm-overlay {
  position: absolute;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
}

.clear-confirm-dialog {
  width: min(100%, 310px);
  padding: 24px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
  text-align: center;
}

.clear-confirm-dialog h4 {
  margin: 0 0 10px;
  color: #222;
  font-size: 17px;
}

.clear-confirm-dialog p {
  margin: 0;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}

.clear-confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 22px;
}

.clear-cancel-btn,
.clear-accept-btn {
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.clear-cancel-btn {
  border: 1px solid #d7dde5;
  background: white;
  color: #495057;
}

.clear-accept-btn {
  border: 1px solid #17a2b8;
  background: #17a2b8;
  color: white;
}

.clear-success-notice {
  position: absolute;
  z-index: 15;
  top: 82px;
  left: 50%;
  width: max-content;
  max-width: calc(100% - 40px);
  padding: 10px 16px;
  border-radius: 999px;
  background: #173f46;
  color: white;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
  font-size: 13px;
  transform: translateX(-50%);
  pointer-events: none;
}

/* 세션 목록 */
.chat-session-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 20px 0;
  background-color: rgba(248, 249, 250, 0.4);
}

.chat-session-btn {
  border: 1px solid #dfe6e9;
  background: white;
  color: #2d3436;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

/* 대화 리스트 영역 */
.chat-messages-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: rgba(248, 249, 250, 0.4);
}

.chat-bubble-row {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.user-row {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bot-row {
  align-self: flex-start;
}

.chat-msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #e8f4f8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.chat-bubble-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.55;
  word-break: break-all;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.user-row .chat-bubble {
  background-color: #17a2b8;
  color: white;
  border-top-right-radius: 2px;
}

.bot-row .chat-bubble {
  background-color: white;
  color: #333;
  border-top-left-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.chat-time {
  font-size: 10px;
  color: #aaa;
  margin-top: 2px;
}

.user-row .chat-time {
  align-self: flex-end;
}

.bot-row .chat-time {
  align-self: flex-start;
}

/* RAG 출처(소스) 카드 */
.chat-sources-container {
  margin-top: 10px;
  background-color: rgba(23, 162, 184, 0.05);
  border-left: 3px solid #17a2b8;
  padding: 8px 12px;
  border-radius: 6px;
  max-width: 100%;
}

.sources-title {
  font-size: 11px;
  font-weight: 700;
  color: #138496;
  margin: 0 0 6px 0;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-card {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  border: 1px solid rgba(23, 162, 184, 0.15);
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.source-card:hover {
  background-color: #e8f4f8;
  transform: translateY(-1px);
}

.source-thumb {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.source-thumb-empty {
  width: 32px;
  height: 32px;
  background-color: #f1f3f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 4px;
}

.source-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.source-name {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-category {
  font-size: 10px;
  color: #888;
}

/* 로딩 애니메이션 bubble */
.loading-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 18px !important;
}

.loading-bubble .dot {
  width: 6px;
  height: 6px;
  background-color: #17a2b8;
  border-radius: 50%;
  animation: wave 1.2s infinite ease-in-out;
}

.loading-bubble .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-bubble .dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* 입력 영역 */
.chat-input-area {
  padding: 14px 20px;
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-input-field {
  flex: 1;
  border: 1px solid #e2e8f0;
  padding: 10px 16px;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.chat-input-field:focus {
  border-color: #17a2b8;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.chat-send-btn {
  background-color: #17a2b8;
  border: none;
  color: white;
  font-size: 16px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.chat-send-btn:hover:not(:disabled) {
  background-color: #138496;
  transform: scale(1.05);
}

.chat-send-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

/* 코드 블록 스타일링 */
:deep(.chat-code) {
  background-color: #f1f3f5;
  color: #e64980;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

/* 애니메이션 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes wave {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.chat-history-panel {
  flex: 1;
  min-height: 0;
  padding: 16px 20px 12px;
  background: rgba(255, 255, 255, 0.96);
  overflow-y: auto;
}

.history-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 700;
  color: #2b2b2b;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.history-load-btn {
  flex: 1;
  text-align: left;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: #2d2d2d;
}

.history-meta {
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
}

.history-empty {
  padding: 48px 12px;
  color: #6c757d;
  text-align: center;
}

/* 반응형 (모바일 뷰포트) */
@media (max-width: 768px) {
  .chatbot-container {
    bottom: 0;
    right: 0;
    width: 100%;
  }

  .chat-floating-btn {
    bottom: 24px;
    right: 24px;
    position: fixed;
  }

  .chat-window {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
  }
}
</style>
