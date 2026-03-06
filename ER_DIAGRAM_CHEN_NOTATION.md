# Chen Notation ER Diagram — Complete Analysis
## School ERP System

---

## SECTION 1 — ENTITIES (49 Total)

| # | Entity Name | Table Name |
|---|-------------|------------|
| 1 | User | users |
| 2 | AcademicYear | academic_years |
| 3 | Class | classes |
| 4 | Subject | subjects |
| 5 | Student | students |
| 6 | Parent | parents |
| 7 | Staff | staff |
| 8 | Attendance | attendances |
| 9 | Leave | leaves |
| 10 | FeeStructure | fee_structures |
| 11 | FeePayment | fee_payments |
| 12 | SalaryPayment | salary_payments |
| 13 | Timetable | timetables |
| 14 | ExamSchedule | exam_schedules |
| 15 | ExamResult | exam_results |
| 16 | Notification | notifications |
| 17 | Activity | activities |
| 18 | Permission | permissions |
| 19 | RolePermission | role_permissions |
| 20 | UserPermission | user_permissions |
| 21 | RoleHierarchy | role_hierarchy |
| 22 | StudentPromotion | student_promotions |
| 23 | StudentTransfer | student_transfers |
| 24 | Book | books |
| 25 | BookCopy | book_copies |
| 26 | BorrowRecord | borrow_records |
| 27 | BookHoldRequest | book_hold_requests |
| 28 | LibrarySettings | library_settings |
| 29 | LmsContent | lms_contents |
| 30 | LmsContentFile | lms_content_files |
| 31 | LmsSubmission | lms_submissions |
| 32 | LmsSubmissionFile | lms_submission_files |
| 33 | Vehicle | vehicles |
| 34 | Route | routes |
| 35 | BusStop | bus_stops |
| 36 | StudentTransport | student_transport |
| 37 | MaintenanceRecord | maintenance_records |
| 38 | VehicleBoarding | vehicle_boarding |
| 39 | TransportSettings | transport_settings |
| 40 | Hostel | hostels |
| 41 | HostelRoom | hostel_rooms |
| 42 | HostelBed | hostel_beds |
| 43 | HostelStudent | hostel_students |
| 44 | HostelVisitor | hostel_visitors |
| 45 | HostelComplaint | hostel_complaints |
| 46 | HostelLeave | hostel_leaves |
| 47 | HostelNotice | hostel_notices |
| 48 | HostelAttendance | hostel_attendance |
| 49 | HostelSettings | hostel_settings |

---

## SECTION 2 — ATTRIBUTES PER ENTITY

---

### 1. User

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL, default "Unknown" |
| email | String | UNIQUE, NOT NULL |
| password | String | NOT NULL |
| role | Enum(UserRole) | NOT NULL |
| status | Enum(UserStatus) | default ACTIVE |
| lastLogin | DateTime | nullable |
| passwordResetToken | String | UNIQUE, nullable |
| passwordResetExpires | DateTime | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: *isActive* can be derived from `status`

---

### 2. AcademicYear

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| year | String | UNIQUE (e.g., "2024-2025") |
| startDate | DateTime | NOT NULL |
| endDate | DateTime | NOT NULL |
| isCurrent | Boolean | default false |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: *duration* can be derived from `endDate - startDate`

---

### 3. Class

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL (e.g., "Grade 1") |
| section | String | nullable (e.g., "A") |
| **academicYearId** | UUID | **FK → AcademicYear.id** |
| **classTeacherId** | UUID | **FK → Staff.id**, nullable |
| capacity | Int | default 40 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Composite Unique: `(name, section, academicYearId)`

---

