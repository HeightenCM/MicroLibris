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
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p class="text-gray-600 mt-1">Overview of your library statistics</p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Books</p>
              <p class="text-3xl font-bold text-blue-600 mt-2">{{ stats.totalBooks }}</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="pi pi-book text-2xl text-blue-600"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Currently Borrowed</p>
              <p class="text-3xl font-bold text-orange-600 mt-2">{{ stats.totalBorrowed }}</p>
            </div>
            <div class="bg-orange-100 rounded-full p-3">
              <i class="pi pi-users text-2xl text-orange-600"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Average Rating</p>
              <p class="text-3xl font-bold text-yellow-600 mt-2">
                {{ stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A' }}
                <span class="text-lg text-gray-500">/5</span>
              </p>
            </div>
            <div class="bg-yellow-100 rounded-full p-3">
              <i class="pi pi-star text-2xl text-yellow-600"></i>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Genres</p>
              <p class="text-3xl font-bold text-green-600 mt-2">{{ stats.byGenre.length }}</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <i class="pi pi-tags text-2xl text-green-600"></i>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card v-if="stats && stats.byGenre.length > 0" class="mt-6">
      <template #title>
        <div class="flex items-center space-x-2">
          <i class="pi pi-chart-pie text-blue-600"></i>
          <span>Books by Genre</span>
        </div>
      </template>
      <template #content>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="genre in stats.byGenre"
            :key="genre._id"
            class="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <p class="text-sm font-medium text-gray-600">{{ genre._id }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ genre.count }}</p>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
