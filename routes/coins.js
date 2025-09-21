const express = require('express');
const { admin } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/coins/update - Update user coins
router.post('/update', async (req, res) => {
  try {
    const { uid, coins, appName, type = 'reward', packageName, adminKey } = req.body;
    const db = admin.database();

    // Validate admin key (mandatory)
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

    // Check authentication method
    const authHeader = req.headers.authorization;
    const hasFirebaseToken = authHeader && authHeader.startsWith('Bearer ');

    // Validate required fields
    if (!uid || coins === undefined || !appName) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'uid, coins, and appName are required'
        }
      });
    }

    // Authentication: Either Firebase token OR valid package name
    if (hasFirebaseToken) {
      // Use Firebase authentication
      try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Token is valid, proceed
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired Firebase token'
          }
        });
      }
    } else if (packageName) {
      // Use package name verification
      try {
        // Convert package name to Firebase-safe key (replace dots with underscores)
        const firebaseKey = packageName.replace(/\./g, '_');

        const adminRef = db.ref('admin/AllowedPackages');
        const packageSnapshot = await adminRef.child(firebaseKey).once('value');

        if (!packageSnapshot.exists()) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PACKAGE_NOT_FOUND',
              message: 'Package name not found in allowed packages'
            }
          });
        }

        const packageData = packageSnapshot.val();
        if (!packageData.isActive) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'PACKAGE_INACTIVE',
              message: 'Package is not active'
            }
          });
        }

        console.log(`✅ Package verification successful: ${packageName} (stored as ${firebaseKey})`);
      } catch (error) {
        console.error('Package verification error:', error);
        return res.status(500).json({
          success: false,
          error: {
            code: 'PACKAGE_VERIFICATION_ERROR',
            message: 'Failed to verify package'
          }
        });
      }
    } else {
      // No authentication method provided
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Either Firebase token or valid packageName is required'
        }
      });
    }

    // Validate coin amount
    if (coins < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COIN_AMOUNT',
          message: 'Coin amount cannot be negative'
        }
      });
    }

    const userRef = db.ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');

    let userData;
    if (!userSnapshot.exists()) {
      // Create user if doesn't exist
      console.log(`Creating new user: ${uid}`);
      userData = {
        uid: uid,
        createdAt: Date.now(),
        currentEarning: 0,
        dailyEarning: 0,
        referredCoins: 0,
        totalReferrals: 0,
        referrals: [],
        transactions: [],
        popupControl: {
          showPopup: false
        }
      };
      await userRef.set(userData);
    } else {
      userData = userSnapshot.val();
    }

    const currentEarning = userData.currentEarning || 0;
    const referredCoins = userData.referredCoins || 0;
    const dailyEarning = userData.dailyEarning || 0;
    const transactions = userData.transactions || [];

    // Create new transaction
    const newTransaction = {
      appName: appName,
      coins: coins,
      timestamp: Date.now(),
      type: type
    };

    // Calculate new balances based on transaction type
    let newCurrentEarning = currentEarning + coins;
    let newReferredCoins = referredCoins;
    let newDailyEarning = dailyEarning;

    if (type === 'referral') {
      newReferredCoins = referredCoins + coins;
    } else if (type === 'daily') {
      newDailyEarning = dailyEarning + coins;
    }

    // Update user data
    await userRef.update({
      currentEarning: newCurrentEarning,
      referredCoins: newReferredCoins,
      dailyEarning: newDailyEarning,
      transactions: [...transactions, newTransaction],
      popupControl: {
        showPopup: true,
        transaction: newTransaction  // Store the transaction that triggered the popup
      }
    });

    res.json({
      success: true,
      data: {
        newBalance: newCurrentEarning,
        referredCoins: newReferredCoins,
        dailyEarning: newDailyEarning,
        transaction: newTransaction
      }
    });

  } catch (error) {
    console.error('Error updating coins:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update coins'
      }
    });
  }
});

// GET /api/coins/:uid - Get user balance
router.get('/:uid', verifyFirebaseToken, async (req, res) => {
  try {
    const requestedUid = req.params.uid;
    const authenticatedUid = req.user.uid;

    // Check authorization - users can only access their own balance
    if (requestedUid !== authenticatedUid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Cannot access other user balance'
        }
      });
    }

    const db = admin.database();
    const userRef = db.ref(`users/${requestedUid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    const userData = userSnapshot.val();

    res.json({
      success: true,
      data: {
        currentEarning: userData.currentEarning || 0,
        dailyEarning: userData.dailyEarning || 0,
        referredCoins: userData.referredCoins || 0,
        totalReferrals: userData.totalReferrals || 0
      }
    });

  } catch (error) {
    console.error('Error retrieving balance:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve balance'
      }
    });
  }
});

module.exports = router;