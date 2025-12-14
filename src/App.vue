<script setup>
import { ref } from 'vue'
import Dashboard from './components/Dashboard.vue'
import BookLibrary from './components/BookLibrary.vue'
import Analytics from './components/Analytics.vue'

const activeTab = ref(0)

const tabs = [
  { label: 'Dashboard', icon: 'pi pi-home' },
  { label: 'Library', icon: 'pi pi-book' },
  { label: 'Analytics', icon: 'pi pi-chart-bar' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <i class="pi pi-book text-3xl text-blue-600"></i>
            <h1 class="text-2xl font-bold text-gray-900">MicroLibris</h1>
          </div>
          <p class="text-sm text-gray-500">A small library management system project</p>
        </div>
      </div>
    </header>

    <div class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TabMenu v-model:activeIndex="activeTab" :model="tabs" />
      </div>
    </div>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Dashboard v-if="activeTab === 0" />
      <BookLibrary v-else-if="activeTab === 1" />
      <Analytics v-else-if="activeTab === 2" />
    </main>
  </div>
</template>
