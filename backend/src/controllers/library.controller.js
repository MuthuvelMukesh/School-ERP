const libraryService = require('../utils/libraryService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

/**
 * Library Controller - Handles all library-related API endpoints
 */

// ==================== BOOK MANAGEMENT ====================

/**
 * Add a new book
 * POST /api/library/books
 */
exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn, publisher, edition, category, description, totalCopies, costPrice, sellingPrice } = req.body;

    if (!title || !author || !isbn || !category || !costPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const book = await libraryService.addBook({
      title,
      author,
      isbn,
      publisher,
      edition,
      category,
      description,
      totalCopies: totalCopies || 1,
      costPrice,
      sellingPrice
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'library',
        description: `Added book: ${book.title}`,
        resourceId: book.id,
        resourceType: 'book',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Book added successfully', book });
  } catch (error) {
    logger.error('Error adding book:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all books with filters
 * GET /api/library/books
 */
exports.getAllBooks = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const books = await libraryService.getAllBooks(
      { search, category },
      parseInt(page),
      parseInt(limit)
    );

    res.json(books);
  } catch (error) {
    logger.error('Error fetching books:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get book details
 * GET /api/library/books/:bookId
 */
exports.getBookDetails = async (req, res) => {
  try {
    const book = await libraryService.getBookDetails(req.params.bookId);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'VIEW',
        actionType: 'VIEW',
        module: 'library',
        description: `Viewed book: ${book.title}`,
        resourceId: book.id,
        resourceType: 'book',
        ipAddress: req.ip
      }
    });

    res.json(book);
  } catch (error) {
    logger.error('Error fetching book details:', error);
    res.status(error.message === 'Book not found' ? 404 : 500).json({ error: error.message });
  }
};

/**
 * Update book information
 * PUT /api/library/books/:bookId
 */
exports.updateBook = async (req, res) => {
  try {
    const book = await libraryService.updateBook(req.params.bookId, req.body);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'library',
        description: `Updated book: ${book.title}`,
        resourceId: book.id,
        resourceType: 'book',
        changes: JSON.parse(JSON.stringify(req.body)),
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Book updated successfully', book });
  } catch (error) {
    logger.error('Error updating book:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a book
 * DELETE /api/library/books/:bookId
 */
exports.deleteBook = async (req, res) => {
  try {
    const bookId = req.params.bookId;
    const book = await libraryService.getBookDetails(bookId);

    await libraryService.deleteBook(bookId);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'DELETE',
        actionType: 'DELETE',
        module: 'library',
        description: `Deleted book: ${book.title}`,
        resourceId: bookId,
        resourceType: 'book',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    logger.error('Error deleting book:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== BOOK COPY MANAGEMENT ====================

/**
 * Add a copy of a book
 * POST /api/library/books/:bookId/copies
 */
exports.addBookCopy = async (req, res) => {
  try {
    const { barcode, condition, notes } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    const copy = await libraryService.addBookCopy(req.params.bookId, {
      barcode,
      condition,
      notes
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'library',
        description: `Added book copy: ${barcode}`,
        resourceId: copy.id,
        resourceType: 'book_copy',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Book copy added successfully', copy });
  } catch (error) {
    logger.error('Error adding book copy:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update book copy status
 * PATCH /api/library/copies/:copyId/status
 */
exports.updateCopyStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const copy = await libraryService.updateBookCopyStatus(req.params.copyId, status, notes);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'library',
        description: `Updated copy status: ${copy.barcode} -> ${status}`,
        resourceId: copy.id,
        resourceType: 'book_copy',
        changes: { status, notes },
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Copy status updated successfully', copy });
  } catch (error) {
    logger.error('Error updating copy status:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== BORROW & RETURN ====================

/**
 * Issue a book
 * POST /api/library/borrow
 */
exports.issueBook = async (req, res) => {
  try {
    const { bookId, memberId } = req.body;

    if (!bookId || !memberId) {
      return res.status(400).json({ error: 'Book ID and Member ID are required' });
    }

    // Get library settings
    const settings = await prisma.librarySettings.findFirst();

    const borrowRecord = await libraryService.issueBook(bookId, memberId, settings || {});

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'library',
        description: `Issued book to member ${memberId}`,
        resourceId: borrowRecord.id,
        resourceType: 'borrow_record',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Book issued successfully', borrowRecord });
  } catch (error) {
    logger.error('Error issuing book:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Return a book
 * POST /api/library/return
 */
exports.returnBook = async (req, res) => {
  try {
    const { borrowRecordId } = req.body;

    if (!borrowRecordId) {
      return res.status(400).json({ error: 'Borrow Record ID is required' });
    }

    // Get library settings
    const settings = await prisma.librarySettings.findFirst();

    const returnRecord = await libraryService.returnBook(borrowRecordId, settings || {});

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'library',
        description: `Returned book, Fine: ${returnRecord.fineAmount}`,
        resourceId: borrowRecordId,
        resourceType: 'borrow_record',
        changes: { fineAmount: returnRecord.fineAmount },
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Book returned successfully', returnRecord });
  } catch (error) {
    logger.error('Error returning book:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Renew a book
 * POST /api/library/renew
 */
exports.renewBook = async (req, res) => {
  try {
    const { borrowRecordId } = req.body;

    if (!borrowRecordId) {
      return res.status(400).json({ error: 'Borrow Record ID is required' });
    }

    // Get library settings
    const settings = await prisma.librarySettings.findFirst();

    const renewed = await libraryService.renewBook(borrowRecordId, settings || {});

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'library',
        description: `Renewed book, New due date: ${renewed.dueDate}`,
        resourceId: borrowRecordId,
        resourceType: 'borrow_record',
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Book renewed successfully', renewalRecord: renewed });
  } catch (error) {
    logger.error('Error renewing book:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get member's active checkouts
 * GET /api/library/member/:memberId/checkouts
 */
exports.getMemberCheckouts = async (req, res) => {
  try {
    const checkouts = await prisma.borrowRecord.findMany({
      where: {
        memberId: req.params.memberId,
        returnDate: null
      },
      include: { book: true },
      orderBy: { dueDate: 'asc' }
    });

    const today = new Date();
    const enriched = checkouts.map(record => ({
      ...record,
      isOverdue: record.dueDate < today,
      daysUntilDue: Math.ceil((record.dueDate - today) / (1000 * 60 * 60 * 24))
    }));

    res.json(enriched);
  } catch (error) {
    logger.error('Error fetching member checkouts:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== HOLD REQUESTS ====================

/**
 * Create a hold request
 * POST /api/library/hold
 */
exports.createHoldRequest = async (req, res) => {
  try {
    const { bookId, memberId } = req.body;

    if (!bookId || !memberId) {
      return res.status(400).json({ error: 'Book ID and Member ID are required' });
    }

    // Get library settings
    const settings = await prisma.librarySettings.findFirst();

    const holdRequest = await libraryService.createHoldRequest(bookId, memberId, settings || {});

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'CREATE',
        actionType: 'CREATE',
        module: 'library',
        description: `Created hold request for member ${memberId}`,
        resourceId: holdRequest.id,
        resourceType: 'hold_request',
        ipAddress: req.ip
      }
    });

    res.status(201).json({ message: 'Hold request created successfully', holdRequest });
  } catch (error) {
    logger.error('Error creating hold request:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get member's hold requests
 * GET /api/library/member/:memberId/holds
 */
exports.getMemberHolds = async (req, res) => {
  try {
    const holds = await libraryService.getMemberHoldRequests(req.params.memberId);
    res.json(holds);
  } catch (error) {
    logger.error('Error fetching hold requests:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REPORTS ====================

/**
 * Get overdue books
 * GET /api/library/reports/overdue
 */
exports.getOverdueBooks = async (req, res) => {
  try {
    const overdue = await libraryService.getOverdueBooks();

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'EXPORT',
        actionType: 'EXPORT',
        module: 'library',
        description: `Exported overdue books report (${overdue.length} items)`,
        ipAddress: req.ip
      }
    });

    res.json({ count: overdue.length, books: overdue });
  } catch (error) {
    logger.error('Error fetching overdue books:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get most borrowed books
 * GET /api/library/reports/most-borrowed
 */
exports.getMostBorrowed = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const books = await libraryService.getMostBorrowedBooks(parseInt(limit));
    res.json(books);
  } catch (error) {
    logger.error('Error fetching most borrowed books:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get member borrowing history
 * GET /api/library/member/:memberId/history
 */
exports.getMemberHistory = async (req, res) => {
  try {
    const { records, stats } = await libraryService.getMemberBorrowingHistory(req.params.memberId);

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'VIEW',
        actionType: 'VIEW',
        module: 'library',
        description: `Viewed member borrowing history`,
        resourceId: req.params.memberId,
        resourceType: 'member',
        ipAddress: req.ip
      }
    });

    res.json({ history: records, statistics: stats });
  } catch (error) {
    logger.error('Error fetching member history:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get library statistics
 * GET /api/library/stats
 */
exports.getLibraryStats = async (req, res) => {
  try {
    const stats = await libraryService.getLibraryStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching library stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== SETTINGS ====================

/**
 * Update library settings
 * PUT /api/library/settings
 */
exports.updateLibrarySettings = async (req, res) => {
  try {
    const { issueLimit, issuePeriodDays, finePerDay, maxFineLimit, holdRequestExpiryDays } = req.body;

    let settings = await prisma.librarySettings.findFirst();

    if (!settings) {
      settings = await prisma.librarySettings.create({
        data: {
          issueLimit: issueLimit || 5,
          issuePeriodDays: issuePeriodDays || 14,
          finePerDay: finePerDay || 5,
          maxFineLimit: maxFineLimit || 100,
          holdRequestExpiryDays: holdRequestExpiryDays || 7
        }
      });
    } else {
      settings = await prisma.librarySettings.update({
        where: { id: settings.id },
        data: {
          ...(issueLimit && { issueLimit }),
          ...(issuePeriodDays && { issuePeriodDays }),
          ...(finePerDay && { finePerDay }),
          ...(maxFineLimit && { maxFineLimit }),
          ...(holdRequestExpiryDays && { holdRequestExpiryDays })
        }
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE',
        actionType: 'UPDATE',
        module: 'library',
        description: 'Updated library settings',
        changes: req.body,
        ipAddress: req.ip
      }
    });

    res.json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    logger.error('Error updating library settings:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get library settings
 * GET /api/library/settings
 */
exports.getLibrarySettings = async (req, res) => {
  try {
    const settings = await prisma.librarySettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    logger.error('Error fetching library settings:', error);
    res.status(500).json({ error: error.message });
  }
};
