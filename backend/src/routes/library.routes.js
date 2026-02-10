const express = require('express');
const { validateToken } = require('../middleware/auth.middleware');
const libraryController = require('../controllers/library.controller');

const router = express.Router();

/**
 * Library Management Routes
 * Base: /api/library
 */

// ==================== BOOK MANAGEMENT ====================

/**
 * POST /api/library/books - Add a new book
 * Body: { title, author, isbn, category, costPrice, [publisher, edition, description, totalCopies, sellingPrice] }
 */
router.post('/books', validateToken, libraryController.addBook);

/**
 * GET /api/library/books - Get all books with filters
 * Query: [search, category, page, limit]
 */
router.get('/books', validateToken, libraryController.getAllBooks);

/**
 * GET /api/library/books/:bookId - Get book details with availability
 */
router.get('/books/:bookId', validateToken, libraryController.getBookDetails);

/**
 * PUT /api/library/books/:bookId - Update book information
 * Body: { [title, author, publisher, edition, category, description, costPrice, sellingPrice] }
 */
router.put('/books/:bookId', validateToken, libraryController.updateBook);

/**
 * DELETE /api/library/books/:bookId - Delete a book
 */
router.delete('/books/:bookId', validateToken, libraryController.deleteBook);

// ==================== BOOK COPY MANAGEMENT ====================

/**
 * POST /api/library/books/:bookId/copies - Add a copy of a book
 * Body: { barcode, [condition, notes] }
 */
router.post('/books/:bookId/copies', validateToken, libraryController.addBookCopy);

/**
 * PATCH /api/library/copies/:copyId/status - Update book copy status
 * Body: { status, [notes] }
 * Status: AVAILABLE, ISSUED, DAMAGED, LOST, PENDING_REPAIR
 */
router.patch('/copies/:copyId/status', validateToken, libraryController.updateCopyStatus);

// ==================== BORROW & RETURN ====================

/**
 * POST /api/library/borrow - Issue a book to a member
 * Body: { bookId, memberId }
 */
router.post('/borrow', validateToken, libraryController.issueBook);

/**
 * POST /api/library/return - Return a book
 * Body: { borrowRecordId }
 */
router.post('/return', validateToken, libraryController.returnBook);

/**
 * POST /api/library/renew - Renew a book borrowing
 * Body: { borrowRecordId }
 */
router.post('/renew', validateToken, libraryController.renewBook);

/**
 * GET /api/library/member/:memberId/checkouts - Get member's active checkouts
 */
router.get('/member/:memberId/checkouts', validateToken, libraryController.getMemberCheckouts);

// ==================== HOLD REQUESTS ====================

/**
 * POST /api/library/hold - Create a hold request for a book
 * Body: { bookId, memberId }
 */
router.post('/hold', validateToken, libraryController.createHoldRequest);

/**
 * GET /api/library/member/:memberId/holds - Get member's hold requests
 */
router.get('/member/:memberId/holds', validateToken, libraryController.getMemberHolds);

// ==================== REPORTS ====================

/**
 * GET /api/library/reports/overdue - Get overdue books report
 */
router.get('/reports/overdue', validateToken, libraryController.getOverdueBooks);

/**
 * GET /api/library/reports/most-borrowed - Get most borrowed books
 * Query: [limit]
 */
router.get('/reports/most-borrowed', validateToken, libraryController.getMostBorrowed);

/**
 * GET /api/library/member/:memberId/history - Get member borrowing history
 */
router.get('/member/:memberId/history', validateToken, libraryController.getMemberHistory);

/**
 * GET /api/library/stats - Get library statistics
 */
router.get('/stats', validateToken, libraryController.getLibraryStats);

// ==================== SETTINGS ====================

/**
 * PUT /api/library/settings - Update library settings
 * Body: { [issueLimit, issuePeriodDays, finePerDay, maxFineLimit, holdRequestExpiryDays] }
 */
router.put('/settings', validateToken, libraryController.updateLibrarySettings);

/**
 * GET /api/library/settings - Get library settings
 */
router.get('/settings', validateToken, libraryController.getLibrarySettings);

module.exports = router;
