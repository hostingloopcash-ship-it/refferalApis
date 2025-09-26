const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
const collaborationFile = path.join(dataDir, 'collaboration_records.csv');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize CSV file with headers if it doesn't exist
const initializeCSVFile = () => {
  if (!fs.existsSync(collaborationFile)) {
    const headers = 'Model,Name,Email,Phone,Contact,Timestamp\n';
    fs.writeFileSync(collaborationFile, headers, 'utf8');
    console.log('📄 Collaboration CSV file initialized');
  }
};

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

    // Initialize CSV file if it doesn't exist
    initializeCSVFile();

    // Prepare CSV row data
    const csvRow = [
      collaborationModel || 'Not provided',
      name || 'Not provided',
      email || 'Not provided',
      phone || 'Not provided',
      contact || 'Not provided',
      timestamp || new Date().toISOString()
    ];

    // Escape CSV values (handle commas, quotes, newlines)
    const escapedRow = csvRow.map(field => {
      if (typeof field === 'string') {
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          return `"${field.replace(/"/g, '""')}"`;
        }
      }
      return field;
    });

    // Create CSV line
    const csvLine = escapedRow.join(',') + '\n';

    // Append to CSV file
    fs.appendFileSync(collaborationFile, csvLine, 'utf8');

    console.log(`📝 New collaboration record added: ${name} (${email})`);

    res.json({
      success: true,
      data: {
        message: 'Collaboration record added successfully',
        recordData: {
          model: collaborationModel,
          name: name,
          email: email,
          phone: phone,
          contact: contact,
          timestamp: timestamp
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

    // Check if secret key matches (using a different env variable for this feature)
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

    // Check if file exists
    if (!fs.existsSync(collaborationFile)) {
      initializeCSVFile(); // Create empty file with headers
    }

    // Get file stats
    const stats = fs.statSync(collaborationFile);
    const fileSize = stats.size;
    const lastModified = stats.mtime;

    // Count records (excluding header)
    const fileContent = fs.readFileSync(collaborationFile, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const recordCount = Math.max(0, lines.length - 1); // Subtract 1 for header

    console.log(`📊 Download request for collaboration records: ${recordCount} records`);

    // Return file info and download endpoint
    res.json({
      success: true,
      data: {
        message: 'File ready for download',
        fileInfo: {
          recordCount: recordCount,
          fileSize: fileSize,
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

    // Check if file exists
    if (!fs.existsSync(collaborationFile)) {
      initializeCSVFile();
    }

    // Set headers for file download
    const fileName = `collaboration_records_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(collaborationFile);
    fileStream.pipe(res);

    console.log(`📥 File downloaded: ${fileName}`);

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