const express = require('express');
const router = express.Router();

// Array of sample reviews
const reviews = [
  {
    id: 1,
    text: "Amazing app! I've been earning coins daily and the referral system works perfectly. Highly recommended!",
    rating: 5
  },
  {
    id: 2,
    text: "Great way to earn some extra rewards. The interface is clean and easy to use. Love it!",
    rating: 5
  },
  {
    id: 3,
    text: "I've referred 10+ friends and earned tons of coins. The payout system is reliable and fast.",
    rating: 5
  },
  {
    id: 4,
    text: "Simple and effective. No complicated processes, just straightforward earning. Perfect!",
    rating: 4
  },
  {
    id: 5,
    text: "Been using this for months now. Consistent rewards and the referral bonuses are generous!",
    rating: 5
  },
  {
    id: 6,
    text: "User-friendly app with great earning potential. The daily rewards keep me coming back.",
    rating: 4
  },
  {
    id: 7,
    text: "Excellent referral program! I've earned more than I expected. Definitely worth trying.",
    rating: 5
  },
  {
    id: 8,
    text: "Clean design, smooth functionality, and real rewards. What more could you ask for?",
    rating: 5
  },
  {
    id: 9,
    text: "I was skeptical at first, but this app actually delivers on its promises. Great experience!",
    rating: 4
  },
  {
    id: 10,
    text: "The best rewards app I've used. Easy to navigate and the coins add up quickly!",
    rating: 5
  },
  {
    id: 11,
    text: "Love how simple it is to earn and refer friends. The whole process is seamless.",
    rating: 5
  },
  {
    id: 12,
    text: "Reliable app with consistent payouts. I've been using it for 6 months without any issues.",
    rating: 4
  },
  {
    id: 13,
    text: "Great concept and execution. The referral system is the best feature - very rewarding!",
    rating: 5
  },
  {
    id: 14,
    text: "Easy to use, great rewards, and excellent customer support. Highly satisfied!",
    rating: 5
  },
  {
    id: 15,
    text: "I've tried many similar apps, but this one stands out. Real rewards, no gimmicks.",
    rating: 4
  },
  {
    id: 16,
    text: "The daily earning feature is fantastic. Small amounts that add up to something meaningful!",
    rating: 4
  },
  {
    id: 17,
    text: "Straightforward app that does exactly what it promises. No hidden fees or complicated rules.",
    rating: 5
  },
  {
    id: 18,
    text: "Been earning consistently for months. The referral bonuses are a nice touch!",
    rating: 5
  },
  {
    id: 19,
    text: "Simple, effective, and rewarding. This app has become part of my daily routine.",
    rating: 4
  },
  {
    id: 20,
    text: "Excellent app! The earning system is transparent and the rewards are real. Love it!",
    rating: 5
  }
];

// GET /api/reviews/random - Get a random review
router.get('/random', (req, res) => {
  try {
    // Get a random review from the array
    const randomIndex = Math.floor(Math.random() * reviews.length);
    const randomReview = reviews[randomIndex];
    
    res.json({
      success: true,
      data: randomReview
    });
    
  } catch (error) {
    console.error('Error getting random review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get random review'
      }
    });
  }
});

// GET /api/reviews - Get all reviews (optional endpoint)
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        reviews: reviews,
        total: reviews.length
      }
    });
    
  } catch (error) {
    console.error('Error getting reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get reviews'
      }
    });
  }
});

module.exports = router;