const express = require('express');
const { admin } = require('../config/firebase');
const router = express.Router();

// Middleware to verify admin secret key
const verifyAdminKey = (req, res, next) => {
  const { adminKey } = req.body;
  
  if (!adminKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_ADMIN_KEY',
        message: 'Admin key is required'
      }
    });
  }
  
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_ADMIN_KEY',
        message: 'Invalid admin key'
      }
    });
  }
  
  next();
};

// POST /api/admin/packages/add - Add or update allowed package
router.post('/packages/add', verifyAdminKey, async (req, res) => {
  try {
    const { packageName, isActive } = req.body;
    const db = admin.database();
    
    // Validate required fields
    if (!packageName || isActive === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'packageName and isActive are required'
        }
      });
    }
    
    // Validate package name format
    if (!packageName.includes('.') || packageName.length < 3) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PACKAGE_NAME',
          message: 'Package name must be in format com.example.app'
        }
      });
    }
    
    // Convert package name to Firebase-safe key (replace dots with underscores)
    const firebaseKey = packageName.replace(/\./g, '_');
    
    // Add/update package in Firebase
    const packageRef = db.ref(`admin/AllowedPackages/${firebaseKey}`);
    await packageRef.set({
      isActive: Boolean(isActive),
      originalPackageName: packageName, // Store original name for reference
      addedAt: Date.now(),
      lastUpdated: Date.now()
    });
    
    console.log(`📦 Package ${isActive ? 'activated' : 'deactivated'}: ${packageName} (stored as ${firebaseKey})`);
    
    res.json({
      success: true,
      data: {
        packageName: packageName,
        isActive: Boolean(isActive),
        message: `Package ${packageName} ${isActive ? 'activated' : 'deactivated'} successfully`
      }
    });
    
  } catch (error) {
    console.error('Error managing package:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to manage package'
      }
    });
  }
});

// GET /api/admin/packages - Get all allowed packages
router.get('/packages', verifyAdminKey, async (req, res) => {
  try {
    const db = admin.database();
    const packagesRef = db.ref('admin/AllowedPackages');
    const snapshot = await packagesRef.once('value');
    
    if (!snapshot.exists()) {
      return res.json({
        success: true,
        data: {
          packages: {},
          total: 0
        }
      });
    }
    
    const packages = snapshot.val();
    
    res.json({
      success: true,
      data: {
        packages: packages,
        total: Object.keys(packages).length
      }
    });
    
  } catch (error) {
    console.error('Error getting packages:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get packages'
      }
    });
  }
});

// POST /api/admin/packages/remove - Remove allowed package
router.post('/packages/remove', verifyAdminKey, async (req, res) => {
  try {
    const { packageName } = req.body;
    const db = admin.database();
    
    if (!packageName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PACKAGE_NAME',
          message: 'packageName is required'
        }
      });
    }
    
    // Convert package name to Firebase-safe key (replace dots with underscores)
    const firebaseKey = packageName.replace(/\./g, '_');
    
    // Remove package from Firebase
    const packageRef = db.ref(`admin/AllowedPackages/${firebaseKey}`);
    await packageRef.remove();
    
    console.log(`🗑️ Package removed: ${packageName} (was stored as ${firebaseKey})`);
    
    res.json({
      success: true,
      data: {
        packageName: packageName,
        message: `Package ${packageName} removed successfully`
      }
    });
    
  } catch (error) {
    console.error('Error removing package:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove package'
      }
    });
  }
});

module.exports = router;