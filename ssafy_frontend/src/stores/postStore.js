import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const selectedPost = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalCount = ref(0)
  const searchKeyword = ref('')

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

  const addPost = (post) => {
    posts.value.unshift(post)
    totalCount.value += 1
  }

  const updatePost = (id, updatedPost) => {
    const index = posts.value.findIndex(post => post.id === id)
    if (index !== -1) {
      posts.value[index] = { ...posts.value[index], ...updatedPost }
    }
  }

  const deletePost = (id) => {
    posts.value = posts.value.filter(post => post.id !== id)
    totalCount.value -= 1
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
    setPosts,
    addPost,
    updatePost,
    deletePost,
    setSelectedPost,
    setIsLoading,
    setError,
    setCurrentPage,
    setSearchKeyword,
    resetPosts
  }
})