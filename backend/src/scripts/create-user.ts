#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

async function createUser() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: npm run create-user <email> <password>');
    console.error('');
    console.error('Examples:');
    console.error('  npm run create-user user@example.com mypassword123');
    process.exit(1);
  }

  const [email, password] = args;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    console.error(`❌ Error: Invalid email format: "${email}"`);
    console.error('   Email should be in format: user@example.com');
    process.exit(1);
  }

  // Validate password
  if (!password || password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    console.error(`   Provided password length: ${password?.length || 0}`);
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

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

    console.log(`Creating user: ${normalizedEmail}...`);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      console.error(`❌ Error: User with email "${normalizedEmail}" already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    console.log('');
    console.log('✅ User created successfully!');
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID:       ${user.id}`);
    console.log(`   Created:  ${user.createdAt.toISOString()}`);
    console.log('');
  } catch (error: any) {
    console.error('');
    if (error.code === 'P2002') {
      console.error(`❌ Error: User with email "${normalizedEmail}" already exists`);
    } else if (error.message) {
      console.error(`❌ Error creating user: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error('❌ Error creating user:', error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
