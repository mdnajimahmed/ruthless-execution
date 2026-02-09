#!/usr/bin/env node
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

async function createUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run create-user <username> <password> [email]');
    console.error('Example: npm run create-user john mypassword123 john@example.com');
    process.exit(1);
  }

  const [username, password, email] = args;

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      console.error(`Error: User with username "${username}" already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email: email || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    console.log('✅ User created successfully!');
    console.log(`   Username: ${user.username}`);
    if (user.email) {
      console.log(`   Email: ${user.email}`);
    }
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt.toISOString()}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.error(`Error: User with username "${username}" or email already exists`);
    } else {
      console.error('Error creating user:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
