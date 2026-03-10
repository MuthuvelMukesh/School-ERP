# School ERP System

> **Open Source** — This project is free and open source under the MIT License. Anyone is welcome to use it, fork it, extend it, or build their own school management solution on top of it.

A comprehensive, full-stack School Management System built with **Next.js 14** and **Node.js/Express**, covering all major aspects of school administration — students, staff, academics, finance, hostel, transport, library, and more.

---

## Changelog

### Mar 10, 2026 — UX Polish & Role Completeness
- **Student Detail Page**: Click any student name to open a full profile page with 4 tabs — Overview, Attendance, Exams, Fees
- **User Profile Page**: Every role now has `/profile` — view, edit, and change password
- **Fee Void**: ADMIN / ACCOUNTANT can void wrong payment entries with a single click
- **Academic Year Dropdown**: Fee structure form now pulls years from the database instead of free-text
- **Parent Views**: PARENT users see a "My Children" banner on Attendance, Exams, and Fees pages with links to each child's profile
- **Dashboard Avatar** is now a profile link
- Backend: `PUT /auth/profile`, `DELETE /fees/payments/:id`, `?studentId=` filter on attendance, PARENT added to all student read routes

### Mar 2026 — All Modules Complete
- **Attendance**: Full mark-attendance workflow — class/date picker, load students, per-student PRESENT/ABSENT/LATE/EXCUSED toggles, bulk submit, filter by class/date/status
- **Examinations**: Exam schedule management (create with type, date, marks, venue) + result recording (marks, grade, pass/fail), tabbed view
- **Fee Management**: Fee structures (type, class, amount, due date) + payment recording (mode, transaction ID) + defaulters tracker with due amounts
- **Staff Management**: Full staff list with search/filter, add staff modal, leave management (apply, approve, reject) with pending badge
- **Students**: Full student list with search + class/status filters, add student form (personal, admission, parent info), view student details modal
- **Timetable**: Grid view (weekly calendar) + list view, add/delete periods, filter by class, teacher assignment

### Feb–Mar 2026 — Bug Fixes & Hardening
- Fixed 9 runtime-crashing bugs across backend controllers
- Security hardening: authenticated file uploads, path traversal protection, error message sanitization
- Consolidated 23+ PrismaClient instances into a single shared singleton
- Fixed all `prisma.fee` → `prisma.feePayment` / `prisma.feeStructure` model references
- Fixed shadowed routes in student and LMS modules
- Added pagination to attendance and exam results endpoints
- Converted sync file operations to async; bulk attendance uses `$transaction`
- Fixed 4 TypeScript compile errors in file management page

### Feb 2026 — Permissions & Progression
- Fine-grained permission matrix: custom permissions, role permissions, user-level overrides, role hierarchy
- Student progression workflows: class promotion, detention, internal/external transfer, progression history
- Frontend management screens for all core modules

---

## Latest Updates (Mar 2026)
All frontend modules are now fully implemented. Every module has full CRUD UI, data tables, search/filter, stat cards, modals, and proper form validation. See the Changelog above for details.

## ER Diagrams (Chen Notation)
- Full database diagram (schema-derived): [frontend/public/er-diagram-full-chen.html](frontend/public/er-diagram-full-chen.html)
- Simplified academic diagram: [er-diagram.html](er-diagram.html)

## Core Objectives
- Digitize school administration
- Reduce manual paperwork
- Provide real-time data access
- Support multiple user roles with fine-grained permissions

## Target Users
- Admin / Principal
- Teachers
- Students / Parents (limited view)
- Accountant / Fee staff
- Transport / Library / Hostel staff

## Modules

| Module | Backend | Frontend |
|---|---|---|
| Authentication | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| Student Management | ✅ | ✅ |
| Staff Management | ✅ | ✅ |
| Attendance | ✅ | ✅ |
| Timetable | ✅ | ✅ |
| Examinations | ✅ | ✅ |
| Fee Management | ✅ | ✅ |
| Notifications | ✅ | ✅ |
| LMS (Notes / Videos / Assignments) | ✅ | ✅ |
| File Management | ✅ | ✅ |
| Transport Management | ✅ | ✅ |
| Library Management | ✅ | ✅ |
| Hostel Management | ✅ | ✅ |
| Payments (Gateway) | ✅ | ✅ |
| Permission Matrix | ✅ | ✅ |
| Activity Log | ✅ | ✅ |
| Student Promotion / Transfer | ✅ | ✅ |

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT-based
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **File Storage**: Multer (local uploads)
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 14 (App Router, React 18)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Language**: TypeScript

