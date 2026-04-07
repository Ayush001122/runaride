// Payment Logic for Run A Ride with Razorpay Integration

const API_BASE_URL = 'http://localhost:5000/api';

// Display payment amount on page load
document.addEventListener('DOMContentLoaded', function() {
  const rideDetails = JSON.parse(localStorage.getItem('paymentRide'));
  
  if (!rideDetails) {
    alert('No ride details found. Please book a ride first.');
    window.location.href = 'book-ride.html';
    return;
  }
  
  // Display payment amount
  document.getElementById('paymentAmount').textContent = '₹' + rideDetails.totalAmount;
  
  // Handle pay button click
  document.getElementById('payButton').addEventListener('click', initiatePayment);
});

// Initiate Razorpay payment
async function initiatePayment() {
  const rideDetails = JSON.parse(localStorage.getItem('paymentRide'));
  const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  
  try {
    // Step 1: Create order on backend
    const orderData = await createPaymentOrder(rideDetails.totalAmount, rideDetails._id);
    
    if (!orderData || !orderData.orderId) {
      throw new Error('Failed to create payment order');
    }
    
    // Step 2: Configure Razorpay options
    const options = {
      key: orderData.keyId, // Razorpay Key ID from environment
      amount: orderData.amount, // Amount in paise
      currency: orderData.currency,
      name: 'Run A Ride',
      description: 'Ride Payment',
      order_id: orderData.orderId,
      handler: async function(response) {
        // This function is called when payment is successful
        await handlePaymentSuccess(response, orderData.paymentId, rideDetails, selectedMethod);
      },
      prefill: {
        name: getUserDetails()?.fullName || '',
        email: getUserDetails()?.email || '',
        contact: getUserDetails()?.phone || ''
      },
      theme: {
        color: '#FFB703' // Run A Ride brand color
      },
      modal: {
        ondismiss: function() {
          // User closed the payment modal
          console.log('Payment cancelled by user');
        }
      }
    };
    
    // Step 3: Open Razorpay checkout
    const rzp = new Razorpay(options);
    
    // Handle payment errors
    rzp.on('payment.failed', function(response) {
      handlePaymentFailure(response.error, rideDetails);
    });
    
    rzp.open();
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    alert('Failed to initiate payment. Please try again.');
  }
}

// Create payment order on backend
async function createPaymentOrder(amount, rideId) {
  try {
    // Get user token from localStorage
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      // If no token, redirect to login
      alert('Please login to continue');
      window.location.href = 'signin.html';
      return null;
    }
    
    const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: amount,
        rideId: rideId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}

// Handle successful payment
async function handlePaymentSuccess(response, paymentId, rideDetails, paymentMethod) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
    
    // Verify payment on backend
    const token = localStorage.getItem('userToken');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        paymentId
      })
    });
    
    if (!verifyResponse.ok) {
      throw new Error('Payment verification failed');
    }
    
    const verifyData = await verifyResponse.json();
    
    // Store payment success data
    const paymentData = {
      transactionId: razorpay_payment_id,
      amount: rideDetails.totalAmount,
      createdAt: new Date(),
      paymentMethod: paymentMethod,
      ride: rideDetails,
      orderId: razorpay_order_id
    };
    
    localStorage.setItem('lastPayment', JSON.stringify(paymentData));
    localStorage.removeItem('paymentRide');
    
    // Redirect to success page
    window.location.href = 'payment-success.html';
    
  } catch (error) {
    console.error('Payment verification error:', error);
    alert('Payment verification failed. Please contact support.');
  }
}

// Handle payment failure
function handlePaymentFailure(error, rideDetails) {
  console.error('Payment failed:', error);
  
  const failedPaymentData = {
    transactionId: error.metadata?.order_id || 'N/A',
    amount: rideDetails.totalAmount,
    error: error.description || 'Payment failed',
    code: error.code || 'unknown'
  };
  
  localStorage.setItem('lastFailedPayment', JSON.stringify(failedPaymentData));
  
  // Redirect to failed payment page
  window.location.href = 'payment-failed.html?' + 
    new URLSearchParams({
      error: failedPaymentData.error,
      order_id: failedPaymentData.transactionId,
      amount: failedPaymentData.amount
    });
}

// Get user details from localStorage
function getUserDetails() {
  const user = localStorage.getItem('userDetails');
  return user ? JSON.parse(user) : null;
}

// Helper function to format currency
function formatCurrency(amount) {
  return '₹' + parseFloat(amount).toFixed(2);
}
