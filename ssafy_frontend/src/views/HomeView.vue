<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/chatbot/chatStore'
import { usePostStore } from '@/stores/postStore'
import { loadDataStats } from '@/services/dataService'
import { CATEGORY_ORDER, getCategoryIcon, getCategoryName } from '@/utils/category'
import LayoutBase from '@/components/LayoutBase.vue'

const router = useRouter()
const chatStore = useChatStore()
const postStore = usePostStore()
const dataStats = ref({
  total: 0,
  districts: 0,
  categories: 0,
  imageRate: '0.0',
  categoryCounts: {}
})

const recentPosts = computed(() => postStore.posts.slice(0, 5))

const formatDate = (date) => {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date))
}

onMounted(() => {
  postStore.loadPosts()
  loadDataStats()
    .then(stats => {
      dataStats.value = {
        total: stats.total || 0,
        districts: stats.districts || 0,
        categories: stats.category_count || 0,
        imageRate: Number(stats.image_rate || 0).toFixed(1),
        categoryCounts: Object.fromEntries(
          (stats.categories || []).map(item => [item.category, item.count])
        )
      }
    })
    .catch(error => {
      console.error('Failed to load LocalHub statistics:', error)
    })
})

const categoryStats = computed(() => {
  return Object.entries(dataStats.value.categoryCounts).map(([category, count]) => ({
    category,
    label: getCategoryName(category),
    icon: getCategoryIcon(category),
    count
  })).sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.category)
    const bIndex = CATEGORY_ORDER.indexOf(b.category)
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) -
      (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex)
  })
})

const formatNumber = value => new Intl.NumberFormat('ko-KR').format(value)

const features = [
  {
    id: 1,
    icon: '🚇',
    title: '역세권 지역 정보 검색',
    description: '지하철역이나 장소명을 입력해 관광지, 문화시설, 쇼핑, 숙박 등 주변 정보를 확인할 수 있습니다.',
    action: () => router.push('/attractions')
  },
  {
    id: 2,
    icon: '💬',
    title: '익명 정보 공유',
    description: '회원가입 없이 지유롭게 궁금한 점을 나누는 익명 커뮤니티입니다.',
    action: () => router.push('/posts')
  },
  {
    id: 3,
    icon: '🤖',
    title: 'AI 챗봇 비서',
    description: '관광지부터 레포츠, 문화시설, 축제까지 궁금한 서울 정보를 AI에게 물어보세요.',
    action: () => {
      chatStore.isOpen = true
    }
  }
]
</script>

<template>
  <LayoutBase>
    <div class="home-view">
      <!-- 배너 섹션 -->
      <section class="banner">
        <div class="banner-content">
          <h1 class="banner-title">
            서울의 숨겨진 핫플<br />
            지하철역 중심으로 찾다
          </h1>
          <p class="banner-subtitle">
            한국관광공사 데이터 기반 {{ formatNumber(dataStats.total) }}개의 서울 지역 정보와
            {{ dataStats.categories }}개 카테고리 탐색 + 익명 커뮤니티
          </p>
          <button class="banner-btn" @click="router.push('/attractions')">
            지금 탐색하기 →
          </button>
        </div>
        <div class="banner-background">
          <div class="location-icon">📍</div>
        </div>
      </section>

      <!-- 3가지 기능 소개 -->
      <section class="features">
        <h2 class="section-title">LocalHub의 3가지 특징</h2>
        <div class="features-grid">
          <div
            v-for="feature in features"
            :key="feature.id"
            class="feature-card"
            @click="feature.action"
          >
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-description">{{ feature.description }}</p>
            <div class="feature-arrow">→</div>
          </div>
        </div>
      </section>

      <section class="recent-posts">
        <div class="section-heading-row">
          <h2 class="section-title">최근 지역 이야기</h2>
          <router-link :to="{ name: 'Posts' }" class="more-link">
            전체 게시글 보기 →
          </router-link>
        </div>

        <div class="recent-post-list">
          <router-link
            v-for="post in recentPosts"
            :key="post.id"
            :to="{ name: 'PostDetail', params: { id: post.id } }"
            class="recent-post-item"
          >
            <strong>{{ post.title }}</strong>
            <span class="recent-date">{{ formatDate(post.createdAt) }}</span>
          </router-link>
        </div>
      </section>

      <!-- 데이터 통계 -->
      <section class="stats">
        <h2 class="section-title">LocalHub 데이터 현황</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ formatNumber(dataStats.total) }}</div>
            <div class="stat-label">서울 지역 데이터</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ dataStats.districts }}</div>
            <div class="stat-label">자치구</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ dataStats.categories }}</div>
            <div class="stat-label">카테고리</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ dataStats.imageRate }}%</div>
            <div class="stat-label">이미지 보유율</div>
          </div>
        </div>
        <div class="category-summary" aria-label="카테고리별 데이터 수">
          <div
            v-for="category in categoryStats"
            :key="category.category"
            class="category-stat"
          >
            <span class="category-stat-icon">{{ category.icon }}</span>
            <span class="category-stat-label">{{ category.label }}</span>
            <strong>{{ formatNumber(category.count) }}</strong>
          </div>
        </div>
      </section>

      <!-- CTA 섹션 -->
      <section class="cta">
        <h2>지금 바로 시작해보세요</h2>
        <p>가장 가까운 지하철역에서 관광, 문화, 축제, 레포츠, 쇼핑 정보를 발견하세요.</p>
        <button class="cta-btn" @click="router.push('/attractions')">
          지하철역으로 검색하기
        </button>
      </section>
    </div>
  </LayoutBase>
