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
      <h2 class="text-2xl font-bold text-gray-900" style="text-align: center; font-size: 50px">
        Statistici
      </h2>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else class="space-y-6">
      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-star-fill text-yellow-500 icon-heading"></i>
            <span>Cele mai populare (după împrumuturi)</span>
          </div>
        </template>
        <template #content>
          <div v-if="popularBooks.length > 0">
            <DataTable :value="popularBooks" :rows="10" stripedRows>
              <Column field="title" header="Titlu" :sortable="true" />
              <Column field="author" header="Autor" :sortable="true" />
              <Column field="genre" header="Categorie">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column field="borrowCount" header="Nr împrumuturi" :sortable="true">
                <template #body="{ data }">
                  <span class="font-bold text-blue-600">{{ data.borrowCount }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            Nu există date despre împrumuturi încă
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-heart-fill text-red-500 icon-heading"></i>
            <span>Cele mai apreciate cărți</span>
          </div>
        </template>
        <template #content>
          <div v-if="ratedBooks.length > 0">
            <DataTable :value="ratedBooks" :rows="10" stripedRows>
              <Column field="title" header="Titlu" :sortable="true" />
              <Column field="author" header="Autor" :sortable="true" />
              <Column field="genre" header="Categorie">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column field="avgRating" header="Medie Rating" :sortable="true">
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
              <Column field="ratingCount" header="Recenzii" :sortable="true">
                <template #body="{ data }">
                  <span class="text-gray-600">{{ data.ratingCount }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8 text-gray-500">Nu există încă recenzii</div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-exclamation-triangle text-orange-500 icon-heading"></i>
            <span>Alertă stoc scăzut (≤30% prezent)</span>
          </div>
        </template>
        <template #content>
          <div v-if="lowStockBooks.length > 0">
            <DataTable :value="lowStockBooks" :rows="10" stripedRows>
              <Column field="title" header="Titlu" :sortable="true" />
              <Column field="author" header="Autor" :sortable="true" />
              <Column field="genre" header="Categorie">
                <template #body="{ data }">
                  <Tag :value="data.genre" />
                </template>
              </Column>
              <Column header="Disponibilitate">
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
          <div v-else class="text-center py-8 text-gray-500">
            Toate cărțile sunt bine aprovizionate!
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center space-x-2">
            <i class="pi pi-chart-line text-blue-500 icon-heading"></i>
            <span>Tendințe împrumuturi (ultimele 12 luni)</span>
          </div>
        </template>
        <template #content>
          <div v-if="trends.length > 0">
            <DataTable :value="trends" stripedRows>
              <Column header="Perioadă">
                <template #body="{ data }">
                  {{ getMonthName(data._id.month) }} {{ data._id.year }}
                </template>
              </Column>
              <Column field="count" header="Cărți împrumutate">
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
            Nu există tendințe pentru împrumuturi încă
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style>
.icon-heading {
  margin-right: 5px;
}
</style>
