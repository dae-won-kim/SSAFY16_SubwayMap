import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

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

    // 첫 요청 전송 시 로딩 상태 활성화 (UI 상의 '...' 타이핑 표시 활성화)
    isLoading.value = true

    const aiMessageId = Date.now() + 2
    let isAiMessageAdded = false

    try {
      // 2. API에 보낼 히스토리 포맷팅 (방금 추가한 사용자 메시지 제외)
      const apiHistory = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        text: msg.text
      }))

      // 3. fetch를 이용해 스트리밍 API 호출
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          history: apiHistory
        })
      })

      if (!response.ok) {
        throw new Error('챗봇 응답 연결 실패')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // 4. 청크 조각 실시간 수신 및 파싱
      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // 마지막 미완성 라인은 다음 루프를 위해 버퍼에 유지
        buffer = lines.pop() || ''

        for (const line of lines) {
          const cleanLine = line.trim()
          if (cleanLine.startsWith('data:')) {
            const jsonStr = cleanLine.slice(5).trim()
            try {
              const data = JSON.parse(jsonStr)
              
              // 텍스트 조각 수신 시점
              if (data.text) {
                // 최초 텍스트 청크 도달 시점에 한 번만 AI 답변 객체를 생성하고 '...' 로딩 표시 끔
                if (!isAiMessageAdded) {
                  messages.value.push({
                    id: aiMessageId,
                    role: 'assistant',
                    text: '',
                    timestamp: new Date(),
                    sources: []
                  })
                  isAiMessageAdded = true
                  isLoading.value = false // 타이핑 바 숨김
                }

                const targetMsg = messages.value.find(m => m.id === aiMessageId)
                if (targetMsg) {
                  targetMsg.text += data.text
                }
              }
              
              // 최종 연관 출처(sources) 바인딩
              if (data.sources) {
                if (!isAiMessageAdded) {
                  messages.value.push({
                    id: aiMessageId,
                    role: 'assistant',
                    text: '',
                    timestamp: new Date(),
                    sources: []
                  })
                  isAiMessageAdded = true
                  isLoading.value = false
                }
                const targetMsg = messages.value.find(m => m.id === aiMessageId)
                if (targetMsg) {
                  targetMsg.sources = data.sources
                }
              }

              // 백엔드 감지 에러
              if (data.error) {
                throw new Error(data.error)
              }
            } catch (e) {
              console.error('SSE JSON parsing error:', e)
            }
          }
        }
      }

    } catch (err) {
      console.error('Error sending message:', err)
      if (!isAiMessageAdded) {
        messages.value.push({
          id: aiMessageId,
          role: 'assistant',
          text: '',
          timestamp: new Date(),
          sources: []
        })
        isAiMessageAdded = true
        isLoading.value = false
      }
      const targetMsg = messages.value.find(m => m.id === aiMessageId)
      if (targetMsg) {
        targetMsg.text = `죄송합니다. 오류가 발생하여 응답을 가져올 수 없습니다. 😢\n\n오류 내용: *${err.message}*`
      }
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



