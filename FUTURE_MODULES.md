# Future Academic Modules - Implementation Plan

This document outlines the planned future modules for the School ERP system that are not yet implemented. Each module includes implementation guidelines and database schema suggestions.

## 1. Library Management System

### Overview
Comprehensive library management system for catalog management, book tracking, member management, and issuance/return tracking.

### Features to Implement

#### 1.1 Book Management
- Maintain book catalog with details (ISBN, title, author, publisher, edition)
- Category and subject classification
- Multiple copies tracking with unique barcodes
- Book pricing and cost tracking
- Damage and maintenance status

#### 1.2 Member Management
- Link students and staff as library members
- Membership validity period and renewal
- Member profiles with borrowing limits
- Member account balance (for late fees)

#### 1.3 Issuance & Return System
- Issue books to members with due dates
- Track returned books and late returns
- Calculate fine/penalties for late returns
- Hold requests for unavailable books
- Renew borrowing periods

#### 1.4 Inventory & Reports
- Real-time book availability
- Shortage identification
- Most borrowed books reports
- Overdue books reports
- Member borrowing history

### Database Schema (Prisma)

```prisma
model Book {
  id            String    @id @default(uuid())
  title         String
  author        String
  isbn          String    @unique
  publisher     String?
  edition       String?
  category      String
  description   String?
  totalCopies   Int       @default(1)
  costPrice     Float
  sellingPrice  Float?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  copies        BookCopy[]
  borrowRecords BorrowRecord[]
  
  @@map("books")
}

model BookCopy {
  id          String    @id @default(uuid())
  bookId      String
  barcode     String    @unique
  status      String    // AVAILABLE, ISSUED, DAMAGED, LOST
  issuedTo    String?
  condition   String    // GOOD, FAIR, POOR
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  book        Book      @relation(fields: [bookId], references: [id])
  
  @@map("book_copies")
}

model BorrowRecord {
  id            String    @id @default(uuid())
  bookId        String
  memberId      String
  issueDate     DateTime
  dueDate       DateTime
  returnDate    DateTime?
  fineAmount    Float     @default(0)
  finePaid      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  book          Book      @relation(fields: [bookId], references: [id])
  
  @@map("borrow_records")
}
```

### Implementation Steps
1. Create Book, BookCopy, and BorrowRecord models in schema
2. Build library controller and routes
3. Implement book search and catalog endpoints
4. Create issuance/return logic
5. Build fine calculation system
6. Create library reports

---

## 2. Transport/Bus Management System

### Overview
Complete transport management including vehicle tracking, route management, stop management, and student allocation.

### Features to Implement

#### 2.1 Vehicle Management
- Register vehicles with registration number, capacity, model
- Driver and conductor assignment
- Vehicle maintenance schedule tracking
- Fuel consumption tracking
- GPS tracking integration

#### 2.2 Route Management
- Define pickup and drop-off routes
- Add bus stops with locations
- Assign students to routes
- Route scheduling (timings)
- Cost allocation per route

#### 2.3 Student Transport Allocation
- Link students to specific routes
- Pick-up and drop-off points for each student
- Monthly transport fees
- Attendance in vehicle (boarding/not boarding)
- Parent contact for emergencies

#### 2.4 Driver & Staff Management
- Driver license and documents tracking
- Performance ratings
- Document verification dates
- Assignment history
- Leave management

#### 2.5 Alerts & Reports
- No-boarding alerts for day
- Delayed bus alerts
- Route-wise occupancy reports
- Monthly transportation expense reports
- Driver performance metrics

### Database Schema (Prisma)

```prisma
model Vehicle {
  id              String    @id @default(uuid())
  registrationNo  String    @unique
  model           String
  capacity        Int
  driverId        String?
  conductorId     String?
  serviceDate     DateTime
  maintenanceDate DateTime?
  fuelType        String    // PETROL, DIESEL, CNG
  averageMileage  Float
  currentMileage  Int
  gpsDeviceId     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  route           Route?
  maintenanceRecords MaintenanceRecord[]
  
  @@map("vehicles")
}

model Route {
  id          String    @id @default(uuid())
  name        String
  vehicleId   String    @unique
  monthlyFee  Float
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  stops       BusStop[]
  students    StudentTransport[]
  
  @@map("routes")
}

model BusStop {
  id        String    @id @default(uuid())
  routeId   String
  stopName  String
  location  String
  latitude  Float?
  longitude Float?
  stopOrder Int
  createdAt DateTime  @default(now())
  
  route     Route     @relation(fields: [routeId], references: [id])
  
  @@map("bus_stops")
}

model StudentTransport {
  id            String    @id @default(uuid())
  studentId     String
  routeId       String
  pickupStop    String
  dropoffStop   String
  monthlyFee    Float
  feePaid       Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  route         Route     @relation(fields: [routeId], references: [id])
  
  @@map("student_transport")
}

model MaintenanceRecord {
  id          String    @id @default(uuid())
  vehicleId   String
  description String
  cost        Float
  date        DateTime
  createdAt   DateTime  @default(now())
  
  vehicle     Vehicle   @relation(fields: [vehicleId], references: [id])
  
  @@map("maintenance_records")
}
```

### Implementation Steps
1. Create vehicle and route models
2. Build vehicle management endpoints
3. Implement route planning features
4. Create student-route allocation
5. Build GPS tracking integration (optional)
6. Create transport-related reports

---

