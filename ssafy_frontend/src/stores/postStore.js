import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MOCK_POSTS = [
  {
    id: 12,
    title: '경주공원 아기길 잔디기는 최고네요',
    content: '지난주에 경주공원에 가봤는데 정말 좋았어요!',
    category: '질문',
    createdAt: '2026-07-14T00:00:00.000Z',
    views: 42,
    password: '1234'
  },
  {
    id: 11,
    title: '홍대 같은 구멍 추천요',
    content: '홍대 같은 분위기의 장소를 찾고 있어요.',
    category: '공유',
    createdAt: '2026-07-13T00:00:00.000Z',
    views: 15,
    password: '1234'
  },
  {
    id: 10,
    title: '이런 공원 핫스팟 추천해',
    content: '서울에서 숨겨진 공원을 찾고 있습니다.',
    category: '정보',
    createdAt: '2026-07-12T00:00:00.000Z',
    views: 108,
    password: '1234'
  },
  {
    id: 9,
    title: '관광지중 숨겨진 맛집 말고 경치 좋은 곳',
    content: '경치 좋은 관광지를 찾고 있어요.',
    category: '기타',
    createdAt: '2026-07-10T00:00:00.000Z',
    views: 256,
    password: '1234'
  },
  {
    id: 8,
    title: '번산 정원 심싱실은 잘 모르겠어',
    content: '번산 정원에 대해 알고 싶습니다.',
    category: '정보',
    createdAt: '2026-07-09T00:00:00.000Z',
    views: 33,
    password: '1234'
  },
  {
    id: 7,
    title: '실제 가본 경험기 공유',
    content: '저의 경험을 공유합니다.',
    category: '공유',
    createdAt: '2026-07-08T00:00:00.000Z',
    views: 47,
    password: '1234'
  },
  {
    id: 6,
    title: '서울에서 제일 조용한',
    content: '조용한 장소를 찾고 있어요.',
    category: '질문',
    createdAt: '2026-07-07T00:00:00.000Z',
    views: 89,
    password: '1234'
  },
  {
    id: 5,
    title: '가족 여행 좋은 곳',
    content: '가족과 함께 가기 좋은 관광지입니다.',
    category: '정보',
    createdAt: '2026-07-06T00:00:00.000Z',
    views: 201,
    password: '1234'
  }
]

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const selectedPost = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalCount = ref(0)
  const searchKeyword = ref('')
  const editAuthorizedId = ref(null)

  const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
  })

  const filteredPosts = computed(() => {
    if (!searchKeyword.value) {
      return posts.value
    }
    return posts.value.filter(post =>
      post.title.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  })

  const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredPosts.value.slice(start, end)
  })

  const setPosts = (data) => {
    posts.value = data
    totalCount.value = data.length
  }

  const initializeMockPosts = () => {
    if (posts.value.length === 0) {
      setPosts(MOCK_POSTS.map(post => ({ ...post })))
    }
  }

  const addPost = (post) => {
    posts.value.unshift(post)
    totalCount.value += 1
  }

  const updatePost = (id, updatedPost) => {
    const index = posts.value.findIndex(post => String(post.id) === String(id))
    if (index !== -1) {
      posts.value[index] = { ...posts.value[index], ...updatedPost }
    }
  }

  const deletePost = (id) => {
    const originalLength = posts.value.length
    posts.value = posts.value.filter(post => String(post.id) !== String(id))
    totalCount.value -= originalLength - posts.value.length
  }

  const getPostById = (id) => {
    return posts.value.find(post => String(post.id) === String(id)) || null
  }

  const createPost = (payload) => {
    const nextId = Math.max(...posts.value.map(post => Number(post.id)), 0) + 1
    const post = {
      id: nextId,
      title: payload.title.trim(),
      content: payload.content.trim(),
      category: payload.category,
      password: payload.password,
      createdAt: new Date().toISOString(),
      views: 0
    }
    addPost(post)
    return post
  }

  const verifyPassword = (id, password) => {
    const post = getPostById(id)
    return Boolean(post && password === post.password)
  }

  const authorizeEdit = (id, password) => {
    if (!verifyPassword(id, password)) return false
    editAuthorizedId.value = String(id)
    return true
  }

  const isEditAuthorized = (id) => {
    return editAuthorizedId.value === String(id)
  }

  const clearEditAuthorization = () => {
    editAuthorizedId.value = null
  }

  const updateAuthorizedPost = (id, payload) => {
    if (!isEditAuthorized(id)) return false
    updatePost(id, {
      title: payload.title.trim(),
      content: payload.content.trim(),
      category: payload.category
    })
    clearEditAuthorization()
    return true
  }

  const deleteWithPassword = (id, password) => {
    if (!verifyPassword(id, password)) return false
    deletePost(id)
    return true
  }

  const incrementViews = (id) => {
    const post = getPostById(id)
    if (post) post.views += 1
  }

  const setSelectedPost = (post) => {
    selectedPost.value = post
  }

  const setIsLoading = (value) => {
    isLoading.value = value
  }

  const setError = (message) => {
    error.value = message
  }

  const setCurrentPage = (page) => {
    currentPage.value = page
  }

  const setSearchKeyword = (keyword) => {
    searchKeyword.value = keyword
    currentPage.value = 1
  }

  const resetPosts = () => {
    posts.value = []
    selectedPost.value = null
    currentPage.value = 1
    totalCount.value = 0
    searchKeyword.value = ''
    editAuthorizedId.value = null
    error.value = null
  }

  return {
    posts,
    selectedPost,
    isLoading,
    error,
    currentPage,
    pageSize,
    totalCount,
    searchKeyword,
    totalPages,
    filteredPosts,
    paginatedPosts,
    initializeMockPosts,
    setPosts,
    addPost,
    updatePost,
    deletePost,
    getPostById,
    createPost,
    verifyPassword,
    authorizeEdit,
    isEditAuthorized,
    clearEditAuthorization,
    updateAuthorizedPost,
    deleteWithPassword,
    incrementViews,
    setSelectedPost,
    setIsLoading,
    setError,
    setCurrentPage,
    setSearchKeyword,
    resetPosts
  }
})
