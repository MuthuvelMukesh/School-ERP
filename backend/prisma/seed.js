/**
 * Database Seeding Script - Initialize default data
 * Run with: npm run seed
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt user input
const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Main seed function
async function main() {
  console.log('\n=== School ERP Database Seeding ===\n');

  try {
    // Check if admin user already exists
    const adminExists = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email:', adminExists.email);
      
      const replaceAdmin = await question('Do you want to recreate admin user? (yes/no): ');
      
      if (replaceAdmin.toLowerCase() !== 'yes') {
        console.log('\nSeeding cancelled.');
        return;
      }

      // Delete existing admin
      await prisma.user.delete({
        where: { id: adminExists.id }
      });
      console.log('Deleted existing admin user.');
    }

    // Get admin credentials from user
    console.log('\nEnter Admin User Credentials:');
    const adminEmail = await question('Email (e.g., admin@school.com): ');
    const adminPassword = await question('Password (minimum 8 characters): ');
    const firstName = await question('First Name: ');
    const lastName = await question('Last Name: ');
    const phone = await question('Phone (optional): ');

    // Validate inputs
    if (!adminEmail || !adminPassword || !firstName || !lastName) {
      console.error('\n❌ All required fields must be filled!');
      return;
    }

    if (adminPassword.length < 8) {
      console.error('\n❌ Password must be at least 8 characters!');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      console.error('\n❌ Invalid email format!');
      return;
    }

    // Check if email already exists
    const userExists = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (userExists) {
      console.error('\n❌ User with this email already exists!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    console.log('\n⏳ Creating admin user...');
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      }
    });

    // Create admin staff profile
    await prisma.staff.create({
      data: {
        userId: adminUser.id,
        firstName,
        lastName,
        phone: phone || '',
        address: '',
        designation: 'School Administrator',
        joiningDate: new Date(),
        salary: 0
      }
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('Admin Details:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Name: ${firstName} ${lastName}`);
    console.log(`  Role: ADMIN`);

    // Ask to create sample academic year
    const createAcademicYear = await question('\nDo you want to create a default academic year? (yes/no): ');

    if (createAcademicYear.toLowerCase() === 'yes') {
      console.log('\n⏳ Creating academic year...');

      const currentYear = new Date().getFullYear();
      const academicYear = await prisma.academicYear.create({
        data: {
          year: `${currentYear}-${currentYear + 1}`,
          startDate: new Date(`${currentYear}-04-01`),
          endDate: new Date(`${currentYear + 1}-03-31`),
          isCurrent: true
        }
      });

      console.log('✅ Academic year created successfully!');
      console.log(`  Year: ${academicYear.year}`);
      console.log(`  Current: Yes`);

      // Ask to create sample classes
      const createClasses = await question('\nDo you want to create sample classes? (yes/no): ');

      if (createClasses.toLowerCase() === 'yes') {
        console.log('\n⏳ Creating sample classes...');

        const classes = [
          { name: 'Grade 1', section: 'A' },
          { name: 'Grade 1', section: 'B' },
          { name: 'Grade 2', section: 'A' },
          { name: 'Grade 2', section: 'B' },
          { name: 'Grade 3', section: 'A' },
          { name: 'Grade 3', section: 'B' }
        ];

        for (const classData of classes) {
          await prisma.class.create({
            data: {
              name: classData.name,
              section: classData.section,
              academicYearId: academicYear.id,
              capacity: 40
            }
          });
        }

        console.log(`✅ Created ${classes.length} sample classes!`);
      }
    }

    // Print login credentials summary
    console.log('\n=== Setup Complete ===');
    console.log('\nYou can now login with:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword} (as entered)`);
    console.log('\nFrontend URL: http://localhost:3000');
    console.log('Backend API: http://localhost:5000\n');

  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the seed function
main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
