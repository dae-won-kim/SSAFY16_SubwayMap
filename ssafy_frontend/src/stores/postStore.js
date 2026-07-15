import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as postService from '@/services/postService'
import { getApiErrorMessage } from '@/api'

const mapPost = (post) => ({
  id: post.id,
  title: post.title,
  content: post.content,
  category: post.category || null,
  createdAt: post.created_at || post.createdAt,
  views: post.views || 0,
  comments: post.comments || [],
  commentCount: post.comment_count ?? post.comments?.length ?? 0
})

export const usePostStore = defineStore('post', () => {
  const posts = ref([])
  const selectedPost = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const currentPage = ref(1)
  const pageSize = ref(10)
  const searchKeyword = ref('')
  const editAuthorization = ref(null)

  const totalCount = computed(() => posts.value.length)
  const totalPages = computed(() => {
    return Math.ceil(totalCount.value / pageSize.value)
  })

  const filteredPosts = computed(() => {
    if (!searchKeyword.value) return posts.value
    const keyword = searchKeyword.value.toLowerCase()
    return posts.value.filter(post => post.title.toLowerCase().includes(keyword))
  })

  const paginatedPosts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredPosts.value.slice(start, start + pageSize.value)
  })

  const setError = (message) => {
    error.value = message
  }

  const upsertPost = (post) => {
    const index = posts.value.findIndex(item => String(item.id) === String(post.id))
    if (index === -1) {
      posts.value.unshift(post)
    } else {
      posts.value[index] = post
    }
  }

  const loadPosts = async () => {
    isLoading.value = true
    error.value = null
    try {
      const data = await postService.fetchPosts(0, 100)
      posts.value = data.map(mapPost)
      return posts.value
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  const getPostById = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const remote = await postService.fetchPost(id)
      const post = mapPost(remote)
      upsertPost(post)
      selectedPost.value = post
      return post
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const createPost = async (payload) => {
    isLoading.value = true
    error.value = null
    try {
      const created = mapPost(await postService.createPost(payload))
      upsertPost(created)
      return created
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const updatePost = async (id, payload) => {
    isLoading.value = true
    error.value = null
    try {
      const updated = mapPost(await postService.updatePost(id, payload))
      upsertPost(updated)
      selectedPost.value = updated
      return updated
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return null
    } finally {
      isLoading.value = false
    }
  }

  const deletePost = async (id, password) => {
    isLoading.value = true
    error.value = null
    try {
      await postService.deletePost(id, password)
      posts.value = posts.value.filter(post => String(post.id) !== String(id))
      if (String(selectedPost.value?.id) === String(id)) selectedPost.value = null
      await loadPosts()
      return true
    } catch (err) {
      error.value = getApiErrorMessage(err)
      return false
    } finally {
      isLoading.value = false
    }
  }

  const authorizeEdit = (id, password) => {
    editAuthorization.value = { id: String(id), password }
    return true
  }

  const isEditAuthorized = (id) => {
    return editAuthorization.value?.id === String(id)
  }

  const clearEditAuthorization = () => {
    editAuthorization.value = null
  }

  const updateAuthorizedPost = async (id, payload) => {
    if (!isEditAuthorized(id)) return false

    const password = editAuthorization.value.password
    const updated = await updatePost(id, { ...payload, password })
    if (!updated) return false

    clearEditAuthorization()
    return true
  }

  const deleteWithPassword = (id, password) => {
    return deletePost(id, password)
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
    searchKeyword.value = ''
    editAuthorization.value = null
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
    loadPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    authorizeEdit,
    isEditAuthorized,
    clearEditAuthorization,
    updateAuthorizedPost,
    deleteWithPassword,
    setCurrentPage,
    setSearchKeyword,
    setError,
    resetPosts
  }
})
