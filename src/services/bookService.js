import axios from 'axios'

const API_URL = 'http://localhost:8080/api/books'

export const bookService = {
  getAllBooks() {
    return axios.get(API_URL)
  },

  getBookById(id) {
    return axios.get(`${API_URL}/${id}`)
  },

  createBook(bookData) {
    return axios.post(API_URL, bookData)
  },

  updateBook(id, bookData) {
    return axios.put(`${API_URL}/${id}`, bookData)
  },

  deleteBook(id) {
    return axios.delete(`${API_URL}/${id}`)
  },

  borrowBook(id, borrowerName) {
    return axios.post(`${API_URL}/${id}/borrow`, { borrowerName })
  },

  returnBook(id, borrowerName) {
    return axios.post(`${API_URL}/${id}/return`, { borrowerName })
  },

  addRating(id, rating, review) {
    return axios.post(`${API_URL}/${id}/rating`, { rating, review })
  },

  getDashboardStats() {
    return axios.get(`${API_URL}/stats/dashboard`)
  },

  getPopularBooks() {
    return axios.get(`${API_URL}/stats/popular`)
  },

  getBooksWithRatings() {
    return axios.get(`${API_URL}/stats/ratings`)
  },

  getLowStockBooks() {
    return axios.get(`${API_URL}/stats/low-stock`)
  },

  getBorrowingTrends() {
    return axios.get(`${API_URL}/stats/trends`)
  },
}
