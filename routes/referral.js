const express = require('express');
const { admin } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// Use Firebase UID as referral ID (much simpler and more reliable)
const generateReferralId = (uid) => {
  return uid; // Firebase UID is already unique and perfect as referral ID
};

// POST /api/referral/generate
router.post('/generate', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // Current user's UID
    const db = admin.database();
    const userRef = db.ref(`users/${userId}`);

    // Check if user exists, create if not
    const userSnapshot = await userRef.once('value');
    let userData = userSnapshot.val();

    if (!userData) {
      // Create user if doesn't exist
      console.log(`Creating new user: ${userId}`);
      userData = {
        uid: userId,
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
    }

    // Use Firebase UID as referral ID (always the same for each user)
    const referralId = generateReferralId(userId);
    const referralLink = `${process.env.DOMAIN}/r/${referralId}`;

    // Update user data with referral info if not already set
    if (!userData.referralId || !userData.referralLink) {
      await userRef.update({
        referralId: referralId,
        referralLink: referralLink
      });
    }

    res.json({
      success: true,
      data: {
        referralId: referralId,
        referralLink: referralLink
      }
    });

  } catch (error) {
    console.error('Error generating referral link:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate referral link'
      }
    });
  }
});

// GET /r/:referralId - Referral redirect handler
router.get('/r/:referralId', async (req, res) => {
  try {
    const referralId = req.params.referralId; // This is now a Firebase UID
    console.log(`🔗 Processing referral redirect for UID: ${referralId}`);

    const db = admin.database();

    // Since referralId is now the Firebase UID, we can directly check if user exists
    const userRef = db.ref(`users/${referralId}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      console.log(`❌ User not found for UID: ${referralId}`);
      console.log(`🔄 Redirecting to default landing page: ${process.env.DEFAULT_LANDING_PAGE}`);
      return res.redirect(process.env.DEFAULT_LANDING_PAGE);
    }

    const userData = snapshot.val();
    console.log(`✅ Valid referral user found: ${userData.name || 'Unknown'} (${referralId})`);

    // Store referral ID in session/cookie for later use during signup
    res.cookie('referralId', referralId, {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true
    });

    // Redirect to app store
    const playStoreUrlWithRef = `${process.env.APP_STORE_URL}&ref=${referralId}`;
    console.log(`🔄 Redirecting to app store: ${playStoreUrlWithRef}`);
    res.redirect(playStoreUrlWithRef);

  } catch (error) {
    console.error('❌ Error processing referral redirect:', error);
    console.log(`🔄 Redirecting to fallback: ${process.env.DEFAULT_LANDING_PAGE}`);
    res.redirect(process.env.DEFAULT_LANDING_PAGE);
  }
});

// POST /api/referral/update - Update referral relationships
router.post('/update', verifyFirebaseToken, async (req, res) => {
  try {
    const { referrerUid, utmSource, utmMedium, utmCampaign, utmTerm, utmContent } = req.body; // UID and UTM data from Play Store install referral API
    const currentUserId = req.user.uid; // Current user's UID
    const db = admin.database();

    if (!referrerUid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REFERRER_UID',
          message: 'referrerUid is required (UID from Play Store referral API)'
        }
      });
    }

    // Don't allow self-referral
    if (referrerUid === currentUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SELF_REFERRAL',
          message: 'Cannot refer yourself'
        }
      });
    }

    // Check if referrer exists
    const referrerRef = db.ref(`users/${referrerUid}`);
    const referrerSnapshot = await referrerRef.once('value');

    if (!referrerSnapshot.exists()) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REFERRER_NOT_FOUND',
          message: 'Referrer user not found'
        }
      });
    }

    const referrerData = referrerSnapshot.val();

    // Check if current user exists, create if not
    const currentUserRef = db.ref(`users/${currentUserId}`);
    const currentUserSnapshot = await currentUserRef.once('value');
    
    if (!currentUserSnapshot.exists()) {
      // Create current user if doesn't exist
      console.log(`Creating new user: ${currentUserId}`);
      const newUserData = {
        uid: currentUserId,
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
      
      // Add UTM data to new user if provided
      if (Object.keys(utmData).length > 0) {
        newUserData.utmTracking = utmData;
      }
      
      await currentUserRef.set(newUserData);
    }

    // Update referrer's data - add current user to their referrals
    const currentReferrals = referrerData.referrals || [];
    const currentTotalReferrals = referrerData.totalReferrals || 0;

    // Check if already referred
    if (currentReferrals.includes(currentUserId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_REFERRED',
          message: 'User is already referred by this referrer'
        }
      });
    }

    await referrerRef.update({
      referrals: [...currentReferrals, currentUserId],
      totalReferrals: currentTotalReferrals + 1
    });

    // Prepare UTM data if provided
    const utmData = {};
    if (utmSource) utmData.utmSource = utmSource;
    if (utmMedium) utmData.utmMedium = utmMedium;
    if (utmCampaign) utmData.utmCampaign = utmCampaign;
    if (utmTerm) utmData.utmTerm = utmTerm;
    if (utmContent) utmData.utmContent = utmContent;
    
    // Add timestamp for UTM data
    if (Object.keys(utmData).length > 0) {
      utmData.utmTimestamp = Date.now();
    }

    // Update current user's referredBy field and UTM data
    const updateData = {
      referredBy: referrerUid
    };
    
    // Add UTM data if provided
    if (Object.keys(utmData).length > 0) {
      updateData.utmTracking = utmData;
      console.log(`📊 UTM tracking data stored for user ${currentUserId}:`, utmData);
    }
    
    await currentUserRef.update(updateData);

    // Add 100 coins to both referrer and referee for successful referral
    const referralBonus = 100;
    const referralTransaction = {
      appName: 'Referral',
      coins: referralBonus,
      timestamp: Date.now(),
      type: 'referralBonus'
    };

    // Update referrer's coins and transactions
    const referrerCurrentEarning = referrerData.currentEarning || 0;
    const referrerReferredCoins = referrerData.referredCoins || 0;
    const referrerTransactions = referrerData.transactions || [];

    await referrerRef.update({
      currentEarning: referrerCurrentEarning + referralBonus,
      referredCoins: referrerReferredCoins + referralBonus,
      transactions: [...referrerTransactions, referralTransaction],
      popupControl: {
        showPopup: true,
        transaction: referralTransaction  // Store the referral transaction that triggered the popup
      }
    });

    // Update current user's coins and transactions
    const currentUserData = currentUserSnapshot.exists() ? currentUserSnapshot.val() : {};
    const currentUserCurrentEarning = currentUserData.currentEarning || 0;
    const currentUserReferredCoins = currentUserData.referredCoins || 0;
    const currentUserTransactions = currentUserData.transactions || [];

    await currentUserRef.update({
      currentEarning: currentUserCurrentEarning + referralBonus,
      referredCoins: currentUserReferredCoins + referralBonus,
      transactions: [...currentUserTransactions, referralTransaction],
      popupControl: {
        showPopup: true,
        transaction: referralTransaction  // Store the referral transaction that triggered the popup
      }
    });

    console.log(`💰 Added ${referralBonus} coins to both referrer (${referrerUid}) and referee (${currentUserId})`);

    res.json({
      success: true,
      data: {
        currentUserId: currentUserId,
        referrerUid: referrerUid,
        newTotalReferrals: currentTotalReferrals + 1,
        coinsAdded: referralBonus,
        utmTracked: Object.keys(utmData).length > 0,
        message: 'Current user successfully set as referral of the referrer and 100 coins added to both users'
      }
    });

  } catch (error) {
    console.error('Error updating referral relationship:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update referral relationship'
      }
    });
  }
});

// GET /api/referrals/:uid - Get user's referrals list
router.get('/:uid', verifyFirebaseToken, async (req, res) => {
  try {
    const requestedUid = req.params.uid;
    const authenticatedUid = req.user.uid;

    // Check authorization - users can only access their own referrals
    if (requestedUid !== authenticatedUid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Cannot access other user referrals'
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
    const referralUids = userData.referrals || [];

    if (referralUids.length === 0) {
      return res.json({
        success: true,
        data: {
          referrals: [],
          totalReferrals: 0
        }
      });
    }

    // Fetch referred users' data
    const referrals = [];
    const usersRef = db.ref('users');

    for (const referredUid of referralUids) {
      try {
        const referredUserSnapshot = await usersRef.child(referredUid).once('value');

        if (referredUserSnapshot.exists()) {
          const referredUserData = referredUserSnapshot.val();
          referrals.push({
            uid: referredUid,
            name: referredUserData.name || 'Unknown',
            email: referredUserData.email || '',
            profilePic: referredUserData.profilePic || '',
            createdAt: referredUserData.createdAt || 0
          });
        }
      } catch (error) {
        console.error(`Error fetching referred user ${referredUid}:`, error);
        // Continue processing other referrals even if one fails
      }
    }

    res.json({
      success: true,
      data: {
        referrals: referrals,
        totalReferrals: referrals.length
      }
    });

  } catch (error) {
    console.error('Error retrieving referrals list:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve referrals list'
      }
    });
  }
});

// GET /api/referral/test/:referralId - Test referral ID lookup (for debugging)
router.get('/test/:referralId', async (req, res) => {
  try {
    const referralId = req.params.referralId; // This is now a Firebase UID
    const db = admin.database();

    console.log(`🔍 Testing referral UID: ${referralId}`);

    // Since referralId is now the Firebase UID, directly check if user exists
    const userRef = db.ref(`users/${referralId}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.json({
        success: false,
        message: `User with UID '${referralId}' not found in database`,
        note: 'Referral ID is now the Firebase UID of the referring user',
        redirectUrls: {
          appStore: process.env.APP_STORE_URL,
          defaultLanding: process.env.DEFAULT_LANDING_PAGE
        }
      });
    }

    const userData = snapshot.val();

    res.json({
      success: true,
      message: `Referral user found for UID '${referralId}'`,
      data: {
        referralId: referralId,
        userUid: userData.uid,
        userName: userData.name || 'Unknown',
        userEmail: userData.email || 'Unknown',
        referralLink: userData.referralLink || `${process.env.DOMAIN}/r/${referralId}`
      },
      redirectUrls: {
        appStore: process.env.APP_STORE_URL,
        defaultLanding: process.env.DEFAULT_LANDING_PAGE
      }
    });

  } catch (error) {
    console.error('Error testing referral UID:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;