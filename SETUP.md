# School ERP System - Quick Start Guide

## Initial Setup

### For Windows (PowerShell)

Terminal 1 (Backend):
```powershell
cd School-ERP\backend
npm install
Copy-Item .env.example .env
# Update .env with database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd School-ERP\frontend
npm install
Copy-Item .env.local.example .env.local
npm run dev
```

### For Windows (cmd)

Terminal 1 (Backend):
```cmd
cd School-ERP\backend
npm install
copy .env.example .env
REM Update .env with database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Terminal 2 (Frontend):
```cmd
cd School-ERP\frontend
npm install
copy .env.local.example .env.local
npm run dev
```

### For Linux/Mac (Bash)

```bash
#!/bin/bash

cd School-ERP/backend
npm install
cp .env.example .env
# Update .env with database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Terminal 2 (Frontend):
```bash
cd School-ERP/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Docker Setup (Recommended for Production)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

If your Docker version doesn't support the new command, use `docker-compose` instead.

## Creating First Admin User

### Method 1: Using Prisma Studio
```bash
cd backend
npx prisma studio
```
Then manually create a user with role 'ADMIN'

### Method 2: Using API
```bash
# Use Postman or curl to call the register endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "admin123",
    "role": "ADMIN",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

## Common Issues and Solutions

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database credentials

### Port Already in Use
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Prisma Client Not Generated
```bash
cd backend
npx prisma generate
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/school_erp"
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=School ERP System
```

## Testing the Installation

1. Open http://localhost:3000
2. You should see the login page
3. Use the admin credentials you created
4. Explore the dashboard

## Next Steps

1. Configure SMTP for email notifications
2. Set up SMS gateway (optional)
3. Customize the school information
4. Create academic year and classes
5. Start adding students and staff

## Support

For issues or questions:
- Check the README.md
- Open an issue on GitHub
- Contact: support@schoolerp.com
