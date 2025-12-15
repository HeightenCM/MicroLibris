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
    toast.add({
      severity: 'error',
      summary: 'Eroare',
      detail: 'Nu s-au putut încărca cărțile',
      life: 3000,
    })
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
    summary: 'Succes',
    detail: selectedBook.value ? 'Carte actualizată' : 'Carte adăugată',
    life: 3000,
  })
}

const deleteBook = (book) => {
  confirm.require({
    message: `Sigur doriți să ștergeți "${book.title}"?`,
    header: 'Confirmare ștergere',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Da',
    rejectLabel: 'Nu',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await bookService.deleteBook(book._id)
        toast.add({ severity: 'success', summary: 'Șters', detail: 'Carte eliminată', life: 3000 })
        loadBooks()
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut șterge cartea',
          life: 3000,
        })
      }
    },
  })
}

const getAvailabilityClass = (book) => {
  if (book.availableCopies === 0) return 'availability-none'
  if (book.availableCopies <= book.totalCopies * 0.3) return 'availability-low'
  return 'availability-good'
}

const getGenreClass = (genre) => {
  const classes = {
    Fiction: 'genre-blue',
    'Science Fiction': 'genre-purple',
    Mystery: 'genre-gray',
    Romance: 'genre-pink',
    Thriller: 'genre-red',
    Fantasy: 'genre-indigo',
    'Non-Fiction': 'genre-green',
    Biography: 'genre-yellow',
    History: 'genre-orange',
  }
  return classes[genre] || 'genre-gray'
}

onMounted(() => {
  loadBooks()
})
</script>

<template>
  <div class="library-container">
    <!-- Header -->
    <div class="library-header">
      <Button
        label="Înregistrează o carte"
        icon="pi pi-plus"
        @click="openNewBookDialog"
        severity="primary"
      />
    </div>

    <!-- Filters -->
    <Card class="filters-card">
      <template #content>
        <div class="filters-grid">
          <span class="p-input-icon-left search-input">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Caută după titlu sau autor"
              class="w-full"
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
          />
        </div>
      </template>
    </Card>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredBooks.length === 0" class="empty-state">
      <i class="pi pi-book empty-icon"></i>
      <p class="empty-text">Nu s-au găsit cărți</p>
      <Button label="Adaugă prima carte" icon="pi pi-plus" @click="openNewBookDialog" text />
    </div>

    <!-- Books Grid -->
    <div v-else class="books-grid">
      <Card v-for="book in filteredBooks" :key="book._id" class="book-card">
        <template #header>
          <div class="book-card-header">
            <i class="pi pi-book"></i>
          </div>
        </template>
        <template #title>
          <div class="book-title">{{ book.title }}</div>
        </template>
        <template #subtitle>
          <div class="book-author">{{ book.author }}</div>
        </template>
        <template #content>
          <div class="book-content">
            <div class="book-badges">
              <span :class="['badge', getGenreClass(book.genre)]">
                {{ book.genre }}
              </span>
              <span :class="['badge', getAvailabilityClass(book)]">
                {{ book.availableCopies }}/{{ book.totalCopies }} disponibile
              </span>
            </div>

            <div class="book-details">
              <div><strong>ISBN:</strong> {{ book.isbn }}</div>
              <div><strong>An:</strong> {{ book.publishedYear }}</div>
            </div>

            <div v-if="book.ratings && book.ratings.length > 0" class="book-rating">
              <Rating
                :modelValue="book.ratings.reduce((a, r) => a + r.rating, 0) / book.ratings.length"
                :readonly="true"
                :cancel="false"
              />
              <span class="rating-count">({{ book.ratings.length }})</span>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="book-actions">
            <Button
              label="Detalii"
              icon="pi pi-eye"
              @click="openDetailsDialog(book)"
              text
              size="small"
            />
            <Button
              label="Editează"
              icon="pi pi-pencil"
              @click="openEditDialog(book)"
              text
              size="small"
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

    <!-- Dialogs -->
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

<style scoped>
.library-container {
  width: 100%;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.library-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.library-subtitle {
  color: #6b7280;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.filters-card {
  margin-bottom: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.search-input {
  width: 100%;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-text {
  color: #6b7280;
  font-size: 1.125rem;
  margin: 0 0 1rem 0;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .books-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.book-card {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  height: 100%;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.book-card-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  height: 8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: white;
  opacity: 0.9;
}

.book-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.book-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.book-badges {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Genre badges */
.genre-blue {
  background-color: #dbeafe;
  color: #1e40af;
}
.genre-purple {
  background-color: #e9d5ff;
  color: #7c3aed;
}
.genre-gray {
  background-color: #f3f4f6;
  color: #374151;
}
.genre-pink {
  background-color: #fce7f3;
  color: #db2777;
}
.genre-red {
  background-color: #fee2e2;
  color: #dc2626;
}
.genre-indigo {
  background-color: #e0e7ff;
  color: #4f46e5;
}
.genre-green {
  background-color: #d1fae5;
  color: #059669;
}
.genre-yellow {
  background-color: #fef3c7;
  color: #d97706;
}
.genre-orange {
  background-color: #fed7aa;
  color: #ea580c;
}

/* Availability badges */
.availability-none {
  background-color: #fee2e2;
  color: #dc2626;
}
.availability-low {
  background-color: #fef3c7;
  color: #d97706;
}
.availability-good {
  background-color: #d1fae5;
  color: #059669;
}

.book-details {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.book-details strong {
  color: #374151;
}

.book-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rating-count {
  font-size: 0.75rem;
  color: #6b7280;
}

.book-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.book-actions :deep(.p-button) {
  flex: 1;
  min-width: 0;
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .library-header {
    flex-direction: column;
    align-items: stretch;
  }

  .library-header button {
    width: 100%;
  }
}
</style>
