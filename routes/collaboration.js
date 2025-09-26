const express = require('express');
const { connectMongoDB, CollaborationRecord } = require('../config/mongodb');
const router = express.Router();

// Initialize MongoDB connection
connectMongoDB();

// POST /api/collaboration/add - Add new collaboration record
router.post('/add', async (req, res) => {
  try {
    const {
      collaborationModel,
      name,
      email,
      phone,
      countryCode,
      contactMethod,
      contact,
      password,
      userExperience,
      trafficSourcesType,
      trafficSources,
      additionalNotes,
      termsAccepted,
      timestamp
    } = req.body;

    // Create new collaboration record in MongoDB
    const collaborationRecord = new CollaborationRecord({
      collaborationModel: collaborationModel || 'Not provided',
      name: name || 'Not provided',
      email: email || 'Not provided',
      phone: phone || 'Not provided',
      countryCode: countryCode || 'Not provided',
      contactMethod: contactMethod || 'Not provided',
      contact: contact || 'Not provided',
      password: password || 'Not provided',
      userExperience: userExperience || 'Not provided',
      trafficSourcesType: trafficSourcesType || 'Not provided',
      trafficSources: trafficSources || 'Not provided',
      additionalNotes: additionalNotes || 'Not provided',
      termsAccepted: termsAccepted || false,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    });

    // Save to MongoDB
    const savedRecord = await collaborationRecord.save();

    console.log(`📝 New collaboration record added: ${name} (${email}) - ID: ${savedRecord._id}`);

    res.json({
      success: true,
      data: {
        message: 'Collaboration record added successfully',
        recordData: {
          id: savedRecord._id,
          model: savedRecord.collaborationModel,
          name: savedRecord.name,
          email: savedRecord.email,
          phone: savedRecord.phone,
          contact: savedRecord.contact,
          timestamp: savedRecord.timestamp
        }
      }
    });

  } catch (error) {
    console.error('Error adding collaboration record:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add collaboration record'
      }
    });
  }
});

// GET /api/collaboration/download/:secretKey - Get download link for collaboration records
router.get('/download/:secretKey', async (req, res) => {
  try {
    const { secretKey } = req.params;

    // Validate secret key
    if (!secretKey) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_SECRET_KEY',
          message: 'Secret key is required'
        }
      });
    }

    // Check if secret key matches
    const downloadSecretKey = process.env.DOWNLOAD_SECRET_KEY || process.env.ADMIN_SECRET_KEY;
    if (secretKey !== downloadSecretKey) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_SECRET_KEY',
          message: 'Invalid secret key'
        }
      });
    }

    // Get record count from MongoDB
    const recordCount = await CollaborationRecord.countDocuments();
    
    // Get latest record for last modified info
    const latestRecord = await CollaborationRecord.findOne().sort({ createdAt: -1 });
    const lastModified = latestRecord ? latestRecord.createdAt : new Date();

    console.log(`📊 Download request for collaboration records: ${recordCount} records`);

    // Return file info and download endpoint
    res.json({
      success: true,
      data: {
        message: 'CSV file ready for download',
        fileInfo: {
          recordCount: recordCount,
          lastModified: lastModified,
          fileName: 'collaboration_records.csv'
        },
        downloadUrl: `${req.protocol}://${req.get('host')}/api/collaboration/file/${secretKey}`,
        instructions: 'Use the downloadUrl to download the CSV file directly'
      }
    });

  } catch (error) {
    console.error('Error preparing download:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to prepare file download'
      }
    });
  }
});

// GET /api/collaboration/file/:secretKey - Direct file download
router.get('/file/:secretKey', async (req, res) => {
  try {
    const { secretKey } = req.params;

    // Validate secret key
    const downloadSecretKey = process.env.DOWNLOAD_SECRET_KEY || process.env.ADMIN_SECRET_KEY;
    if (secretKey !== downloadSecretKey) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_SECRET_KEY',
          message: 'Invalid secret key'
        }
      });
    }

    // Fetch all records from MongoDB
    const records = await CollaborationRecord.find().sort({ createdAt: -1 });

    // Generate CSV content
    const csvHeaders = 'Model,Name,Email,Phone,Contact,Timestamp\n';
    
    const csvRows = records.map(record => {
      const row = [
        record.collaborationModel || 'Not provided',
        record.name || 'Not provided',
        record.email || 'Not provided',
        record.phone || 'Not provided',
        record.contact || 'Not provided',
        record.timestamp ? record.timestamp.toISOString() : new Date().toISOString()
      ];

      // Escape CSV values (handle commas, quotes, newlines)
      const escapedRow = row.map(field => {
        if (typeof field === 'string') {
          // If field contains comma, quote, or newline, wrap in quotes and escape quotes
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
        }
        return field;
      });

      return escapedRow.join(',');
    });

    const csvContent = csvHeaders + csvRows.join('\n');

    // Set headers for file download
    const fileName = `collaboration_records_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send CSV content
    res.send(csvContent);

    console.log(`📥 CSV file downloaded: ${fileName} (${records.length} records)`);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to download file'
      }
    });
  }
});

module.exports = router;