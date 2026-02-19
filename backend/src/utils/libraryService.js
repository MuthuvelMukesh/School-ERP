const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('./logger');

/**
 * Library Service - Handles all library management business logic
 */

// ==================== BOOK MANAGEMENT ====================

/**
 * Add a new book to the library catalog
 */
async function addBook(bookData) {
  try {
    const existingBook = await prisma.book.findUnique({
      where: { isbn: bookData.isbn }
    });

    if (existingBook) {
      throw new Error('Book with this ISBN already exists');
    }

    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        publisher: bookData.publisher,
        edition: bookData.edition,
        category: bookData.category,
        description: bookData.description,
        totalCopies: bookData.totalCopies || 1,
        costPrice: bookData.costPrice,
        sellingPrice: bookData.sellingPrice
      }
    });

    logger.info(`Book added: ${book.title} (ISBN: ${book.isbn})`);
    return book;
  } catch (error) {
    logger.error('Error adding book:', error);
    throw error;
  }
}

/**
 * Get all books with pagination and filters
 */
async function getAllBooks(filters = {}, page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    const where = {};

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { author: { contains: filters.search, mode: 'insensitive' } },
        { isbn: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { copies: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.book.count({ where })
    ]);

    return {
      data: books,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error fetching books:', error);
    throw error;
  }
}

/**
 * Get book details with availability
 */
async function getBookDetails(bookId) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        copies: true,
        borrowRecords: {
          where: { returnDate: null },
          take: 5
        }
      }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    const availableCopies = book.copies.filter(c => c.status === 'AVAILABLE').length;
    const issuedCopies = book.copies.filter(c => c.status === 'ISSUED').length;

    return {
      ...book,
      availability: {
        available: availableCopies,
        issued: issuedCopies,
        damaged: book.copies.filter(c => c.status === 'DAMAGED').length,
        total: book.totalCopies
      },
      currentBorrows: book.borrowRecords
    };
  } catch (error) {
    logger.error('Error fetching book details:', error);
    throw error;
  }
}

/**
 * Update book information
 */
async function updateBook(bookId, bookData) {
  try {
    const book = await prisma.book.update({
      where: { id: bookId },
      data: {
        ...(bookData.title && { title: bookData.title }),
        ...(bookData.author && { author: bookData.author }),
        ...(bookData.publisher && { publisher: bookData.publisher }),
        ...(bookData.edition && { edition: bookData.edition }),
        ...(bookData.category && { category: bookData.category }),
        ...(bookData.description !== undefined && { description: bookData.description }),
        ...(bookData.costPrice && { costPrice: bookData.costPrice }),
        ...(bookData.sellingPrice !== undefined && { sellingPrice: bookData.sellingPrice })
      }
    });

    logger.info(`Book updated: ${book.title}`);
    return book;
  } catch (error) {
    logger.error('Error updating book:', error);
    throw error;
  }
}

/**
 * Delete a book (only if no borrow records)
 */
async function deleteBook(bookId) {
  try {
    const borrowRecords = await prisma.borrowRecord.count({
      where: { bookId }
    });

    if (borrowRecords > 0) {
      throw new Error('Cannot delete book with existing borrow records');
    }

    await prisma.book.delete({
      where: { id: bookId }
    });

    logger.info(`Book deleted: ${bookId}`);
  } catch (error) {
    logger.error('Error deleting book:', error);
    throw error;
  }
}

// ==================== BOOK COPY MANAGEMENT ====================

/**
 * Add a copy of a book
 */
async function addBookCopy(bookId, copyData) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    });

    if (!book) {
      throw new Error('Book not found');
    }

    const bookCopy = await prisma.bookCopy.create({
      data: {
        bookId,
        barcode: copyData.barcode,
        status: 'AVAILABLE',
        condition: copyData.condition || 'GOOD',
        notes: copyData.notes
      }
    });

    logger.info(`Book copy added: ${bookCopy.barcode}`);
    return bookCopy;
  } catch (error) {
    logger.error('Error adding book copy:', error);
    throw error;
  }
}

/**
 * Update book copy status
 */
async function updateBookCopyStatus(copyId, status, notes = null) {
  try {
    const bookCopy = await prisma.bookCopy.update({
      where: { id: copyId },
      data: {
        status,
        ...(notes && { notes })
      }
    });

    logger.info(`Book copy status updated: ${bookCopy.barcode} -> ${status}`);
    return bookCopy;
  } catch (error) {
    logger.error('Error updating book copy status:', error);
    throw error;
  }
}

