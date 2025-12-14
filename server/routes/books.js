import express from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

const router = express.Router()

const getCollection = () => getDb().collection('books')

router.post('/', async (req, res) => {
  try {
    const book = {
      ...req.body,
      borrowHistory: [],
      ratings: [],
      addedDate: new Date(),
    }

    const result = await getCollection().insertOne(book)
    res.status(201).json({
      message: 'Book added successfully',
      bookId: result.insertedId,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const books = await getCollection().find().toArray()
    res.json(books)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const book = await getCollection().findOne({
      _id: new ObjectId(req.params.id),
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json(book)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { _id, ...updateData } = req.body

    const result = await getCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Book updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await getCollection().deleteOne({
      _id: new ObjectId(req.params.id),
    })

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Book deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/borrow', async (req, res) => {
  try {
    const { borrowerName } = req.body

    const borrowRecord = {
      borrowerName,
      borrowDate: new Date(),
      returnDate: null,
      status: 'borrowed',
    }

    const result = await getCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $push: { borrowHistory: borrowRecord },
        $inc: { availableCopies: -1 },
      },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Book borrowed successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/return', async (req, res) => {
  try {
    const { borrowerName } = req.body

    const book = await getCollection().findOne({
      _id: new ObjectId(req.params.id),
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    const borrowIndex = book.borrowHistory.findIndex(
      (b) => b.borrowerName === borrowerName && b.status === 'borrowed',
    )

    if (borrowIndex === -1) {
      return res.status(400).json({ error: 'No active borrow record found' })
    }

    const updateField = `borrowHistory.${borrowIndex}`
    await getCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          [`${updateField}.returnDate`]: new Date(),
          [`${updateField}.status`]: 'returned',
        },
        $inc: { availableCopies: 1 },
      },
    )

    res.json({ message: 'Book returned successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/:id/rating', async (req, res) => {
  try {
    const { rating, review } = req.body

    const ratingRecord = {
      rating,
      review,
      reviewDate: new Date(),
    }

    const result = await getCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { ratings: ratingRecord } },
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' })
    }

    res.json({ message: 'Rating added successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await getCollection()
      .aggregate([
        {
          $facet: {
            totalBooks: [{ $count: 'count' }],
            totalBorrowed: [
              { $match: { $expr: { $lt: ['$availableCopies', '$totalCopies'] } } },
              { $count: 'count' },
            ],
            byGenre: [{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            avgRating: [
              { $unwind: '$ratings' },
              { $group: { _id: null, avgRating: { $avg: '$ratings.rating' } } },
            ],
          },
        },
      ])
      .toArray()

    const result = {
      totalBooks: stats[0].totalBooks[0]?.count || 0,
      totalBorrowed: stats[0].totalBorrowed[0]?.count || 0,
      byGenre: stats[0].byGenre,
      avgRating: stats[0].avgRating[0]?.avgRating || 0,
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats/popular', async (req, res) => {
  try {
    const popularBooks = await getCollection()
      .aggregate([
        {
          $addFields: {
            borrowCount: { $size: '$borrowHistory' },
          },
        },
        {
          $match: { borrowCount: { $gt: 0 } },
        },
        {
          $sort: { borrowCount: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            title: 1,
            author: 1,
            borrowCount: 1,
            genre: 1,
          },
        },
      ])
      .toArray()

    res.json(popularBooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats/ratings', async (req, res) => {
  try {
    const booksWithRatings = await getCollection()
      .aggregate([
        {
          $match: { ratings: { $exists: true, $ne: [] } },
        },
        {
          $addFields: {
            avgRating: { $avg: '$ratings.rating' },
            ratingCount: { $size: '$ratings' },
          },
        },
        {
          $sort: { avgRating: -1 },
        },
        {
          $project: {
            title: 1,
            author: 1,
            avgRating: 1,
            ratingCount: 1,
            genre: 1,
          },
        },
      ])
      .toArray()

    res.json(booksWithRatings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats/low-stock', async (req, res) => {
  try {
    const lowStockBooks = await getCollection()
      .aggregate([
        {
          $match: {
            $expr: {
              $and: [
                { $gt: ['$totalCopies', 0] },
                { $lte: ['$availableCopies', { $multiply: ['$totalCopies', 0.3] }] },
              ],
            },
          },
        },
        {
          $sort: { availableCopies: 1 },
        },
        {
          $project: {
            title: 1,
            author: 1,
            availableCopies: 1,
            totalCopies: 1,
            genre: 1,
          },
        },
      ])
      .toArray()

    res.json(lowStockBooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/stats/trends', async (req, res) => {
  try {
    const trends = await getCollection()
      .aggregate([
        { $unwind: '$borrowHistory' },
        {
          $group: {
            _id: {
              year: { $year: '$borrowHistory.borrowDate' },
              month: { $month: '$borrowHistory.borrowDate' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 },
      ])
      .toArray()

    res.json(trends)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
