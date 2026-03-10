const express = require('express');
const { validateToken, authorize } = require('../middleware/auth.middleware');
const libraryController = require('../controllers/library.controller');

const router = express.Router();

// All library routes require authentication
router.use(validateToken);

// Roles that can manage library resources
const LIBRARY_MANAGERS = ['ADMIN', 'PRINCIPAL', 'LIBRARIAN'];
// Roles that can view/borrow books
const LIBRARY_MEMBERS = ['ADMIN', 'PRINCIPAL', 'LIBRARIAN', 'TEACHER', 'STUDENT'];

/**
 * Library Management Routes
 * Base: /api/library
 */

// ==================== BOOK MANAGEMENT ====================

/**
 * POST /api/library/books - Add a new book
 * Body: { title, author, isbn, category, costPrice, [publisher, edition, description, totalCopies, sellingPrice] }
 */
router.post('/books', authorize(...LIBRARY_MANAGERS), libraryController.addBook);

/**
 * GET /api/library/books - Get all books with filters
 * Query: [search, category, page, limit]
 */
router.get('/books', authorize(...LIBRARY_MEMBERS), libraryController.getAllBooks);

/**
 * GET /api/library/books/:bookId - Get book details with availability
 */
router.get('/books/:bookId', authorize(...LIBRARY_MEMBERS), libraryController.getBookDetails);

/**
 * PUT /api/library/books/:bookId - Update book information
 * Body: { [title, author, publisher, edition, category, description, costPrice, sellingPrice] }
 */
router.put('/books/:bookId', authorize(...LIBRARY_MANAGERS), libraryController.updateBook);

/**
 * DELETE /api/library/books/:bookId - Delete a book
 */
router.delete('/books/:bookId', authorize(...LIBRARY_MANAGERS), libraryController.deleteBook);

// ==================== BOOK COPY MANAGEMENT ====================

/**
 * POST /api/library/books/:bookId/copies - Add a copy of a book
 * Body: { barcode, [condition, notes] }
 */
router.post('/books/:bookId/copies', authorize(...LIBRARY_MANAGERS), libraryController.addBookCopy);

/**
 * PATCH /api/library/copies/:copyId/status - Update book copy status
 * Body: { status, [notes] }
 * Status: AVAILABLE, ISSUED, DAMAGED, LOST, PENDING_REPAIR
 */
router.patch('/copies/:copyId/status', authorize(...LIBRARY_MANAGERS), libraryController.updateCopyStatus);

// ==================== BORROW & RETURN ====================

/**
 * POST /api/library/borrow - Issue a book to a member
 * Body: { bookId, memberId }
 */
router.post('/borrow', authorize(...LIBRARY_MANAGERS), libraryController.issueBook);

/**
 * POST /api/library/return - Return a book
 * Body: { borrowRecordId }
 */
router.post('/return', authorize(...LIBRARY_MANAGERS), libraryController.returnBook);

/**
 * POST /api/library/renew - Renew a book borrowing
 * Body: { borrowRecordId }
 */
router.post('/renew', authorize(...LIBRARY_MANAGERS), libraryController.renewBook);

/**
 * GET /api/library/member/:memberId/checkouts - Get member's active checkouts
 */
router.get('/member/:memberId/checkouts', authorize(...LIBRARY_MEMBERS), libraryController.getMemberCheckouts);

// ==================== HOLD REQUESTS ====================

/**
 * POST /api/library/hold - Create a hold request for a book
 * Body: { bookId, memberId }
 */
router.post('/hold', authorize(...LIBRARY_MEMBERS), libraryController.createHoldRequest);

/**
 * GET /api/library/member/:memberId/holds - Get member's hold requests
 */
router.get('/member/:memberId/holds', authorize(...LIBRARY_MEMBERS), libraryController.getMemberHolds);

// ==================== REPORTS ====================

/**
 * GET /api/library/reports/overdue - Get overdue books report
 */
router.get('/reports/overdue', authorize(...LIBRARY_MANAGERS), libraryController.getOverdueBooks);

/**
 * GET /api/library/reports/most-borrowed - Get most borrowed books
 * Query: [limit]
 */
router.get('/reports/most-borrowed', authorize(...LIBRARY_MEMBERS), libraryController.getMostBorrowed);

/**
 * GET /api/library/member/:memberId/history - Get member borrowing history
 */
router.get('/member/:memberId/history', authorize(...LIBRARY_MEMBERS), libraryController.getMemberHistory);

/**
 * GET /api/library/stats - Get library statistics
 */
router.get('/stats', authorize(...LIBRARY_MANAGERS), libraryController.getLibraryStats);

// ==================== SETTINGS ====================

/**
 * PUT /api/library/settings - Update library settings
 * Body: { [issueLimit, issuePeriodDays, finePerDay, maxFineLimit, holdRequestExpiryDays] }
 */
router.put('/settings', authorize('ADMIN', 'LIBRARIAN'), libraryController.updateLibrarySettings);

/**
 * GET /api/library/settings - Get library settings
 */
router.get('/settings', authorize(...LIBRARY_MANAGERS), libraryController.getLibrarySettings);

module.exports = router;