// ==================== BORROW & RETURN ====================

/**
 * Issue a book to a member
 */
async function issueBook(bookId, memberId, settings) {
  try {
    // Check availability
    const availableCopy = await prisma.bookCopy.findFirst({
      where: {
        bookId,
        status: 'AVAILABLE'
      }
    });

    if (!availableCopy) {
      throw new Error('No copies available for this book');
    }

    // Check member's borrowing limit
    const activeCheckouts = await prisma.borrowRecord.count({
      where: {
        memberId,
        returnDate: null
      }
    });

    if (activeCheckouts >= (settings.issueLimit || 5)) {
      throw new Error(`Member has reached borrow limit of ${settings.issueLimit || 5}`);
    }

    // Create borrow record
    const issuePeriodDays = settings.issuePeriodDays || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + issuePeriodDays);

    const borrowRecord = await prisma.borrowRecord.create({
      data: {
        bookId,
        memberId,
        dueDate
      }
    });

    // Update copy status
    await prisma.bookCopy.update({
      where: { id: availableCopy.id },
      data: {
        status: 'ISSUED',
        issuedTo: memberId
      }
    });

    logger.info(`Book issued: ${bookId} to ${memberId}`);
    return borrowRecord;
  } catch (error) {
    logger.error('Error issuing book:', error);
    throw error;
  }
}

/**
 * Return a book
 */
async function returnBook(borrowRecordId, settings) {
  try {
    const borrowRecord = await prisma.borrowRecord.findUnique({
      where: { id: borrowRecordId }
    });

    if (!borrowRecord) {
      throw new Error('Borrow record not found');
    }

    if (borrowRecord.returnDate) {
      throw new Error('Book already returned');
    }

    // Calculate fine if overdue
    const today = new Date();
    let fineAmount = 0;

    if (today > borrowRecord.dueDate) {
      const daysOverdue = Math.floor((today - borrowRecord.dueDate) / (1000 * 60 * 60 * 24));
      const finePerDay = settings.finePerDay || 5;
      fineAmount = Math.min(daysOverdue * finePerDay, settings.maxFineLimit || 100);
    }

    // Update borrow record
    const updatedRecord = await prisma.borrowRecord.update({
      where: { id: borrowRecordId },
      data: {
        returnDate: today,
        fineAmount
      }
    });

    // Update copy status
    const bookCopy = await prisma.bookCopy.findFirst({
      where: {
        bookId: borrowRecord.bookId,
        issuedTo: borrowRecord.memberId
      }
    });

    if (bookCopy) {
      await prisma.bookCopy.update({
        where: { id: bookCopy.id },
        data: {
          status: 'AVAILABLE',
          issuedTo: null
        }
      });
    }

    logger.info(`Book returned: ${borrowRecord.bookId}, Fine: ${fineAmount}`);
    return updatedRecord;
  } catch (error) {
    logger.error('Error returning book:', error);
    throw error;
  }
}

/**
 * Renew a book borrowing
 */
async function renewBook(borrowRecordId, settings) {
  try {
    const borrowRecord = await prisma.borrowRecord.findUnique({
      where: { id: borrowRecordId }
    });

    if (!borrowRecord) {
      throw new Error('Borrow record not found');
    }

    if (borrowRecord.returnDate) {
      throw new Error('Cannot renew returned book');
    }

    const maxRenewals = borrowRecord.maxRenewals || 3;
    if (borrowRecord.renewalCount >= maxRenewals) {
      throw new Error(`Maximum renewals (${maxRenewals}) reached`);
    }

    // Extend due date
    const newDueDate = new Date(borrowRecord.dueDate);
    const issuePeriodDays = settings.issuePeriodDays || 14;
    newDueDate.setDate(newDueDate.getDate() + issuePeriodDays);

    const renewed = await prisma.borrowRecord.update({
      where: { id: borrowRecordId },
      data: {
        dueDate: newDueDate,
        renewalCount: { increment: 1 }
      }
    });

    logger.info(`Book renewed: ${borrowRecord.bookId}, New due date: ${newDueDate}`);
    return renewed;
  } catch (error) {
    logger.error('Error renewing book:', error);
    throw error;
  }
}

// ==================== HOLD REQUESTS ====================

/**
 * Create a hold request for unavailable book
 */
