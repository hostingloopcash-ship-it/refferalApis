# Referral & Coins Management API

Backend APIs for managing user referrals and coins/rewards in mobile applications.

## Features

- 🔗 Referral link generation and management
- 💰 Coins/rewards system with transaction tracking
- 🔐 Firebase Authentication integration
- 📱 Mobile app integration ready
- ☁️ AWS Lightsail deployment ready

## API Endpoints

### Referral Management
- `POST /api/referral/generate` - Generate referral link
- `GET /r/:referralId` - Referral redirect handler
- `POST /api/referral/update` - Update referral relationships
- `GET /api/referrals/:uid` - Get user's referrals list

### Coins Management
- `POST /api/coins/update` - Update user coins
- `GET /api/coins/:uid` - Get user balance

### Transactions
- `GET /api/transactions/:uid` - Get transaction history

### Reviews
- `GET /api/reviews/random` - Get random review (no auth required)
- `GET /api/reviews` - Get all reviews (no auth required)

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Firebase credentials:**
   - Create a Firebase project and get your service account credentials
   - Update the `.env` file with your actual Firebase credentials
   - The current `.env` contains sample credentials that won't work

3. **Start development server:**
```bash
npm run dev
```

4. **Test the API:**
   - Visit http://localhost:3000/health to verify server is running
   - Use [POSTMAN_DOCUMENTATION.md](./POSTMAN_DOCUMENTATION.md) to test all endpoints

## Deployment

For production deployment to AWS Lightsail, follow the detailed [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## Environment Variables

```bash
NODE_ENV=development
PORT=3000
DOMAIN=http://localhost:3000

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# App Configuration
APP_STORE_URL=https://play.google.com/store/apps/details?id=com.yourapp
DEFAULT_LANDING_PAGE=https://yourdomain.com
```

## Deployment

### AWS Lightsail

1. Create Node.js instance on AWS Lightsail
2. Upload project files
3. Install dependencies: `npm install`
4. Configure production environment: `cp .env.production .env`
5. Start server: `npm start`

### SSL Setup

Configure Let's Encrypt SSL certificate for HTTPS enforcement.

## Authentication

All API endpoints require Firebase Authentication token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## License

MIT