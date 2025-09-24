#!/usr/bin/env node

/**
 * Setup script for Spotify Music Player
 * This script helps users get started quickly by:
 * - Copying environment variables
 * - Running initial database setup
 * - Providing setup instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎵 Welcome to Spotify Music Player Setup!\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📄 Copying .env.example to .env...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file\n');
  } else {
    console.log('❌ .env.example not found!\n');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists\n');
}

// Check if environment variables are set
console.log('🔍 Checking environment variables...');
require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET',
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing environment variables:');
  missingVars.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📝 Please update your .env file with the required values:');
  console.log(
    '   1. Set up a Spotify app at: https://developer.spotify.com/dashboard',
  );
  console.log('   2. Set up a PostgreSQL database');
  console.log('   3. Generate a secure NEXTAUTH_SECRET');
  console.log(
    '\n⏸️  Setup paused - please complete your .env file and run this script again.',
  );
  process.exit(1);
}

console.log('✅ All required environment variables are set\n');

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated\n');
} catch {
  console.log('❌ Failed to generate Prisma client');
  console.log('Please run: npm run prisma:generate\n');
}

// Ask about database migration
console.log('🗄️  Database setup:');
console.log('   Run the following commands to set up your database:');
console.log('   1. npm run prisma:migrate    # Create and run migrations');
console.log('   2. npm run prisma:seed       # (Optional) Seed the database');
console.log('   3. npm run dev               # Start the development server');
console.log('');

// Spotify setup instructions
console.log('🎧 Spotify App Setup:');
console.log('   1. Go to: https://developer.spotify.com/dashboard');
console.log('   2. Create a new app');
console.log(
  '   3. Add redirect URI: http://localhost:3000/api/auth/callback/spotify',
);
console.log('   4. Copy Client ID and Client Secret to your .env file');
console.log('');

console.log('🚀 Setup complete! Next steps:');
console.log('   1. Set up your database: npm run prisma:migrate');
console.log('   2. Start the dev server: npm run dev');
console.log('   3. Open: http://localhost:3000');
console.log('');
console.log('📚 For more information, see the README.md file.');
console.log('🎵 Happy coding!');
