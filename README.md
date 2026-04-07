# Run A Ride - Auto Rickshaw Booking Platform 

A complete ride-booking platform similar to Uber, focused on auto-rickshaws and affordable rides in rural and semi-urban areas. Features secure online payments via Razorpay.

## Features

✅ **User Authentication**
- User registration and login with JWT tokens
- Secure password hashing with bcryptjs

✅ **Ride Booking System**
- Book autos, cars, and cabs
- Fare calculation based on distance and ride type
- Real-time fare estimation
- Multiple ride types (Auto, Car, Cab)

✅ **Payment Gateway Integration**
- Razorpay payment gateway integration
- Multiple payment methods: UPI, Credit/Debit Cards, Net Banking
- Secure payment processing with signature verification
- Payment success/failure handling
- Transaction receipts

✅ **Fare Management**
- Transparent fare breakdown
- Base fare + distance-based pricing
- Tax calculation (5% GST)
- Fare summary before payment

✅ **Responsive Design**
- Modern, clean UI inspired by Uber
- Mobile-first responsive design
- Dark theme with orange accents

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome for icons
- Razorpay Checkout SDK

### Backend
- Node.js with Express.js
- MongoDB for database
- Mongoose ODM
- JWT for authentication
- Bcryptjs for password hashing

### Payment Gateway
- Razorpay (Test Mode enabled)

## Project Structure

```
runaride/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── paymentController.js  # Payment logic
│   │   ├── rideController.js     # Ride management
│   │   └── userController.js     # User auth
│   ├── middleware/
│   │   └── auth.js               # JWT authentication
│   ├── models/
│   │   ├── Payment.js            # Payment schema
│   │   ├── Ride.js               # Ride schema
│   │   └── User.js               # User schema
│   ├── routes/
│   │   ├── payment.js            # Payment routes
│   │   ├── rides.js              # Ride routes
│   │   └── users.js              # User routes
│   └── server.js                 # Express server
├── book-ride.html                # Ride booking page
├── fare-summary.html             # Fare breakdown page
├── payment.html                  # Payment page
├── payment-success.html          # Success confirmation
├── payment-failed.html           # Failed payment page
├── signin.html                   # Sign in page
├── signup.html                   # Sign up page
├── index.html                    # Main landing page
├── style.css                     # Main styles
├── auth.css                      # Auth page styles
├── payment.css                   # Payment page styles
├── script.js                     # Common JS functions
├── booking.js                    # Booking logic
├── payment.js                    # Payment logic
├── package.json                  # Dependencies
├── .env                          # Environment variables
└── README.md                     # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Razorpay account (https://razorpay.com)

### Installation Steps

1. **Install Dependencies**
```bash
npm install
```

2. **Configure Environment Variables**

Edit `.env` file with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/runaride

# JWT Secret (Change this!)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:8000
```

3. **Get Razorpay API Keys**

   a. Sign up at https://razorpay.com
   
   b. Go to Dashboard → Settings → API Keys
   
   c. Generate Test Keys
   
   d. Copy Key ID and Key Secret to `.env` file
   
   e. For webhooks: Settings → Webhooks → Add endpoint
      - URL: `http://localhost:5000/api/payment/webhook`
      - Events: payment.captured, payment.failed

4. **Start MongoDB**

If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas connection string in `.env`

5. **Start Backend Server**
```bash
npm run dev
```

Server will start on http://localhost:5000

6. **Start Frontend** (Optional - Backend serves static files)

If you want to run frontend separately:
```bash
# Using Python
python -m http.server 8000

# Or use any static file server
```

## Usage Flow

### 1. User Registration/Login
- Navigate to Sign Up page
- Enter details and create account
- Login with credentials

### 2. Book a Ride
- Click "Book a Ride" from navbar
- Enter pickup and drop locations
- Select ride type (Auto/Car/Cab)
- Click "Calculate Fare"
- Review fare breakdown
- Click "Proceed to Book"

### 3. Review Fare Summary
- Check journey details
- Verify fare breakdown
- Click "Proceed to Payment"

### 4. Make Payment
- Choose payment method (UPI/Card/Net Banking)
- Click "Pay Now"
- Complete Razorpay payment
- View success/failure page

### 5. Payment Success
- View transaction details
- Download receipt
- Ride status updated to "Paid"

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (Protected)

### Rides
- `POST /api/rides` - Create new ride (Protected)
- `GET /api/rides/:id` - Get ride by ID (Protected)
- `PUT /api/rides/:id/status` - Update ride status (Protected)
- `GET /api/rides/user/:userId` - Get user's rides (Protected)
- `GET /api/rides/active` - Get active ride (Protected)

### Payments
- `POST /api/payment/create-order` - Create Razorpay order (Protected)
- `POST /api/payment/verify` - Verify payment signature (Protected)
- `POST /api/payment/webhook` - Handle Razorpay webhooks (Public)
- `GET /api/payment/history` - Get payment history (Protected)
- `GET /api/payment/:id` - Get payment by ID (Protected)

## Testing

### Test Credentials

Use Razorpay test cards for testing payments:
- **Success**: Card number ending with 1111
- **Failure**: Card number ending with 4111

See Razorpay test card list: https://razorpay.com/docs/payments/payments/test-card-upi-details/

### Test Flow

1. Start backend server
2. Open browser to http://localhost:8000
3. Create a test account
4. Book a ride
5. Use test card details for payment
6. Verify success page appears

## Security Features

- ✅ JWT token authentication
- ✅ Password hashing with bcryptjs
- ✅ Server-side payment verification
- ✅ HMAC SHA256 signature validation
- ✅ CORS protection
- ✅ Rate limiting on API endpoints
- ✅ Helmet.js security headers
- ✅ Input validation
- ✅ Environment variable protection

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- For Atlas, whitelist your IP address

### Razorpay Payment Error
- Verify API keys are correct
- Check if Razorpay account is activated
- Use test mode keys for development

### Port Already in Use
- Change PORT in .env file
- Kill process using port 5000

## Future Enhancements

- [ ] Google Maps API integration for real distance calculation
- [ ] Driver app and matching system
- [ ] Live ride tracking
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Wallet system
- [ ] Promo codes and discounts
- [ ] Ride history and analytics
- [ ] Admin dashboard
- [ ] Multi-language support

## Support

For issues and queries:
- Email: support@runaride.com
- Phone: +91 90000 00001

## License

MIT License - Run A Ride Platform

---

**Note**: This is a demonstration project. For production use, implement additional security measures, error handling, and compliance with local transportation regulations.
