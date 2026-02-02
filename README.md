# School ERP System

## Description
Web-based School ERP to manage student, staff, academic, financial and administrative operations for small-medium schools.

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
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT-based
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

### Frontend
- **Framework**: Next.js 14 (React 18)
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
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── middleware/            # Auth, validation middleware
│   │   ├── routes/                # API routes
│   │   ├── utils/                 # Utility functions
│   │   └── server.js              # Express app entry point
│   ├── .env.example               # Environment variables template
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── auth/                  # Authentication pages
    │   ├── dashboard/             # Dashboard page
    │   ├── globals.css            # Global styles
    │   ├── layout.tsx             # Root layout
    │   └── page.tsx               # Home page
    ├── lib/
    │   └── api.ts                 # API client and endpoints
    ├── next.config.js
    ├── tailwind.config.js
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuthuvelMukesh/School-ERP.git
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
   
   # Start the backend server
   npm run dev
   ```

   Backend will run on http://localhost:5000

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Create .env.local file
   cp .env.local.example .env.local
   
   # Update .env.local with:
   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
   
   # Start the frontend server
   npm run dev
   ```

   Frontend will run on http://localhost:3000

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Login with demo credentials:
     - Email: admin@school.com
     - Password: admin123
   
   **Note**: You'll need to create an admin user first by using the register API endpoint or directly in the database.

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
Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
MIT License - see the [LICENSE](LICENSE) file for details.

## Support
For support, email support@schoolerp.com or open an issue in the GitHub repository.

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
