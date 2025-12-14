import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'

dotenv.config()

let db
let client

async function connectToDatabase() {
  if (db) return db

  try {
    client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    console.log('✅ Connected to MongoDB Atlas')

    db = client.db('library')
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.')
  }
  return db
}

async function closeDatabase() {
  if (client) {
    await client.close()
    console.log('Database connection closed')
  }
}

export { connectToDatabase, getDb, closeDatabase }
