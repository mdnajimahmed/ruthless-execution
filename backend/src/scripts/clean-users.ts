#!/usr/bin/env node
import 'dotenv/config';
import prisma from '../config/database.js';

async function cleanUsers() {
  try {
    // Test database connection first
    console.log('Checking database connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
    } catch (dbError: any) {
      console.error('');
      console.error('❌ Cannot connect to database!');
      console.error('');
      console.error('Please make sure PostgreSQL is running:');
      console.error('  docker-compose up -d');
      console.error('');
      process.exit(1);
    }

    // Count existing users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} user(s) in database`);

    if (userCount === 0) {
      console.log('✅ No users to delete');
      await prisma.$disconnect();
      return;
    }

    // List users before deletion
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    console.log('');
    console.log('Users to be deleted:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    console.log('');

    // Delete all users (cascade will delete related data)
    console.log('Deleting all users and related data...');
    const result = await prisma.user.deleteMany({});

    console.log('');
    console.log(`✅ Successfully deleted ${result.count} user(s)`);
    console.log('   Note: All related goals, tasks, entries, and backlog items have been deleted');
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error(`❌ Error cleaning users: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanUsers();
