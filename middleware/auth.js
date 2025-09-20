const { admin } = require('../config/firebase');

// Middleware to verify Firebase Auth token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization token is required'
        }
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Try to verify as ID token first
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || `${decodedToken.uid}@test.com`
      };
      return next();
    } catch (idTokenError) {
      // If ID token verification fails, try custom token verification
      try {
        // For development/testing: allow custom tokens by decoding them
        // This is a simplified approach for testing purposes
        const decodedCustomToken = await admin.auth().verifyIdToken(token, true);
        req.user = {
          uid: decodedCustomToken.uid,
          email: decodedCustomToken.email || `${decodedCustomToken.uid}@test.com`
        };
        return next();
      } catch (customTokenError) {
        // If both fail, check if it's a development environment and allow test tokens
        if (process.env.NODE_ENV === 'development' && token.startsWith('test-')) {
          // Extract UID from test token format: test-{uid}
          const uid = token.replace('test-', '');
          req.user = {
            uid: uid,
            email: `${uid}@test.com`
          };
          return next();
        }
        
        throw idTokenError; // Throw the original ID token error
      }
    }
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
};

// Middleware to check if user can access specific UID data
const authorizeUser = (req, res, next) => {
  const requestedUid = req.params.uid;
  const authenticatedUid = req.user.uid;
  
  if (requestedUid && requestedUid !== authenticatedUid) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'Cannot access other user data'
      }
    });
  }
  
  next();
};

module.exports = {
  verifyFirebaseToken,
  authorizeUser
};