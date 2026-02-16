// Central configuration for the API URL
// Next.js requires NEXT_PUBLIC_ prefix for client-side environment variables
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://code-relay-backend.onrender.com';

console.log('Frontend initialized with API_URL:', API_URL);
