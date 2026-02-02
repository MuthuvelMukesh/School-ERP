const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@school.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not found in environment.');
        console.warn('⚠️  Using default credentials: admin@school.com / Admin@123');
        console.warn('⚠️  Please provide these variables in your .env file for production!');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log('✅ Admin user seeded:', admin.email);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
