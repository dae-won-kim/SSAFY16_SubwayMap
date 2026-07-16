import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useChatStore = defineStore('chat', () => {
  const CHAT_HISTORY_KEY = 'localhub-chat-history'
  const CHAT_SESSIONS_KEY = 'localhub-chat-sessions'

  const messages = ref([])
  const isOpen = ref(false)
  const isLoading = ref(false)
  const sessions = ref([])
  const activeSessionId = ref(null)
  let historyRestored = false

  const restoreHistory = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.sessionStorage.getItem(CHAT_HISTORY_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      // 기존 배열 형식도 계속 복원할 수 있도록 호환 처리
      if (Array.isArray(parsed)) {
        messages.value = parsed
      } else if (parsed && Array.isArray(parsed.messages)) {
        messages.value = parsed.messages
        activeSessionId.value = parsed.activeSessionId || null
      }
    } catch (error) {
      console.warn('Failed to restore chat history:', error)
      window.sessionStorage.removeItem(CHAT_HISTORY_KEY)
    }
  }

  watch(
    [messages, activeSessionId],
    ([messageValue, sessionId]) => {
      if (!historyRestored || typeof window === 'undefined') return
      window.sessionStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify({
        messages: messageValue,
        activeSessionId: sessionId
      }))
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
    activeSessionId.value = null
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CHAT_HISTORY_KEY)
    }
    initChat()
  }

  const loadSessions = () => {
    if (typeof window === 'undefined') return
    try {
      const saved = window.localStorage.getItem(CHAT_SESSIONS_KEY)
      const parsed = saved ? JSON.parse(saved) : []
      sessions.value = Array.isArray(parsed)
        ? parsed.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        : []
    } catch (error) {
      console.warn('Failed to load chat sessions:', error)
      sessions.value = []
      window.localStorage.removeItem(CHAT_SESSIONS_KEY)
    }
  }

  const loadSession = (sessionId) => {
    if (!sessionId) return
    const session = sessions.value.find(item => item.session_id === sessionId)
    if (!session) return

    activeSessionId.value = session.session_id
    messages.value = (session.messages || []).map(msg => ({
      ...msg,
      sources: msg.sources || []
    }))
  }

  const archiveCurrentSession = () => {
    if (typeof window === 'undefined') return false

    const firstUserMessage = messages.value.find(msg => msg.role === 'user')
    if (!firstUserMessage) return true

    try {
      loadSessions()
      const sessionId = activeSessionId.value || `session-${Date.now()}`
      const now = new Date().toISOString()
      const titleText = firstUserMessage.text.trim().replace(/\s+/g, ' ')
      const existingIndex = sessions.value.findIndex(item => item.session_id === sessionId)
      const existingSession = existingIndex >= 0 ? sessions.value[existingIndex] : null
      const archivedSession = {
        session_id: sessionId,
        title: titleText.length > 36 ? `${titleText.slice(0, 36)}…` : titleText,
        created_at: existingSession?.created_at || now,
        updated_at: now,
        messages: messages.value.map(msg => ({ ...msg }))
      }

      if (existingIndex >= 0) {
        sessions.value.splice(existingIndex, 1, archivedSession)
      } else {
        sessions.value.push(archivedSession)
      }
      sessions.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      window.localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions.value))
      activeSessionId.value = sessionId
      return true
    } catch (error) {
      console.warn('Failed to archive current chat:', error)
      return false
    }
  }

  // 현재 대화를 기록에 저장한 뒤 새 대화 시작
  const startNewChat = () => {
    if (!archiveCurrentSession()) return false
    clearHistory()
    loadSessions()
    return true
  }

  // 메시지 전송
  const sendMessage = async (userText) => {
    if (!userText.trim()) return

    const sessionId = activeSessionId.value || `session-${Date.now()}`
    activeSessionId.value = sessionId

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

    const getAiMessage = () => {
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
      return messages.value.find(message => message.id === aiMessageId)
    }

    const applyResponseData = (data) => {
      if (data.error) throw new Error(data.error)

      if (data.text) {
        const aiMessage = getAiMessage()
        if (aiMessage) aiMessage.text += data.text
      }
      if (Array.isArray(data.sources)) {
        const aiMessage = getAiMessage()
        if (aiMessage) aiMessage.sources = data.sources
      }
    }

    try {
      const apiHistory = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        text: msg.text,
        session_id: sessionId
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json'
        },
        body: JSON.stringify({
          message: userText,
          history: apiHistory,
          session_id: sessionId
        })
      })

      if (!response.ok) {
        throw new Error('챗봇 응답 연결 실패')
      }

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/event-stream')) {
        // Netlify 프록시는 SSE 청크를 합치거나 버퍼링할 수 있다. 응답을 전부
        // 받은 뒤 data 줄 단위로 처리하면 브라우저별 청크 경계 차이를 피할 수 있다.
        const responseText = await response.text()
        const dataLines = responseText
          .replace(/\r\n?/g, '\n')
          .split('\n')
          .filter(line => line.startsWith('data:'))

        for (const line of dataLines) {
          const dataText = line.slice(5).trim()
          if (!dataText || dataText === '[DONE]') continue
          applyResponseData(JSON.parse(dataText))
        }
      } else {
        const result = await response.json()
        applyResponseData({
          text: result.reply || '응답을 받지 못했습니다.',
          sources: result.sources || []
        })
      }

      if (!isAiMessageAdded) {
        const aiMessage = getAiMessage()
        if (aiMessage) {
          aiMessage.text = '응답을 받지 못했습니다.'
        }
      } else {
        const aiMessage = messages.value.find(message => message.id === aiMessageId)
        if (aiMessage && !aiMessage.text) {
          aiMessage.text = '응답을 받지 못했습니다.'
        }
      }
    } catch (err) {
      console.error('Error sending message:', err)
      const targetMsg = getAiMessage()
      if (targetMsg) {
        targetMsg.text = `죄송합니다. 오류가 발생하여 응답을 가져올 수 없습니다. 😢\n\n오류 내용: *${err.message}*`
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    messages,
    sessions,
    activeSessionId,
    isOpen,
    isLoading,
    initChat,
    clearHistory,
    startNewChat,
    sendMessage,
    loadSessions,
    loadSession
  }
})
