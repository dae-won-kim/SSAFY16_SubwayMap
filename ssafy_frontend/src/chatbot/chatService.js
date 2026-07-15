import axios from 'axios'

export async function fetchChatbotResponse(message, history = []) {
  try {
    const response = await axios.post('/api/chat', {
      message,
      history
    })

    return response.data
  } catch (error) {
    console.error('Chat API Error:', error)
    throw new Error(error?.response?.data?.detail || '챗봇 서버 요청 실패')
  }
}