const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectMongoDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      return false;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Collaboration record schema
const collaborationSchema = new mongoose.Schema({
  collaborationModel: {
    type: String,
    default: 'Not provided'
  },
  name: {
    type: String,
    default: 'Not provided'
  },
  email: {
    type: String,
    default: 'Not provided'
  },
  phone: {
    type: String,
    default: 'Not provided'
  },
  countryCode: {
    type: String,
    default: 'Not provided'
  },
  contactMethod: {
    type: String,
    default: 'Not provided'
  },
  contact: {
    type: String,
    default: 'Not provided'
  },
  password: {
    type: String,
    default: 'Not provided'
  },
  userExperience: {
    type: String,
    default: 'Not provided'
  },
  trafficSourcesType: {
    type: String,
    default: 'Not provided'
  },
  trafficSources: {
    type: String,
    default: 'Not provided'
  },
  additionalNotes: {
    type: String,
    default: 'Not provided'
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const CollaborationRecord = mongoose.model('CollaborationRecord', collaborationSchema);

module.exports = {
  connectMongoDB,
  CollaborationRecord
};