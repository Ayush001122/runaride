// Booking Logic for Run A Ride

const API_BASE_URL = 'http://localhost:5000/api';

// Calculate fare based on distance and ride type
function calculateFare() {
  const pickup = document.getElementById('pickup').value.trim();
  const drop = document.getElementById('drop').value.trim();
  
  if (!pickup || !drop) {
    alert('Please enter both pickup and drop locations');
    return;
  }
  
  // Simulate distance calculation (in real app, use Google Maps API)
  const distance = calculateDistance(pickup, drop);
  const duration = distance * 3; // Approx 3 mins per km
  
  // Get selected ride type
  const selectedRide = document.querySelector('input[name="rideType"]:checked');
  const rideOption = selectedRide.closest('.ride-option');
  const baseFare = parseFloat(rideOption.dataset.baseFare);
  const perKmRate = parseFloat(rideOption.dataset.perKm);
  
  // Calculate fares
  const distanceFare = distance * perKmRate;
  const totalBeforeTax = baseFare + distanceFare;
  const taxes = totalBeforeTax * 0.05; // 5% tax
  const totalAmount = totalBeforeTax + taxes;
  
  // Display trip info
  document.getElementById('tripInfo').style.display = 'flex';
  document.getElementById('distanceValue').textContent = distance.toFixed(1) + ' km';
  document.getElementById('durationValue').textContent = Math.round(duration) + ' mins';
  
  // Display fare breakdown
  document.getElementById('fareEstimate').style.display = 'block';
  document.getElementById('baseFareDisplay').textContent = '₹' + baseFare.toFixed(2);
  document.getElementById('distanceFareDisplay').textContent = '₹' + distanceFare.toFixed(2);
  document.getElementById('taxesDisplay').textContent = '₹' + taxes.toFixed(2);
  document.getElementById('totalFareDisplay').textContent = '₹' + totalAmount.toFixed(2);
  
  // Enable proceed button
  document.getElementById('proceedBtn').disabled = false;
  
  // Store ride details in localStorage
  const rideDetails = {
    pickupLocation: pickup,
    dropLocation: drop,
    distance: distance.toFixed(1),
    duration: duration.toFixed(0),
    rideType: selectedRide.value,
    baseFare: baseFare.toFixed(2),
    distanceFare: distanceFare.toFixed(2),
    taxes: taxes.toFixed(2),
    totalAmount: totalAmount.toFixed(2)
  };
  
  localStorage.setItem('currentRide', JSON.stringify(rideDetails));
}

// Mock distance calculation function (replace with actual Google Maps API in production)
function calculateDistance(pickup, drop) {
  // Generate a random distance between 2-20 km for demo
  // In production, use actual mapping service
  const hash = simpleHash(pickup + drop);
  return 2 + (hash % 18); // Returns 2-20 km
}

// Simple hash function for consistent results
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Handle ride type selection
document.addEventListener('DOMContentLoaded', function() {
  const rideOptions = document.querySelectorAll('.ride-option');
  
  rideOptions.forEach(option => {
    option.addEventListener('click', function() {
      // Remove selected class from all options
      rideOptions.forEach(opt => opt.classList.remove('selected'));
      
      // Add selected class to clicked option
      this.classList.add('selected');
      
      // Check the radio button
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      // Recalculate fare if locations are filled
      const pickup = document.getElementById('pickup').value.trim();
      const drop = document.getElementById('drop').value.trim();
      
      if (pickup && drop && document.getElementById('fareEstimate').style.display === 'block') {
        calculateFare();
      }
    });
  });
  
  // Handle form submission
  const bookingForm = document.getElementById('bookingForm');
  
  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const rideDetails = JSON.parse(localStorage.getItem('currentRide'));
    
    if (!rideDetails) {
      alert('Please calculate fare first');
      return;
    }
    
    // Navigate to fare summary page
    window.location.href = 'fare-summary.html';
  });
});

// Create ride booking in backend
async function createRideBooking(rideDetails, token) {
  try {
    const response = await fetch(`${API_BASE_URL}/rides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(rideDetails)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create ride');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create ride error:', error);
    throw error;
  }
}

// Get distance between coordinates using Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
