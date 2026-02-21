# Changelog

All notable changes to the School ERP project are documented in this file.

## [Unreleased]

---

## [v1.1.0] - February 20, 2026

### Added

#### 🔐 Permission Matrix System
- Complete role-based permission management with hierarchy support
- Custom permission creation with module categorization
- User-level permission overrides with 3-tier precedence (User > Role > Inherited)
- Role inheritance tree with BFS-based permission resolution
- Permission middleware (`authorizePermission`) with fallback role support
- 13 default system permissions (students.*, staff.*, fees.*, etc.)
- Permission initialization endpoint for system setup
- Frontend admin screen for permission matrix configuration

**Models Added:**
- `Permission` - Custom permission definitions (key, name, module, description)
- `RolePermission` - Role-to-permission mappings with allowed flag
- `UserPermission` - User-level permission overrides
- `RoleHierarchy` - Role inheritance relationships (parent → child)

**Endpoints (7):**
- `GET /api/permissions` - List all permissions with filtering
- `POST /api/permissions` - Create custom permission
- `POST /api/permissions/initialize` - Seed default permissions (ADMIN only)
- `PUT /api/permissions/roles` - Assign permissions to roles
- `PUT /api/permissions/users` - Set user-level permission overrides (ADMIN only)
- `GET /api/permissions/hierarchy` - Get role hierarchy
- `PUT /api/permissions/hierarchy` - Create/update role inheritance relationships (ADMIN only)

#### 📚 Student Progression System
- Class promotion workflow for students
- Student detention tracking
- Internal and external transfer workflows
- Complete progression history tracking with audit trail
- Bulk promotion/detention operations with transaction safety
- Progress history view with related class and transfer details
- Frontend admin screen for managing all progression operations

**Models Added:**
- `StudentPromotion` - Promotion, detention, and base progression records
- `StudentTransfer` - Internal transfer (class-to-address change) and external transfer (to other school)

**New Enums:**
- `PromotionStatus: PROMOTED | DETAINED | TRANSFERRED`
- `TransferType: INTERNAL | EXTERNAL`

**Endpoints (4):**
- `POST /api/students/promotions` - Promote students to target class
- `POST /api/students/detentions` - Retain students in current class
- `POST /api/students/transfers` - Transfer students (internal or external)
- `GET /api/students/:id/progress-history` - Get student progression history with data

#### 🎓 Frontend Dashboard Module Pages
Complete implementation of 7 missing module pages with API integration, authentication gates, and data visualization:

1. **Students Page** (`/dashboard/students`)
   - Student list with search/filter
   - Add/edit student forms
   - Bulk operations support
   - Class and section filtering

2. **Staff Page** (`/dashboard/staff`)
   - Staff directory with roles
   - Hire/edit staff workflows
   - Department and qualification tracking
   - Contact information management

3. **Fees Page** (`/dashboard/fees`)
   - Fee structure management
   - Fee category creation
   - Installment tracking
   - Due date and reminder configuration

4. **Attendance Page** (`/dashboard/attendance`)
   - Daily attendance marking
   - Bulk attendance operations
   - Attendance reports and trends
   - Absent/present statistics by class

5. **Timetable Page** (`/dashboard/timetable`)
   - Weekly schedule view
   - Teacher and class assignment
   - Subject and classroom mapping
   - Conflict detection

6. **Exams Page** (`/dashboard/exams`)
   - Exam schedule creation
   - Grade entry interface
   - Result publication
   - Exam analytics and distribution

7. **Notifications Page** (`/dashboard/notifications`)
   - Notification center with filters
   - Send bulk notifications
   - Notification history
   - Event-based alert configuration

**Features Common to All Pages:**
- JWT authentication with role-based access control
- React hooks (useState, useEffect, useCallback) for state management
- API client integration with axios
- Toast notifications for user feedback (react-toastify)
- Loading and error states
- TypeScript interfaces for type safety (where applicable)
- Tailwind CSS styling with responsive design
- Search, filter, and sort capabilities

#### 🎨 Permission Management UI
Admin screen for managing the permission matrix:
- Initialize default permissions
- Create custom permissions with key, name, module selector
- Assign permissions to roles with allowed/denied toggle
- Manage role hierarchy relationships
- View all permissions with module filtering
- Visual permission matrix display

#### 👥 Student Progression UI
Admin screen for managing student class changes:
- Bulk student selection with checkbox table
- Promote/Detain operations with target class selection
- Individual transfer workflows (INTERNAL/EXTERNAL toggle)
- Transfer history with class-to-class or school-to-school details
- Progress history sidebar with promotion and transfer records
- Remarks and date tracking for audit trails
- Success/error notifications with operation feedback

#### 📱 Dashboard Navigation Updates
- Added Permission Matrix link with Shield icon
- Added Student Progression link with ArrowUpDown icon
- Integrated new admin pages into sidebar menu
- Added quick action link to Student Progression from dashboard

### Changed