## 3. Hostel Management System

### Overview
Complete hostel management including room allocation, warden assignment, leave management, and visitor tracking.

### Features to Implement

#### 3.1 Hostel & Room Management
- Multiple hostels support
- Room types and capacities
- Bed allocation with students
- Room conditions and maintenance status
- Occupancy tracking

#### 3.2 Student Hostel Allocation
- Allocate students to rooms
- Check-in and check-out dates
- Refundable security deposit
- Monthly charges
- Hostel rules and policies

#### 3.3 Warden & Staff
- Warden assignment to hostel
- Leave and duty management
- Complaint logging and tracking
- Night supervision records

#### 3.4 Visitor Management
- Register visitors with purpose
- Visit date and time tracking
- Leave request management
- Out-pass system

#### 3.5 Amenities & Maintenance
- Track available amenities
- Maintenance requests
- Inspection records
- Cleanliness and hygiene reports

#### 3.6 Notices & Communication
- Hostel notices board
- Emergency alerts
- Parent communication
- Student announcements

### Database Schema (Prisma)

```prisma
model Hostel {
  id          String    @id @default(uuid())
  name        String
  type        String    // BOYS, GIRLS, CO_ED
  capacity    Int
  wardenId    String?
  address     String?
  contactNo   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  rooms       HostelRoom[]
  students    HostelStudent[]
  
  @@map("hostels")
}

model HostelRoom {
  id          String    @id @default(uuid())
  hostelId    String
  roomNumber  String
  capacity    Int
  type        String    // SINGLE, DOUBLE, TRIPLE
  rentAmount  Float
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  hostel      Hostel    @relation(fields: [hostelId], references: [id])
  beds        HostelBed[]
  
  @@map("hostel_rooms")
}

model HostelBed {
  id      String    @id @default(uuid())
  roomId  String
  bedNo   Int
  status  String    // OCCUPIED, VACANT, MAINTENANCE
  
  room    HostelRoom @relation(fields: [roomId], references: [id])
  
  @@map("hostel_beds")
}

model HostelStudent {
  id              String    @id @default(uuid())
  studentId       String
  hostelId        String
  roomId          String
  checkInDate     DateTime
  checkOutDate    DateTime?
  depositAmount   Float
  monthlyFee      Float
  feePaid         Boolean   @default(false)
  createdAt       DateTime  @default(now())
  
  hostel          Hostel    @relation(fields: [hostelId], references: [id])
  
  @@map("hostel_students")
}

model HostelVisitor {
  id        String    @id @default(uuid())
  studentId String
  visitorName String
  purpose   String
  date      DateTime
  inTime    DateTime?
  outTime   DateTime?
  createdAt DateTime  @default(now())
  
  @@map("hostel_visitors")
}

model HostelComplaint {
  id        String    @id @default(uuid())
  studentId String
  subject   String
  description String
  status    String    // OPEN, RESOLVED, CLOSED
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  @@map("hostel_complaints")
}
```

### Implementation Steps
1. Create hostel and room models
2. Build room allocation system
3. Implement student hostel management
4. Create visitor tracking system
5. Build complaint management
6. Create hostel-related reports

---

## Implementation Priority & Recommendations

### Priority Levels

**High Priority (Q1 2024)**
- Library Management System (frequently used, good ROI)
- Transport Management (significant operational need)

**Medium Priority (Q2 2024)**
- Hostel Management (required for boarding schools)
- Enhanced Reporting (dashboard analytics expansion)

**Low Priority (Q3+ 2024)**
- Advanced GPS tracking for transport
- Biometric integration for hostel access
- Mobile app for hostel students

### Recommended Implementation Order

1. **Phase 1**: Library Management
   - Time: 2-3 weeks
   - Team: 1-2 developers
   - Dependencies: None
   - Value: High

2. **Phase 2**: Transport Management
   - Time: 3-4 weeks
   - Team: 1-2 developers
   - Dependencies: Google Maps API (optional)
   - Value: High

3. **Phase 3**: Hostel Management
   - Time: 2-3 weeks
   - Team: 1 developer
   - Dependencies: None
   - Value: Medium

### Technology Stack for New Modules

- **Backend**: Node.js/Express (existing)
- **Database**: PostgreSQL (existing Prisma setup)
- **Frontend**: React/Next.js (existing)
- **APIs**: Google Maps (for transport), SendGrid (for notifications)
- **Real-time**: WebSockets for live updates (optional)

### File Structure for New Modules

```
backend/
├── src/
│   ├── controllers/
│   │   ├── library.controller.js
│   │   ├── transport.controller.js
│   │   └── hostel.controller.js
│   ├── routes/
│   │   ├── library.routes.js
│   │   ├── transport.routes.js
│   │   └── hostel.routes.js
│   └── utils/
│       ├── libraryService.js
│       ├── transportService.js
│       └── hostelService.js

frontend/
└── app/
    ├── library/
    ├── transport/
    └── hostel/
```

### Testing & Deployment

1. **Unit Tests**: Implement for each controller
2. **Integration Tests**: Test database operations
3. **E2E Tests**: Test complete workflows
4. **Staging**: Deploy to staging before production
5. **Documentation**: API docs and user guides

---

## Conclusion

These three modules will significantly enhance the School ERP system's functionality. With proper planning and phased implementation, they can be developed incrementally without disrupting existing features.

For questions or clarifications on implementation, refer to the existing modules' code structure.
