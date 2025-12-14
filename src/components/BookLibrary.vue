<script setup>
import { ref, onMounted, computed } from 'vue'
import { bookService } from '../services/bookService'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import BookDialog from './BookDialog.vue'
import BookDetailsDialog from './BookDetailsDialog.vue'

const confirm = useConfirm()
const toast = useToast()

const books = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedGenre = ref(null)
const showBookDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedBook = ref(null)

const genres = computed(() => {
  const uniqueGenres = [...new Set(books.value.map((b) => b.genre))]
  return uniqueGenres.map((g) => ({ label: g, value: g }))
})

const filteredBooks = computed(() => {
  let filtered = books.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query),
    )
  }

  if (selectedGenre.value) {
    filtered = filtered.filter((book) => book.genre === selectedGenre.value)
  }

  return filtered
})

const loadBooks = async () => {
  try {
    loading.value = true
    const response = await bookService.getAllBooks()
    books.value = response.data
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load books', life: 3000 })
  } finally {
    loading.value = false
  }
}

const openNewBookDialog = () => {
  selectedBook.value = null
  showBookDialog.value = true
}

const openEditDialog = (book) => {
  selectedBook.value = { ...book }
  showBookDialog.value = true
}

const openDetailsDialog = (book) => {
  selectedBook.value = book
  showDetailsDialog.value = true
}

const handleBookSaved = () => {
  loadBooks()
  showBookDialog.value = false
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: selectedBook.value ? 'Book updated' : 'Book added',
    life: 3000,
  })
}

const deleteBook = (book) => {
  confirm.require({
    message: `Are you sure you want to delete "${book.title}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookService.deleteBook(book._id)
        toast.add({ severity: 'success', summary: 'Deleted', detail: 'Book removed', life: 3000 })
        loadBooks()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete book',
          life: 3000,
        })
      }
    },
  })
}

const getAvailabilityColor = (book) => {
  if (book.availableCopies === 0) return 'bg-red-100 text-red-800'
  if (book.availableCopies <= book.totalCopies * 0.3) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

const getGenreColor = (genre) => {
  const colors = {
    Fiction: 'bg-blue-100 text-blue-800',
    'Science Fiction': 'bg-purple-100 text-purple-800',
    Mystery: 'bg-gray-100 text-gray-800',
    Romance: 'bg-pink-100 text-pink-800',
    Thriller: 'bg-red-100 text-red-800',
    Fantasy: 'bg-indigo-100 text-indigo-800',
    'Non-Fiction': 'bg-green-100 text-green-800',
    Biography: 'bg-yellow-100 text-yellow-800',
    History: 'bg-orange-100 text-orange-800',
  }
  return colors[genre] || 'bg-gray-100 text-gray-800'
}

onMounted(() => {
  loadBooks()
})
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900" style="text-align: center; font-size: 50px">
            Colecție
          </h2>
        </div>
      </div>
    </div>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="align-items: center">
          <Button
            label="Înregistrează o carte"
            icon="pi pi-plus"
            @click="openNewBookDialog"
            class="bg-blue-600"
            style="margin-right: 20px"
          />
          <i class="pi pi-search" />
          <span class="p-input-icon-left w-full">
            <InputText
              v-model="searchQuery"
              placeholder="Caută după titlu sau autor"
              class="w-full"
              style="margin-left: 10px"
            />
          </span>
          <Dropdown
            v-model="selectedGenre"
            :options="genres"
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrează după categorie"
            :showClear="true"
            class="w-full"
            style="margin-left: 10px"
          />
        </div>
      </template>
    </Card>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else-if="filteredBooks.length === 0" class="text-center py-12">
      <i class="pi pi-book text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">No books found</p>
      <Button
        label="Add Your First Book"
        icon="pi pi-plus"
        @click="openNewBookDialog"
        class="mt-4"
        text
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card v-for="book in filteredBooks" :key="book._id" class="hover:shadow-lg transition-shadow">
        <template #header>
          <div
            class="bg-gradient-to-br from-blue-500 to-blue-700 h-32 flex items-center justify-center"
          >
            <i class="pi pi-book text-5xl text-white opacity-80"></i>
          </div>
        </template>
        <template #title>
          <div class="text-lg font-bold text-gray-900 truncate">{{ book.title }}</div>
        </template>
        <template #subtitle>
          <div class="text-sm text-gray-600">{{ book.author }}</div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span
                :class="`px-2 py-1 rounded text-xs font-medium ${getGenreColor(book.genre)}`"
                style="margin-right: 10px"
              >
                {{ book.genre }}
              </span>
              <span :class="`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(book)}`">
                {{ book.availableCopies }}/{{ book.totalCopies }} disponibile
              </span>
            </div>

            <div class="text-sm text-gray-600">
              <div>ISBN: {{ book.isbn }}</div>
              <div>An: {{ book.publishedYear }}</div>
            </div>

            <div v-if="book.ratings && book.ratings.length > 0" class="flex items-center">
              <Rating
                :modelValue="book.ratings.reduce((a, r) => a + r.rating, 0) / book.ratings.length"
                :readonly="true"
                :cancel="false"
                class="text-sm"
              />
              <span class="text-xs text-gray-500 ml-2">({{ book.ratings.length }})</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-2">
            <Button
              label="Detalii"
              icon="pi pi-eye"
              @click="openDetailsDialog(book)"
              text
              size="small"
              class="flex-1"
            />
            <Button
              label="Editează"
              icon="pi pi-pencil"
              @click="openEditDialog(book)"
              text
              size="small"
              class="flex-1"
            />
            <Button
              icon="pi pi-trash"
              @click="deleteBook(book)"
              text
              severity="danger"
              size="small"
            />
          </div>
        </template>
      </Card>
    </div>

    <BookDialog v-model:visible="showBookDialog" :book="selectedBook" @saved="handleBookSaved" />

    <BookDetailsDialog
      v-model:visible="showDetailsDialog"
      :book="selectedBook"
      @updated="loadBooks"
    />

    <ConfirmDialog />
    <Toast />
  </div>
</template>
