#!/usr/bin/env node

/**
 * Production Mode Testing Script
 * 
 * This script helps test the server in production mode to ensure
 * all security features work correctly before deployment.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Production Mode Testing...\n');

// Set production environment
process.env.NODE_ENV = 'production';

console.log('📋 Environment Configuration:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);
console.log(`   Timestamp Validation: 5 minutes (300000ms)`);
console.log(`   Rate Limiting: Strict (100 requests per 15 minutes)`);
console.log('');

// Test configuration loading
try {
    const config = require('./config');
    console.log('✅ Configuration loaded successfully:');
    console.log(`   Timestamp Validation: ${config.TIMESTAMP_VALIDATION.MAX_TIME_DIFFERENCE}ms`);
    console.log(`   Rate Limit: ${config.RATE_LIMIT.MAX_REQUESTS} requests per ${config.RATE_LIMIT.WINDOW_MS / 1000 / 60} minutes`);
    console.log('');
} catch (error) {
    console.error('❌ Configuration loading failed:', error.message);
    process.exit(1);
}

// Test server syntax
console.log('🔍 Testing server syntax...');
try {
    require('./server.js');
    console.log('✅ Server syntax is valid');
} catch (error) {
    console.error('❌ Server syntax error:', error.message);
    process.exit(1);
}

console.log('');

// Start server in production mode
console.log('🚀 Starting server in production mode...');
console.log('   This will test:');
console.log('   - Strict timestamp validation (5 minutes)');
console.log('   - Strict rate limiting');
console.log('   - All security middleware');
console.log('   - Production error handling');
console.log('');

const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
});

server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});

server.on('exit', (code) => {
    if (code === 0) {
        console.log('\n✅ Server exited successfully');
    } else {
        console.log(`\n❌ Server exited with code ${code}`);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping server...');
    server.kill('SIGTERM');
    process.exit(0);
});

console.log('📝 Testing Instructions:');
console.log('1. The server is now running in production mode');
console.log('2. Test with your React Native app');
console.log('3. Verify that timestamp validation is strict (5 minutes)');
console.log('4. Check that rate limiting is enforced');
console.log('5. Test all security features');
console.log('6. Press Ctrl+C to stop the server');
console.log('');
