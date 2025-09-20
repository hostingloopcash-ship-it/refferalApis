const express = require('express');
const { admin } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// POST /api/coins/update - Update user coins
router.post('/update', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, coins, appName, type = 'reward' } = req.body;
    const db = admin.database();
    
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
        transactions: []
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
      transactions: [...transactions, newTransaction]
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