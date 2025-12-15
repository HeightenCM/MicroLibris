<script setup>
import { ref, onMounted } from 'vue'
import { bookService } from '../services/bookService'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const popularBooks = ref([])
const ratedBooks = ref([])
const lowStockBooks = ref([])
const trends = ref([])
const authorStats = ref([])
const borrowerStats = ref([])
const loading = ref(true)
const activeTab = ref(0)

const loadAnalytics = async () => {
  try {
    loading.value = true

    // Load each endpoint separately with error handling
    try {
      const popular = await bookService.getPopularBooks()
      popularBooks.value = popular.data
    } catch (error) {
      console.error('Error loading popular books:', error)
      popularBooks.value = []
    }

    try {
      const ratings = await bookService.getBooksWithRatings()
      ratedBooks.value = ratings.data
    } catch (error) {
      console.error('Error loading rated books:', error)
      ratedBooks.value = []
    }

    try {
      const lowStock = await bookService.getLowStockBooks()
      lowStockBooks.value = lowStock.data
    } catch (error) {
      console.error('Error loading low stock books:', error)
      lowStockBooks.value = []
    }

    try {
      const trendData = await bookService.getBorrowingTrends()
      trends.value = trendData.data
    } catch (error) {
      console.error('Error loading trends:', error)
      trends.value = []
    }

    try {
      const authors = await bookService.getAuthorStats()
      authorStats.value = authors.data
    } catch (error) {
      console.error('Error loading author stats:', error)
      authorStats.value = []
    }

    try {
      const borrowers = await bookService.getBorrowerStats()
      borrowerStats.value = borrowers.data
    } catch (error) {
      console.error('Error loading borrower stats:', error)
      borrowerStats.value = []
    }
  } catch (error) {
    console.error('Error loading analytics:', error)
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: 'Nu s-au putut încărca analizele',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const getMonthName = (month) => {
  const months = [
    'Ian',
    'Feb',
    'Mar',
    'Apr',
    'Mai',
    'Iun',
    'Iul',
    'Aug',
    'Sep',
    'Oct',
    'Noi',
    'Dec',
  ]
  return months[month - 1]
}

const getSeverity = (urgency) => {
  const map = {
    Critical: 'danger',
    High: 'warning',
    Medium: 'info',
    Low: 'success',
  }
  return map[urgency] || 'info'
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div class="analytics-container">
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>

    <TabView v-else v-model:activeIndex="activeTab" class="analytics-tabs">
      <!-- Most Popular Books Tab -->
      <TabPanel header="Cărți populare">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-star-fill"></i>
              <span>Top 10 cărți după numărul de împrumuturi</span>
            </div>
          </template>
          <template #content>
            <div v-if="popularBooks.length > 0">
              <DataTable :value="popularBooks" stripedRows>
                <Column field="title" header="Titlu" :sortable="true" style="min-width: 250px" />
                <Column field="author" header="Autor" :sortable="true" />
                <Column field="genre" header="Gen">
                  <template #body="{ data }">
                    <Tag :value="data.genre" />
                  </template>
                </Column>
                <Column field="borrowCount" header="Total împrumuturi" :sortable="true">
                  <template #body="{ data }">
                    <span class="value-highlight blue">{{ data.borrowCount }}</span>
                  </template>
                </Column>
                <Column field="activeBorrows" header="Împrumutate acum" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.activeBorrows" severity="warning" />
                  </template>
                </Column>
                <Column field="avgRating" header="Rating" :sortable="true">
                  <template #body="{ data }">
                    <div class="rating-cell">
                      <Rating :modelValue="data.avgRating" :readonly="true" :cancel="false" />
                      <span class="rating-value">({{ data.avgRating }})</span>
                    </div>
                  </template>
                </Column>
                <Column field="popularityScore" header="Scor popularitate" :sortable="true">
                  <template #body="{ data }">
                    <span class="value-highlight purple">{{
                      data.popularityScore.toFixed(1)
                    }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">Nu există date de împrumut disponibile</div>
          </template>
        </Card>
      </TabPanel>

      <!-- Top Rated Books Tab -->
      <TabPanel header="Cele mai bine cotate">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-heart-fill"></i>
              <span>Cărți cu cele mai bune evaluări</span>
            </div>
          </template>
          <template #content>
            <div v-if="ratedBooks.length > 0">
              <DataTable :value="ratedBooks" stripedRows>
                <Column field="title" header="Titlu" :sortable="true" style="min-width: 250px" />
                <Column field="author" header="Autor" :sortable="true" />
                <Column field="genre" header="Gen">
                  <template #body="{ data }">
                    <Tag :value="data.genre" />
                  </template>
                </Column>
                <Column field="avgRating" header="Rating mediu" :sortable="true">
                  <template #body="{ data }">
                    <div class="rating-cell">
                      <Rating :modelValue="data.avgRating" :readonly="true" :cancel="false" />
                      <span class="rating-value">({{ data.avgRating }})</span>
                    </div>
                  </template>
                </Column>
                <Column field="ratingCount" header="Nr. recenzii" :sortable="true" />
                <Column field="ratingQuality" header="Calitate">
                  <template #body="{ data }">
                    <Tag
                      :value="data.ratingQuality"
                      :severity="data.avgRating >= 4 ? 'success' : 'info'"
                    />
                  </template>
                </Column>
                <Column header="Distribuție" style="min-width: 200px">
                  <template #body="{ data }">
                    <div class="rating-distribution">
                      <div class="distribution-row">
                        <span>⭐⭐⭐⭐⭐</span>
                        <span class="distribution-count">{{
                          data.ratingDistribution.fiveStars
                        }}</span>
                      </div>
                      <div class="distribution-row">
                        <span>⭐⭐⭐⭐</span>
                        <span class="distribution-count">{{
                          data.ratingDistribution.fourStars
                        }}</span>
                      </div>
                      <div class="distribution-row">
                        <span>⭐⭐⭐</span>
                        <span class="distribution-count">{{
                          data.ratingDistribution.threeStars
                        }}</span>
                      </div>
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">Nu există evaluări disponibile</div>
          </template>
        </Card>
      </TabPanel>

      <!-- Low Stock Tab -->
      <TabPanel header="Stoc redus">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-exclamation-triangle"></i>
              <span>Alertă stoc redus (≤30% disponibile)</span>
            </div>
          </template>
          <template #content>
            <div v-if="lowStockBooks.length > 0">
              <DataTable :value="lowStockBooks" stripedRows>
                <Column field="title" header="Titlu" :sortable="true" style="min-width: 250px" />
                <Column field="author" header="Autor" :sortable="true" />
                <Column field="genre" header="Gen">
                  <template #body="{ data }">
                    <Tag :value="data.genre" />
                  </template>
                </Column>
                <Column header="Disponibilitate">
                  <template #body="{ data }">
                    <div class="availability-cell">
                      <span class="availability-text"
                        >{{ data.availableCopies }}/{{ data.totalCopies }}</span
                      >
                      <ProgressBar
                        :value="data.availabilityPercentage"
                        :showValue="false"
                        class="availability-bar"
                      />
                      <span class="availability-percent">{{ data.availabilityPercentage }}%</span>
                    </div>
                  </template>
                </Column>
                <Column field="activeBorrows" header="Împrumutate acum" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.activeBorrows" severity="warning" />
                  </template>
                </Column>
                <Column field="urgencyLevel" header="Urgență">
                  <template #body="{ data }">
                    <Tag :value="data.urgencyLevel" :severity="getSeverity(data.urgencyLevel)" />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">Toate cărțile sunt bine aprovizionate!</div>
          </template>
        </Card>
      </TabPanel>

      <!-- Trends Tab -->
      <TabPanel header="Tendințe împrumuturi">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-chart-line"></i>
              <span>Tendințe împrumuturi (ultimele 12 luni)</span>
            </div>
          </template>
          <template #content>
            <div v-if="trends.length > 0">
              <DataTable :value="trends" stripedRows>
                <Column header="Perioadă">
                  <template #body="{ data }">
                    <span class="period-text"
                      >{{ getMonthName(data._id.month) }} {{ data._id.year }}</span
                    >
                  </template>
                </Column>
                <Column field="totalBorrows" header="Total împrumuturi" :sortable="true">
                  <template #body="{ data }">
                    <div class="trend-cell">
                      <span class="value-highlight blue">{{ data.totalBorrows }}</span>
                      <ProgressBar
                        :value="data.totalBorrows"
                        :showValue="false"
                        class="trend-bar"
                      />
                    </div>
                  </template>
                </Column>
                <Column field="returned" header="Returnate" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.returned" severity="success" />
                  </template>
                </Column>
                <Column field="stillBorrowed" header="În circulație" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.stillBorrowed" severity="warning" />
                  </template>
                </Column>
                <Column field="returnRate" header="Rată returnare" :sortable="true">
                  <template #body="{ data }">
                    <span class="rate-text">{{ data.returnRate }}%</span>
                  </template>
                </Column>
                <Column field="uniqueBookCount" header="Cărți unice" :sortable="true" />
                <Column field="uniqueBorrowerCount" header="Cititori unici" :sortable="true" />
              </DataTable>
            </div>
            <div v-else class="empty-state">Nu există date despre tendințe disponibile</div>
          </template>
        </Card>
      </TabPanel>

      <!-- Authors Tab -->
      <TabPanel header="Statistici autori">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-user"></i>
              <span>Statistici per autor</span>
            </div>
          </template>
          <template #content>
            <div v-if="authorStats.length > 0">
              <DataTable :value="authorStats" stripedRows>
                <Column field="author" header="Autor" :sortable="true" style="min-width: 200px" />
                <Column field="totalBooks" header="Cărți" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.totalBooks" severity="info" />
                  </template>
                </Column>
                <Column field="totalCopies" header="Total copii" :sortable="true" />
                <Column field="genreCount" header="Genuri" :sortable="true" />
                <Column field="avgRating" header="Rating mediu" :sortable="true">
                  <template #body="{ data }">
                    <div class="rating-cell">
                      <Rating :modelValue="data.avgRating" :readonly="true" :cancel="false" />
                      <span class="rating-value">({{ data.avgRating }})</span>
                    </div>
                  </template>
                </Column>
                <Column field="totalBorrows" header="Total împrumuturi" :sortable="true">
                  <template #body="{ data }">
                    <span class="value-highlight purple">{{ data.totalBorrows }}</span>
                  </template>
                </Column>
                <Column
                  field="mostPopularBook"
                  header="Cea mai populară carte"
                  style="min-width: 200px"
                />
                <Column field="productivity" header="Productivitate">
                  <template #body="{ data }">
                    <Tag
                      :value="data.productivity"
                      :severity="data.totalBooks >= 3 ? 'success' : 'info'"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">Nu există date despre autori</div>
          </template>
        </Card>
      </TabPanel>

      <!-- Borrowers Tab -->
      <TabPanel header="Analiza cititorilor">
        <Card>
          <template #title>
            <div class="card-title">
              <i class="pi pi-users"></i>
              <span>Top 20 cititori</span>
            </div>
          </template>
          <template #content>
            <div v-if="borrowerStats.length > 0">
              <DataTable :value="borrowerStats" stripedRows>
                <Column
                  field="borrowerName"
                  header="Cititor"
                  :sortable="true"
                  style="min-width: 200px"
                />
                <Column field="totalBorrows" header="Total împrumuturi" :sortable="true">
                  <template #body="{ data }">
                    <span class="value-highlight blue">{{ data.totalBorrows }}</span>
                  </template>
                </Column>
                <Column field="returned" header="Returnate" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.returned" severity="success" />
                  </template>
                </Column>
                <Column field="currentlyBorrowed" header="Împrumutate acum" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.currentlyBorrowed" severity="warning" />
                  </template>
                </Column>
                <Column field="uniqueBooksRead" header="Cărți unice" :sortable="true" />
                <Column field="returnRate" header="Rată returnare" :sortable="true">
                  <template #body="{ data }">
                    <span class="rate-text">{{ data.returnRate }}%</span>
                  </template>
                </Column>
                <Column field="avgBorrowDuration" header="Durată medie (zile)" :sortable="true">
                  <template #body="{ data }">
                    <span>{{ data.avgBorrowDuration || 'N/A' }}</span>
                  </template>
                </Column>
                <Column field="mostReadGenre" header="Gen preferat" :sortable="true">
                  <template #body="{ data }">
                    <Tag :value="data.mostReadGenre || 'N/A'" />
                  </template>
                </Column>
                <Column field="readerType" header="Tip cititor">
                  <template #body="{ data }">
                    <Tag
                      :value="data.readerType"
                      :severity="data.totalBorrows >= 5 ? 'success' : 'info'"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="empty-state">Nu există date despre cititori</div>
          </template>
        </Card>
      </TabPanel>
    </TabView>

    <Toast />
  </div>
</template>

<style scoped>
.analytics-container {
  width: 100%;
}

.analytics-header {
  margin-bottom: 1.5rem;
}

.analytics-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.analytics-subtitle {
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

.analytics-tabs :deep(.p-tabview-nav) {
  background: white;
  border-bottom: 2px solid #e5e7eb;
}

.analytics-tabs :deep(.p-tabview-nav-link) {
  font-weight: 600;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.card-title .pi-star-fill {
  color: #eab308;
}
.card-title .pi-heart-fill {
  color: #ef4444;
}
.card-title .pi-exclamation-triangle {
  color: #f97316;
}
.card-title .pi-chart-line {
  color: #3b82f6;
}
.card-title .pi-user {
  color: #6366f1;
}
.card-title .pi-users {
  color: #14b8a6;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.value-highlight {
  font-weight: 700;
}

.value-highlight.blue {
  color: #2563eb;
}
.value-highlight.purple {
  color: #9333ea;
}

.rating-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-value {
  color: #6b7280;
  font-size: 0.875rem;
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.distribution-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.distribution-count {
  font-weight: 500;
}

.availability-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.availability-text {
  font-weight: 500;
  min-width: 3rem;
}

.availability-bar {
  width: 100px;
  height: 8px;
}

.availability-percent {
  font-size: 0.75rem;
  color: #6b7280;
}

.period-text {
  font-weight: 500;
}

.trend-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.trend-bar {
  flex: 1;
  height: 20px;
}

.rate-text {
  font-weight: 500;
}
</style>