### 4. Subject

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL |
| code | String | UNIQUE |
| **classId** | UUID | **FK → Class.id** |
| **teacherId** | UUID | **FK → Staff.id**, nullable |
| credits | Int | default 1 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 5. Student

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **userId** | UUID | **FK → User.id**, UNIQUE |
| admissionNo | String | UNIQUE |
| firstName | String | NOT NULL |
| lastName | String | NOT NULL |
| dateOfBirth | DateTime | NOT NULL |
| gender | Enum(Gender) | NOT NULL |
| bloodGroup | Enum(BloodGroup) | nullable |
| address | String | NOT NULL |
| phone | String | NOT NULL |
| **parentId** | UUID | **FK → Parent.id**, nullable |
| **classId** | UUID | **FK → Class.id** |
| admissionDate | DateTime | default now |
| profilePhoto | String | nullable |
| documents | Json | nullable (multi-valued: file paths) |
| medicalInfo | String | nullable |
| isActive | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Multi-valued: `documents` (Json array of file paths)
> Derived: `fullName` = firstName + lastName

---

### 6. Parent

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **userId** | UUID | **FK → User.id**, UNIQUE |
| firstName | String | NOT NULL |
| lastName | String | NOT NULL |
| phone | String | NOT NULL |
| email | String | nullable |
| occupation | String | nullable |
| address | String | NOT NULL |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `fullName` = firstName + lastName

---

### 7. Staff

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **userId** | UUID | **FK → User.id**, UNIQUE |
| employeeId | String | UNIQUE |
| firstName | String | NOT NULL |
| lastName | String | NOT NULL |
| dateOfBirth | DateTime | NOT NULL |
| gender | Enum(Gender) | NOT NULL |
| bloodGroup | Enum(BloodGroup) | nullable |
| phone | String | NOT NULL |
| email | String | nullable |
| address | String | NOT NULL |
| designation | String | NOT NULL |
| department | String | nullable |
| joiningDate | DateTime | NOT NULL |
| salary | Float | NOT NULL |
| qualification | String | nullable |
| experience | Int | nullable (years) |
| profilePhoto | String | nullable |
| documents | Json | nullable (multi-valued) |
| isActive | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Multi-valued: `documents` (Json array)
> Derived: `fullName` = firstName + lastName; `yearsAtSchool` = now − joiningDate

---

### 8. Attendance

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **classId** | UUID | **FK → Class.id** |
| date | DateTime | NOT NULL |
| status | Enum(AttendanceStatus) | NOT NULL |
| remarks | String | nullable |
| markedBy | String | NOT NULL (userId, not FK) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(studentId, date)`

---

### 9. Leave

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **staffId** | UUID | **FK → Staff.id** |
| startDate | DateTime | NOT NULL |
| endDate | DateTime | NOT NULL |
| reason | String | NOT NULL |
| status | Enum(LeaveStatus) | default PENDING |
| approvedBy | String | nullable (userId, not FK) |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `duration` = endDate − startDate

---

### 10. FeeStructure

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **academicYearId** | UUID | **FK → AcademicYear.id** |
| name | String | NOT NULL (e.g., "Tuition Fee") |
| amount | Float | NOT NULL |
| dueDate | DateTime | nullable |
| description | String | nullable |
| isOptional | Boolean | default false |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 11. FeePayment

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **feeStructureId** | UUID | **FK → FeeStructure.id** |
| amount | Float | NOT NULL |
| paymentDate | DateTime | default now |
| paymentMode | Enum(PaymentMode) | NOT NULL |
| transactionId | String | nullable |
| receiptNo | String | UNIQUE |
| status | Enum(FeeStatus) | default PAID |
| remarks | String | nullable |
| collectedBy | String | NOT NULL (userId, not FK) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 12. SalaryPayment

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **staffId** | UUID | **FK → Staff.id** |
| month | String | NOT NULL (e.g., "2024-01") |
| amount | Float | NOT NULL |
| paymentDate | DateTime | NOT NULL |
| paymentMode | Enum(PaymentMode) | NOT NULL |
| transactionId | String | nullable |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(staffId, month)`

---

