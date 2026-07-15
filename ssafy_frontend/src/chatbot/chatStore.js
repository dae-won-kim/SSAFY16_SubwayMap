import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { useCommonStore } from '../stores/commonStore'
import { fetchGeminiResponse } from './chatService'

export const useChatStore = defineStore('chat', () => {
  const CHAT_HISTORY_KEY = 'localhub-chat-history'
  const dataStore = useDataStore()
  const commonStore = useCommonStore()

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

  // 사용자 텍스트에서 명사/키워드 추출 (간이)
  const extractKeywords = (text) => {
    // 특수문자 제거 후 공백 단위로 쪼개고, 2글자 이상인 키워드 필터링
    const cleanText = text.replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s]/g, '')
    return cleanText
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length >= 2)
  }

  // 사용자 질문에 연관된 로컬 데이터 검색 (RAG)
  const searchLocalData = (userText) => {
    const allItems = dataStore.allItems || []
    if (allItems.length === 0) return []

    const keywords = extractKeywords(userText)
    const matched = new Map()

    // 1. 현재 화면에서 선택된 지하철역 정보가 있다면 가중치 부여
    const selectedStation = commonStore.selectedStation
    if (selectedStation) {
      allItems.forEach(item => {
        if (
          item.title.toLowerCase().includes(selectedStation.toLowerCase()) ||
          (item.addr1 && item.addr1.toLowerCase().includes(selectedStation.toLowerCase()))
        ) {
          matched.set(item.contentid, { item, score: 5 }) // 지하철역 매칭 시 높은 우선순위
        }
      })
    }

    // 2. 검색 텍스트에 지하철역 이름이 들어갔는지 추가 검사 (예: "홍대입구", "강남역")
    const stations = ['홍대입구', '강남', '명동', '동대문', '종로3가', '이태원', '여의도', '신촌', '서울역', '시청', '잠실', '성수']
    stations.forEach(station => {
      if (userText.includes(station)) {
        allItems.forEach(item => {
          if (item.addr1 && item.addr1.toLowerCase().includes(station.toLowerCase())) {
            const current = matched.get(item.contentid)
            matched.set(item.contentid, {
              item,
              score: (current?.score || 0) + 4
            })
          }
        })
      }
    })

    // 3. 키워드 매칭
    keywords.forEach(keyword => {
      allItems.forEach(item => {
        let keywordScore = 0
        if (item.title.toLowerCase().includes(keyword.toLowerCase())) {
          keywordScore += 3
        }
        if (item.addr1 && item.addr1.toLowerCase().includes(keyword.toLowerCase())) {
          keywordScore += 1
        }
        if (item.contentType && item.contentType.toLowerCase().includes(keyword.toLowerCase())) {
          keywordScore += 1
        }

        if (keywordScore > 0) {
          const current = matched.get(item.contentid)
          matched.set(item.contentid, {
            item,
            score: (current?.score || 0) + keywordScore
          })
        }
      })
    })

    // 스코어 순 정렬 후 최대 8개 항목 반환
    return Array.from(matched.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(entry => entry.item)
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
      // 데이터가 로드되지 않았다면 백그라운드 로드 수행
      const allItems = dataStore.allItems || []
      if (allItems.length === 0) {
        await dataStore.loadAllDataAction()
      }

      // 2. RAG 검색 수행 (로컬 명소 매칭)
      const contextItems = searchLocalData(userText)

      // 3. 참고용 프롬프트 생성
      let contextString = ''
      if (contextItems.length > 0) {
        contextString = '## [참고할 서울 공공데이터 명소 목록]\n'
        contextItems.forEach((item, index) => {
          contextString += `${index + 1}. **장소명**: "${item.title}" | **주소**: "${item.addr1 || '정보 없음'}" | **전화번호**: "${item.tel || '정보 없음'}" | **카테고리**: "${item.contentType || '정보 없음'}" | **이미지**: "${item.firstimage2 || ''}"\n`
        })
      }

      // 시스템 규칙과 컨텍스트, 이전 대화 목록 병합
      const systemPrompt = `당신은 서울시 대중교통 및 공공데이터 기반 지역 정보 커뮤니티 플랫폼인 'LocalHub'의 친절한 인공지능 안내 비서입니다.
사용자에게 질문에 맞는 서울의 명소, 축제, 문화시설, 쇼핑, 숙박 등의 정보를 정확하게 안내해야 합니다.

[작성 규칙]
1. 제공된 '[참고할 서울 공공데이터 명소 목록]'이 질문과 연관된다면, 해당 데이터를 적극 활용해 신뢰도 높은 맞춤 추천(장소명, 주소, 특징 등)을 제공해 주세요.
2. 질문에 언급된 지하철역이나 지역이 있다면, 데이터에 명시된 장소의 위치나 특징과 유기적으로 연결해 주세요.
3. 제공된 데이터에 없는 질문이라도 서울 관광 및 이동 경로에 대한 팁을 상식에 기반해 매우 친절히 답해주세요. 다만 데이터에 없는 정보는 유추해서 사실처럼 말하지 말고, "데이터에 등록되지는 않았으나 서울의 주요 명소인..." 등으로 상냥하게 답해주세요.
4. 가독성을 높이기 위해 굵은 글씨(**)나 제목 표시(###, #), 리스트 기호(*, -, _) 등 특수한 마크다운 양식 기호는 절대 사용하지 마세요. 오직 깔끔한 일반 평문(Plain Text)과 자연스러운 줄바꿈(엔터)만을 사용하여 답변을 정갈하게 작성해 주세요.`

      const finalPrompt = `${systemPrompt}\n\n${contextString}\n\n사용자의 질문: ${userText}`

      // 4. API에 보낼 히스토리 포맷팅 (텍스트만 전달)
      const apiHistory = messages.value.slice(0, -1).map(msg => ({
        role: msg.role,
        text: msg.text
      }))

      // 5. Gemini API 호출
      const aiReply = await fetchGeminiResponse(finalPrompt, apiHistory)

      // 6. 결과 메시지 조립 및 추가
      messages.value.push({
        id: Date.now() + 2,
        role: 'assistant',
        text: aiReply,
        timestamp: new Date(),
        sources: contextItems.map(item => ({
          contentid: item.contentid,
          title: item.title,
          addr1: item.addr1,
          firstimage2: item.firstimage2,
          contentType: item.contentType
        }))
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