#### Backend Authorization System
- Replaced simple role-based authorization with hierarchical permission checking
- `authorize()` middleware remains for backward compatibility
- New `authorizePermission()` middleware with fallback role support
- Permission resolution logic queries User → Role → Inherited permissions
- Role inheritance implemented as directed acyclic graph (DAG) with BFS traversal

#### Student Routes
- Extended `/api/students` routes with 4 new progression endpoints
- All progression endpoints include permission-based authorization
- Transaction-based operations ensure atomic student updates and record creation

#### Frontend API Client
- Extended `lib/api.ts` with new `studentAPI` progression methods
- Added new `permissionAPI` object with 7 methods
- Maintained backward compatibility with existing endpoints

#### Database Schema
- Added 8 new models (Permission, RolePermission, UserPermission, RoleHierarchy, StudentPromotion, StudentTransfer)
- Added 2 new enums (PromotionStatus, TransferType)
- Added foreign key relationships with cascade delete behavior
- Added unique constraints on role-permission and user-permission pairs

### Fixed

None (all previous gaps were fixed in v1.0.0)

### Security

- Permission hierarchy prevents privilege escalation through role inheritance
- User-level permission overrides allow fine-grained access control
- Transaction-based operations prevent partial updates
- Authorization checks on all progression endpoints
- Validation on custom permission creation (key format, module selection)

### Database

**Migration Applied:** `20260219181024_permissions_promotion_transfer`

**Tables Created:**
- `permissions` - Custom permission definitions
- `role_permissions` - Role-to-permission mappings (unique index on role + permissionId)
- `user_permissions` - User-level overrides (cascade delete on user/permission)
- `role_hierarchy` - Role inheritance relationships (unique index on parentRole + childRole)
- `student_promotions` - Promotion/detention/transfer base records (indexes on studentId, status, performedAt)
- `student_transfers` - External transfer details (indexes on studentId, transferType, transferDate)

**Schema Additions:**
```javascript
enum PromotionStatus {
  PROMOTED
  DETAINED
  TRANSFERRED
}

enum TransferType {
  INTERNAL
  EXTERNAL
}
```

### Documentation

- Updated README.md with new features and API endpoints
- Added Admin Guide sections for Permission Matrix and Student Progression
- Documented 4 new progression endpoints with request/response schemas
- Documented 7 new permission endpoints
- Added role hierarchy explanation and examples

### Performance

- Added database indexes on frequently queried fields (promotionStatus, transferType, performedAt, transferDate)
- Implemented transaction batching for bulk operations (50+ student promotions)
- Permission caching feasible but not yet implemented

### Tech Stack

**No new dependencies added** - All functionality built with existing stack:
- Express.js (backend)
- Next.js 14.0.4 (frontend)
- Prisma 5.7.1 (ORM)
- PostgreSQL 15 (database)
- React 18.x with TypeScript
- Tailwind CSS 3.3.x
- Axios for HTTP client

---

## [v1.0.0] - February 2, 2026

### Added

#### Core School Management System
- Student information management with admission tracking
- Staff directory with role-based assignments
- Fee management with category and installment tracking
- Attendance marking and reporting
- Timetable scheduling and management
- Exam management with grade entry
- LMS (Learning Management System) for course materials and assignments
- Notification system with bulk messaging

#### Security & Compliance
- JWT-based authentication with role-based access control
- Input sanitization middleware (XSS protection)
- Comprehensive error handling and logging
- Activity tracking for audit trail
- Password reset flow with email verification
- Encrypted file storage support

#### API Features
- 10+ fully documented RESTful API endpoints per module
- Request validation with express-validator
- Global error handling with structured responses
- Activity logging for all major operations
- CSV export capabilities for reports
- File upload/download with virus scanning

#### Frontend
- Responsive Next.js dashboard with Tailwind CSS
- Authentication pages (login, forgot-password)
- Multi-module management dashboards
- Real-time notifications
- Data export to CSV/PDF formats
- Mobile-friendly design

#### Database
- Prisma ORM with PostgreSQL
- 20+ data models with relationships
- Database migrations and versioning
- Seed script for admin setup
- Indexed queries for performance

#### Deployment
- Docker support for backend and frontend
- Docker Compose for full stack setup
- Environment-based configuration
- Production-ready error handling
- Database migration automation

### Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with 24-hour expiration
- CORS configured for frontend communication
- Rate limiting on authentication endpoints
- SQL injection prevention through Prisma ORM
- File upload validation (type, size, virus scanning)

### Documentation

- Comprehensive API documentation
- Setup guide for local development
- Database migration guide
- Module implementation guides (hostel, library, transport, fees, LMS)
- Architecture overview
- Environment configuration examples

---

## Version Schema

This project follows [Semantic Versioning](https://semver.org/):
- **MAJOR**: Significant features, breaking changes
- **MINOR**: Added features, backward compatible
- **PATCH**: Bug fixes, minor improvements

## Contributing

To contribute to this project, please follow the versioning guidelines and update this changelog with your changes before submitting a pull request.

## Dates

- **v1.0.0**: February 2, 2026 - Initial release with 10 gap fixes
- **v1.1.0**: February 20, 2026 - Permission matrix, student progression, frontend module completion
