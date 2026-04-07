// ========================================
// DRIVER REGISTRATION & DASHBOARD LOGIC
// Run A Ride - Driver Management System
// WITH SOCKET.IO REAL-TIME INTEGRATION
// ========================================

let currentDriverId = null;
let currentUser = null;
let socket = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // Check which page we're on
  const isRegistrationPage = document.getElementById('driverRegistrationForm');
  const isDashboardPage = document.getElementById('availabilityToggle');

  if (isRegistrationPage) {
    initRegistrationPage();
  } else if (isDashboardPage) {
    initDashboardPage();
  }
});

// ========================================
// REGISTRATION PAGE FUNCTIONS
// ========================================

function initRegistrationPage() {
  const form = document.getElementById('driverRegistrationForm');
  
  // Get logged-in user ID
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first to register as a driver');
    window.location.href = 'signin.html';
    return;
  }

  // Decode JWT to get user ID
  try {
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('userId').value = userInfo.userId || userInfo.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    alert('Please login again');
    window.location.href = 'signin.html';
  }

  // Handle ride option selection
  document.querySelectorAll('.ride-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.ride-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      option.querySelector('input[type="radio"]').checked = true;
    });
  });

  // Form submission
  form.addEventListener('submit', handleDriverRegistration);
}

async function handleDriverRegistration(e) {
  e.preventDefault();

  const formData = {
    userId: document.getElementById('userId').value,
    vehicleType: document.querySelector('input[name="vehicleType"]:checked').value,
    vehicleNumber: document.getElementById('vehicleNumber').value.toUpperCase(),
    vehicleModel: document.getElementById('vehicleModel').value,
    vehicleColor: document.getElementById('vehicleColor').value,
    licenseNumber: document.getElementById('licenseNumber').value.toUpperCase(),
    licenseExpiry: document.getElementById('licenseExpiry').value,
    serviceAreas: document.getElementById('serviceAreas').value
      .split(',')
      .map(area => area.trim())
      .filter(area => area.length > 0)
  };

  // Validate license expiry
  const expiryDate = new Date(formData.licenseExpiry);
  const today = new Date();
  if (expiryDate < today) {
    alert('License expiry date must be in the future');
    return;
  }

  try {
    const response = await fetch('/api/drivers/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      alert('🎉 Driver registration successful! Please wait for admin verification.');
      window.location.href = 'driver-dashboard.html';
    } else {
      alert(`❌ Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('❌ Registration failed. Please try again.');
  }
}

// ========================================
// DASHBOARD PAGE FUNCTIONS
// ========================================

function initDashboardPage() {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    window.location.href = 'signin.html';
    return;
  }

  try {
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    currentUser = userInfo;
    
    // Initialize Socket.io
    socket = initSocket(currentUser.userId || currentUser.id, 'driver');
    
    loadDriverData();
  } catch (error) {
    console.error('Error decoding token:', error);
    alert('Please login again');
    window.location.href = 'signin.html';
  }

  // Availability toggle
  const availabilityToggle = document.getElementById('availabilityToggle');
  availabilityToggle.addEventListener('change', toggleAvailability);

  // Simulate incoming ride request (for demo)
  setTimeout(() => {
    showDemoRideRequest();
  }, 5000);
}

async function loadDriverData() {
  try {
    // In production, fetch driver profile from API
    // For demo, use mock data
    const mockDriver = {
      _id: 'demo-driver-123',
      userId: currentUser?.userId || currentUser?.id,
      fullName: 'Demo Driver',
      vehicleType: 'auto',
      vehicleNumber: 'DL 3C AB 1234',
      rating: 4.5,
      totalRides: 127,
      totalEarnings: 15680,
      isVerified: true,
      isAvailable: true
    };

    currentDriverId = mockDriver._id;

    // Update UI
    updateDashboardUI(mockDriver);
    
    // Load recent rides
    loadRecentRides();

  } catch (error) {
    console.error('Error loading driver data:', error);
  }
}

function updateDashboardUI(driver) {
  // Welcome message
  document.getElementById('welcomeMessage').textContent = 
    `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${driver.fullName || 'Driver'}`;

  // Stats
  document.getElementById('totalEarnings').textContent = `₹${driver.totalEarnings.toLocaleString()}`;
  document.getElementById('totalRides').textContent = driver.totalRides;
  document.getElementById('driverRating').textContent = driver.rating.toFixed(1);
  
  // Profile
  document.getElementById('driverName').textContent = driver.fullName || 'Driver';
  document.getElementById('ratingValue').textContent = driver.rating.toFixed(1);
  document.getElementById('vehicleType').textContent = 
    driver.vehicleType?.charAt(0).toUpperCase() + driver.vehicleType?.slice(1) || '-';
  document.getElementById('vehicleNumber').textContent = driver.vehicleNumber || '-';
  document.getElementById('verificationStatus').textContent = 
    driver.isVerified ? '✓ Verified' : 'Pending Verification';
  document.getElementById('verificationStatus').style.color = 
    driver.isVerified ? '#4caf50' : '#ffb703';

  // Availability toggle
  document.getElementById('availabilityToggle').checked = driver.isAvailable;
  updateAvailabilityStatus(driver.isAvailable);
}

function updateAvailabilityStatus(isAvailable) {
  const statusBadge = document.getElementById('statusBadge');
  const availabilityText = document.getElementById('availabilityText');
  
  if (isAvailable) {
    statusBadge.textContent = 'Available';
    statusBadge.className = 'status-badge status-available';
    availabilityText.textContent = 'You are:';
  } else {
    statusBadge.textContent = 'Busy';
    statusBadge.className = 'status-badge status-busy';
    availabilityText.textContent = 'You are:';
  }
}

async function toggleAvailability() {
  const isAvailable = document.getElementById('availabilityToggle').checked;
  
  try {
    const response = await fetch(`/api/drivers/${currentDriverId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isAvailable })
    });

    if (response.ok) {
      updateAvailabilityStatus(isAvailable);
      
      // Show notification
      const message = isAvailable ? 
        '✅ You are now available for rides' : 
        '⏸️ You are now busy';
      
      showNotification(message);
    }
  } catch (error) {
    console.error('Error updating status:', error);
    // Revert toggle
    document.getElementById('availabilityToggle').checked = !isAvailable;
    alert('Failed to update status. Please try again.');
  }
}

