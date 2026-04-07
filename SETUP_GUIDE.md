# Quick Setup Guide - Run A Ride Payment Integration

## Step-by-Step Installation

### 1. Install Node.js Dependencies

Open terminal in project folder and run:

```bash
npm install
```

This will install all required packages:
- express
- mongoose
- dotenv
- cors
- razorpay
- bcryptjs
- jsonwebtoken
- And more security/utility packages

### 2. Set Up Razorpay (Required for Payments)

#### Get Your Razorpay Account

1. **Sign Up**: Go to https://razorpay.com and create an account
2. **Complete KYC**: Fill in your business details
3. **Activate Payment Gateway**: Follow Razorpay's activation process

#### Get API Keys

1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys** (or **Development** → **API Keys**)
3. Click **Generate Test Key**
4. You'll get:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

#### Add Keys to .env File

Open `.env` file and update:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
```

Replace with your actual keys from Razorpay.

### 3. Set Up MongoDB

#### Option A: Local MongoDB (Recommended for Development)

1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   # Windows (run as admin in PowerShell)
   net start MongoDB
   
   # Or if installed without service:
   mongod
   ```

3. Update `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/runaride
   ```

#### Option B: MongoDB Atlas (Cloud Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/runaride
   ```

### 4. Configure JWT Secret

Generate a random secret for JWT tokens:

```bash
# On Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# On Windows PowerShell
powershell -Command "[System.Web.Security.Membership]::GeneratePassword(32,0)"
```

Update `.env` file:
```env
JWT_SECRET=your_generated_secret_here
```

### 5. Set Up Webhooks (Optional but Recommended)

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **+ Add New Webhook**
3. Enter URL: `http://localhost:5000/api/payment/webhook`
4. Select events:
   - ✅ payment.captured
   - ✅ payment.failed
5. Generate webhook secret
6. Add to `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```

### 6. Start the Application

#### Start Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Run A Ride server running on port 5000
📍 Environment: development
MongoDB Connected: localhost
```

#### Start Frontend (Optional)

The backend serves static files, but if you want separate frontend:

```bash
python -m http.server 8000
```

Or use any static file server.

### 7. Test the Application

1. Open browser to http://localhost:8000 (or http://localhost:5000)
2. Create an account (Sign Up)
3. Login with your credentials
4. Click "Book Now" or "Book a Ride"
5. Enter pickup and drop locations
6. Select ride type
7. Calculate fare
8. Proceed to payment
9. Use Razorpay test card:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date

### 8. Verify Everything Works

✅ User registration works
✅ Login provides JWT token
✅ Ride booking creates records in database
✅ Fare calculation is correct
✅ Razorpay payment opens
✅ Payment success redirects to success page
✅ Payment failure redirects to failed page
✅ Receipt shows correct transaction details

## Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"

**Solution:**
- Check if MongoDB is running: `net start MongoDB` (Windows) or `mongod`
- Verify MONGODB_URI in .env is correct
- For Atlas, whitelist your IP address

### Issue: "Razorpay is not defined"

**Solution:**
- Check if Razorpay SDK is loaded in payment.html
- Verify internet connection
- Clear browser cache

### Issue: "Payment verification failed"

**Solution:**
- Check RAZORPAY_KEY_SECRET is correct
- Ensure signature generation matches Razorpay's format
- Verify order_id and payment_id are correct

### Issue: "Port 5000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Change PORT in .env to different number like 5001
```

### Issue: "CORS Error"

**Solution:**
- Check FRONTEND_URL in .env matches your frontend port
- Restart backend server after .env changes
- Clear browser cache

## Testing Checklist

Before going live, test these scenarios:

- [ ] User can register successfully
- [ ] User can login successfully
- [ ] Ride booking works
- [ ] Fare calculation is accurate
- [ ] Razorpay payment opens correctly
- [ ] Successful payment updates ride status to "Paid"
- [ ] Failed payment shows error message
- [ ] Payment receipt displays correct details
- [ ] Download receipt function works
- [ ] All pages are responsive on mobile

## Next Steps After Testing

1. **Get Live Razorpay Keys**
   - Complete Razorpay KYC
   - Switch from test to live mode
   - Update .env with live keys

2. **Deploy Backend**
   - Use services like Heroku, Railway, or DigitalOcean
   - Set environment variables on hosting platform
   - Update frontend API URLs

3. **Deploy Frontend**
   - Use Netlify, Vercel, or GitHub Pages
   - Update API_BASE_URL in booking.js and payment.js

4. **Enable HTTPS**
   - Required for production
   - Use Let's Encrypt or hosting provider SSL

5. **Monitor Transactions**
   - Check Razorpay dashboard regularly
   - Set up email notifications
   - Monitor database for payment records

## Support Resources

- Razorpay Docs: https://razorpay.com/docs/
- MongoDB Docs: https://docs.mongodb.com/
- Express Docs: https://expressjs.com/
- Node.js Docs: https://nodejs.org/docs/

---

**Happy Coding! 🚀**
