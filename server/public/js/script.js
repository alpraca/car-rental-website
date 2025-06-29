// Global cars array
let cars = [];

// Function to load cars for users
async function loadCarsForUsers() {
  try {
    const response = await fetch('/cars');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    cars = await response.json();
    renderCarsForUsers(cars);
  } catch (error) {
    console.error('Error loading cars:', error);
    document.getElementById('userCarList').innerHTML = `
      <div class="error-message">
        <p>Failed to load cars. Please try again later.</p>
        <button onclick="loadCarsForUsers()">Retry</button>
      </div>
    `;
  }
}

// Function to render cars for users
function renderCarsForUsers(cars) {
  const userCarList = document.getElementById('userCarList');
  if (!userCarList) return;

  userCarList.innerHTML = '';

  cars.forEach((car) => {
    const div = document.createElement('div');
    div.className = 'user-car-box';
    
    const message = encodeURIComponent(
      `Hello, I am interested in renting this car:\n\nName: ${car.name}\nPrice: ${car.price}\nLocation: ${car.location}\nSerial Code: ${car.serialCode}`
    );

    div.innerHTML = `
      <div class="image-gallery" onclick="gallery.openGallery('${car._id}')">
        <img src="${car.images[0] || 'placeholder.jpg'}" alt="${car.name}">
      </div>
      <div class="car-info">
        <h3>${car.name}</h3>
        <p><strong>Price:</strong> ${car.price}</p>
        <p><strong>Location:</strong> ${car.location}</p>
        <a href="https://wa.me/355694577986?text=${message}" 
           target="_blank" 
           class="rent-button">
          Rent
        </a>
      </div>
    `;
    userCarList.appendChild(div);
  });

  // Update location filter options
  updateLocationFilter(cars);
}

// Function to update location filter
function updateLocationFilter(cars) {
  const locationFilter = document.getElementById('locationFilter');
  if (!locationFilter) return;

  // Get unique locations
  const locations = [...new Set(cars.map(car => car.location))];
  
  // Clear existing options except the first one
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  
  // Add location options
  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });
}

// Function to filter cars
function filterUserCars(query) {
  const priceFilter = document.getElementById('priceFilter')?.value;
  const locationFilter = document.getElementById('locationFilter')?.value;
  
  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(query) || 
                         car.location.toLowerCase().includes(query);
    const matchesLocation = !locationFilter || 
                           car.location.toLowerCase() === locationFilter.toLowerCase();
    const carPrice = parseFloat(car.price.replace(/[^0-9.]/g, ''));
    const matchesPrice = !priceFilter || 
                        (priceFilter === 'low' && carPrice <= 50) || 
                        (priceFilter === 'high' && carPrice > 50);

    return matchesSearch && matchesLocation && matchesPrice;
  });

  renderCarsForUsers(filteredCars);
}

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load cars initially
  loadCarsForUsers();

  // Setup price filter
  const priceFilter = document.getElementById('priceFilter');
  if (priceFilter) {
    priceFilter.addEventListener('change', () => {
      filterUserCars(document.getElementById('searchBar1')?.value.toLowerCase() || '');
    });
  }

  // Setup location filter
  const locationFilter = document.getElementById('locationFilter');
  if (locationFilter) {
    locationFilter.addEventListener('change', () => {
      filterUserCars(document.getElementById('searchBar1')?.value.toLowerCase() || '');
    });
  }
}); 