function loadRecentRides() {
  // Mock recent rides data
  const recentRides = [
    {
      _id: 'ride-001',
      pickupLocation: 'Connaught Place',
      dropLocation: 'Karol Bagh',
      distance: 5.3,
      totalAmount: 98,
      status: 'completed',
      createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      _id: 'ride-002',
      pickupLocation: 'Delhi Gate',
      dropLocation: 'India Gate',
      distance: 2.1,
      totalAmount: 45,
      status: 'completed',
      createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
    }
  ];

  const ridesList = document.getElementById('recentRidesList');
  
  if (recentRides.length === 0) {
    ridesList.innerHTML = `
      <li class="empty-state">
        <i class="fas fa-car"></i>
        <p>No recent rides</p>
      </li>
    `;
    return;
  }

  ridesList.innerHTML = recentRides.map(ride => `
    <li class="ride-item">
      <div class="ride-info">
        <h4>${ride.pickupLocation} → ${ride.dropLocation}</h4>
        <p>${ride.distance} km • ${formatDate(ride.createdAt)}</p>
      </div>
      <div style="display: flex; align-items: center;">
        <span class="ride-amount">₹${ride.totalAmount}</span>
        <span class="ride-status status-${ride.status}">${ride.status}</span>
      </div>
    </li>
  `).join('');
}

// ========================================
// RIDE REQUEST HANDLING
// ========================================

let currentRideRequest = null;

// Socket.io callback for new ride requests
function onNewRideRequest(ride) {
  console.log('🔔 New ride request received via Socket.io:', ride);
  displayRideRequest(ride);
}

