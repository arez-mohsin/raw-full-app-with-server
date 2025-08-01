const fetch = require('node-fetch');

// Test script to verify notification system
async function testNotification() {
    const serverUrl = 'https://raw-full-app-with-server.onrender.com';

    console.log('🔔 Testing notification system...');
    console.log('Server URL:', serverUrl);

    try {
        // Test 1: Health check
        console.log('\n1. Testing health endpoint...');
        const healthResponse = await fetch(`${serverUrl}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check passed:', healthData.status);

        // Test 2: Test notification endpoint (requires authentication)
        console.log('\n2. Testing notification endpoint...');
        console.log('Note: This requires a valid user ID and authentication token');
        console.log('To test manually, use the /test-notification endpoint with:');
        console.log('- userId: your user ID');
        console.log('- Authorization header: Bearer <your-firebase-token>');

        console.log('\n📋 Manual test instructions:');
        console.log('1. Get your Firebase ID token from the app');
        console.log('2. Make a POST request to: /test-notification');
        console.log('3. Include in body: { "userId": "your-user-id" }');
        console.log('4. Include header: Authorization: Bearer <your-token>');

        console.log('\n🔍 To verify notifications are working:');
        console.log('1. Start a mining session in the app');
        console.log('2. Check if you receive a "Mining Started!" notification');
        console.log('3. Wait for 2 hours or manually trigger session completion');
        console.log('4. Check if you receive a "Mining Complete!" notification');
        console.log('5. Check server logs for notification success/failure');

        console.log('\n📊 Server monitoring:');
        console.log('- Check server logs for "Push notification sent" messages');
        console.log('- Look for "mining" level log entries');
        console.log('- Monitor for any "Failed to send push notification" errors');
        console.log('- Mining start: "Push notification sent for mining start"');
        console.log('- Mining complete: "Push notification sent for mining completion (scheduled task)"');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testNotification();