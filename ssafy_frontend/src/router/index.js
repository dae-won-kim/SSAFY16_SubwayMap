import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AttractionView from '../views/AttractionView.vue'
import AttractionDetailView from '../views/AttractionDetailView.vue'
import PostListView from '../views/PostListView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostFormView from '../views/PostFormView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/attractions', name: 'Attractions', component: AttractionView },
  {
    path: '/attractions/:id',
    name: 'AttractionDetail',
    component: AttractionDetailView,
    props: true
  },
  { path: '/posts', name: 'Posts', component: PostListView },
  { path: '/posts/new', name: 'PostCreate', component: PostFormView },
  { path: '/posts/:id', name: 'PostDetail', component: PostDetailView },
  { path: '/posts/:id/edit', name: 'PostEdit', component: PostFormView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
