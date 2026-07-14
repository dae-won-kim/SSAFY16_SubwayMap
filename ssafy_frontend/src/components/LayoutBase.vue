<script setup>
import HeaderNav from './HeaderNav.vue'
</script>

<template>
  <div class="layout-base">
    <HeaderNav />
    <main class="main-content">
      <slot />
    </main>
    <footer class="footer">
      <div class="footer-content">
        <p>© 2026 LocalHub SSAFY Team Project. All rights reserved.</p>
        <p>본 서비스의 데이터는 한국관광공사 TourAPI 4.0 (공공누리 Type1·3)을 활용합니다.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout-base {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 20px;
}

.footer {
  background-color: #1a3a3a;
  color: #ccc;
  padding: 40px 20px;
  margin-top: 60px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.6;
}
</style>