<script setup>
import { ref, onMounted } from 'vue'
import { bookService } from '../services/bookService'

const stats = ref(null)
const loading = ref(true)

const loadStats = async () => {
  try {
    loading.value = true
    const response = await bookService.getDashboardStats()
    stats.value = response.data
    console.log('Stats loaded:', stats.value) // Debug
  } catch (error) {
    console.error('Error loading stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2 class="dashboard-title">Dashboard</h2>
      <p class="dashboard-subtitle">Prezentare generală a statisticilor bibliotecii</p>
    </div>

    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>

    <div v-else-if="stats" class="dashboard-content">
      <!-- Main Stats Grid -->
      <div class="stats-grid">
        <!-- Total Books Card -->
        <Card class="stat-card">
          <template #content>
            <div class="stat-card-content">
              <div class="stat-info">
                <p class="stat-label">Total cărți</p>
                <p class="stat-value blue">{{ stats.totalBooks }}</p>
              </div>
              <div class="stat-icon blue-bg">
                <i class="pi pi-book"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Currently Borrowed Card -->
        <Card class="stat-card">
          <template #content>
            <div class="stat-card-content">
              <div class="stat-info">
                <p class="stat-label">Împrumutate acum</p>
                <p class="stat-value orange">{{ stats.totalBorrowed }}</p>
              </div>
              <div class="stat-icon orange-bg">
                <i class="pi pi-users"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Average Rating Card -->
        <Card class="stat-card">
          <template #content>
            <div class="stat-card-content">
              <div class="stat-info">
                <p class="stat-label">Rating mediu</p>
                <p class="stat-value yellow">
                  {{ stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A' }}
                  <span class="stat-unit">/5</span>
                </p>
                <p class="stat-detail">{{ stats.totalRatings }} recenzii</p>
              </div>
              <div class="stat-icon yellow-bg">
                <i class="pi pi-star"></i>
              </div>
            </div>
          </template>
        </Card>

        <!-- Genres Card -->
        <Card class="stat-card">
          <template #content>
            <div class="stat-card-content">
              <div class="stat-info">
                <p class="stat-label">Categorii</p>
                <p class="stat-value green">{{ stats.byGenre.length }}</p>
              </div>
              <div class="stat-icon green-bg">
                <i class="pi pi-tags"></i>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Secondary Stats Grid -->
      <div class="secondary-stats-grid">
        <!-- Total Circulation -->
        <Card class="secondary-stat-card">
          <template #content>
            <div class="secondary-stat-content">
              <i class="pi pi-sync secondary-stat-icon purple"></i>
              <p class="secondary-stat-label">Circulații totale</p>
              <p class="secondary-stat-value purple">{{ stats.totalCirculation }}</p>
            </div>
          </template>
        </Card>

        <!-- Active Borrowers -->
        <Card class="secondary-stat-card">
          <template #content>
            <div class="secondary-stat-content">
              <i class="pi pi-user-plus secondary-stat-icon indigo"></i>
              <p class="secondary-stat-label">Cititori activi</p>
              <p class="secondary-stat-value indigo">{{ stats.activeBorrowers }}</p>
            </div>
          </template>
        </Card>

        <!-- Recent Additions -->
        <Card class="secondary-stat-card">
          <template #content>
            <div class="secondary-stat-content">
              <i class="pi pi-plus-circle secondary-stat-icon teal"></i>
              <p class="secondary-stat-label">Adăugate anul acesta</p>
              <p class="secondary-stat-value teal">{{ stats.recentAdditions }}</p>
            </div>
          </template>
        </Card>
      </div>

      <!-- Genre Distribution -->
      <Card v-if="stats.byGenre && stats.byGenre.length > 0" class="genre-section">
        <template #title>
          <div class="genre-header">
            <i class="pi pi-chart-pie"></i>
            <span>Cărți după categorie</span>
          </div>
        </template>
        <template #content>
          <div class="genre-grid">
            <div v-for="genre in stats.byGenre" :key="genre._id" class="genre-card">
              <div class="genre-card-header">
                <div>
                  <p class="genre-name">{{ genre._id }}</p>
                  <p class="genre-count">{{ genre.count }} cărți</p>
                </div>
                <Tag :value="`${genre.borrowRate?.toFixed(0) || 0}%`" severity="info" />
              </div>

              <div class="genre-details">
                <div class="genre-detail-row">
                  <span>Total copii:</span>
                  <span class="genre-detail-value">{{ genre.totalCopies }}</span>
                </div>
                <div class="genre-detail-row">
                  <span>Disponibile:</span>
                  <span class="genre-detail-value green-text">{{ genre.availableCopies }}</span>
                </div>
              </div>

              <ProgressBar
                :value="genre.borrowRate || 0"
                :showValue="false"
                class="genre-progress"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  width: 100%;
}

.dashboard-header {
  margin-bottom: 1.5rem;
}

.dashboard-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dashboard-subtitle {
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Main Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0 0 0.5rem 0;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  margin: 0;
}

.stat-value.blue {
  color: #2563eb;
}
.stat-value.orange {
  color: #ea580c;
}
.stat-value.yellow {
  color: #ca8a04;
}
.stat-value.green {
  color: #16a34a;
}

.stat-unit {
  font-size: 1.125rem;
  color: #6b7280;
  font-weight: 400;
}

.stat-detail {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.stat-icon.blue-bg {
  background-color: #dbeafe;
  color: #2563eb;
}

.stat-icon.orange-bg {
  background-color: #fed7aa;
  color: #ea580c;
}

.stat-icon.yellow-bg {
  background-color: #fef3c7;
  color: #ca8a04;
}

.stat-icon.green-bg {
  background-color: #dcfce7;
  color: #16a34a;
}

/* Secondary Stats Grid */
.secondary-stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .secondary-stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.secondary-stat-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.secondary-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.secondary-stat-content {
  text-align: center;
  padding: 0.5rem;
}

.secondary-stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.secondary-stat-icon.purple {
  color: #9333ea;
}
.secondary-stat-icon.indigo {
  color: #4f46e5;
}
.secondary-stat-icon.teal {
  color: #0d9488;
}

.secondary-stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  margin: 0.5rem 0 0.25rem 0;
}

.secondary-stat-value {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0;
}

.secondary-stat-value.purple {
  color: #9333ea;
}
.secondary-stat-value.indigo {
  color: #4f46e5;
}
.secondary-stat-value.teal {
  color: #0d9488;
}

/* Genre Section */
.genre-section {
  margin-top: 0.5rem;
}

.genre-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #2563eb;
}

.genre-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
}

@media (min-width: 768px) {
  .genre-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .genre-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.genre-card {
  background: linear-gradient(to bottom right, #f9fafb, #ffffff);
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.genre-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.genre-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.genre-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.genre-count {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0.25rem 0 0 0;
}

.genre-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.genre-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
}

.genre-detail-value {
  font-weight: 500;
  color: #111827;
}

.green-text {
  color: #16a34a !important;
}

.genre-progress {
  height: 6px;
}

.genre-progress :deep(.p-progressbar-value) {
  background: linear-gradient(to right, #3b82f6, #2563eb);
}
</style>