## Project Structure

```
School-ERP/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   ├── seed.js                # Database seeder
│   │   └── migrations/            # Prisma migrations
│   ├── src/
│   │   ├── controllers/           # Route controllers (18 modules)
│   │   ├── middleware/            # Auth, validation, error handling
│   │   ├── routes/                # API routes (18 modules)
│   │   ├── utils/                 # Prisma singleton, services, logger
│   │   └── server.js              # Express app entry point
│   ├── .env.example               # Environment variables template
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── auth/                  # Login, forgot-password, reset-password
    │   ├── dashboard/             # Dashboard
    │   ├── profile/               # User profile + change password
    │   ├── students/              # Student list + [id] detail page + progression
    │   ├── staff/                 # Staff list + leaves
    │   ├── attendance/            # Attendance view + mark
    │   ├── timetable/             # Grid + list timetable
    │   ├── exams/                 # Schedules + results
    │   ├── fees/                  # Structures + payments + defaulters
    │   ├── lms/                   # LMS content + submissions
    │   ├── hostel/                # Hostel management
    │   ├── transport/             # Transport management
    │   ├── library/               # Library management
    │   ├── payments/              # Payment gateway
    │   ├── notifications/         # Notifications
    │   ├── permissions/           # Permission matrix
    │   ├── activities/            # Activity log
    │   ├── files/                 # File management
    │   ├── globals.css            # Global styles
    │   ├── layout.tsx             # Root layout
    │   └── page.tsx               # Home / redirect
    ├── lib/
    │   ├── api.ts                 # Axios API client + all endpoints
    │   └── config.ts              # App config
    ├── next.config.js
    ├── tailwind.config.js
    └── tsconfig.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Quick Start (Scripted)
See [SETUP.md](SETUP.md) for OS-specific quick start steps.

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd School-ERP
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file from example
   cp .env.example .env
   
   # Update .env with your database credentials:
   # DATABASE_URL="postgresql://username:password@localhost:5432/school_erp"
   # JWT_SECRET="your-secret-key"
   
   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate dev --name init
   
   # (Optional) Seed sample data
   node prisma/seed.js
   
   # Start the backend server
   npm run dev
   ```

   Backend runs on http://localhost:5000

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env.local file
   cp .env.example .env.local
   
   # Set the API URL:
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
   
   # Start the frontend server
   npm run dev
   ```

   Frontend runs on http://localhost:3000

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Register an admin user via `POST /api/auth/register` or use Prisma Studio: `npx prisma studio`


### Docker (Optional)
```bash
docker compose up -d
```

If your Docker version doesn't support the new command, use:
```bash
docker-compose up -d
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Change password

### Student Endpoints
- `GET /students` - Get all students (paginated)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `POST /students/promotions` - Promote students to next class
- `POST /students/detentions` - Detain students in current class
- `POST /students/transfers` - Transfer student (internal/external)
- `GET /students/:id/progress-history` - Promotion/transfer history
- `GET /students/class/:classId` - Get students by class
- `GET /students/:id/attendance` - Get student attendance
- `GET /students/:id/fees` - Get student fees
- `GET /students/:id/results` - Get student results

### Staff Endpoints
- `GET /staff` - Get all staff
- `GET /staff/:id` - Get staff by ID
- `POST /staff` - Create new staff
- `PUT /staff/:id` - Update staff
- `DELETE /staff/:id` - Delete staff
- `GET /staff/:id/leaves` - Get staff leaves
- `POST /staff/:id/leaves` - Apply leave
- `PUT /staff/leaves/:leaveId` - Update leave status

### Fee Endpoints
- `GET /fees/structures` - Get all fee structures
- `POST /fees/structures` - Create fee structure
- `GET /fees/payments` - Get all payments
- `POST /fees/payments` - Create payment
- `GET /fees/defaulters` - Get fee defaulters

