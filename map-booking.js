// Interactive Map Booking Logic for Run A Ride
// Uses Leaflet.js with OpenStreetMap (Free, no API key required)

let map;
let routingControl = null;
let pickupMarker = null;
let dropMarker = null;
let currentLocation = null;

// Default to a major city center (can be changed based on user location)
const DEFAULT_LAT = 28.6139; // Delhi
const DEFAULT_LNG = 77.2090;

// Initialize the map
function initMap() {
  // Create map centered on default location
  map = L.map('map').setView([DEFAULT_LAT, DEFAULT_LNG], 13);
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);
  
  // Add click event to map
  map.on('click', handleMapClick);
  
  console.log('Map initialized');
}

// Handle map clicks - alternate between pickup and drop
let clickMode = 'pickup'; // 'pickup' or 'drop'

function handleMapClick(e) {
  const { lat, lng } = e.latlng;
  
  if (clickMode === 'pickup') {
    setPickupLocation(lat, lng);
    clickMode = 'drop';
  } else {
    setDropLocation(lat, lng);
    clickMode = 'pickup';
  }
}

// Set pickup location from map click
function setPickupLocation(lat, lng) {
  // Remove existing pickup marker
  if (pickupMarker) {
    map.removeLayer(pickupMarker);
  }
  
  // Add new marker
  pickupMarker = L.marker([lat, lng], {
    draggable: true
  }).addTo(map);
  
  // Add popup
  pickupMarker.bindPopup('<b>Pickup Location</b>').openPopup();
  
  // Reverse geocode to get address
  reverseGeocode(lat, lng, 'pickup');
  
  // Update route if drop location exists
  if (dropMarker) {
    calculateRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
  }
  
  // Make marker draggable and update on drag
  pickupMarker.on('dragend', function(event) {
    const marker = event.target;
    const position = marker.getLatLng();
    reverseGeocode(position.lat, position.lng, 'pickup');
    
    if (dropMarker) {
      calculateRoute(position, dropMarker.getLatLng());
    }
  });
}

// Set drop location from map click
function setDropLocation(lat, lng) {
  // Remove existing drop marker
  if (dropMarker) {
    map.removeLayer(dropMarker);
  }
  
  // Add new marker
  dropMarker = L.marker([lat, lng], {
    draggable: true
  }).addTo(map);
  
  // Add popup
  dropMarker.bindPopup('<b>Drop Location</b>').openPopup();
  
  // Reverse geocode to get address
  reverseGeocode(lat, lng, 'drop');
  
  // Update route if pickup location exists
  if (pickupMarker) {
    calculateRoute(pickupMarker.getLatLng(), dropMarker.getLatLng());
  }
  
  // Make marker draggable and update on drag
  dropMarker.on('dragend', function(event) {
    const marker = event.target;
    const position = marker.getLatLng();
    reverseGeocode(position.lat, position.lng, 'drop');
    
    if (pickupMarker) {
      calculateRoute(pickupMarker.getLatLng(), position);
    }
  });
}

// Calculate route between two points using OSRM
function calculateRoute(pickupLatLng, dropLatLng) {
  // Remove existing routing control
  if (routingControl) {
    map.removeControl(routingControl);
  }
  
  // Create routing control
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(pickupLatLng.lat, pickupLatLng.lng),
      L.latLng(dropLatLng.lat, dropLatLng.lng)
    ],
    routeWhileDragging: true,
    showAlternatives: false,
    lineOptions: {
      styles: [{color: '#ffb703', opacity: 0.8, weight: 6}]
    },
    createMarker: function() { return null; }, // Don't create markers, we have our own
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    show: false, // Don't show default itinerary
    geocoder: L.Control.Geocoder ? L.Control.Geocoder.nominatim() : null
  }).addTo(map);
  
  // Listen for route found event
  routingControl.on('routesfound', function(e) {
    const routes = e.routes;
    const summary = routes[0].summary;
    
    // Distance in km
    const distanceKm = (summary.totalDistance / 1000).toFixed(1);
    // Duration in minutes
    const durationMins = Math.round(summary.totalTime / 60);
    
    // Update UI
    updateTripDetails(distanceKm, durationMins);
    calculateFare(distanceKm);
  });
  
  // Show trip details
  document.getElementById('tripDetails').style.display = 'block';
}

