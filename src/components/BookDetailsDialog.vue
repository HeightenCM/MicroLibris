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
      summary: 'Required',
      detail: 'Please enter borrower name',
      life: 3000,
    })
    return
  }

  try {
    loading.value = true
    await bookService.borrowBook(props.book._id, borrowerName.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Book borrowed successfully',
      life: 3000,
    })
    borrowerName.value = ''
    emit('updated')
    emit('update:visible', false)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to borrow book', life: 3000 })
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
      summary: 'Success',
      detail: 'Book returned successfully',
      life: 3000,
    })
    emit('updated')
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to return book', life: 3000 })
  } finally {
    loading.value = false
  }
}

const addRating = async () => {
  if (rating.value === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Required',
      detail: 'Please select a rating',
      life: 3000,
    })
    return
  }

  try {
    loading.value = true
    await bookService.addRating(props.book._id, rating.value, review.value)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Rating added successfully',
      life: 3000,
    })
    rating.value = 0
    review.value = ''
    emit('updated')
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to add rating', life: 3000 })
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
        <TabPanel header="Details">
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-gray-600">Author</p>
                <p class="text-gray-900">{{ book.author }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Genre</p>
                <p class="text-gray-900">{{ book.genre }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">ISBN</p>
                <p class="text-gray-900">{{ book.isbn }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Published Year</p>
                <p class="text-gray-900">{{ book.publishedYear }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Total Copies</p>
                <p class="text-gray-900">{{ book.totalCopies }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-600">Available Copies</p>
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
              <p class="text-sm font-medium text-gray-600 mb-2">Average Rating</p>
              <div class="flex items-center">
                <span class="text-3xl font-bold text-gray-900 mr-3">{{ avgRating }}</span>
                <Rating :modelValue="parseFloat(avgRating)" :readonly="true" :cancel="false" />
                <span class="text-gray-500 ml-2">({{ book.ratings.length }} reviews)</span>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Borrow">
          <div class="space-y-4">
            <div v-if="book.availableCopies > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Borrower Name</label>
              <div class="flex gap-2">
                <InputText
                  v-model="borrowerName"
                  placeholder="Enter name"
                  class="flex-1"
                  :disabled="loading"
                />
                <Button label="Borrow" icon="pi pi-check" @click="borrowBook" :loading="loading" />
              </div>
            </div>
            <div v-else class="text-center py-8">
              <i class="pi pi-ban text-4xl text-red-500 mb-2"></i>
              <p class="text-gray-600">No copies available for borrowing</p>
            </div>

            <Divider />

            <div v-if="activeBorrows.length > 0">
              <h4 class="font-medium text-gray-900 mb-3">Currently Borrowed By:</h4>
              <div class="space-y-2">
                <div
                  v-for="(borrow, index) in activeBorrows"
                  :key="index"
                  class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ borrow.borrowerName }}</p>
                    <p class="text-sm text-gray-500">
                      Borrowed: {{ formatDate(borrow.borrowDate) }}
                    </p>
                  </div>
                  <Button
                    label="Return"
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

        <TabPanel header="History">
          <div v-if="borrowHistory.length > 0">
            <DataTable :value="borrowHistory" :paginator="true" :rows="5">
              <Column field="borrowerName" header="Borrower" />
              <Column header="Borrowed Date">
                <template #body="{ data }">
                  {{ formatDate(data.borrowDate) }}
                </template>
              </Column>
              <Column header="Returned Date">
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
            <p class="text-gray-500">No borrow history yet</p>
          </div>
        </TabPanel>

        <!-- Ratings Tab -->
        <TabPanel header="Ratings">
          <div class="space-y-4">
            <Card>
              <template #content>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <Rating v-model="rating" :cancel="false" :disabled="loading" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2"
                      >Review (Optional)</label
                    >
                    <Textarea
                      v-model="review"
                      rows="3"
                      class="w-full"
                      placeholder="Write your review..."
                      :disabled="loading"
                    />
                  </div>
                  <Button
                    label="Submit Rating"
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
              <h4 class="font-medium text-gray-900 mb-3">All Reviews</h4>
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
              <p class="text-gray-500">No ratings yet</p>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>

    <Toast />
  </Dialog>
</template>
