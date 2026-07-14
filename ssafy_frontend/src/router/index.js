import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AttractionView from '../views/AttractionView.vue'
import PostsView from '../views/PostsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/attractions',
    name: 'Attractions',
    component: AttractionView
  },
  {
    path: '/posts',
    name: 'Posts',
    component: PostsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router