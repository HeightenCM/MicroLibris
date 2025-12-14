<script setup>
import { ref, watch } from 'vue'
import { bookService } from '../services/bookService'

const props = defineProps({
  visible: Boolean,
  book: Object,
})

const emit = defineEmits(['update:visible', 'saved'])

const formData = ref({
  title: '',
  author: '',
  isbn: '',
  publishedYear: new Date().getFullYear(),
  genre: '',
  totalCopies: 1,
  availableCopies: 1,
})

const genres = [
  'Fiction',
  'Science Fiction',
  'Mystery',
  'Romance',
  'Thriller',
  'Fantasy',
  'Non-Fiction',
  'Biography',
  'History',
  'Self-Help',
]

const loading = ref(false)

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.book) {
        formData.value = { ...props.book }
      } else {
        resetForm()
      }
    }
  },
)

const resetForm = () => {
  formData.value = {
    title: '',
    author: '',
    isbn: '',
    publishedYear: new Date().getFullYear(),
    genre: '',
    totalCopies: 1,
    availableCopies: 1,
  }
}

const saveBook = async () => {
  try {
    loading.value = true

    if (props.book) {
      await bookService.updateBook(props.book._id, formData.value)
    } else {
      await bookService.createBook(formData.value)
    }

    emit('saved')
    emit('update:visible', false)
  } catch (error) {
    console.error('Error saving book:', error)
  } finally {
    loading.value = false
  }
}

const closeDialog = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="closeDialog"
    :header="book ? 'Edit Book' : 'Add New Book'"
    :modal="true"
    :style="{ width: '600px' }"
    :closable="!loading"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
        <InputText v-model="formData.title" class="w-full" :disabled="loading" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Author *</label>
        <InputText v-model="formData.author" class="w-full" :disabled="loading" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">ISBN *</label>
          <InputText v-model="formData.isbn" class="w-full" :disabled="loading" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Published Year *</label>
          <InputNumber
            v-model="formData.publishedYear"
            class="w-full"
            :useGrouping="false"
            :disabled="loading"
          />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Genre *</label>
        <Dropdown
          v-model="formData.genre"
          :options="genres"
          placeholder="Select a genre"
          class="w-full"
          :disabled="loading"
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Total Copies *</label>
          <InputNumber v-model="formData.totalCopies" class="w-full" :min="1" :disabled="loading" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Available Copies *</label>
          <InputNumber
            v-model="formData.availableCopies"
            class="w-full"
            :min="0"
            :max="formData.totalCopies"
            :disabled="loading"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancel" @click="closeDialog" text :disabled="loading" />
      <Button
        :label="book ? 'Update' : 'Add'"
        @click="saveBook"
        :loading="loading"
        :disabled="!formData.title || !formData.author || !formData.isbn || !formData.genre"
      />
    </template>
  </Dialog>
</template>
