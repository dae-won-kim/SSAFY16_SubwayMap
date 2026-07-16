import axios from 'axios'
import { CHAT_API_URL } from '@/api'

export async function fetchChatbotResponse(message, history = [], sessionId = null) {
  try {
    const response = await axios.post(CHAT_API_URL, {
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