### Attendance Endpoints
- `GET /attendance` - Get attendance records
- `POST /attendance` - Mark attendance
- `POST /attendance/bulk` - Bulk mark attendance
- `GET /attendance/class/:classId` - Get class attendance

### Timetable Endpoints
- `GET /timetable` - Get all timetables
- `GET /timetable/class/:classId` - Get class timetable
- `POST /timetable` - Create timetable entry

### Exam Endpoints
- `GET /exams/schedules` - Get all exam schedules
- `POST /exams/schedules` - Create exam schedule
- `GET /exams/results` - Get all results
- `POST /exams/results` - Create result
- `GET /exams/report-card/:studentId/:examId` - Get report card

### Dashboard Endpoints
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/recent-activities` - Get recent activities

### Notification Endpoints
- `GET /notifications` - Get all notifications
- `POST /notifications` - Send notification

### LMS Endpoints
- `GET /lms` - Get LMS content (filters: classId, subjectId, teacherId, type, visibility, q)
- `GET /lms/:id` - Get LMS content by ID
- `POST /lms` - Create LMS content
- `PUT /lms/:id` - Update LMS content
- `DELETE /lms/:id` - Delete LMS content
- `POST /lms/:id/attachments` - Upload LMS attachments
- `DELETE /lms/:id/attachments/:attachmentId` - Delete LMS attachment
- `GET /lms/:id/submissions` - Get submissions for assignment (teacher/admin)
- `GET /lms/:id/submissions/me` - Get my submission (student)
- `GET /lms/submissions/me` - List my submissions (student)
- `POST /lms/:id/submissions` - Submit assignment (student)
- `PUT /lms/:id/submissions/:submissionId` - Grade submission (teacher/admin)
- `GET /lms/:id/analytics` - Assignment analytics (teacher/admin)

### Metadata Endpoints
- `GET /metadata/classes` - Get classes
- `GET /metadata/subjects` - Get subjects (filters: classId, teacherId)

### Permission Endpoints
- `GET /permissions` - List permissions and assignments
- `POST /permissions/initialize` - Initialize default permissions (admin)
- `POST /permissions` - Create custom permission
- `PUT /permissions/roles` - Set role permissions
- `PUT /permissions/users` - Set user-level permission overrides
- `GET /permissions/hierarchy` - Get role hierarchy
- `PUT /permissions/hierarchy` - Create/update role hierarchy mapping

## Database Schema

Key entities:
- **Users**: Authentication and role management
- **Students**: Student profiles and admission info
- **Staff**: Staff profiles and employment info
- **Parents**: Parent/guardian information
- **Classes**: Class/grade definitions
- **Subjects**: Subject definitions
- **Attendance**: Daily attendance records
- **FeeStructure**: Fee definitions
- **FeePayment**: Payment records
- **Timetable**: Class schedules
- **ExamSchedule**: Exam definitions
- **ExamResult**: Student exam results
- **Leave**: Staff leave applications
- **Notification**: Communication records
- **LmsContent**: Lesson notes, videos, assignments
- **LmsContentFile**: LMS attachments
- **LmsSubmission**: Assignment submissions
- **LmsSubmissionFile**: Submission attachments
- **Permission/RolePermission/UserPermission**: Fine-grained access control
- **RoleHierarchy**: Parent-child role inheritance mapping
- **StudentPromotion**: Promotion/detention/transfer progression history
- **StudentTransfer**: Internal/external transfer records

## LMS Highlights
- Upload multimedia lesson notes, video lectures, and assignments
- Teacher-only content creation and attachments
- Student assignment submissions with uploads
- Grading workflow with feedback
- Assignment analytics (total, graded, late, average grade)

## Next Steps
- Configure `DATABASE_URL` and run Prisma migrations to get up and running
- Add LMS calendar view with deadline reminders
- Add submission and fee-due email/SMS notifications
- Add LMS widgets to the student/teacher dashboard
- Generate PDF report cards and fee receipts
- Build advanced analytics and reporting views

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC) with fine-grained permission matrix
- API rate limiting
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- Authenticated static file serving (uploads require valid JWT)
- Path traversal protection on file download/delete endpoints
- Error message sanitization (no internal details leaked to clients)

## Deployment

### Backend Deployment (Railway/Render)
1. Create a PostgreSQL database
2. Set environment variables
3. Deploy the backend folder
4. Run `npx prisma migrate deploy`

### Frontend Deployment (Vercel/Netlify)
1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variable: `NEXT_PUBLIC_API_URL`

### Docker Deployment
```bash
# Start all services (backend + frontend + postgres)
docker compose up -d