### 13. Timetable

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **classId** | UUID | **FK → Class.id** |
| **subjectId** | UUID | **FK → Subject.id** |
| **teacherId** | UUID | **FK → Staff.id** |
| dayOfWeek | Int | NOT NULL (0–6) |
| startTime | String | NOT NULL (HH:MM) |
| endTime | String | NOT NULL (HH:MM) |
| room | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(classId, dayOfWeek, startTime)`

---

### 14. ExamSchedule

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL |
| examType | Enum(ExamType) | NOT NULL |
| **classId** | UUID | **FK → Class.id** |
| **academicYearId** | UUID | **FK → AcademicYear.id** |
| startDate | DateTime | NOT NULL |
| endDate | DateTime | NOT NULL |
| totalMarks | Int | default 100 |
| passingMarks | Int | default 35 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 15. ExamResult

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **examScheduleId** | UUID | **FK → ExamSchedule.id** |
| **subjectId** | UUID | **FK → Subject.id** |
| marksObtained | Float | NOT NULL |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(studentId, examScheduleId, subjectId)`
> Derived: `percentage` = marksObtained / totalMarks × 100; `grade` from marksObtained

---

### 16. Notification

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| title | String | NOT NULL |
| message | String | NOT NULL |
| type | String | NOT NULL (SMS/EMAIL/PUSH) |
| recipients | Json | NOT NULL (array — multi-valued) |
| sentAt | DateTime | default now |
| sentBy | String | NOT NULL (userId, not FK) |
| status | String | default "SENT" |
| createdAt | DateTime | auto |

> Multi-valued: `recipients` (JSON array of user IDs or roles)

---

### 17. Activity

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| userId | String | NOT NULL (audit log, not FK) |
| action | Enum(ActivityAction) | NOT NULL |
| actionType | Enum(ActivityType) | NOT NULL |
| module | String | NOT NULL |
| description | String | NOT NULL |
| ipAddress | String | nullable |
| userAgent | String | nullable |
| resourceId | String | nullable |
| resourceType | String | nullable |
| changes | Json | nullable (multi-valued diff) |
| status | String | default "SUCCESS" |
| createdAt | DateTime | auto |

> Multi-valued: `changes` (JSON object of before/after)

---

### 18. Permission

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| key | String | UNIQUE |
| name | String | NOT NULL |
| module | String | NOT NULL |
| description | String | nullable |
| isSystem | Boolean | default false |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 19. RolePermission

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| role | Enum(UserRole) | NOT NULL |
| **permissionId** | UUID | **FK → Permission.id** |
| allowed | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(role, permissionId)` — junction/associative entity for Role ↔ Permission

---

### 20. UserPermission

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **userId** | UUID | **FK → User.id** |
| **permissionId** | UUID | **FK → Permission.id** |
| allowed | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(userId, permissionId)` — junction entity for User ↔ Permission (overrides)

---

### 21. RoleHierarchy

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| parentRole | Enum(UserRole) | NOT NULL |
| childRole | Enum(UserRole) | NOT NULL |
| createdAt | DateTime | auto |

> Unique: `(parentRole, childRole)` — self-referencing role relationship

---

### 22. StudentPromotion

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **fromClassId** | UUID | **FK → Class.id** |
| **toClassId** | UUID | **FK → Class.id**, nullable |
| status | Enum(PromotionStatus) | NOT NULL |
| reason | String | nullable |
| remarks | String | nullable |
| performedBy | String | NOT NULL (userId, not FK) |
| performedAt | DateTime | default now |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 23. StudentTransfer

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **fromClassId** | UUID | **FK → Class.id** |
| **toClassId** | UUID | **FK → Class.id**, nullable |
| transferType | Enum(TransferType) | NOT NULL |
| toSchoolName | String | nullable |
| toSchoolAddress | String | nullable |
| transferDate | DateTime | default now |
| reason | String | nullable |
| remarks | String | nullable |
| performedBy | String | NOT NULL (userId, not FK) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 24. Book

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| title | String | NOT NULL |
| author | String | NOT NULL |
| isbn | String | UNIQUE |
| publisher | String | nullable |
| edition | String | nullable |
| category | String | NOT NULL |
| description | String | nullable |
| totalCopies | Int | default 1 |
| costPrice | Float | NOT NULL |
| sellingPrice | Float | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `availableCopies` = totalCopies − count of issued BookCopies

