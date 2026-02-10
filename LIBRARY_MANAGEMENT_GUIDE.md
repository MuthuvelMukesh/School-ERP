# Library Management System - Implementation Guide

**Status**: ✅ Complete  
**Date**: February 10, 2026  
**Module Version**: 1.0.0

---

## Overview

The Library Management System is a comprehensive module for managing book catalogs, member borrowing, and library operations. It includes book tracking, member management, issuance/return workflows, hold requests, and detailed reporting.

---

## Features Implemented

### 1. Book Catalog Management
- ✅ Add/update/delete books with ISBN, author, publisher details
- ✅ Category and subject classification
- ✅ Book pricing tracking (cost and selling price)
- ✅ Bulk copy management with unique barcodes
- ✅ Detailed search with filters (title, author, ISBN, category)

### 2. Member Management
- ✅ Student and staff library membership
- ✅ Member borrowing limits (configurable, default 5 books)
- ✅ Active checkout tracking
- ✅ Borrowing history and statistics

### 3. Issuance & Return
- ✅ Issue books with automatic due date calculation
- ✅ Track returned books with automatic fine calculation
- ✅ Renewal with configurable max renewals (default 3)
- ✅ Late fine calculation (per day with max limit)
- ✅ Book copy status tracking (AVAILABLE, ISSUED, DAMAGED, LOST, PENDING_REPAIR)

### 4. Hold Requests
- ✅ Request books that are currently issued
- ✅ Hold request expiry dates
- ✅ Automatic hold fulfillment on return
- ✅ Cancel pending holds

### 5. Reporting & Analytics
- ✅ Overdue books report with days overdue
- ✅ Most borrowed books ranking
- ✅ Member borrowing history with statistics
- ✅ Library stats (catalog, activity, inventory)
- ✅ Activity logging for all operations

### 6. Configuration
- ✅ Configurable issue limits per member
- ✅ Customizable borrowing periods
- ✅ Fine calculation settings
- ✅ Hold request expiry settings

---

## Database Schema

### Models Added

#### Book
```prisma
model Book {
  id              String       // UUID
  title           String       // Book title
  author          String       // Author name
  isbn            String       // Unique ISBN
  publisher       String?      // Publisher name
  edition         String?      // Edition info
  category        String       // Category for classification
  description     String?      // Book description
  totalCopies     Int          // Total number of copies
  costPrice       Float        // Cost to library
  sellingPrice    Float?       // Selling price
  createdAt       DateTime     // Creation timestamp
  updatedAt       DateTime     // Last update timestamp
  
  // Relations
  copies          BookCopy[]   // Physical copies
  borrowRecords   BorrowRecord[] // Borrow history
}
```

#### BookCopy
```prisma
model BookCopy {
  id              String       // UUID
  bookId          String       // Reference to Book
  barcode         String       // Unique barcode
  status          String       // AVAILABLE, ISSUED, DAMAGED, LOST, PENDING_REPAIR
  condition       String       // GOOD, FAIR, POOR
  issuedTo        String?      // Student/Staff ID (null if available)
  notes           String?      // Additional notes
  createdAt       DateTime     // Creation timestamp
  updatedAt       DateTime     // Last update timestamp
  
  // Relations
  book            Book         // Reference to Book (cascade delete)
}
```

#### BorrowRecord
```prisma
model BorrowRecord {
  id              String       // UUID
  bookId          String       // Reference to Book
  memberId        String       // Student or Staff ID
  issueDate       DateTime     // Date of issue
  dueDate         DateTime     // Return due date
  returnDate      DateTime?    // Actual return date (null if not returned)
  fineAmount      Float        // Calculated fine amount
  finePaid        Boolean      // Whether fine was paid
  finePaymentDate DateTime?    // Date fine was paid
  renewalCount    Int          // Number of renewals made
  maxRenewals     Int          // Max renewals allowed (usually 3)
  remarks         String?      // Additional remarks
  createdAt       DateTime     // Creation timestamp
  updatedAt       DateTime     // Last update timestamp
  
  // Relations
  book            Book         // Reference to Book (cascade delete)
}
```