</template>

<style scoped>
.home-view {
  width: 100%;
}

/* 배너 섹션 */
.banner {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 80px 40px;
  border-radius: 12px;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.banner-background {
  position: absolute;
  right: -50px;
  bottom: -50px;
  opacity: 0.1;
}

.location-icon {
  font-size: 300px;
}

.banner-content {
  flex: 1;
  z-index: 1;
}

.banner-title {
  font-size: 44px;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.banner-subtitle {
  font-size: 16px;
  opacity: 0.95;
  margin: 0 0 30px 0;
  line-height: 1.6;
}

.banner-btn {
  padding: 14px 32px;
  background-color: white;
  color: #17a2b8;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 기능 섹션 */
.features {
  margin-bottom: 80px;
}

.recent-posts {
  margin-bottom: 80px;
}

.section-heading-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
}

.section-heading-row .section-title {
  margin-bottom: 0;
  text-align: left;
}

.more-link {
  flex: 0 0 auto;
  color: #138496;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.recent-post-list {
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  background: white;
}

.recent-post-item {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr) 70px;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  color: #333;
  text-decoration: none;
}

.recent-post-item:last-child {
  border-bottom: 0;
}

.recent-post-item:hover {
  background: #f5fbfc;
}



.recent-post-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-date {
  color: #999;
  font-size: 12px;
  text-align: right;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 50px 0;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-card {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  position: relative;
}

.feature-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: #17a2b8;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #333;
}

.feature-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 20px 0;
  line-height: 1.6;
}

.feature-arrow {
  font-size: 24px;
  color: #17a2b8;
  font-weight: 600;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-arrow {
  transform: translateX(8px);
}

/* 통계 섹션 */
.stats {
  background-color: #f8f9fa;
  padding: 60px 40px;
  border-radius: 12px;
  margin-bottom: 80px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 44px;
  font-weight: 700;
  color: #17a2b8;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.category-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 36px;
  padding-top: 28px;
  border-top: 1px solid #e2e8f0;
}

.category-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #555;
  font-size: 13px;
}

.category-stat-icon {
  font-size: 18px;
}

.category-stat-label {
  flex: 1;
}

.category-stat strong {
  color: #138496;
}

/* CTA 섹션 */
.cta {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
  padding: 60px 40px;
  border-radius: 12px;
  text-align: center;
}

.cta h2 {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.cta p {
  font-size: 16px;
  opacity: 0.95;
  margin: 0 0 30px 0;
}

.cta-btn {
  padding: 14px 40px;
  background-color: white;
  color: #17a2b8;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* 반응형 */
@media (max-width: 768px) {
  .banner {
    padding: 50px 30px;
    flex-direction: column;
  }

  .banner-title {
    font-size: 32px;
  }

  .banner-background {
    display: none;
  }

  .section-title {
    font-size: 24px;
    margin-bottom: 40px;
  }

  .section-heading-row {
    align-items: flex-start;
  }

  .recent-post-item {
    grid-template-columns: 60px minmax(0, 1fr);
  }

  .recent-date {
    display: none;
  }

  .features-grid {
    gap: 20px;
  }

  .stats-grid {
    gap: 30px;
  }
}
</style>