function showDemoRideRequest() {
  // Only show if driver is available and socket not providing real requests
  if (!document.getElementById('availabilityToggle').checked) {
    return;
  }

  currentRideRequest = {
    rideId: 'demo-ride-' + Date.now(),
    pickupLocation: 'Rajiv Chowk, Connaught Place',
    dropLocation: 'Janpath Market',
    distance: 3.2,
    duration: 12,
    totalAmount: 67,
    passengerName: 'John Doe',
    passengerRating: 4.8
  };

  displayRideRequest(currentRideRequest);
}

function displayRideRequest(ride) {
  const rideRequestCard = document.getElementById('rideRequestCard');
  
  document.getElementById('requestPickup').textContent = ride.pickupLocation;
  document.getElementById('requestDrop').textContent = ride.dropLocation;
  document.getElementById('requestDistance').textContent = `${ride.distance} km`;
  document.getElementById('requestFare').textContent = `₹${ride.totalAmount}`;
  
  rideRequestCard.style.display = 'block';
  
  // Play notification sound (optional)
  playNotificationSound();
  
  // Auto-hide after 30 seconds if not responded
  setTimeout(() => {
    if (currentRideRequest && currentRideRequest.rideId === ride.rideId) {
      declineRide();
      showNotification('Ride request expired');
    }
  }, 30000);
}

function acceptRide() {
  if (!currentRideRequest) return;

  console.log('Accepting ride:', currentRideRequest.rideId);
  
  // Send acceptance via Socket.io
  if (socket && isConnected) {
    acceptRide(currentRideRequest.rideId, currentDriverId);
  } else {
    // Fallback if socket not connected
    console.log('Socket not connected, using API fallback');
  }
  
  showNotification('✅ Ride accepted! Navigate to pickup location.');
  
  // Hide request card
  document.getElementById('rideRequestCard').style.display = 'none';
  currentRideRequest = null;
  
  // Set driver as busy
  document.getElementById('availabilityToggle').checked = false;
  updateAvailabilityStatus(false);
}

function declineRide() {
  if (!currentRideRequest) return;

  console.log('Declining ride:', currentRideRequest.rideId);
  
  // Hide request card
  document.getElementById('rideRequestCard').style.display = 'none';
  currentRideRequest = null;
  
  showNotification('Ride declined');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2d2d2d;
    color: #ffffff;
    padding: 15px 25px;
    border-radius: 8px;
    border-left: 4px solid #ffb703;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function playNotificationSound() {
  // Optional: Play notification sound
  // You can add an audio file and play it here
  console.log('🔔 Notification sound played');
}

// ========================================
// QUICK ACTIONS
// ========================================

function goToEarnings() {
  alert('Earnings page - Coming soon!');
}

function updateLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Update via Socket.io if connected
        if (socket && isConnected && currentRideRequest) {
          updateDriverLocation(currentRideRequest.rideId, lat, lng);
        }
        
        // Also update via API for persistence
        try {
          const response = await fetch(`/api/drivers/${currentDriverId}/location`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ lat, lng })
          });
          
          if (response.ok) {
            showNotification('✅ Location updated successfully');
          }
        } catch (error) {
          console.error('Error updating location:', error);
          showNotification('❌ Failed to update location');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showNotification('❌ Unable to get your location');
      }
    );
  } else {
    showNotification('❌ Geolocation not supported by your browser');
  }
}

function goOffline() {
  if (socket && isConnected) {
    goOffline();
  }
  showNotification('👋 Going offline...');
}

function goToSettings() {
  alert('Settings page - Coming soon!');
}

function viewAllRides() {
  alert('Ride history page - Coming soon!');
}

// ========================================
// SOCKET.IO INTEGRATION (FOR FUTURE)
// ========================================

// This will be used when Socket.io is implemented
/*
let socket = null;

function initSocket() {
  socket = io('http://localhost:5000');
  
  socket.on('connect', () => {
    console.log('Connected to server');
    // Join driver's room
    socket.emit('driver-join', { driverId: currentDriverId });
  });
  
  socket.on('new-ride-request', (ride) => {
    console.log('New ride request received:', ride);
    displayRideRequest(ride);
  });
  
  socket.on('ride-status-update', (update) => {
    console.log('Ride status updated:', update);
    // Update UI accordingly
  });
}
*/