# Legacy Docker Compose
docker-compose up -d
```

## Development Workflow

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Database Management
```bash
# Open Prisma Studio (Database GUI)
cd backend
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

### Code Quality
```bash
# Frontend linting
cd frontend
npm run lint
```

## Contributing

This is an **open-source project** and contributions are what make it grow. Whether you're a developer, designer, or school administrator with domain knowledge — you are welcome here.

- Fork it and build your own school ERP variant
- Add new modules or improve existing ones
- Fix bugs, improve performance, or enhance the UI
- Translate it for your language/region
- Share it with other schools and institutions

Anyone can take this project forward. There is no closed roadmap — if you have a need, build it and contribute it back.

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

#### 1. Fork and Clone
```bash
git clone <your-fork-url>
cd School-ERP
git remote add upstream <original-repo-url>
```

#### 2. Create a Feature Branch
```bash
git checkout -b feature/YourFeatureName
```

Use descriptive branch names:
- `feature/student-portal` for new features
- `bugfix/attendance-calculation` for bug fixes
- `docs/api-documentation` for documentation

#### 3. Make Your Changes
- Follow the existing code style and structure
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

#### 4. Commit with Clear Messages
```bash
git commit -m "Brief description of changes

- Added feature X
- Fixed bug Y
- Updated documentation Z"
```

#### 5. Push and Create Pull Request
```bash
git push origin feature/YourFeatureName
```

Then open a Pull Request on GitHub with:
- Clear title and description
- Reference any related issues (#issue-number)
- Screenshots for UI changes
- Test results

### Guidelines

**Code Standards:**
- Use consistent indentation (2 spaces for JS/TS, 4 spaces for Python)
- Follow ES6+ syntax for JavaScript
- Add error handling and validation
- Include meaningful variable names

**Git Workflow:**
- Keep commits focused and atomic
- Never commit directly to main branch
- Rebase before pushing: `git rebase upstream/main`
- Keep PRs manageable (< 400 lines if possible)

**Testing:**
- Write tests for new features
- Ensure existing tests pass
- Run linting before committing

**Documentation:**
- Update README for new features
- Add JSDoc/TSDoc comments
- Update API documentation
- Include setup instructions if needed

### Reporting Issues

Found a bug? Please report it by:
1. Checking existing issues first
2. Creating a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, Node version, etc.)

### Feature Requests

Have an idea? We'd love to hear it! Submit a feature request with:
- Clear use case
- How it benefits users
- Suggested implementation (optional)

### Questions?

- Read existing issues and discussions
- Open a GitHub Discussion or Issue

### Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributors page

Thank you for contributing!

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

In short, you are free to:
- **Use** this software for any purpose, including commercial
- **Copy, modify, and distribute** it freely
- **Build on top of it** and create your own products
- **Fork it** and develop it in any direction you choose

The only requirement is to include the original license notice in your distribution. This project will always remain open source.

## Support
Open an issue in the GitHub repository for bug reports or feature requests.

## Roadmap

### Completed
- [x] All 18 frontend modules fully implemented
- [x] Library management
- [x] Transport management
- [x] Hostel management
- [x] Payment gateway integration
- [x] Fine-grained permission matrix
- [x] Student promotion / transfer workflows
- [x] LMS with assignments, submissions, grading
- [x] Activity audit log
- [x] File management (upload/download/delete)

### Upcoming
- [ ] PDF report generation (report cards, fee receipts)
- [ ] SMS / email notification integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language (i18n) support
- [ ] Bulk import (CSV) for students and staff

## Acknowledgments
- Built with Next.js, Node.js, PostgreSQL, and Prisma
- Designed for small-to-medium educational institutions
- Community-driven development
