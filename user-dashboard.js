// ========================================
// USER DASHBOARD LOGIC
// Run A Ride - Rider Dashboard
// ========================================

let currentUser = null;
let allRides = [];
let socket = null;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initDashboard();
});

async function initDashboard() {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login first');
    window.location.href = 'signin.html';
    return;
  }

  try {
    // Decode JWT token
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    currentUser = userInfo;

    // Initialize Socket.io
    socket = initSocket(currentUser.userId || currentUser.id, 'rider');

    // Load user data
    await loadUserData();

    // Load ride history
    await loadRideHistory();

    // Setup Socket listeners
    setupSocketListeners();

  } catch (error) {
    console.error('Error initializing dashboard:', error);
    alert('Session expired. Please login again.');
    window.location.href = 'signin.html';
  }
}

// ========================================
// LOAD USER DATA
// ========================================

async function loadUserData() {
  try {
    // Mock user data (in production, fetch from API)
    const mockUser = {
      _id: currentUser.userId || currentUser.id,
      fullName: currentUser.fullName || 'User',
      email: currentUser.email || 'user@example.com',
      phone: currentUser.phone || '+91 9876543210',
      totalRides: 0,
      totalSpent: 0,
      avgRating: 0
    };

    // Update UI
    document.getElementById('userName').textContent = mockUser.fullName;
    document.getElementById('userEmail').textContent = mockUser.email;
    document.getElementById('profileRides').textContent = mockUser.totalRides;
    document.getElementById('profileRating').textContent = mockUser.avgRating.toFixed(1);

    // Welcome message
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    document.getElementById('welcomeMessage').textContent = `${greeting}, ${mockUser.fullName.split(' ')[0]}!`;

    // Update stats
    updateStats(mockUser);

  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

function updateStats(user) {
  // Calculate statistics from ride history
  const totalRides = allRides.length;
  const totalSpent = allRides.reduce((sum, ride) => sum + (ride.totalAmount || 0), 0);
  
  // This month's rides
  const now = new Date();
  const thisMonthRides = allRides.filter(ride => {
    const rideDate = new Date(ride.createdAt);
    return rideDate.getMonth() === now.getMonth() && 
           rideDate.getFullYear() === now.getFullYear();
  }).length;

  // Update stat cards
  document.getElementById('totalRides').textContent = totalRides;
  document.getElementById('totalSpent').textContent = `₹${totalSpent.toLocaleString()}`;
  document.getElementById('avgRating').textContent = user.avgRating.toFixed(1);
  document.getElementById('thisMonth').textContent = thisMonthRides;
}

// ========================================
// LOAD RIDE HISTORY
// ========================================

async function loadRideHistory() {
  try {
    // Mock ride data (in production, fetch from API)
    const mockRides = [
      {
        _id: 'ride-001',
        pickupLocation: 'Connaught Place, New Delhi',
        dropLocation: 'India Gate, New Delhi',
        distance: 5.3,
        duration: 16,
        totalAmount: 98,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        driverName: 'Rajesh Kumar',
        driverRating: 4.8
      },
      {
        _id: 'ride-002',
        pickupLocation: 'Karol Bagh, New Delhi',
        dropLocation: 'Aerocity, New Delhi',
        distance: 12.5,
        duration: 35,
        totalAmount: 245,
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        driverName: 'Suresh Yadav',
        driverRating: 4.5
      },
      {
        _id: 'ride-003',
        pickupLocation: 'Dwarka Sector 21',
        dropLocation: 'IGI Airport Terminal 3',
        distance: 8.2,
        duration: 22,
        totalAmount: 156,
        status: 'ongoing',
        createdAt: new Date().toISOString(),
        driverName: 'Mohammed Azhar',
        driverRating: 4.9
      }
    ];

    allRides = mockRides;
    displayRides(allRides);
    updateStats({});

    // Check for ongoing ride
    const ongoingRide = allRides.find(ride => ride.status === 'ongoing');
    if (ongoingRide) {
      showCurrentRide(ongoingRide);
    }

  } catch (error) {
    console.error('Error loading ride history:', error);
    document.getElementById('rideList').innerHTML = `
      <li class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error loading rides</p>
      </li>
    `;
  }
}

function displayRides(rides) {
  const rideList = document.getElementById('rideList');

  if (rides.length === 0) {
    rideList.innerHTML = `
      <li class="empty-state">
        <i class="fas fa-car"></i>
        <p>No rides yet. Book your first ride!</p>
      </li>
    `;
    return;
  }

  rideList.innerHTML = rides.map(ride => `
    <li class="ride-item" onclick="viewRideDetails('${ride._id}')">
      <div class="ride-route">
        <div class="route-marker pickup"></div>
        <div class="ride-info">
          <strong>${truncateText(ride.pickupLocation, 40)}</strong>
        </div>
      </div>
      <div class="route-line"></div>
      <div class="ride-route">
        <div class="route-marker drop"></div>
        <div class="ride-info">
          <strong>${truncateText(ride.dropLocation, 40)}</strong>
        </div>
      </div>

      <div class="ride-meta">
        <div class="meta-item">
          <i class="fas fa-road"></i>
          <span>${ride.distance} km</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-clock"></i>
          <span>${ride.duration || '--'} mins</span>
        </div>
        <div class="meta-item">
          <i class="fas fa-calendar"></i>
          <span>${formatDate(ride.createdAt)}</span>
        </div>
      </div>

      <div class="ride-footer">
        <span class="ride-status status-${ride.status}">${capitalizeFirst(ride.status)}</span>
        <span class="ride-amount">₹${ride.totalAmount}</span>
      </div>
    </li>
  `).join('');
}

// ========================================
// FILTER RIDES
// ========================================

function filterRides(filter) {
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

  // Filter rides
  let filteredRides = allRides;

  if (filter !== 'all') {
    filteredRides = allRides.filter(ride => ride.status === filter);
  }

  displayRides(filteredRides);
}

// ========================================
// CURRENT RIDE
// ========================================

function showCurrentRide(ride) {
  const currentRideCard = document.getElementById('currentRideCard');
  const currentRideDetails = document.getElementById('currentRideDetails');

  currentRideDetails.innerHTML = `
    <div style="margin-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <i class="fas fa-map-marker-alt" style="color: var(--success);"></i>
        <span>${ride.pickupLocation}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fas fa-location-arrow" style="color: var(--danger);"></i>
        <span>${ride.dropLocation}</span>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
      <div>
        <small style="color: var(--text-secondary);">Driver</small>
        <p style="margin: 5px 0;">${ride.driverName || 'Assigned...'}</p>
      </div>
      <div style="text-align: right;">
        <small style="color: var(--text-secondary);">Fare</small>
        <p style="margin: 5px 0; color: var(--primary-color); font-weight: bold;">₹${ride.totalAmount}</p>
      </div>
    </div>
  `;

  currentRideCard.style.display = 'block';
}

function trackCurrentRide() {
  alert('Live tracking page - Coming soon!');
  // window.location.href = 'track-ride.html';
}

// ========================================
// SOCKET.IO LISTENERS
// ========================================

function setupSocketListeners() {
  if (!socket) return;

  // Driver accepted ride
  socket.on('ride-accepted', (data) => {
    console.log('✅ Driver accepted your ride:', data);
    showNotification('🎉 Driver accepted your ride!', 'success');
    
    // Reload ride history
    setTimeout(() => loadRideHistory(), 1000);
  });

  // Driver location update
  socket.on('driver-location', (data) => {
    console.log('📍 Driver location updated:', data);
    // Update map with driver location (if on tracking page)
  });

  // Ride status update
  socket.on('ride-status-update', (data) => {
    console.log('🔄 Ride status updated:', data);
    showNotification(data.message, 'info');
    
    // Reload rides after completion
    if (data.status === 'completed') {
      setTimeout(() => loadRideHistory(), 2000);
    }
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
  // Use notification from socket-client.js or create custom one
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2d2d2d;
    color: #ffffff;
    padding: 15px 25px;
    border-radius: 8px;
    border-left: 4px solid ${type === 'success' ? '#4caf50' : '#ffb703'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================================
// ACTION HANDLERS
// ========================================

function viewRideDetails(rideId) {
  const ride = allRides.find(r => r._id === rideId);
  if (!ride) return;

  alert(`Ride Details:\n\nPickup: ${ride.pickupLocation}\nDrop: ${ride.dropLocation}\nDistance: ${ride.distance} km\nAmount: ₹${ride.totalAmount}\nStatus: ${ride.status}\nDriver: ${ride.driverName || 'N/A'}`);
  
  // In production, navigate to detailed ride view page
  // window.location.href = `ride-details.html?id=${rideId}`;
}

function viewSavedAddresses() {
  alert('Saved Addresses:\n\n- Home: 123 Main Street, Connaught Place\n- Work: Cyber City, Gurgaon\n\nAddress management - Coming soon!');
}

function viewPaymentMethods() {
  alert('Payment Methods:\n\n- UPI: user@paytm\n- Card: **** **** **** 1234\n\nPayment management - Coming soon!');
}

function viewProfileSettings() {
  alert('Profile Settings:\n\n- Edit Profile\n- Change Password\n- Privacy Settings\n\nSettings page - Coming soon!');
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
  }
}

// ========================================
// CALLBACK PLACEHOLDERS
// ========================================

function onDriverAccepted(data) {
  console.log('Driver accepted callback:', data);
  showNotification('🎉 Driver accepted your ride!', 'success');
  setTimeout(() => loadRideHistory(), 1000);
}

function onDriverLocationUpdate(data) {
  console.log('Driver location update callback:', data);
  // Update map if on tracking page
}

function onRideStatusUpdate(data) {
  console.log('Ride status update callback:', data);
  showNotification(data.message, 'info');
  
  if (data.status === 'completed') {
    setTimeout(() => loadRideHistory(), 2000);
  }
}
