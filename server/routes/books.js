import express from 'express'
import { ObjectId } from 'mongodb'
import { getDb } from '../config/db.js'

const router = express.Router()

// Helper function to get books collection
const getCollection = () => getDb().collection('books')

// CREATE - Add a new book
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

// READ - Get all books
router.get('/', async (req, res) => {
  try {
    const books = await getCollection().find().toArray()
    res.json(books)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// READ - Get book by ID
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

// UPDATE - Update book details
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

// DELETE - Remove a book
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

// UPDATE - Borrow a book
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

// UPDATE - Return a book
router.post('/:id/return', async (req, res) => {
  try {
    const { borrowerName } = req.body

    // Find the book and the specific borrow record
    const book = await getCollection().findOne({
      _id: new ObjectId(req.params.id),
    })

    if (!book) {
      return res.status(404).json({ error: 'Book not found' })
    }

    // Find the active borrow record for this borrower
    const borrowIndex = book.borrowHistory.findIndex(
      (b) => b.borrowerName === borrowerName && b.status === 'borrowed',
    )

    if (borrowIndex === -1) {
      return res.status(400).json({ error: 'No active borrow record found' })
    }

    // Update the specific borrow record
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

// UPDATE - Add a rating/review
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

// AGGREGATION - Get statistics
// Demonstrates: $facet, $count, $match, $expr, $group, $avg, $unwind, $sum, $cond
router.get('/stats/dashboard', async (req, res) => {
  try {
    const stats = await getCollection()
      .aggregate([
        {
          $facet: {
            // Simple count of all books
            totalBooks: [{ $count: 'count' }],

            // Count books that have at least one copy borrowed
            totalBorrowed: [
              { $match: { $expr: { $lt: ['$availableCopies', '$totalCopies'] } } },
              { $count: 'count' },
            ],

            // Group by genre with total books and total copies per genre
            byGenre: [
              {
                $group: {
                  _id: '$genre',
                  count: { $sum: 1 },
                  totalCopies: { $sum: '$totalCopies' },
                  availableCopies: { $sum: '$availableCopies' },
                },
              },
              { $sort: { count: -1 } },
              {
                $project: {
                  _id: 1,
                  count: 1,
                  totalCopies: 1,
                  availableCopies: 1,
                  borrowRate: {
                    $multiply: [
                      {
                        $divide: [
                          { $subtract: ['$totalCopies', '$availableCopies'] },
                          '$totalCopies',
                        ],
                      },
                      100,
                    ],
                  },
                },
              },
            ],

            // Calculate average rating across all books
            avgRating: [
              { $unwind: '$ratings' },
              {
                $group: {
                  _id: null,
                  avgRating: { $avg: '$ratings.rating' },
                  totalRatings: { $sum: 1 },
                },
              },
            ],

            // Calculate total circulation (all borrows)
            totalCirculation: [{ $unwind: '$borrowHistory' }, { $count: 'count' }],

            // Books added this year
            recentAdditions: [
              {
                $match: {
                  addedDate: {
                    $gte: new Date(new Date().getFullYear(), 0, 1),
                  },
                },
              },
              { $count: 'count' },
            ],

            // Active borrowers (currently have books)
            activeBorrowers: [
              { $unwind: '$borrowHistory' },
              { $match: { 'borrowHistory.status': 'borrowed' } },
              { $group: { _id: '$borrowHistory.borrowerName' } },
              { $count: 'count' },
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
      totalRatings: stats[0].avgRating[0]?.totalRatings || 0,
      totalCirculation: stats[0].totalCirculation[0]?.count || 0,
      recentAdditions: stats[0].recentAdditions[0]?.count || 0,
      activeBorrowers: stats[0].activeBorrowers[0]?.count || 0,
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Most popular books (by borrow count)
// Demonstrates: $addFields, $size, $filter, $match, $sort, $limit, $project, $cond
router.get('/stats/popular', async (req, res) => {
  try {
    const popularBooks = await getCollection()
      .aggregate([
        {
          $addFields: {
            borrowCount: { $size: '$borrowHistory' },
            activeBorrows: {
              $size: {
                $filter: {
                  input: '$borrowHistory',
                  as: 'borrow',
                  cond: { $eq: ['$borrow.status', 'borrowed'] },
                },
              },
            },
            avgRating: {
              $cond: {
                if: { $gt: [{ $size: '$ratings' }, 0] },
                then: { $avg: '$ratings.rating' },
                else: 0,
              },
            },
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
            activeBorrows: 1,
            genre: 1,
            avgRating: { $round: ['$avgRating', 1] },
            popularityScore: {
              $add: ['$borrowCount', { $multiply: ['$avgRating', 2] }],
            },
          },
        },
      ])
      .toArray()

    res.json(popularBooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Books with average ratings
// Demonstrates: $match, $addFields, $avg, $size, $sort, $project, bucket by rating
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
            ratingDistribution: {
              fiveStars: {
                $size: {
                  $filter: {
                    input: '$ratings',
                    cond: { $eq: ['$this.rating', 5] },
                  },
                },
              },
              fourStars: {
                $size: {
                  $filter: {
                    input: '$ratings',
                    cond: { $eq: ['$this.rating', 4] },
                  },
                },
              },
              threeStars: {
                $size: {
                  $filter: {
                    input: '$ratings',
                    cond: { $eq: ['$this.rating', 3] },
                  },
                },
              },
              twoStars: {
                $size: {
                  $filter: {
                    input: '$ratings',
                    cond: { $eq: ['$this.rating', 2] },
                  },
                },
              },
              oneStar: {
                $size: {
                  $filter: {
                    input: '$ratings',
                    cond: { $eq: ['$this.rating', 1] },
                  },
                },
              },
            },
          },
        },
        {
          $sort: { avgRating: -1, ratingCount: -1 },
        },
        {
          $project: {
            title: 1,
            author: 1,
            avgRating: { $round: ['$avgRating', 2] },
            ratingCount: 1,
            genre: 1,
            ratingDistribution: 1,
            ratingQuality: {
              $switch: {
                branches: [
                  { case: { $gte: ['$avgRating', 4.5] }, then: 'Excellent' },
                  { case: { $gte: ['$avgRating', 4.0] }, then: 'Very Good' },
                  { case: { $gte: ['$avgRating', 3.0] }, then: 'Good' },
                  { case: { $gte: ['$avgRating', 2.0] }, then: 'Fair' },
                ],
                default: 'Poor',
              },
            },
          },
        },
      ])
      .toArray()

    res.json(booksWithRatings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Books with low availability
// Demonstrates: $match with $expr, $and, $multiply, $addFields, $divide, $sort
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
          $addFields: {
            availabilityPercentage: {
              $multiply: [{ $divide: ['$availableCopies', '$totalCopies'] }, 100],
            },
            urgencyLevel: {
              $switch: {
                branches: [
                  { case: { $eq: ['$availableCopies', 0] }, then: 'Critical' },
                  { case: { $lte: ['$availableCopies', 1] }, then: 'High' },
                  {
                    case: { $lte: [{ $divide: ['$availableCopies', '$totalCopies'] }, 0.2] },
                    then: 'Medium',
                  },
                ],
                default: 'Low',
              },
            },
            activeBorrows: {
              $size: {
                $filter: {
                  input: '$borrowHistory',
                  as: 'borrow',
                  cond: { $eq: ['$borrow.status', 'borrowed'] },
                },
              },
            },
          },
        },
        {
          $sort: { availableCopies: 1, totalCopies: -1 },
        },
        {
          $project: {
            title: 1,
            author: 1,
            availableCopies: 1,
            totalCopies: 1,
            genre: 1,
            availabilityPercentage: { $round: ['$availabilityPercentage', 1] },
            urgencyLevel: 1,
            activeBorrows: 1,
          },
        },
      ])
      .toArray()

    res.json(lowStockBooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Borrowing trends by month
// Demonstrates: $unwind, $group with date operators, $sort, $limit, $project with calculated fields
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
            totalBorrows: { $sum: 1 },
            returned: {
              $sum: {
                $cond: [{ $eq: ['$borrowHistory.status', 'returned'] }, 1, 0],
              },
            },
            stillBorrowed: {
              $sum: {
                $cond: [{ $eq: ['$borrowHistory.status', 'borrowed'] }, 1, 0],
              },
            },
            uniqueBooks: { $addToSet: '$title' },
            uniqueBorrowers: { $addToSet: '$borrowHistory.borrowerName' },
          },
        },
        {
          $addFields: {
            returnRate: {
              $multiply: [{ $divide: ['$returned', '$totalBorrows'] }, 100],
            },
            uniqueBookCount: { $size: '$uniqueBooks' },
            uniqueBorrowerCount: { $size: '$uniqueBorrowers' },
          },
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 },
        },
        {
          $limit: 12,
        },
        {
          $project: {
            _id: 1,
            totalBorrows: 1,
            returned: 1,
            stillBorrowed: 1,
            returnRate: { $round: ['$returnRate', 1] },
            uniqueBookCount: 1,
            uniqueBorrowerCount: 1,
            period: {
              $concat: [
                { $toString: '$_id.year' },
                '-',
                {
                  $cond: [
                    { $lt: ['$_id.month', 10] },
                    { $concat: ['0', { $toString: '$_id.month' }] },
                    { $toString: '$_id.month' },
                  ],
                },
              ],
            },
          },
        },
      ])
      .toArray()

    res.json(trends)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Author statistics
// Demonstrates: $group by author, $push, $avg, complex aggregations
router.get('/stats/authors', async (req, res) => {
  try {
    const authorStats = await getCollection()
      .aggregate([
        {
          $group: {
            _id: '$author',
            totalBooks: { $sum: 1 },
            totalCopies: { $sum: '$totalCopies' },
            genres: { $addToSet: '$genre' },
            books: {
              $push: {
                title: '$title',
                avgRating: { $avg: '$ratings.rating' },
                borrowCount: { $size: '$borrowHistory' },
              },
            },
            avgRating: { $avg: { $avg: '$ratings.rating' } },
            totalBorrows: { $sum: { $size: '$borrowHistory' } },
          },
        },
        {
          $addFields: {
            genreCount: { $size: '$genres' },
            mostPopularBook: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: '$books',
                    sortBy: { borrowCount: -1 },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $sort: { totalBorrows: -1 },
        },
        {
          $project: {
            author: '$_id',
            totalBooks: 1,
            totalCopies: 1,
            genres: 1,
            genreCount: 1,
            avgRating: { $round: ['$avgRating', 2] },
            totalBorrows: 1,
            mostPopularBook: '$mostPopularBook.title',
            productivity: {
              $switch: {
                branches: [
                  { case: { $gte: ['$totalBooks', 3] }, then: 'Prolific' },
                  { case: { $eq: ['$totalBooks', 2] }, then: 'Moderate' },
                ],
                default: 'Single Work',
              },
            },
          },
        },
      ])
      .toArray()

    res.json(authorStats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// AGGREGATION - Borrower analytics
// Demonstrates: $unwind, $match, $group, $lookup-like behavior with arrays
router.get('/stats/borrowers', async (req, res) => {
  try {
    const borrowerStats = await getCollection()
      .aggregate([
        { $unwind: '$borrowHistory' },
        {
          $group: {
            _id: '$borrowHistory.borrowerName',
            totalBorrows: { $sum: 1 },
            returned: {
              $sum: { $cond: [{ $eq: ['$borrowHistory.status', 'returned'] }, 1, 0] },
            },
            currentlyBorrowed: {
              $sum: { $cond: [{ $eq: ['$borrowHistory.status', 'borrowed'] }, 1, 0] },
            },
            favoriteGenres: { $push: '$genre' },
            booksRead: { $addToSet: '$title' },
            avgBorrowDuration: {
              $avg: {
                $cond: [
                  { $ne: ['$borrowHistory.returnDate', null] },
                  {
                    $divide: [
                      { $subtract: ['$borrowHistory.returnDate', '$borrowHistory.borrowDate'] },
                      86400000, // Convert to days
                    ],
                  },
                  null,
                ],
              },
            },
          },
        },
        {
          $addFields: {
            returnRate: {
              $multiply: [{ $divide: ['$returned', '$totalBorrows'] }, 100],
            },
            uniqueBooksRead: { $size: '$booksRead' },
            mostReadGenre: {
              $arrayElemAt: [
                {
                  $sortArray: {
                    input: {
                      $map: {
                        input: { $setUnion: ['$favoriteGenres', []] },
                        as: 'genre',
                        in: {
                          genre: '$genre',
                          count: {
                            $size: {
                              $filter: {
                                input: '$favoriteGenres',
                                cond: { $eq: ['$this', '$genre'] },
                              },
                            },
                          },
                        },
                      },
                    },
                    sortBy: { count: -1 },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $sort: { totalBorrows: -1 },
        },
        {
          $limit: 20,
        },
        {
          $project: {
            borrowerName: '$_id',
            totalBorrows: 1,
            returned: 1,
            currentlyBorrowed: 1,
            uniqueBooksRead: 1,
            returnRate: { $round: ['$returnRate', 1] },
            avgBorrowDuration: { $round: ['$avgBorrowDuration', 1] },
            mostReadGenre: '$mostReadGenre.genre',
            readerType: {
              $switch: {
                branches: [
                  { case: { $gte: ['$totalBorrows', 5] }, then: 'Avid Reader' },
                  { case: { $gte: ['$totalBorrows', 3] }, then: 'Regular Reader' },
                  { case: { $eq: ['$totalBorrows', 2] }, then: 'Casual Reader' },
                ],
                default: 'New Reader',
              },
            },
          },
        },
      ])
      .toArray()

    res.json(borrowerStats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