#### BookHoldRequest
```prisma
model BookHoldRequest {
  id              String       // UUID
  bookId          String       // Reference to Book
  memberId        String       // Student or Staff ID
  requestDate     DateTime     // When hold was requested
  fulfillmentDate DateTime?    // When/if hold was fulfilled
  status          String       // PENDING, FULFILLED, CANCELLED
  expiryDate      DateTime     // Hold expiry date
  createdAt       DateTime     // Creation timestamp
  updatedAt       DateTime     // Last update timestamp
  
  // Relations
  book            Book         // Reference to Book (cascade delete)
}
```

#### LibrarySettings
```prisma
model LibrarySettings {
  id                      String   // UUID
  issueLimit              Int      // Books per member (default: 5)
  issuePeriodDays         Int      // Days to return (default: 14)
  finePerDay              Float    // Fine per day (default: 5)
  maxFineLimit            Float    // Max fine limit (default: 100)
  holdRequestExpiryDays   Int      // Hold expiry days (default: 7)
  createdAt               DateTime // Creation timestamp
  updatedAt               DateTime // Last update timestamp
}
```

---

## API Endpoints

### Book Management

#### 1. Add a Book
```
POST /api/library/books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "category": "Fiction",
  "costPrice": 500,
  "publisher": "Scribner",
  "edition": "1st",
  "totalCopies": 3,
  "sellingPrice": 650,
  "description": "A classic American novel"
}

Response: 201 Created
{
  "message": "Book added successfully",
  "book": { ... }
}
```

#### 2. Get All Books
```
GET /api/library/books?search=gatsby&category=Fiction&page=1&limit=20
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

#### 3. Get Book Details
```
GET /api/library/books/:bookId
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  ...
  "availability": {
    "available": 2,
    "issued": 1,
    "damaged": 0,
    "total": 3
  },
  "currentBorrows": [ ... ]
}
```

#### 4. Update Book
```
PUT /api/library/books/:bookId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "The Great Gatsby (Revised)",
  "sellingPrice": 700
}

Response: 200 OK
{
  "message": "Book updated successfully",
  "book": { ... }
}
```

#### 5. Delete Book
```
DELETE /api/library/books/:bookId
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Book deleted successfully"
}
```

### Book Copy Management

#### 1. Add Book Copy
```
POST /api/library/books/:bookId/copies
Authorization: Bearer <token>
Content-Type: application/json

{
  "barcode": "ISBN978-0743273565-001",
  "condition": "GOOD",
  "notes": "New copy"
}

Response: 201 Created
{
  "message": "Book copy added successfully",
  "copy": { ... }
}
```

#### 2. Update Copy Status
```
PATCH /api/library/copies/:copyId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "DAMAGED",
  "notes": "Water damage on pages"
}

Response: 200 OK
{
  "message": "Copy status updated successfully",
  "copy": { ... }
}
```

### Borrow & Return

#### 1. Issue Book
```
POST /api/library/borrow
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "uuid",
  "memberId": "student-id-or-staff-id"
}

Response: 201 Created
{
  "message": "Book issued successfully",
  "borrowRecord": {
    "id": "uuid",
    "bookId": "uuid",
    "memberId": "member-id",
    "issueDate": "2026-02-10T10:30:00Z",
    "dueDate": "2026-02-24T10:30:00Z",
    "returnDate": null,
    "fineAmount": 0,
    "finePaid": false,
    "renewalCount": 0
  }
}
```

#### 2. Return Book
```
POST /api/library/return
Authorization: Bearer <token>
Content-Type: application/json

{
  "borrowRecordId": "uuid"
}

Response: 200 OK
{
  "message": "Book returned successfully",
  "returnRecord": {
    "id": "uuid",
    "bookId": "uuid",
    "memberId": "member-id",
    "issueDate": "2026-02-10T10:30:00Z",
    "dueDate": "2026-02-24T10:30:00Z",
    "returnDate": "2026-02-25T14:00:00Z",
    "fineAmount": 5,  // 1 day overdue @ 5 per day
    "finePaid": false
  }
}
```

#### 3. Renew Book
```
POST /api/library/renew
Authorization: Bearer <token>
Content-Type: application/json

