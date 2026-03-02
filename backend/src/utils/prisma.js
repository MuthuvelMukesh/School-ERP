const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient to avoid connection pool exhaustion
// In development, hot-reloading can create multiple instances
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
