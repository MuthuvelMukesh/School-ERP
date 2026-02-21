/**
 * Database Seeding Script - Initialize default users for RBAC testing
 * Run with: npm run seed or node prisma/seed.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
  { email: 'admin@school.com', password: 'Admin@123', role: 'ADMIN', name: 'Super Admin', profileType: 'NO_PROFILE' },
  { email: 'teacher@school.com', password: 'Teacher@123', role: 'TEACHER', name: 'John Doe', profileType: 'STAFF', designation: 'Senior Teacher' },
  { email: 'student@school.com', password: 'Student@123', role: 'STUDENT', name: 'Alice Smith', profileType: 'STUDENT', admissionNo: 'STU1001' },
  { email: 'accounts@school.com', password: 'Accounts@123', role: 'ACCOUNTANT', name: 'Jane Roe', profileType: 'STAFF', designation: 'Head Accountant' }
];

async function main() {
  console.log('\n=== Seeding RBAC Test Users ===\n');

  try {
    // Optionally create an academic year and class first (required for Student creation)
    let defaultYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } });
    if (!defaultYear) {
      const year = new Date().getFullYear();
      defaultYear = await prisma.academicYear.create({
        data: {
          year: `${year}-${year + 1}`,
          startDate: new Date(`${year}-04-01`),
          endDate: new Date(`${year + 1}-03-31`),
          isCurrent: true
        }
      });
      console.log('✅ Created default academic year.');
    }

    let defaultClass = await prisma.class.findFirst();
    if (!defaultClass) {
      defaultClass = await prisma.class.create({
        data: {
          name: 'Grade 10',
          section: 'A',
          academicYearId: defaultYear.id,
          capacity: 40
        }
      });
      console.log('✅ Created default class Grade 10-A.');
    }

    for (const u of users) {
      const existingUser = await prisma.user.findUnique({ where: { email: u.email } });
      if (existingUser) {
        console.log(`⚠️ User ${u.email} already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(u.password, 10);

      const user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password: hashedPassword,
          role: u.role,
          status: 'ACTIVE'
        }
      });

      // Split name for profiles
      const [firstName, ...lastNameParts] = u.name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      if (u.profileType === 'STAFF') {
        await prisma.staff.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            employeeId: `EMP-${Date.now().toString().slice(-4)}`,
            dateOfBirth: new Date('1980-01-01'),
            gender: 'MALE',
            phone: '1234567890',
            address: 'Staff Address',
            designation: u.designation,
            joiningDate: new Date(),
            salary: 50000
          }
        });
      } else if (u.profileType === 'STUDENT') {
        await prisma.student.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            admissionNo: u.admissionNo,
            dateOfBirth: new Date('2010-01-01'),
            gender: 'FEMALE',
            phone: '0987654321',
            address: 'Student Address',
            classId: defaultClass.id
          }
        });
      }

      console.log(`✅ Created test user: ${u.email} [${u.role}]`);
    }

    console.log('\n=== Seeding Complete ===\n');

  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