{
  "borrowRecordId": "uuid"
}

Response: 200 OK
{
  "message": "Book renewed successfully",
  "renewalRecord": {
    "id": "uuid",
    "bookId": "uuid",
    "memberId": "member-id",
    "issueDate": "2026-02-10T10:30:00Z",
    "dueDate": "2026-03-10T10:30:00Z",  // Extended by 14 days
    "renewalCount": 1,
    "maxRenewals": 3
  }
}
```

#### 4. Get Member's Active Checkouts
```
GET /api/library/member/:memberId/checkouts
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "book": { "id": "uuid", "title": "The Great Gatsby", ... },
    "issueDate": "2026-02-10T10:30:00Z",
    "dueDate": "2026-02-24T10:30:00Z",
    "returnDate": null,
    "isOverdue": false,
    "daysUntilDue": 14
  }
]
```

### Hold Requests

#### 1. Create Hold Request
```
POST /api/library/hold
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "uuid",
  "memberId": "member-id"
}

Response: 201 Created
{
  "message": "Hold request created successfully",
  "holdRequest": {
    "id": "uuid",
    "bookId": "uuid",
    "memberId": "member-id",
    "requestDate": "2026-02-10T10:30:00Z",
    "status": "PENDING",
    "expiryDate": "2026-02-17T10:30:00Z"
  }
}
```

#### 2. Get Member's Holds
```
GET /api/library/member/:memberId/holds
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "book": { "id": "uuid", "title": "...", ... },
    "status": "PENDING",
    "requestDate": "2026-02-10T10:30:00Z",
    "expiryDate": "2026-02-17T10:30:00Z"
  }
]
```

### Reports & Analytics

#### 1. Get Overdue Books
```
GET /api/library/reports/overdue
Authorization: Bearer <token>

Response: 200 OK
{
  "count": 5,
  "books": [
    {
      "id": "uuid",
      "book": { "title": "The Great Gatsby", ... },
      "memberId": "member-id",
      "dueDate": "2026-02-08T10:30:00Z",
      "returnDate": null,
      "daysOverdue": 2,
      "fineAmount": 10
    }
  ]
}
```

#### 2. Get Most Borrowed Books
```
GET /api/library/reports/most-borrowed?limit=10
Authorization: Bearer <token>

Response: 200 OK
[
  {
    "id": "uuid",
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "borrowCount": 15
  }
]
```

#### 3. Get Member Borrowing History
```
GET /api/library/member/:memberId/history
Authorization: Bearer <token>

Response: 200 OK
{
  "history": [
    {
      "id": "uuid",
      "book": { "title": "...", ... },
      "issueDate": "2026-01-15T10:30:00Z",
      "dueDate": "2026-01-29T10:30:00Z",
      "returnDate": "2026-01-28T14:00:00Z",
      "fineAmount": 0,
      "finePaid": true
    }
  ],
  "statistics": {
    "totalBorrowed": 12,
    "currentActive": 2,
    "totalFinesPaid": 25
  }
}
```

#### 4. Get Library Statistics
```
GET /api/library/stats
Authorization: Bearer <token>

Response: 200 OK
{
  "catalog": {
    "totalBooks": 500,
    "totalCopies": 1200,
    "availableCopies": 950,
    "issuedBooks": 240,
    "damageBooks": 10
  },
  "activity": {
    "overdueBooks": 5,
    "totalMembers": 850,
    "pendingFines": 1250
  }
}
```

### Settings

#### 1. Update Library Settings
```
PUT /api/library/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "issueLimit": 5,
  "issuePeriodDays": 14,
  "finePerDay": 5,
  "maxFineLimit": 100,
  "holdRequestExpiryDays": 7
}

