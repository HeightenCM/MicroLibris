<script setup>
import { ref, watch, computed } from 'vue'
import { bookService } from '../services/bookService'
import { useToast } from 'primevue/usetoast'

const props = defineProps({
  visible: Boolean,
  book: Object,
})

const emit = defineEmits(['update:visible', 'updated'])
const toast = useToast()

const activeTab = ref(0)
const borrowerName = ref('')
const rating = ref(0)
const review = ref('')
const loading = ref(false)

const activeBorrows = computed(() => {
  if (!props.book?.borrowHistory) return []
  return props.book.borrowHistory.filter((b) => b.status === 'borrowed')
})

const borrowHistory = computed(() => {
  if (!props.book?.borrowHistory) return []
  return [...props.book.borrowHistory].sort(
    (a, b) => new Date(b.borrowDate) - new Date(a.borrowDate),
  )
})

const avgRating = computed(() => {
  if (!props.book?.ratings || props.book.ratings.length === 0) return 0
  const sum = props.book.ratings.reduce((acc, r) => acc + r.rating, 0)
  return (sum / props.book.ratings.length).toFixed(1)
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      activeTab.value = 0
      borrowerName.value = ''
      rating.value = 0
      review.value = ''
    }
  },
)

const borrowBook = async () => {
  if (!borrowerName.value.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Necesar',
      detail: 'Te rog introdu numele împrumutorului',
      life: 3000,
    })
    return
  }

  try {
    loading.value = true
    await bookService.borrowBook(props.book._id, borrowerName.value)
    toast.add({
      severity: 'success',
      summary: 'Succes',
      detail: 'Carte împrumutată cu succes',
      life: 3000,
    })
    borrowerName.value = ''
    emit('updated')
    emit('update:visible', false)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: 'Nu s-a putut împrumuta cartea',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const returnBook = async (borrowerName) => {
  try {
    loading.value = true
    await bookService.returnBook(props.book._id, borrowerName)
    toast.add({
      severity: 'success',
      summary: 'Succes',
      detail: 'Carte returnată cu succes',
      life: 3000,
    })
    emit('updated')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: 'Nu s-a putut returna cartea',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const addRating = async () => {
  if (rating.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Necesar',
      detail: 'Te rog alege un rating',
      life: 3000,
    })
    return
  }

  try {
    loading.value = true
    await bookService.addRating(props.book._id, rating.value, review.value)
    toast.add({
      severity: 'success',
      summary: 'Succes',
      detail: 'Rating adăugat cu succes',
      life: 3000,
    })
    rating.value = 0
    review.value = ''
    emit('updated')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: 'Nu s-a putut adăuga un rating',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const closeDialog = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="closeDialog"
    :header="book?.title"
    :modal="true"
    :style="{ width: '800px' }"
  >
    <div v-if="book">
      <TabView v-model:activeIndex="activeTab">
        <TabPanel header="Detalii">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">Autor</p>
                <p class="text-gray-900">{{ book.author }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">Categorie</p>
                <p class="text-gray-900">{{ book.genre }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">ISBN</p>
                <p class="text-gray-900">{{ book.isbn }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">An publicație</p>
                <p class="text-gray-900">{{ book.publishedYear }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">Total exemplare</p>
                <p class="text-gray-900">{{ book.totalCopies }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600 detalii">Exemplare în stoc</p>
                <p
                  class="text-gray-900 font-bold"
                  :class="book.availableCopies > 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ book.availableCopies }}
                </p>
              </div>
            </div>

            <Divider />

            <div v-if="book.ratings && book.ratings.length > 0">
              <p class="text-sm font-medium text-gray-600 mb-2">Rating Mediu</p>
              <div class="flex items-center">
                <span class="text-3xl font-bold text-gray-900 mr-3">{{ avgRating }}</span>
                <Rating :modelValue="parseFloat(avgRating)" :readonly="true" :cancel="false" />
                <span class="text-gray-500 ml-2">({{ book.ratings.length }} recenzii)</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Împrumută">
          <div class="space-y-4">
            <div v-if="book.availableCopies > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Împrumutor</label>
              <div class="flex gap-2">
                <InputText
                  v-model="borrowerName"
                  placeholder="Scrie un nume"
                  class="flex-1"
                  :disabled="loading"
                  style="margin-right: 10px"
                />
                <Button label="Împrumută" icon="pi pi-check" @click="borrowBook" :loading="loading" />
              </div>
            </div>
            <div v-else class="text-center py-8">
              <i class="pi pi-ban text-4xl text-red-500 mb-2"></i>
              <p class="text-gray-600">Niciun exemplar prezent pentru a fi împrumutat</p>
            </div>

            <Divider />

            <div v-if="activeBorrows.length > 0">
              <h4 class="font-medium text-gray-900 mb-3">În prezent împrumutată de:</h4>
              <div class="space-y-2">
                <div
                  v-for="(borrow, index) in activeBorrows"
                  :key="index"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ borrow.borrowerName }}</p>
                    <p class="text-sm text-gray-500">
                      Împrumutată la: {{ formatDate(borrow.borrowDate) }}
                    </p>
                  </div>
                  <Button
                    label="Returnează"
                    icon="pi pi-undo"
                    @click="returnBook(borrow.borrowerName)"
                    size="small"
                    outlined
                    :loading="loading"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Istoric">
          <div v-if="borrowHistory.length > 0">
            <DataTable :value="borrowHistory" :paginator="true" :rows="5">
              <Column field="borrowerName" header="Împrumutor" />
              <Column header="Dată împrumut">
                <template #body="{ data }">
                  {{ formatDate(data.borrowDate) }}
                </template>
              </Column>
              <Column header="Dată return">
                <template #body="{ data }">
                  {{ data.returnDate ? formatDate(data.returnDate) : '-' }}
                </template>
              </Column>
              <Column header="Status">
                <template #body="{ data }">
                  <Tag
                    :value="data.status"
                    :severity="data.status === 'borrowed' ? 'warning' : 'success'"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div v-else class="text-center py-8">
            <i class="pi pi-history text-4xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">Niciun istoric de împrumut încă</p>
          </div>
        </TabPanel>

        <TabPanel header="Recenzii">
          <div class="space-y-4">
            <Card>
              <template #content>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Părerea ta</label>
                    <Rating
                      v-model="rating"
                      :cancel="false"
                      :disabled="loading"
                      style="margin-left: 10px"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Detalii (Opțional)</label
                    >
                    <br></br>
                    <Textarea
                      v-model="review"
                      rows="3"
                      class="w-full"
                      placeholder="Scrie-ți părerea..."
                      :disabled="loading"
                      style="margin: 10px"
                    />
                  </div>
                  <Button
                    label="Trimite recenzie"
                    icon="pi pi-star"
                    @click="addRating"
                    class="w-full"
                    :loading="loading"
                  />
                </div>
              </template>
            </Card>

            <Divider />

            <div v-if="book.ratings && book.ratings.length > 0">
              <h4 class="font-medium text-gray-900 mb-3">Toate recenziile</h4>
              <div class="space-y-3">
                <Card v-for="(r, index) in book.ratings" :key="index">
                  <template #content>
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <Rating
                          :modelValue="r.rating"
                          :readonly="true"
                          :cancel="false"
                          class="mb-2"
                        />
                        <p class="text-gray-700" v-if="r.review">{{ r.review }}</p>
                        <p class="text-xs text-gray-500 mt-2">{{ formatDate(r.reviewDate) }}</p>
                      </div>
                    </div>
                  </template>
                </Card>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <i class="pi pi-star text-4xl text-gray-300 mb-2"></i>
              <p class="text-gray-500">Nicio recenzie încă</p>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <Toast />
  </Dialog>
</template>

<style>
  .detalii{
    font-weight: bold;
    font-size: x-large;
  }
</style>
