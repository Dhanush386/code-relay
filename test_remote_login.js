const axios = require('axios');

const REMOTE_URL = 'https://code-relay-backend.onrender.com';

async function testParticipant() {
    console.log('\n--- Testing Participant Registration ---');
    try {
        const res = await axios.post(`${REMOTE_URL}/api/participant/register`, {
            participantId: 'test-team-' + Date.now(),
            collegeName: 'Test College'
        });
        console.log('✅ Participant Register Success:', res.status);
        console.log('Token:', !!res.data.token);
    } catch (err) {
        console.log('❌ Participant Register Failed:');
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
}

async function testOrganizer() {
    console.log('\n--- Testing Organizer Login ---');
    try {
        const res = await axios.post(`${REMOTE_URL}/api/organizer/login`, {
            email: 'admin@test.com',
            password: 'password123'
        });
        console.log('✅ Organizer Login Success:', res.status);
    } catch (err) {
        console.log('❌ Organizer Login Failed:');
        if (err.response) {
            console.log('Status:', err.response.status);
            console.log('Data:', err.response.data);
        } else {
            console.log('Error:', err.message);
        }
    }
}

async function run() {
    await testParticipant();
    await testOrganizer();
}

run();