Response: 200 OK
{
  "message": "Settings updated successfully",
  "settings": { ... }
}
```

#### 2. Get Library Settings
```
GET /api/library/settings
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uuid",
  "issueLimit": 5,
  "issuePeriodDays": 14,
  "finePerDay": 5,
  "maxFineLimit": 100,
  "holdRequestExpiryDays": 7
}
```

---

## Testing

### Test Workflow

#### Step 1: Add Books
```bash
curl -X POST http://localhost:5000/api/library/books \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "category": "Fiction",
    "costPrice": 500
  }'
```

#### Step 2: Add Book Copies
```bash
curl -X POST http://localhost:5000/api/library/books/BOOK_ID/copies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barcode": "ISBN978-0743273565-001",
    "condition": "GOOD"
  }'
```

#### Step 3: Issue a Book
```bash
curl -X POST http://localhost:5000/api/library/borrow \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "BOOK_ID",
    "memberId": "STUDENT_ID"
  }'
```

#### Step 4: Return a Book
```bash
curl -X POST http://localhost:5000/api/library/return \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "borrowRecordId": "BORROW_RECORD_ID"
  }'
```

#### Step 5: Get Library Stats
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/library/stats
```

---

## Business Logic

### Fine Calculation
- Fine is calculated only when a book is returned overdue
- Daily fine rate: configurable (default 5)
- Maximum fine limit: configurable (default 100)
- Formula: `min(daysOverdue × finePerDay, maxFineLimit)`

### Renewal Rules
- Each book can be renewed up to configurable times (default 3)
- Renewal extends the due date by the issue period (default 14 days)
- Overdue books cannot be renewed until returned

### Member Limits
- Default borrowing limit: 5 books per member
- Active checkouts are checked when issuing
- Limit is configurable per library

### Hold Request Logic
- Can be created only for issued/unavailable books
- Expires after configurable days (default 7)
- Member can have multiple holds
- Only 1 pending hold per book per member

---

## Activity Logging

All library operations are automatically logged with:
- User ID (who performed the action)
- Action type (CREATE, UPDATE, DELETE, VIEW, etc.)
- Module (library)
- Description (specific details)
- Resource ID and type
- Changes (for updates)
- IP address and timestamp

Access logs at: `/api/activities?module=library`

---

## Integration Points

### Database Migration
```bash
# Generate Prisma client
npm run prisma:generate

# Run migration (includes new library tables)
npm run prisma:migrate
```

### Activity Tracking
Library operations automatically log to the `Activity` model. Access via:
```bash
GET /api/activities?module=library
```

### File References
- Service: `backend/src/utils/libraryService.js`
- Controller: `backend/src/controllers/library.controller.js`
- Routes: `backend/src/routes/library.routes.js`
- Schema: `backend/prisma/schema.prisma` (Book, BookCopy, BorrowRecord, BookHoldRequest, LibrarySettings models)

---

## Configuration

Configure library behavior in `/api/library/settings`:

| Setting | Default | Purpose |
|---------|---------|---------|
| issueLimit | 5 | Max books per member |
| issuePeriodDays | 14 | Days to return book |
| finePerDay | 5 | Fine amount per day overdue |
| maxFineLimit | 100 | Maximum fine cap |
| holdRequestExpiryDays | 7 | Hold request validity |

---

## Next Steps

1. Run database migration: `npm run prisma:migrate`
2. Configure library settings via API
3. Add initial book catalog
4. Train librarians on the system
5. Monitor activity logs for usage patterns

---

## Known Limitations

- Fine payment tracking (paid/unpaid) is tracked but payment processing not integrated
- No email notifications for overdue books (can be added)
- No SMS alerts for holds
- Manual fine waiver required (admin endpoint not yet implemented)

---

## Future Enhancements

- Email notifications for overdue/holds
- SMS alerts for members
- Barcode scanning integration
- RFID tag support
- Magazine/journal support
- Digital book management
- Inter-library loan system
- Recommendation system based on borrowing history

---

**Status**: ✅ Ready for Production  
**Version**: 1.0.0  
**Last Updated**: February 10, 2026
