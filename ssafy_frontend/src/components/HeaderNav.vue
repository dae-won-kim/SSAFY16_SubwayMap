<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigation = [
  { label: '홈', to: '/' },
  { label: '관광지 탐색', to: '/attractions' },
  { label: '익명 게시판', to: '/posts' }
]

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <header class="header-nav">
    <div class="container">
      <!-- 로고 -->
      <div class="logo" @click="goHome">
        <span class="logo-icon">🗺️</span>
        <span class="logo-text">LocalHub</span>
      </div>

      <!-- 네비게이션 -->
      <nav class="nav-menu">
        <router-link
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: $route.path === item.to }"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header-nav {
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 20px;
  color: #17a2b8;
  transition: color 0.3s ease;
}

.logo:hover {
  color: #138496;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  color: #333;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s ease;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
}

.nav-link:hover {
  color: #17a2b8;
}

.nav-link.active {
  color: #17a2b8;
  border-bottom-color: #17a2b8;
}
</style>