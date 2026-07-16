import axios from 'axios'

export async function fetchChatbotResponse(message, history = [], sessionId = null) {
  try {
    const response = await axios.post('/api/chat', {
      message,
      history,
      session_id: sessionId
    })

    return response.data
  } catch (error) {
    console.error('Chat API Error:', error)
    throw new Error(error?.response?.data?.detail || '챗봇 서버 요청 실패')
  }
}

export async function fetchChatSessions() {
  const response = await axios.get('/api/chat/sessions')
  return response.data
}

export async function fetchChatSession(sessionId) {
  const response = await axios.get(`/api/chat/sessions/${sessionId}`)
  return response.data
}