---

### 25. BookCopy *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** (surrogate) |
| **bookId** | UUID | **FK → Book.id** |
| barcode | String | UNIQUE (partial key / discriminator) |
| status | String | AVAILABLE/ISSUED/DAMAGED/LOST |
| condition | String | GOOD/FAIR/POOR |
| issuedTo | String | nullable (Student/Staff ID) |
| notes | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 26. BorrowRecord

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **bookId** | UUID | **FK → Book.id** |
| memberId | String | NOT NULL (Student or Staff ID, not strict FK) |
| issueDate | DateTime | default now |
| dueDate | DateTime | NOT NULL |
| returnDate | DateTime | nullable |
| fineAmount | Float | default 0 |
| finePaid | Boolean | default false |
| finePaymentDate | DateTime | nullable |
| renewalCount | Int | default 0 |
| maxRenewals | Int | default 3 |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `isOverdue` = now > dueDate AND returnDate IS NULL

---

### 27. BookHoldRequest

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **bookId** | UUID | **FK → Book.id** |
| memberId | String | NOT NULL (Student or Staff ID) |
| requestDate | DateTime | default now |
| fulfillmentDate | DateTime | nullable |
| status | String | PENDING/FULFILLED/CANCELLED |
| expiryDate | DateTime | NOT NULL |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 28. LibrarySettings

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| issueLimit | Int | default 5 |
| issuePeriodDays | Int | default 14 |
| finePerDay | Float | default 5 |
| maxFineLimit | Float | default 100 |
| holdRequestExpiryDays | Int | default 7 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Singleton configuration entity, no relations.

---

### 29. LmsContent

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| title | String | NOT NULL |
| description | String | nullable |
| type | Enum(LmsContentType) | NOT NULL |
| visibility | Enum(LmsVisibility) | default DRAFT |
| **classId** | UUID | **FK → Class.id** |
| **subjectId** | UUID | **FK → Subject.id** |
| **teacherId** | UUID | **FK → Staff.id** |
| dueDate | DateTime | nullable |
| totalMarks | Int | nullable |
| instructions | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 30. LmsContentFile *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **contentId** | UUID | **FK → LmsContent.id** |
| originalName | String | NOT NULL (partial key / discriminator) |
| filename | String | NOT NULL |
| path | String | NOT NULL |
| size | Int | NOT NULL |
| mimetype | String | NOT NULL |
| category | String | nullable |
| uploadedBy | String | NOT NULL (userId, not FK) |
| uploadedAt | DateTime | default now |

---

### 31. LmsSubmission

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **contentId** | UUID | **FK → LmsContent.id** |
| **studentId** | UUID | **FK → Student.id** |
| status | Enum(LmsSubmissionStatus) | default SUBMITTED |
| submittedAt | DateTime | default now |
| grade | Float | nullable |
| feedback | String | nullable |
| gradedBy | String | nullable (userId, not FK) |
| gradedAt | DateTime | nullable |

> Unique: `(contentId, studentId)`

---

### 32. LmsSubmissionFile *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **submissionId** | UUID | **FK → LmsSubmission.id** |
| originalName | String | NOT NULL |
| filename | String | NOT NULL |
| path | String | NOT NULL |
| size | Int | NOT NULL |
| mimetype | String | NOT NULL |
| category | String | nullable |
| uploadedBy | String | NOT NULL |
| uploadedAt | DateTime | default now |

---

