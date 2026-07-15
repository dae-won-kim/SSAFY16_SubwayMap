import { api } from '@/api'

export const fetchPosts = async (skip = 0, limit = 20) => {
  const res = await api.get('/posts', { params: { skip, limit } })
  return res.data
}

export const fetchPost = async (id) => {
  const res = await api.get(`/posts/${id}`)
  return res.data
}

export const createPost = async (payload) => {
  const body = {
    title: payload.title.trim(),
    content: payload.content.trim(),
    password: payload.password,
    category: payload.category || null
  }
  const res = await api.post('/posts', body)
  return res.data
}

export const updatePost = async (id, payload) => {
  const body = {
    title: payload.title.trim(),
    content: payload.content.trim(),
    password: payload.password,
    category: payload.category || null
  }
  const res = await api.put(`/posts/${id}`, body)
  return res.data
}

export const deletePost = async (id, password) => {
  await api.delete(`/posts/${id}`, {
    data: { password }
  })
}
