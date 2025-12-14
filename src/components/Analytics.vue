<script setup>
import { ref, onMounted } from 'vue'
import { bookService } from '../services/bookService'

const popularBooks = ref([])
const ratedBooks = ref([])
const lowStockBooks = ref([])
const trends = ref([])
const loading = ref(true)

const loadAnalytics = async () => {
  try {
    loading.value = true
    const [popular, ratings, lowStock, trendData] = await Promise.all([
      bookService.getPopularBooks(),
      bookService.getBooksWithRatings(),
      bookService.getLowStockBooks(),
      bookService.getBorrowingTrends(),
    ])

    popularBooks.value = popular.data
    ratedBooks.value = ratings.data
    lowStockBooks.value = lowStock.data
    trends.value = trendData.data
  } catch (error) {
    console.error('Error loading analytics:', error)
  } finally {
    loading.value = false
  }
}

const getMonthName = (month) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return months[month - 1]
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Analytics & Aggregations</h2>
      <p class="text-gray-600 mt-1">Insights from MongoDB aggregation pipeline</p>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else class="space-y-6">
      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-star-fill text-yellow-500"></i>
            <span>Most Popular Books (by Borrow Count)</span>
          </div>
        </template>
        <template #content>
          <div v-if="popularBooks.length > 0">
            <DataTable :value="popularBooks" :rows="10" stripedRows>
              <Column field="title" header="Title" :sortable="true" />
              <Column field="author" header="Author" :sortable="true" />
              <Column field="genre" header="Genre">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column field="borrowCount" header="Times Borrowed" :sortable="true">
                <template #body="{ data }">
                  <span class="font-bold text-blue-600">{{ data.borrowCount }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">No borrowing data available yet</div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-heart-fill text-red-500"></i>
            <span>Top Rated Books</span>
          </div>
        </template>
        <template #content>
          <div v-if="ratedBooks.length > 0">
            <DataTable :value="ratedBooks" :rows="10" stripedRows>
              <Column field="title" header="Title" :sortable="true" />
              <Column field="author" header="Author" :sortable="true" />
              <Column field="genre" header="Genre">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column field="avgRating" header="Avg Rating" :sortable="true">
                <template #body="{ data }">
                  <div class="flex items-center">
                    <Rating
                      :modelValue="data.avgRating"
                      :readonly="true"
                      :cancel="false"
                      class="text-sm"
                    />
                    <span class="ml-2 text-gray-600">({{ data.avgRating.toFixed(1) }})</span>
                  </div>
                </template>
              </Column>
              <Column field="ratingCount" header="Reviews" :sortable="true">
                <template #body="{ data }">
                  <span class="text-gray-600">{{ data.ratingCount }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">No ratings available yet</div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-exclamation-triangle text-orange-500"></i>
            <span>Low Stock Alert (≤30% Available)</span>
          </div>
        </template>
        <template #content>
          <div v-if="lowStockBooks.length > 0">
            <DataTable :value="lowStockBooks" :rows="10" stripedRows>
              <Column field="title" header="Title" :sortable="true" />
              <Column field="author" header="Author" :sortable="true" />
              <Column field="genre" header="Genre">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column header="Availability">
                <template #body="{ data }">
                  <div class="flex items-center">
                    <span class="font-medium"
                      >{{ data.availableCopies }}/{{ data.totalCopies }}</span
                    >
                    <ProgressBar
                      :value="(data.availableCopies / data.totalCopies) * 100"
                      :showValue="false"
                      class="ml-3"
                      style="width: 100px; height: 8px"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">All books are well stocked!</div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-chart-line text-blue-500"></i>
            <span>Borrowing Trends (Last 12 Months)</span>
          </div>
        </template>
        <template #content>
          <div v-if="trends.length > 0">
            <DataTable :value="trends" stripedRows>
              <Column header="Period">
                <template #body="{ data }">
                  {{ getMonthName(data._id.month) }} {{ data._id.year }}
                </template>
              </Column>
              <Column field="count" header="Books Borrowed">
                <template #body="{ data }">
                  <div class="flex items-center">
                    <span class="font-bold text-blue-600 mr-3">{{ data.count }}</span>
                    <ProgressBar
                      :value="data.count"
                      :showValue="false"
                      style="flex: 1; height: 20px"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No borrowing trends data available yet
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