### 33. Vehicle

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| registrationNo | String | UNIQUE |
| model | String | NOT NULL |
| capacity | Int | NOT NULL |
| **driverId** | UUID | **FK → Staff.id**, nullable |
| **conductorId** | UUID | **FK → Staff.id**, nullable |
| serviceDate | DateTime | NOT NULL |
| maintenanceDate | DateTime | nullable |
| fuelType | Enum(FuelType) | NOT NULL |
| averageMileage | Float | NOT NULL |
| currentMileage | Int | default 0 |
| gpsDeviceId | String | nullable |
| condition | Enum(VehicleCondition) | default GOOD |
| insuranceExpiry | DateTime | nullable |
| notes | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 34. Route

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL |
| **vehicleId** | UUID | **FK → Vehicle.id**, UNIQUE |
| monthlyFee | Float | NOT NULL |
| totalStops | Int | default 0 |
| estimatedDuration | Int | nullable (minutes) |
| notes | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `totalStops` maintainable from count of BusStop records

---

### 35. BusStop *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **routeId** | UUID | **FK → Route.id** |
| stopName | String | NOT NULL |
| location | String | NOT NULL |
| latitude | Float | nullable |
| longitude | Float | nullable |
| stopOrder | Int | NOT NULL (partial key / discriminator) |
| arrivalTime | String | nullable (HH:MM) |
| estimatedWaitTime | Int | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(routeId, stopOrder)`
> Composite attribute: `coordinates` = (latitude, longitude)

---

### 36. StudentTransport

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **routeId** | UUID | **FK → Route.id** |
| pickupStop | String | NOT NULL |
| dropoffStop | String | NOT NULL |
| monthlyFee | Float | NOT NULL |
| feePaid | Boolean | default false |
| feePaymentDate | DateTime | nullable |
| boardingStatus | Boolean | default true |
| enrollmentDate | DateTime | default now |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(studentId, routeId)` — associative entity with relationship attributes

---

### 37. MaintenanceRecord *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **vehicleId** | UUID | **FK → Vehicle.id** |
| description | String | NOT NULL |
| cost | Float | NOT NULL |
| date | DateTime | NOT NULL (partial key / discriminator) |
| nextServiceDate | DateTime | nullable |
| parts | String | nullable |
| mechanic | String | nullable |
| createdAt | DateTime | auto |

---

### 38. VehicleBoarding

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **vehicleId** | UUID | **FK → Vehicle.id** |
| date | DateTime | NOT NULL |
| studentCount | Int | default 0 |
| capacity | Int | NOT NULL |
| remarks | String | nullable |
| createdAt | DateTime | auto |

> Unique: `(vehicleId, date)`

---

### 39. TransportSettings

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| defaultMonthlyFee | Float | default 1000 |
| lateFeePercentage | Float | default 10 |
| maxStudentsPerVehicle | Int | default 50 |
| maintenanceCheckInterval | Int | default 30 |
| fineForNoBoarding | Float | default 100 |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 40. Hostel

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| name | String | NOT NULL |
| type | Enum(HostelType) | NOT NULL |
| capacity | Int | NOT NULL |
| **wardenId** | UUID | **FK → Staff.id**, nullable |
| address | String | nullable |
| contactNo | String | nullable |
| facilities | String | nullable (comma-separated — multi-valued) |
| rules | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Multi-valued: `facilities` (CSV string)

---

### 41. HostelRoom *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **hostelId** | UUID | **FK → Hostel.id** |
| roomNumber | String | NOT NULL (partial key / discriminator) |
| floor | Int | nullable |
| capacity | Int | NOT NULL |
| type | Enum(RoomType) | NOT NULL |
| rentAmount | Float | NOT NULL |
| amenities | String | nullable (comma-separated — multi-valued) |
| status | String | AVAILABLE/FULL/MAINTENANCE |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(hostelId, roomNumber)`
> Multi-valued: `amenities`

---

### 42. HostelBed *(Weak Entity)*

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **roomId** | UUID | **FK → HostelRoom.id** |
| bedNo | Int | NOT NULL (partial key / discriminator) |
| status | Enum(BedStatus) | default VACANT |
| studentId | String | nullable (current occupant, not FK) |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(roomId, bedNo)`

---

