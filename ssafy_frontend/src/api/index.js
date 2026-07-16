import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const configuredChatApiUrl = import.meta.env.VITE_CHAT_API_URL?.trim()

export const CHAT_API_URL = configuredChatApiUrl || (
  import.meta.env.PROD
    ? 'https://ssafy16-subwaymap-t3r8.onrender.com/api/chat'
    : '/api/chat'
)

export const api = axios.create({
  baseURL: configuredBaseUrl || '/api',
  timeout: 70000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getApiErrorMessage = (error) => {
  if (!error.response) {
    return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
  }

  const detail = error.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg).filter(Boolean).join(', ')
  }

  if (error.response.status === 403) {
    return '비밀번호가 일치하지 않습니다.'
  }
  if (error.response.status === 404) {
    return '요청한 정보를 찾을 수 없습니다.'
  }

  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