// Reverse geocode using Nominatim (OpenStreetMap)
async function reverseGeocode(lat, lng, type) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const data = await response.json();
    
    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    
    if (type === 'pickup') {
      document.getElementById('pickup').value = address;
    } else {
      document.getElementById('drop').value = address;
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to coordinates
    const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    if (type === 'pickup') {
      document.getElementById('pickup').value = coords;
    } else {
      document.getElementById('drop').value = coords;
    }
  }
}

// Get current location using browser Geolocation API
function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Center map on current location
      map.setView([lat, lng], 15);
      
      // Set as pickup location
      setPickupLocation(lat, lng);
      clickMode = 'drop';
      
      currentLocation = { lat, lng };
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('Unable to get your location. Please enter manually or allow location access.');
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Update trip details display
function updateTripDetails(distance, duration) {
  document.getElementById('distanceValue').textContent = distance + ' km';
  document.getElementById('durationValue').textContent = duration + ' mins';
}

// Calculate fare based on distance and ride type
function calculateFare(distance) {
  const selectedRide = document.querySelector('input[name="rideType"]:checked');
  const rideOption = selectedRide.closest('.ride-option');
  const baseFare = parseFloat(rideOption.dataset.baseFare);
  const perKmRate = parseFloat(rideOption.dataset.perKm);
  
  const distanceFare = distance * perKmRate;
  const totalBeforeTax = baseFare + distanceFare;
  const taxes = totalBeforeTax * 0.05; // 5% tax
  const totalAmount = totalBeforeTax + taxes;
  
  // Display fare
  document.getElementById('fareDisplay').style.display = 'block';
  document.getElementById('fareAmount').textContent = '₹' + totalAmount.toFixed(0);
  document.getElementById('baseFareBreakdown').textContent = baseFare.toFixed(0);
  document.getElementById('distanceFareBreakdown').textContent = distanceFare.toFixed(0);
  document.getElementById('taxBreakdown').textContent = taxes.toFixed(0);
  
  // Enable proceed button
  document.getElementById('proceedBtn').disabled = false;
  
  // Store ride details
  const pickupText = document.getElementById('pickup').value.trim();
  const dropText = document.getElementById('drop').value.trim();
  
  const rideDetails = {
    pickupLocation: pickupText,
    dropLocation: dropText,
    distance: distance,
    duration: parseInt(document.getElementById('durationValue').textContent),
    rideType: selectedRide.value,
    baseFare: baseFare.toFixed(2),
    distanceFare: distanceFare.toFixed(2),
    taxes: taxes.toFixed(2),
    totalAmount: totalAmount.toFixed(2)
  };
  
  localStorage.setItem('currentRide', JSON.stringify(rideDetails));
}

// Handle ride type change
function handleRideTypeChange() {
  const distanceText = document.getElementById('distanceValue').textContent;
  const distance = parseFloat(distanceText);
  
  if (!isNaN(distance)) {
    calculateFare(distance);
  }
}

// Handle form submission
document.addEventListener('DOMContentLoaded', function() {
  // Initialize map
  initMap();
  
  // Setup ride type selection
  const rideOptions = document.querySelectorAll('.ride-option');
  rideOptions.forEach(option => {
    option.addEventListener('click', function() {
      rideOptions.forEach(opt => opt.classList.remove('selected'));
      this.classList.add('selected');
      
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;
      
      handleRideTypeChange();
    });
  });
  
  // Handle manual location input
  const pickupInput = document.getElementById('pickup');
  const dropInput = document.getElementById('drop');
  
  // Search for location when user types
  let debounceTimer;
  pickupInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchLocation(this.value, 'pickup');
    }, 1000);
  });
  
  dropInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchLocation(this.value, 'drop');
    }, 1000);
  });
  
  // Handle form submit
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const rideDetails = JSON.parse(localStorage.getItem('currentRide'));
    
    if (!rideDetails) {
      alert('Please select pickup and drop locations first');
      return;
    }
    
    // Navigate to fare summary
    window.location.href = 'fare-summary.html';
  });
});

// Search for location using Nominatim
async function searchLocation(query, type) {
  if (query.length < 3) return;
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      
      // Center map
      map.setView([lat, lng], 16);
      
      if (type === 'pickup') {
        setPickupLocation(lat, lng);
      } else {
        setDropLocation(lat, lng);
      }
    }
  } catch (error) {
    console.error('Search error:', error);
  }
}

// Export functions for global use
window.getCurrentLocation = getCurrentLocation;