### 43. HostelStudent

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **studentId** | UUID | **FK → Student.id** |
| **hostelId** | UUID | **FK → Hostel.id** |
| **roomId** | UUID | **FK → HostelRoom.id** |
| **bedId** | UUID | **FK → HostelBed.id** |
| checkInDate | DateTime | NOT NULL |
| checkOutDate | DateTime | nullable |
| depositAmount | Float | NOT NULL |
| depositRefunded | Boolean | default false |
| monthlyFee | Float | NOT NULL |
| feePaid | Boolean | default false |
| feePaymentDate | DateTime | nullable |
| emergencyContact | String | nullable |
| specialRequirements | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Unique: `(studentId, hostelId)` — quaternary associative entity

---

### 44. HostelVisitor

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| studentId | String | NOT NULL |
| visitorName | String | NOT NULL |
| relation | String | nullable |
| contactNo | String | nullable |
| purpose | String | NOT NULL |
| visitDate | DateTime | NOT NULL |
| inTime | DateTime | nullable |
| outTime | DateTime | nullable |
| approved | Boolean | default false |
| approvedBy | String | nullable (userId, not FK) |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Composite attribute: `visitWindow` = (inTime, outTime)

---

### 45. HostelComplaint

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| studentId | String | NOT NULL |
| hostelId | String | NOT NULL |
| category | String | NOT NULL (MAINTENANCE/CLEANLINESS/SECURITY/NOISE/OTHER) |
| subject | String | NOT NULL |
| description | String | NOT NULL |
| priority | String | LOW/MEDIUM/HIGH/URGENT |
| status | Enum(ComplaintStatus) | default OPEN |
| assignedTo | String | nullable |
| resolvedDate | DateTime | nullable |
| resolution | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 46. HostelLeave

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| studentId | String | NOT NULL |
| hostelId | String | NOT NULL |
| leaveFrom | DateTime | NOT NULL |
| leaveTo | DateTime | NOT NULL |
| reason | String | NOT NULL |
| destination | String | nullable |
| contactNo | String | NOT NULL |
| status | Enum(LeaveStatus) | default PENDING |
| approvedBy | String | nullable |
| approvedDate | DateTime | nullable |
| remarks | String | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Derived: `duration` = leaveTo − leaveFrom

---

### 47. HostelNotice

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| **hostelId** | UUID | **FK → Hostel.id** |
| title | String | NOT NULL |
| content | String | NOT NULL |
| priority | String | NORMAL/IMPORTANT/URGENT |
| isActive | Boolean | default true |
| createdBy | String | NOT NULL (userId, not FK) |
| expiryDate | DateTime | nullable |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

---

### 48. HostelAttendance

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| studentId | String | NOT NULL |
| hostelId | String | NOT NULL |
| date | DateTime | NOT NULL |
| isPresent | Boolean | default true |
| remarks | String | nullable |
| recordedBy | String | nullable (userId, not FK) |
| recordedAt | DateTime | default now |
| createdAt | DateTime | auto |

> Unique: `(studentId, hostelId, date)`

---

### 49. HostelSettings

| Attribute | Type | Constraint |
|-----------|------|------------|
| **id** | UUID | **PK** |
| defaultMonthlyFee | Float | default 3000 |
| defaultDepositAmount | Float | default 5000 |
| visitorTimeFrom | String | default "09:00" |
| visitorTimeTo | String | default "18:00" |
| leaveApprovalRequired | Boolean | default true |
| attendanceRequired | Boolean | default true |
| createdAt | DateTime | auto |
| updatedAt | DateTime | auto |

> Composite attribute: `visitorHours` = (visitorTimeFrom, visitorTimeTo)

---

## SECTION 3 — RELATIONSHIPS

---

### Core Academic Relationships

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R1 | has account | User | 1:1 | Student | Partial | Total |
| R2 | has account | User | 1:1 | Staff | Partial | Total |
| R3 | has account | User | 1:1 | Parent | Partial | Total |
| R4 | belongs to | Student | N:1 | Parent | Partial | Partial |
| R5 | belongs to | Student | N:1 | Class | Total | Partial |
| R6 | belongs to | Subject | N:1 | Class | Total | Partial |
| R7 | belongs to | Class | N:1 | AcademicYear | Total | Partial |
| R8 | teaches | Staff | 1:N | Subject | Partial | Partial |
| R9 | is class teacher of | Staff | 1:N | Class | Partial | Partial |
| R10 | has | AcademicYear | 1:N | FeeStructure | Total | Total |
| R11 | schedules | AcademicYear | 1:N | ExamSchedule | Partial | Total |

