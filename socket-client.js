// ========================================
// SOCKET.IO CLIENT UTILITY
// Run A Ride - Real-time Communication
// ========================================

let socket = null;
let isConnected = false;

// ========================================
// INITIALIZATION
// ========================================

function initSocket(userId, userRole = 'rider') {
  // Only initialize if not already connected
  if (socket && isConnected) {
    console.log('Socket already connected');
    return socket;
  }

  try {
    // Connect to Socket.io server
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.io server:', socket.id);
      isConnected = true;

      // Join appropriate room based on role
      if (userRole === 'driver') {
        joinDriverArea();
      } else if (userRole === 'rider') {
        joinRiderRoom();
      }

      emitConnectionEvent(userRole, userId);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
      isConnected = false;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected = false;
    });

    setupSocketListeners(userRole);

    return socket;

  } catch (error) {
    console.error('Failed to initialize Socket.io:', error);
    return null;
  }
}

// ========================================
// EMIT EVENTS (Send to Server)
// ========================================

// Rider requests a ride - broadcast to nearby drivers
function requestRide(rideData) {
  if (!socket || !isConnected) {
    console.error('Socket not connected');
    return false;
  }

  const payload = {
    rideId: rideData.rideId,
    pickupLocation: rideData.pickupLocation,
    dropLocation: rideData.dropLocation,
    distance: rideData.distance,
    duration: rideData.duration,
    totalAmount: rideData.totalAmount,
    passengerName: rideData.passengerName,
    passengerRating: rideData.passengerRating,
    pickupAreaCode: generateAreaCode(rideData.pickupLat, rideData.pickupLng),
    pickupLat: rideData.pickupLat,
    pickupLng: rideData.pickupLng
  };

  socket.emit('ride-request', payload);
  console.log('🚗 Ride request sent:', payload);
  return true;
}

// Driver joins service area
function joinDriverArea(areaCode = null) {
  if (!socket || !isConnected) return;

  // Get current location if area not provided
  if (!areaCode && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const code = generateAreaCode(lat, lng);
        
        socket.emit('driver-join-area', {
          driverId: getCurrentDriverId(),
          areaCode: code,
          lat,
          lng
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Use default area
        socket.emit('driver-join-area', {
          driverId: getCurrentDriverId(),
          areaCode: 'default'
        });
      }
    );
  } else {
    socket.emit('driver-join-area', {
      driverId: getCurrentDriverId(),
      areaCode: areaCode || 'default'
    });
  }
}

// Accept ride request
function acceptRide(rideId, driverId) {
  if (!socket || !isConnected) return;

  socket.emit('accept-ride', {
    rideId,
    driverId
  });
  console.log(`✅ Accepted ride ${rideId}`);
}

// Update driver location during ride
function updateDriverLocation(rideId, lat, lng) {
  if (!socket || !isConnected) return;

  socket.emit('update-location', {
    rideId,
    lat,
    lng
  });
}

// Start the ride
function startRide(rideId) {
  if (!socket || !isConnected) return;

  socket.emit('ride-started', { rideId });
  console.log('▶️ Ride started');
}

// Complete the ride
function completeRide(rideId, finalAmount) {
  if (!socket || !isConnected) return;

  socket.emit('ride-completed', {
    rideId,
    finalAmount
  });
  console.log('✔️ Ride completed');
}

// Go offline
function goOffline() {
  if (!socket || !isConnected) return;

  socket.emit('driver-offline', {
    driverId: getCurrentDriverId()
  });
  
  socket.disconnect();
  console.log('🔌 Went offline');
}

// ========================================
// RECEIVE EVENTS (Listen from Server)
// ========================================

function setupSocketListeners(userRole) {
  if (!socket) return;

  // Common listeners
  socket.on('ride-request-sent', (data) => {
    console.log('📍 Ride request sent confirmation:', data);
    showNotification(data.message, 'info');
  });

  // Rider-specific listeners
  if (userRole === 'rider') {
    setupRiderListeners();
  }

  // Driver-specific listeners
  if (userRole === 'driver') {
    setupDriverListeners();
  }
}

function setupRiderListeners() {
  // Driver accepted ride
  socket.on('ride-accepted', (data) => {
    console.log('✅ Driver accepted your ride:', data);
    showNotification('🎉 Driver accepted your ride!', 'success');
    
    // Update UI to show driver assigned
    if (typeof onDriverAccepted === 'function') {
      onDriverAccepted(data);
    }
  });

  // Driver location update
  socket.on('driver-location', (data) => {
    console.log('📍 Driver location updated:', data);
    
    // Update map with driver location
    if (typeof onDriverLocationUpdate === 'function') {
      onDriverLocationUpdate(data);
    }
  });

  // Ride status update
  socket.on('ride-status-update', (data) => {
    console.log('🔄 Ride status updated:', data);
    showNotification(data.message, 'info');
    
    if (typeof onRideStatusUpdate === 'function') {
      onRideStatusUpdate(data);
    }
  });
}

function setupDriverListeners() {
  // New ride request received
  socket.on('new-ride-request', (data) => {
    console.log('🔔 New ride request:', data);
    
    // Play notification sound
    playNotificationSound();
    
    // Show ride request UI
    if (typeof onNewRideRequest === 'function') {
      onNewRideRequest(data);
    }
  });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function generateAreaCode(lat, lng) {
  // Generate area code based on coordinates
  // This is a simple implementation - in production, use actual geofencing
  const precision = 2; // 2 decimal places = ~1km precision
  const latRounded = Math.floor(lat * Math.pow(10, precision));
  const lngRounded = Math.floor(lng * Math.pow(10, precision));
  return `area-${latRounded}-${lngRounded}`;
}

function getCurrentDriverId() {
  // Get driver ID from localStorage or session
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const userInfo = JSON.parse(atob(token.split('.')[1]));
    return userInfo.userId || userInfo.id;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

function showNotification(message, type = 'info') {
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

function playNotificationSound() {
  // Optional: Play notification sound
  // You can add an audio file here
  console.log('🔔 Notification sound played');
}

// ========================================
// CALLBACK PLACEHOLDERS
// (Implement these in your page-specific JS)
// ========================================

function onNewRideRequest(ride) {
  console.log('New ride request callback:', ride);
  // Implement in driver-dashboard.js
}

function onDriverAccepted(data) {
  console.log('Driver accepted callback:', data);
  // Implement in book-ride-map.js
}

function onDriverLocationUpdate(data) {
  console.log('Driver location update callback:', data);
  // Implement in track-ride.js
}

function onRideStatusUpdate(data) {
  console.log('Ride status update callback:', data);
  // Implement in relevant pages
}

// ========================================
// EXPORTS (for module systems)
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSocket,
    requestRide,
    joinDriverArea,
    acceptRide,
    updateDriverLocation,
    startRide,
    completeRide,
    goOffline
  };
}
