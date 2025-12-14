import express from 'express'
import cors from 'cors'
import { connectToDatabase, closeDatabase } from './config/db.js'
import booksRouter from './routes/books.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/books', booksRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

async function startServer() {
  try {
    await connectToDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`)
      console.log(`📚 API available at http://localhost:${PORT}/api/books`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...')
  await closeDatabase()
  process.exit(0)
})

startServer()