---

### Attendance & Leave

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R12 | records attendance of | Student | 1:N | Attendance | Partial | Total |
| R13 | attendance in | Class | 1:N | Attendance | Total | Total |
| R14 | applies for leave | Staff | 1:N | Leave | Partial | Total |

---

### Fee & Salary

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R15 | pays fee under | Student | 1:N | FeePayment | Partial | Total |
| R16 | charged by | FeeStructure | 1:N | FeePayment | Total | Total |
| R17 | receives salary | Staff | 1:N | SalaryPayment | Partial | Total |

---

### Timetable & Exams

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R18 | scheduled in | Class | 1:N | Timetable | Partial | Total |
| R19 | covers | Subject | 1:N | Timetable | Partial | Total |
| R20 | assigned to | Staff | 1:N | Timetable | Partial | Total |
| R21 | has schedule | Class | 1:N | ExamSchedule | Partial | Total |
| R22 | appears in | Student | 1:N | ExamResult | Partial | Total |
| R23 | examined under | ExamSchedule | 1:N | ExamResult | Total | Total |
| R24 | tested on | Subject | 1:N | ExamResult | Partial | Total |

---

### Permissions & Access Control

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R25 | granted to role | Permission | 1:N | RolePermission | Partial | Total |
| R26 | overridden for | User | 1:N | UserPermission | Partial | Total |
| R27 | overrides | Permission | 1:N | UserPermission | Partial | Total |
| R28 | inherits from (self-ref) | UserRole | N:M | UserRole | Partial | Partial |

---

### Promotions & Transfers

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R29 | promoted from | Class | 1:N | StudentPromotion | Partial | Total |
| R30 | promoted to | Class | 1:N | StudentPromotion | Partial | Partial |
| R31 | undergoes promotion | Student | 1:N | StudentPromotion | Partial | Total |
| R32 | transferred from | Class | 1:N | StudentTransfer | Partial | Total |
| R33 | transferred to | Class | 1:N | StudentTransfer | Partial | Partial |
| R34 | undergoes transfer | Student | 1:N | StudentTransfer | Partial | Total |

---

### Library

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R35 | has copies | Book | 1:N | BookCopy | Total | Total |
| R36 | borrowed as | Book | 1:N | BorrowRecord | Partial | Total |
| R37 | placed hold on | Book | 1:N | BookHoldRequest | Partial | Total |

---

### LMS

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R38 | created for | Class | 1:N | LmsContent | Partial | Total |
| R39 | covers | Subject | 1:N | LmsContent | Partial | Total |
| R40 | created by | Staff | 1:N | LmsContent | Partial | Total |
| R41 | has files | LmsContent | 1:N | LmsContentFile | Partial | Total |
| R42 | receives submission | LmsContent | 1:N | LmsSubmission | Partial | Total |
| R43 | submits | Student | 1:N | LmsSubmission | Partial | Partial |
| R44 | has files | LmsSubmission | 1:N | LmsSubmissionFile | Partial | Total |

---

### Transport

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R45 | driven by | Vehicle | N:1 | Staff (driver) | Partial | Partial |
| R46 | conducted by | Vehicle | N:1 | Staff (conductor) | Partial | Partial |
| R47 | assigned route | Vehicle | 1:1 | Route | Partial | Total |
| R48 | has stops | Route | 1:N | BusStop | Total | Total |
| R49 | enrolls in | Student | M:N | Route | Partial | Partial |
| R50 | has records | Vehicle | 1:N | MaintenanceRecord | Partial | Total |
| R51 | tracks boarding | Vehicle | 1:N | VehicleBoarding | Partial | Total |

---

### Hostel

