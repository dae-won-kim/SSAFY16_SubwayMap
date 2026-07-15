import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { fetchChatbotResponse } from './chatService'

export const useChatStore = defineStore('chat', () => {
  const CHAT_HISTORY_KEY = 'localhub-chat-history'

  const messages = ref([])
  const isOpen = ref(false)
  const isLoading = ref(false)
  let historyRestored = false

  const restoreHistory = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.sessionStorage.getItem(CHAT_HISTORY_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) messages.value = parsed
    } catch (error) {
      console.warn('Failed to restore chat history:', error)
      window.sessionStorage.removeItem(CHAT_HISTORY_KEY)
    }
  }

  watch(
    messages,
    (value) => {
      if (!historyRestored || typeof window === 'undefined') return
      window.sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(value))
    },
    { deep: true }
  )

  // 기본 인사말 추가
  const initChat = () => {
    if (!historyRestored) {
      historyRestored = true
      restoreHistory()
    }
    if (messages.value.length === 0) {
      messages.value.push({
        id: Date.now(),
        role: 'assistant',
        text: '안녕하세요! 서울 지역 정보 공유 커뮤니티 **LocalHub**의 AI 비서입니다. 🚇\n\n궁금한 서울의 관광지, 축제, 문화시설, 쇼핑, 숙박 등의 정보를 물어보세요! \n\n예: *"홍대입구역 주변 놀거리 추천해줘"*, *"경복궁 야간개장 정보가 어떻게 돼?"*',
        timestamp: new Date(),
        sources: []
      })
    }
  }

  // 대화 초기화
  const clearHistory = () => {
    messages.value = []
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CHAT_HISTORY_KEY)
    }
    initChat()
  }

  // 메시지 전송
  const sendMessage = async (userText) => {
    if (!userText.trim()) return

    // 1. 사용자 메시지 추가
    messages.value.push({
      id: Date.now() + 1,
      role: 'user',
      text: userText,
      timestamp: new Date()
    })

    isLoading.value = true

    try {
      // 2. API에 보낼 히스토리 포맷팅 (텍스트만 전달)
      const apiHistory = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        text: msg.text
      }))

      // 3. 백엔드 API 호출 (순수한 userText와 대화 히스토리만 전달)
      const result = await fetchChatbotResponse(userText, apiHistory)
      const aiReply = result.reply || '응답을 받지 못했습니다.'

      // 4. 결과 메시지 조립 및 추가
      messages.value.push({
        id: Date.now() + 2,
        role: 'assistant',
        text: aiReply,
        timestamp: new Date(),
        sources: result.sources || []
      })

    } catch (err) {
      console.error('Error sending message:', err)
      messages.value.push({
        id: Date.now() + 3,
        role: 'assistant',
        text: `죄송합니다. 오류가 발생하여 응답을 가져올 수 없습니다. 😢\n\n오류 내용: *${err.message}*`,
        timestamp: new Date(),
        sources: []
      })
    } finally {
      isLoading.value = false
    }
  }

  return {
    messages,
    isOpen,
    isLoading,
    initChat,
    clearHistory,
    sendMessage
  }
})

