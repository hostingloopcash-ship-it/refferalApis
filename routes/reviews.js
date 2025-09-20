const express = require('express');
const router = express.Router();

// Array of sample reviews
const reviews = [
  { id: 1, text: "Amazing app! I've been earning coins daily and the referral system works perfectly. Highly recommended!", rating: 5 },
  { id: 2, text: "Great way to earn some extra rewards. The interface is clean and easy to use. Love it!", rating: 5 },
  { id: 3, text: "I've referred 10+ friends and earned tons of coins. The payout system is reliable and fast.", rating: 5 },
  { id: 4, text: "Simple and effective. No complicated processes, just straightforward earning. Perfect!", rating: 4 },
  { id: 5, text: "Been using this for months now. Consistent rewards and the referral bonuses are generous!", rating: 5 },
  { id: 6, text: "User-friendly app with great earning potential. The daily rewards keep me coming back.", rating: 4 },
  { id: 7, text: "Excellent referral program! I've earned more than I expected. Definitely worth trying.", rating: 5 },
  { id: 8, text: "Clean design, smooth functionality, and real rewards. What more could you ask for?", rating: 5 },
  { id: 9, text: "I was skeptical at first, but this app actually delivers on its promises. Great experience!", rating: 4 },
  { id: 10, text: "The best rewards app I've used. Easy to navigate and the coins add up quickly!", rating: 5 },
  { id: 11, text: "Love how simple it is to earn and refer friends. The whole process is seamless.", rating: 5 },
  { id: 12, text: "Reliable app with consistent payouts. I've been using it for 6 months without any issues.", rating: 4 },
  { id: 13, text: "Great concept and execution. The referral system is the best feature - very rewarding!", rating: 5 },
  { id: 14, text: "Easy to use, great rewards, and excellent customer support. Highly satisfied!", rating: 5 },
  { id: 15, text: "I've tried many similar apps, but this one stands out. Real rewards, no gimmicks.", rating: 4 },
  { id: 16, text: "The daily earning feature is fantastic. Small amounts that add up to something meaningful!", rating: 4 },
  { id: 17, text: "Straightforward app that does exactly what it promises. No hidden fees or complicated rules.", rating: 5 },
  { id: 18, text: "Been earning consistently for months. The referral bonuses are a nice touch!", rating: 5 },
  { id: 19, text: "Simple, effective, and rewarding. This app has become part of my daily routine.", rating: 4 },
  { id: 20, text: "Excellent app! The earning system is transparent and the rewards are real. Love it!", rating: 5 },
  { id: 21, text: "Amazing app! Daily rewards are consistent and referral bonuses work great.", rating: 5 },
  { id: 22, text: "Clean interface and smooth experience. I earn coins daily without any hassle.", rating: 5 },
  { id: 23, text: "Referral system is excellent. Invited friends and got rewarded instantly!", rating: 5 },
  { id: 24, text: "Simple and effective. The app delivers on its promise with no complications.", rating: 4 },
  { id: 25, text: "Consistent payouts and easy-to-understand reward system. Very satisfied!", rating: 5 },
  { id: 26, text: "User-friendly and smooth. The daily tasks keep me engaged and earning.", rating: 4 },
  { id: 27, text: "Great referral program! Earned coins easily by inviting friends.", rating: 5 },
  { id: 28, text: "Design is clean, app runs smoothly, and rewards are real. Perfect combination.", rating: 5 },
  { id: 29, text: "At first skeptical, but this app really works. Coins add up quickly.", rating: 4 },
  { id: 30, text: "Excellent app for earning extra rewards. Simple, reliable, and effective.", rating: 5 },
  { id: 31, text: "Seamless experience. Earning and referrals are straightforward and smooth.", rating: 5 },
  { id: 32, text: "Consistent rewards every day. Been using this for months without issues.", rating: 4 },
  { id: 33, text: "Referral system is very rewarding. Great way to invite friends and earn coins.", rating: 5 },
  { id: 34, text: "Easy-to-use app with excellent customer support. Highly recommended!", rating: 5 },
  { id: 35, text: "Stands out from other reward apps. Reliable payouts and real rewards.", rating: 4 },
  { id: 36, text: "Daily earning feature is fantastic. Small tasks add up to meaningful rewards.", rating: 4 },
  { id: 37, text: "Does exactly what it promises. Simple, no hidden fees, and very reliable.", rating: 5 },
  { id: 38, text: "Consistent earnings and referral bonuses are a nice touch. Love this app!", rating: 5 },
  { id: 39, text: "Simple, effective, and rewarding. Part of my daily routine now.", rating: 4 },
  { id: 40, text: "Transparent rewards system. The app is honest and easy to use.", rating: 5 },
  { id: 41, text: "Amazing daily rewards and a smooth referral system. Highly recommended!", rating: 5 },
  { id: 42, text: "Interface is clean, user-friendly, and I earn coins daily without problems.", rating: 5 },
  { id: 43, text: "Inviting friends is easy and rewarding. The referral system works perfectly.", rating: 5 },
  { id: 44, text: "Straightforward earning app. No unnecessary complications.", rating: 4 },
  { id: 45, text: "Reliable payouts and consistent rewards. Love the simplicity!", rating: 5 },
  { id: 46, text: "Daily tasks are simple, fun, and rewarding. Keeps me engaged.", rating: 4 },
  { id: 47, text: "Referral program is excellent. Earned coins effortlessly.", rating: 5 },
  { id: 48, text: "Smooth functionality, clean design, and real rewards. Very satisfied.", rating: 5 },
  { id: 49, text: "Initially skeptical, but this app delivers on its promises.", rating: 4 },
  { id: 50, text: "Best rewards app I've tried. Easy to navigate and rewarding.", rating: 5 },
  { id: 51, text: "Earning and referrals are seamless. Love the user experience.", rating: 5 },
  { id: 52, text: "Consistent daily rewards. Reliable and easy to use.", rating: 4 },
  { id: 53, text: "Referral system is great. Invite friends and earn easily.", rating: 5 },
  { id: 54, text: "User-friendly app with excellent support. Very happy!", rating: 5 },
  { id: 55, text: "Stands out among similar apps. Real rewards, no gimmicks.", rating: 4 },
  { id: 56, text: "Daily earning feature is small but meaningful. Keeps me motivated.", rating: 4 },
  { id: 57, text: "Simple, honest app with no hidden fees. Works perfectly.", rating: 5 },
  { id: 58, text: "Referral bonuses are consistent and fair. Really love this app.", rating: 5 },
  { id: 59, text: "Easy, effective, and part of my daily routine now.", rating: 4 },
  { id: 60, text: "Transparent and trustworthy rewards app. Highly recommended.", rating: 5 },
  { id: 61, text: "Amazing app for daily earning and referrals. Works smoothly.", rating: 5 },
  { id: 62, text: "Clean interface and reliable rewards. Very easy to use.", rating: 5 },
  { id: 63, text: "Referral system is simple and rewarding. Invite friends easily.", rating: 5 },
  { id: 64, text: "Straightforward app, no unnecessary steps. Works as promised.", rating: 4 },
  { id: 65, text: "Consistent payouts and simple reward system. Very satisfied.", rating: 5 },
  { id: 66, text: "Daily tasks are smooth and rewarding. Keeps me engaged.", rating: 4 },
  { id: 67, text: "Excellent referral program. Earned coins without any hassle.", rating: 5 },
  { id: 68, text: "Smooth design, easy to use, and rewards are real.", rating: 5 },
  { id: 69, text: "Initially doubtful, but app works as described. Happy user.", rating: 4 },
  { id: 70, text: "Top rewards app. Easy navigation and fast payouts.", rating: 5 },
  { id: 71, text: "Seamless experience with earning and referral features.", rating: 5 },
  { id: 72, text: "Daily rewards are reliable. Been using for months.", rating: 4 },
  { id: 73, text: "Referral system is very good. Coins credited immediately.", rating: 5 },
  { id: 74, text: "User-friendly and well-supported. Very happy with app.", rating: 5 },
  { id: 75, text: "Reliable, rewarding, and stands out among similar apps.", rating: 4 },
  { id: 76, text: "Daily earning is small but meaningful. Love the app.", rating: 4 },
  { id: 77, text: "Honest app, works as promised. No hidden fees.", rating: 5 },
  { id: 78, text: "Referral bonuses are generous and consistent. Highly recommended.", rating: 5 },
  { id: 79, text: "Simple, effective, and part of my daily routine.", rating: 4 },
  { id: 80, text: "Transparent reward system. Coins credited on time.", rating: 5 },
  { id: 81, text: "Amazing daily rewards and referral features. Works perfectly.", rating: 5 },
  { id: 82, text: "Clean design, easy navigation, and reliable rewards.", rating: 5 },
  { id: 83, text: "Referral system is simple and works perfectly. Invite friends easily.", rating: 5 },
  { id: 84, text: "Straightforward app with smooth earning process.", rating: 4 },
  { id: 85, text: "Reliable payouts and simple tasks. Very satisfied.", rating: 5 },
  { id: 86, text: "Daily tasks are smooth and keep me engaged. Love the app.", rating: 4 },
  { id: 87, text: "Excellent referral program. Coins credited instantly.", rating: 5 },
  { id: 88, text: "Smooth interface, easy to use, and real rewards.", rating: 5 },
  { id: 89, text: "Was skeptical initially, but app delivers as promised.", rating: 4 },
  { id: 90, text: "Top rewards app. Easy, smooth, and reliable.", rating: 5 },
  { id: 91, text: "Seamless experience. Earning and referrals work flawlessly.", rating: 5 },
  { id: 92, text: "Daily rewards are reliable and consistent. Very happy.", rating: 4 },
  { id: 93, text: "Referral system is excellent. Coins credited immediately.", rating: 5 },
  { id: 94, text: "User-friendly app with consistent payouts. Highly recommended.", rating: 5 },
  { id: 95, text: "Reliable, rewarding, and simple to use. Love this app.", rating: 4 },
  { id: 96, text: "Daily earning small but meaningful. Great app.", rating: 4 },
  { id: 97, text: "Honest and simple app. No hidden fees. Works perfectly.", rating: 5 },
  { id: 98, text: "Referral bonuses are generous and consistent. Works great.", rating: 5 },
  { id: 99, text: "Simple, effective, and part of my daily routine.", rating: 4 },
  { id: 100, text: "Transparent rewards system. Coins credited reliably. Highly recommended!", rating: 5 }
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