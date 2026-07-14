import axios from 'axios'

const API_KEY = process.env.GEMINI_API_KEY || ''
const MODEL = 'gemini-2.5-flash'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

/**
 * Gemini API를 호출하여 답변을 생성합니다.
 * @param {string} prompt - 현재 사용자의 질문 (컨텍스트가 병합된 프롬프트)
 * @param {Array<{role: string, text: string}>} history - 이전 대화 내역 목록
 * @returns {Promise<string>} Gemini AI의 답변 텍스트
 */
export async function fetchGeminiResponse(prompt, history = []) {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.')
  }

  // Gemini API 규격(role: 'user' | 'model')으로 이전 대화 목록 변환
  const contents = history.map(msg => {
    return {
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }
  })

  // 현재 사용자 질문(프롬프트) 추가
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  })

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000
    }
  }

  try {
    const response = await axios.post(API_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const candidates = response.data?.candidates
    if (candidates && candidates.length > 0) {
      const text = candidates[0]?.content?.parts[0]?.text
      if (text) {
        return text
      }
    }
    throw new Error('응답 데이터를 분석할 수 없습니다.')
  } catch (error) {
    console.error('Gemini API Error:', error)
    if (error.response && error.response.data) {
      const apiError = error.response.data.error
      throw new Error(`API 요청 실패: ${apiError?.message || error.message}`)
    }
    throw error
  }
}
