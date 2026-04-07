// ========================================
// ADMIN PANEL LOGIC
// Run A Ride - Administration Dashboard
// ========================================

let allDrivers = [];
let allRides = [];
let allUsers = [];

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initAdminPanel();
});

async function initAdminPanel() {
  // Check if admin (in production, verify admin role)
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login as admin');
    window.location.href = 'signin.html';
    return;
  }

  try {
    // Load all data
    await Promise.all([
      loadDrivers(),
      loadRides(),
      loadUsers()
    ]);

    // Update stats
    updateStats();

  } catch (error) {
    console.error('Error loading admin data:', error);
  }
}

// ========================================
// TAB SWITCHING
// ========================================

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  // Remove active from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Highlight button
  event.target.classList.add('active');
}

// ========================================
// LOAD DRIVERS
// ========================================

async function loadDrivers() {
  try {
    // Mock driver data (in production, fetch from API)
    const mockDrivers = [
      {
        _id: 'driver-001',
        userId: { fullName: 'Rajesh Kumar' },
        vehicleType: 'auto',
        vehicleNumber: 'DL 3C AB 1234',
        licenseNumber: 'DL-1234567890',
        isVerified: false,
        isAvailable: true,
        totalRides: 0,
        rating: 0,
        createdAt: new Date().toISOString()
      },
      {
        _id: 'driver-002',
        userId: { fullName: 'Suresh Yadav' },
        vehicleType: 'car',
        vehicleNumber: 'DL 1C AB 5678',
        licenseNumber: 'DL-0987654321',
        isVerified: true,
        isAvailable: true,
        totalRides: 127,
        rating: 4.5,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    allDrivers = mockDrivers;
    displayDrivers(allDrivers);
    updateStats();

  } catch (error) {
    console.error('Error loading drivers:', error);
    document.getElementById('driversTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Error loading drivers</p>
        </td>
      </tr>
    `;
  }
}

function displayDrivers(drivers) {
  const tbody = document.getElementById('driversTableBody');

  if (drivers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fas fa-car"></i>
          <p>No drivers found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = drivers.map(driver => `
    <tr>
      <td>${driver.userId?.fullName || 'Unknown'}</td>
      <td>${capitalizeFirst(driver.vehicleType)}</td>
      <td>${driver.vehicleNumber}</td>
      <td>${driver.licenseNumber}</td>
      <td>
        <span class="status-badge status-${driver.isVerified ? 'verified' : 'pending'}">
          ${driver.isVerified ? 'Verified' : 'Pending'}
        </span>
      </td>
      <td>
        ${!driver.isVerified ? `
          <button class="action-btn btn-verify" onclick="verifyDriver('${driver._id}')">
            <i class="fas fa-check"></i> Verify
          </button>
          <button class="action-btn btn-reject" onclick="rejectDriver('${driver._id}')">
            <i class="fas fa-times"></i> Reject
          </button>
        ` : `
          <button class="action-btn btn-view" onclick="viewDriver('${driver._id}')">
            <i class="fas fa-eye"></i> View
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

// ========================================
// DRIVER ACTIONS
// ========================================

async function verifyDriver(driverId) {
  if (!confirm('Verify this driver? They will be able to accept rides.')) return;

  try {
    // In production, call API to update driver status
    const driver = allDrivers.find(d => d._id === driverId);
    if (driver) {
      driver.isVerified = true;
      displayDrivers(allDrivers);
      updateStats();
      showNotification('✅ Driver verified successfully!', 'success');
    }
  } catch (error) {
    console.error('Error verifying driver:', error);
    showNotification('❌ Failed to verify driver', 'error');
  }
}

async function rejectDriver(driverId) {
  if (!confirm('Reject this driver registration?')) return;

  try {
    // In production, call API to reject driver
    const driverIndex = allDrivers.findIndex(d => d._id === driverId);
    if (driverIndex > -1) {
      allDrivers.splice(driverIndex, 1);
      displayDrivers(allDrivers);
      updateStats();
      showNotification('Driver registration rejected', 'info');
    }
  } catch (error) {
    console.error('Error rejecting driver:', error);
    showNotification('❌ Failed to reject driver', 'error');
  }
}

function viewDriver(driverId) {
  const driver = allDrivers.find(d => d._id === driverId);
  if (!driver) return;

  alert(`Driver Details:\n\nName: ${driver.userId?.fullName}\nVehicle: ${driver.vehicleType} - ${driver.vehicleNumber}\nLicense: ${driver.licenseNumber}\nTotal Rides: ${driver.totalRides}\nRating: ${driver.rating.toFixed(1)}\nStatus: ${driver.isVerified ? 'Verified' : 'Pending'}`);
}

// ========================================
// LOAD RIDES
// ========================================

async function loadRides() {
  try {
    // Mock ride data
    const mockRides = [
      {
        _id: 'ride-001',
        user: { fullName: 'John Doe' },
        pickupLocation: 'Connaught Place',
        dropLocation: 'India Gate',
        totalAmount: 98,
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        _id: 'ride-002',
        user: { fullName: 'Jane Smith' },
        pickupLocation: 'Karol Bagh',
        dropLocation: 'Aerocity',
        totalAmount: 245,
        status: 'ongoing',
        createdAt: new Date().toISOString()
      }
    ];

    allRides = mockRides;
    displayRides(allRides);
    updateStats();

  } catch (error) {
    console.error('Error loading rides:', error);
  }
}

function displayRides(rides) {
  const tbody = document.getElementById('ridesTableBody');

  if (rides.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <i class="fas fa-car"></i>
          <p>No rides found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rides.map(ride => `
    <tr>
      <td><code>${ride._id}</code></td>
      <td>${ride.user?.fullName || 'Unknown'}</td>
      <td>${truncateText(ride.pickupLocation, 20)} → ${truncateText(ride.dropLocation, 20)}</td>
      <td style="color: var(--primary-color); font-weight: bold;">₹${ride.totalAmount}</td>
      <td>
        <span class="status-badge status-${ride.status}">${capitalizeFirst(ride.status)}</span>
      </td>
      <td>${formatDate(ride.createdAt)}</td>
    </tr>
  `).join('');
}

// ========================================
// LOAD USERS
// ========================================

async function loadUsers() {
  try {
    // Mock user data
    const mockUsers = [
      {
        _id: 'user-001',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+91 9876543210',
        totalRides: 15,
        isActive: true
      },
      {
        _id: 'user-002',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+91 9876543211',
        totalRides: 8,
        isActive: true
      }
    ];

    allUsers = mockUsers;
    displayUsers(allUsers);

  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function displayUsers(users) {
  const tbody = document.getElementById('usersTableBody');

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <i class="fas fa-users"></i>
          <p>No users found</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.fullName}</td>
      <td>${user.email}</td>
      <td>${user.phone}</td>
      <td>${user.totalRides || 0}</td>
      <td>
        <span class="status-badge status-${user.isActive ? 'verified' : 'pending'}">
          ${user.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
    </tr>
  `).join('');
}

// ========================================
// UPDATE STATISTICS
// ========================================

function updateStats() {
  const totalDrivers = allDrivers.length;
  const pendingVerifications = allDrivers.filter(d => !d.isVerified).length;
  const totalRides = allRides.length;
  
  // Calculate today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayRides = allRides.filter(ride => {
    const rideDate = new Date(ride.createdAt);
    return rideDate >= today;
  });
  const todayRevenue = todayRides.reduce((sum, ride) => sum + (ride.totalAmount || 0), 0);

  // Update stat cards
  document.getElementById('totalDrivers').textContent = totalDrivers;
  document.getElementById('pendingVerifications').textContent = pendingVerifications;
  document.getElementById('totalRides').textContent = totalRides;
  document.getElementById('todayRevenue').textContent = `₹${todayRevenue.toLocaleString()}`;
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
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2d2d2d;
    color: #ffffff;
    padding: 15px 25px;
    border-radius: 8px;
    border-left: 4px solid ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#ffb703'};
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

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  }
}