| # | Relationship Name | Entity A | Cardinality | Entity B | Participation A | Participation B |
|---|-------------------|----------|-------------|----------|-----------------|-----------------|
| R52 | managed by | Hostel | N:1 | Staff (warden) | Partial | Partial |
| R53 | contains | Hostel | 1:N | HostelRoom | Total | Total |
| R54 | has | HostelRoom | 1:N | HostelBed | Total | Total |
| R55 | allocated to | Student | M:N | Hostel (via HostelStudent) | Partial | Partial |
| R56 | posts | Hostel | 1:N | HostelNotice | Partial | Total |

---

## SECTION 4 — WEAK ENTITIES

| # | Weak Entity | Owner / Parent Entity | Partial Key (Discriminator) | Identifying Relationship |
|---|-------------|----------------------|----------------------------|--------------------------|
| W1 | BookCopy | Book | `barcode` | "has copies" |
| W2 | BusStop | Route | `stopOrder` | "has stops" |
| W3 | MaintenanceRecord | Vehicle | `date` | "has maintenance records" |
| W4 | HostelRoom | Hostel | `roomNumber` | "contains" |
| W5 | HostelBed | HostelRoom | `bedNo` | "has beds" |
| W6 | LmsContentFile | LmsContent | `filename` | "has files" |
| W7 | LmsSubmissionFile | LmsSubmission | `filename` | "has submission files" |

> Note: All weak entities have surrogate UUID PKs in the physical schema, but their existence depends entirely on the owner — they cannot exist without their parent.

---

## SECTION 5 — RELATIONSHIP ATTRIBUTES

These are attributes that semantically belong to the *relationship* between two entities, not to either entity alone:

| # | Associative Entity | Between | Relationship Attributes |
|---|-------------------|---------|------------------------|
| A1 | **RolePermission** | UserRole ↔ Permission | `allowed` — whether the role has this permission granted or denied |
| A2 | **UserPermission** | User ↔ Permission | `allowed` — individual override for a user's permission |
| A3 | **StudentTransport** | Student ↔ Route | `pickupStop`, `dropoffStop`, `monthlyFee`, `feePaid`, `feePaymentDate`, `boardingStatus`, `enrollmentDate` |
| A4 | **HostelStudent** | Student ↔ Hostel ↔ Room ↔ Bed | `checkInDate`, `checkOutDate`, `depositAmount`, `depositRefunded`, `monthlyFee`, `feePaid`, `feePaymentDate`, `emergencyContact`, `specialRequirements` |
| A5 | **ExamResult** | Student ↔ ExamSchedule ↔ Subject | `marksObtained`, `remarks` |
| A6 | **BorrowRecord** | Member ↔ Book | `issueDate`, `dueDate`, `returnDate`, `fineAmount`, `finePaid`, `finePaymentDate`, `renewalCount` |
| A7 | **StudentPromotion** | Student ↔ Class(from) ↔ Class(to) | `status`, `reason`, `remarks`, `performedBy`, `performedAt` |
| A8 | **StudentTransfer** | Student ↔ Class(from) ↔ Class(to) | `transferType`, `toSchoolName`, `toSchoolAddress`, `transferDate`, `reason`, `remarks`, `performedBy` |
| A9 | **Timetable** | Class ↔ Subject ↔ Staff | `dayOfWeek`, `startTime`, `endTime`, `room` |
| A10 | **LmsSubmission** | LmsContent ↔ Student | `status`, `submittedAt`, `grade`, `feedback`, `gradedBy`, `gradedAt` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total Entities | 49 |
| Strong Entities | 42 |
| Weak Entities | 7 |
| Total Relationships | 56 |
| 1:1 Relationships | 4 |
| 1:N Relationships | 45 |
| M:N Relationships | 3 |
| Self-referencing Relationships | 1 (RoleHierarchy) |
| Associative Entities with Relationship Attributes | 10 |
| Singleton Config Entities (no relations) | 4 (LibrarySettings, TransportSettings, HostelSettings, Notification) |
