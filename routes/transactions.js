const express = require('express');
const { admin } = require('../config/firebase');
const { verifyFirebaseToken, authorizeUser } = require('../middleware/auth');
const router = express.Router();

// GET /api/transactions/:uid - Get user transaction history
router.get('/:uid', verifyFirebaseToken, authorizeUser, async (req, res) => {
  try {
    const uid = req.params.uid;
    const db = admin.database();
    const userRef = db.ref(`users/${uid}`);
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
    const transactions = userData.transactions || [];
    
    // Sort transactions by timestamp (newest first)
    const sortedTransactions = transactions.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({
      success: true,
      data: {
        transactions: sortedTransactions,
        totalTransactions: sortedTransactions.length
      }
    });
    
  } catch (error) {
    console.error('Error retrieving transaction history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve transaction history'
      }
    });
  }
});

module.exports = router;