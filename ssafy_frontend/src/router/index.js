import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AttractionView from '../views/AttractionView.vue'
import AttractionDetailView from '../views/AttractionDetailView.vue'
import PostsView from '../views/PostsView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/attractions', name: 'Attractions', component: AttractionView },
  {
    path: '/attractions/:id',
    name: 'AttractionDetail',
    component: AttractionDetailView,
    props: true
  },
  { path: '/posts', name: 'Posts', component: PostsView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

export default router