async function createHoldRequest(bookId, memberId, settings) {
  try {
    // Check if book is available
    const availableCopy = await prisma.bookCopy.findFirst({
      where: { bookId, status: 'AVAILABLE' }
    });

    if (availableCopy) {
      throw new Error('Book is currently available, no need to hold');
    }

    // Check existing hold
    const existingHold = await prisma.bookHoldRequest.findFirst({
      where: {
        bookId,
        memberId,
        status: 'PENDING'
      }
    });

    if (existingHold) {
      throw new Error('Member already has a pending hold for this book');
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (settings.holdRequestExpiryDays || 7));

    const holdRequest = await prisma.bookHoldRequest.create({
      data: {
        bookId,
        memberId,
        expiryDate
      }
    });

    logger.info(`Hold request created: ${bookId} for ${memberId}`);
    return holdRequest;
  } catch (error) {
    logger.error('Error creating hold request:', error);
    throw error;
  }
}

/**
 * Get member's hold requests
 */
async function getMemberHoldRequests(memberId) {
  try {
    return await prisma.bookHoldRequest.findMany({
      where: { memberId },
      include: { book: true },
      orderBy: { requestDate: 'desc' }
    });
  } catch (error) {
    logger.error('Error fetching hold requests:', error);
    throw error;
  }
}

// ==================== REPORTS ====================

/**
 * Get overdue books report
 */
async function getOverdueBooks() {
  try {
    const today = new Date();
    const overdue = await prisma.borrowRecord.findMany({
      where: {
        dueDate: { lt: today },
        returnDate: null
      },
      include: { book: true },
      orderBy: { dueDate: 'asc' }
    });

    return overdue.map(record => ({
      ...record,
      daysOverdue: Math.floor((today - record.dueDate) / (1000 * 60 * 60 * 24))
    }));
  } catch (error) {
    logger.error('Error fetching overdue books:', error);
    throw error;
  }
}

/**
 * Get most borrowed books
 */
async function getMostBorrowedBooks(limit = 10) {
  try {
    const result = await prisma.borrowRecord.groupBy({
      by: ['bookId'],
      _count: true,
      orderBy: { _count: 'desc' },
      take: limit
    });

    const bookIds = result.map(r => r.bookId);
    const books = await prisma.book.findMany({
      where: { id: { in: bookIds } }
    });

    return result.map(r => ({
      ...books.find(b => b.id === r.bookId),
      borrowCount: r._count
    }));
  } catch (error) {
    logger.error('Error fetching most borrowed books:', error);
    throw error;
  }
}

/**
 * Get member borrowing history
 */
async function getMemberBorrowingHistory(memberId) {
  try {
    const records = await prisma.borrowRecord.findMany({
      where: { memberId },
      include: { book: true },
      orderBy: { issueDate: 'desc' }
    });

    const stats = {
      totalBorrowed: records.length,
      currentActive: records.filter(r => !r.returnDate).length,
      totalFinesPaid: records.reduce((sum, r) => sum + (r.finePaid ? r.fineAmount : 0), 0)
    };

    return { records, stats };
  } catch (error) {
    logger.error('Error fetching member borrowing history:', error);
    throw error;
  }
}

/**
 * Get library statistics
 */
async function getLibraryStats() {
  try {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      issuedBooks,
      overdueBooks,
      totalMembers,
      pendingFines
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.borrowRecord.count({ where: { returnDate: null } }),
      prisma.borrowRecord.count({
        where: {
          dueDate: { lt: new Date() },
          returnDate: null
        }
      }),
      prisma.borrowRecord.findMany({
        select: { memberId: true },
        distinct: ['memberId']
      }),
      prisma.borrowRecord.aggregate({
        where: { finePaid: false, fineAmount: { gt: 0 } },
        _sum: { fineAmount: true }
      })
    ]);

    return {
      catalog: {
        totalBooks,
        totalCopies,
        availableCopies,
        issuedBooks,
        damageBooks: totalCopies - availableCopies - issuedBooks
      },
      activity: {
        overdueBooks,
        totalMembers: totalMembers.length,
        pendingFines: pendingFines._sum.fineAmount || 0
      }
    };
  } catch (error) {
    logger.error('Error fetching library stats:', error);
    throw error;
  }
}

module.exports = {
  addBook,
  getAllBooks,
  getBookDetails,
  updateBook,
  deleteBook,
  addBookCopy,
  updateBookCopyStatus,
  issueBook,
  returnBook,
  renewBook,
  createHoldRequest,
  getMemberHoldRequests,
  getOverdueBooks,
  getMostBorrowedBooks,
  getMemberBorrowingHistory,
  getLibraryStats
};
