/**
 * Prisma database seed script
 * Rules for this file:
 * - Create sample data for development/testing
 * - Use proper error handling
 * - Clean up existing data safely
 * - Log operations for debugging
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data (optional - be careful in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning up existing data...');

    await prisma.spotifyCache.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleanup completed');
  }

  // Create sample data if needed
  console.log('📝 Creating sample data...');

  // You can add sample users or other data here if needed for testing
  // For now, we'll just ensure the database is properly set up

  console.log('✅ Database seed completed successfully');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Database seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
