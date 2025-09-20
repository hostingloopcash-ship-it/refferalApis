const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Check if all required environment variables are present
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('❌ Missing Firebase credentials in environment variables');
      console.log('Required variables:');
      console.log('- FIREBASE_PROJECT_ID');
      console.log('- FIREBASE_PRIVATE_KEY');
      console.log('- FIREBASE_CLIENT_EMAIL');
      console.log('\nPlease check your .env file and ensure all Firebase credentials are set.');
      process.exit(1);
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
      console.log('\nPlease verify your Firebase credentials are correct.');
      process.exit(1);
    }
  }
  return admin;
};

module.exports = { initializeFirebase, admin };