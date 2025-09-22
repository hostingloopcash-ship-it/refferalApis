const express = require('express');
const { admin } = require('../config/firebase');
const router = express.Router();

// Middleware to verify admin secret key
const verifyAdminKey = (req, res, next) => {
  const adminKey = req.body.adminKey || req.body.admin_key || req.query.adminKey;

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

// POST /api/attempts - Get attempts & coins for a specific day (using POST to send data in body)
router.post('/', verifyAdminKey, async (req, res) => {
  try {
    const { day } = req.body;
    const db = admin.database();

    // Validate day parameter
    if (!day || isNaN(day) || day < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DAY',
          message: 'Day must be a positive number'
        }
      });
    }

    const dayNumber = parseInt(day);

    // Get configuration from Firebase
    const configRef = db.ref('admin/AttemptsConfig');
    const configSnapshot = await configRef.once('value');

    let dayConfigs = [];
    let defaultConfig = { attempts: 12, minCoins: 10, maxCoins: 20 };

    if (configSnapshot.exists()) {
      const configData = configSnapshot.val();
      dayConfigs = configData.dayConfigs || [];
      defaultConfig = configData.defaultConfig || defaultConfig;
    }

    // Get config for requested day
    let dayConfig;
    if (dayNumber <= dayConfigs.length && dayConfigs[dayNumber - 1]) {
      dayConfig = dayConfigs[dayNumber - 1];
    } else {
      // Use default config if day is beyond configured days
      dayConfig = defaultConfig;
    }

    res.json({
      success: true,
      data: {
        day: dayNumber,
        attempts: dayConfig.attempts,
        minCoins: dayConfig.minCoins,
        maxCoins: dayConfig.maxCoins
      }
    });

  } catch (error) {
    console.error('Error getting attempts config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get attempts configuration'
      }
    });
  }
});

// POST /api/attempts/config - Set day-wise configuration
router.post('/config', verifyAdminKey, async (req, res) => {
  try {
    const { dayConfigs, defaultConfig } = req.body;
    const db = admin.database();

    // Validate dayConfigs
    if (!Array.isArray(dayConfigs)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DAY_CONFIGS',
          message: 'dayConfigs must be an array'
        }
      });
    }

    // Validate each day config
    for (let i = 0; i < dayConfigs.length; i++) {
      const config = dayConfigs[i];
      if (!config.attempts || !config.minCoins || !config.maxCoins) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONFIG_FORMAT',
            message: `Day ${i + 1} config must have attempts, minCoins, and maxCoins`
          }
        });
      }

      if (config.minCoins > config.maxCoins) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COIN_RANGE',
            message: `Day ${i + 1}: minCoins cannot be greater than maxCoins`
          }
        });
      }
    }

    // Validate defaultConfig
    if (!defaultConfig || !defaultConfig.attempts || !defaultConfig.minCoins || !defaultConfig.maxCoins) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEFAULT_CONFIG',
          message: 'defaultConfig must have attempts, minCoins, and maxCoins'
        }
      });
    }

    if (defaultConfig.minCoins > defaultConfig.maxCoins) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DEFAULT_COIN_RANGE',
          message: 'Default config: minCoins cannot be greater than maxCoins'
        }
      });
    }

    // Save configuration to Firebase
    const configRef = db.ref('admin/AttemptsConfig');
    await configRef.set({
      dayConfigs: dayConfigs,
      defaultConfig: defaultConfig,
      lastUpdated: Date.now()
    });

    console.log(`📊 Attempts configuration updated: ${dayConfigs.length} day configs set`);

    res.json({
      success: true,
      data: {
        message: 'Configuration updated successfully',
        dayConfigs: dayConfigs,
        defaultConfig: defaultConfig
      }
    });

  } catch (error) {
    console.error('Error setting attempts config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to set attempts configuration'
      }
    });
  }
});

// POST /api/attempts/config/get - Get current configuration (using POST to send admin key in body)
router.post('/config/get', verifyAdminKey, async (req, res) => {
  try {
    const db = admin.database();
    const configRef = db.ref('admin/AttemptsConfig');
    const configSnapshot = await configRef.once('value');

    if (!configSnapshot.exists()) {
      // Return default configuration if none exists
      const defaultResponse = {
        dayConfigs: [],
        defaultConfig: { attempts: 12, minCoins: 10, maxCoins: 20 }
      };

      return res.json({
        success: true,
        data: defaultResponse
      });
    }

    const configData = configSnapshot.val();

    res.json({
      success: true,
      data: {
        dayConfigs: configData.dayConfigs || [],
        defaultConfig: configData.defaultConfig || { attempts: 12, minCoins: 10, maxCoins: 20 },
        lastUpdated: configData.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error getting attempts config:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get attempts configuration'
      }
    });
  }
});

module.exports = router;