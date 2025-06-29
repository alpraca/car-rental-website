// script.js
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      document.getElementById('loginForm').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      fetchCars();
    } else {
      alert('Invalid username or password');
    }
  } catch (error) {
    console.error('Error during login:', error);
  }
}

async function fetchCars() {
  try {
    const response = await fetch('/cars');
    const cars = await response.json();
    renderCars(cars);
    renderCarsForUsers(cars); // Also render cars for the user interface
  } catch (error) {
    console.error('Error fetching cars:', error);
  }
}

function renderCars(cars) {
  const carList = document.getElementById('carList');
  carList.innerHTML = '';
  cars.forEach((car) => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="car-details" id="car-${car._id}">
        <div class="car-images">
          ${car.images && car.images.length > 0 ? 
            `<div class="image-gallery">
              ${car.images.map(img => `
                <div class="image-container">
                  <img src="${img}" alt="Car Image" class="car-image">
                </div>
              `).join('')}
            </div>` : 
            '<p>No images available</p>'
          }
        </div>
        
        <div class="car-info">
        <div class="edit-group">
          <h3 class="display-value">${car.name}</h3>
          <input type="text" class="edit-input" value="${car.name}" style="display: none;">
        </div>
        
        <div class="edit-group">
          <p class="display-value">Price: ${car.price}</p>
          <input type="text" class="edit-input" value="${car.price}" style="display: none;">
        </div>
        
        <div class="edit-group">
          <p class="display-value">Location: ${car.location}</p>
          <input type="text" class="edit-input" value="${car.location}" style="display: none;">
        </div>
        
        <div class="edit-group">
          <p class="display-value">Serial Code: ${car.serialCode}</p>
          <input type="text" class="edit-input" value="${car.serialCode}" style="display: none;">
        </div>
        
        <div class="edit-group">
          <p class="display-value">Car Owner: ${car.carOwner || 'Not specified'}</p>
          <input type="text" class="edit-input" value="${car.carOwner || ''}" style="display: none;">
        </div>
        
        <div class="button-group">
          <button class="edit-btn" onclick="toggleEdit('${car._id}')">Edit</button>
          <button class="save-btn" onclick="saveChanges('${car._id}')" style="display: none;">Save</button>
          <button class="cancel-btn" onclick="cancelEdit('${car._id}')" style="display: none;">Cancel</button>
            <button class="delete-btn" onclick="deleteCar('${car._id}')">Delete</button>
        </div>

        <div class="reservation-section">
            <h4>Add Reservation</h4>
            <div class="reservation-inputs">
              <input type="date" id="reservationDate-${car._id}" class="date-input">
              <button class="add-reservation-btn" onclick="addReservation('${car._id}')">Add</button>
              <button class="remove-reservation-btn" onclick="deleteReservation('${car._id}')">Remove</button>
            </div>
            <div id="reservations-${car._id}" class="reservations-list">
              <h4>Current Reservations:</h4>
              ${car.reservations && car.reservations.length > 0 ? 
                car.reservations.map(date => `<p>${new Date(date).toLocaleDateString()}</p>`).join('') :
                '<p>No reservations</p>'
              }
            </div>
          </div>
        </div>
      </div>
    `;
    carList.appendChild(li);
  });
}

// Global variables for image gallery
let currentImageIndex = 0;
let currentCarImages = [];
let cars = []; // Global cars array

// Update the loadCarsForUsers function to store cars globally
async function loadCarsForUsers() {
  try {
    const response = await fetch('/cars');
    cars = await response.json(); // Store cars globally
    renderCarsForUsers(cars);
  } catch (error) {
    console.error('Error loading cars for users:', error);
    alert('Failed to load cars. Please try again later.');
  }
}

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
      <div class="image-gallery" onclick="openImageGallery('${car._id}')">
        <img src="${car.images[0] || 'placeholder.jpg'}" alt="Car Image">
      </div>
      <div class="car-info">
        <h3>${car.name}</h3>
        <p><strong>Price:</strong> ${car.price}</p>
        <p><strong>Location:</strong> ${car.location}</p>
        <a href="https://wa.me/355694577986?text=${message}" target="_blank" class="rent-button">
          Rent
        </a>
      </div>
    `;
    userCarList.appendChild(div);
  });
}

function openImageGallery(carId) {
  console.log('Opening gallery for car:', carId); // Debug log
  const car = cars.find(c => c._id === carId);
  console.log('Found car:', car); // Debug log
  
  if (!car || !car.images || car.images.length === 0) {
    console.log('No images found for car'); // Debug log
    return;
  }

  currentCarImages = car.images;
  currentImageIndex = 0;
  updateGalleryView();
  
  const modal = document.getElementById('imageModal');
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeImageGallery() {
  const modal = document.getElementById('imageModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function updateGalleryView() {
  const mainImage = document.querySelector('.gallery-container img');
  const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
  
  if (!mainImage || !thumbnailsContainer) {
    console.error('Gallery elements not found');
    return;
  }
  
  // Update main image
  mainImage.src = currentCarImages[currentImageIndex];
  
  // Update thumbnails
  thumbnailsContainer.innerHTML = '';
  currentCarImages.forEach((image, index) => {
    const thumbnail = document.createElement('img');
    thumbnail.src = image;
    thumbnail.className = `thumbnail ${index === currentImageIndex ? 'active' : ''}`;
    thumbnail.onclick = () => {
      currentImageIndex = index;
      updateGalleryView();
    };
    thumbnailsContainer.appendChild(thumbnail);
  });
}

function showNextImage() {
  currentImageIndex = (currentImageIndex + 1) % currentCarImages.length;
  updateGalleryView();
}

function showPrevImage() {
  currentImageIndex = (currentImageIndex - 1 + currentCarImages.length) % currentCarImages.length;
  updateGalleryView();
}

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load cars when the page loads
loadCarsForUsers();

  // Set up gallery controls
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.close-modal');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (closeBtn) {
    closeBtn.addEventListener('click', closeImageGallery);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', showPrevImage);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', showNextImage);
  }

  // Close modal when clicking outside the image
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeImageGallery();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (modal && modal.style.display === 'block') {
      if (e.key === 'Escape') {
        closeImageGallery();
      } else if (e.key === 'ArrowLeft') {
        showPrevImage();
      } else if (e.key === 'ArrowRight') {
        showNextImage();
      }
    }
  });
});

// Listen for user search input
document.getElementById('searchBar1').addEventListener('input', function () {
  const query = this.value.toLowerCase();
  filterUserCars(query);
});

// Function to filter cars for the user page
function filterUserCars(query) {
  const userCarList = document.getElementById('userCarList');
  const allCars = userCarList.querySelectorAll('.user-car-box');
  
  allCars.forEach(carDiv => {
    const carName = carDiv.querySelector('h3').innerText.toLowerCase();
    const carLocation = carDiv.querySelector('p:nth-child(3)').innerText.toLowerCase();

    // Show or hide car based on search query
    if (carName.includes(query) || carLocation.includes(query)) {
      carDiv.style.display = 'flex';
    } else {
      carDiv.style.display = 'none';
    }
  });
}

async function addCar() {
  const name = document.getElementById('name').value;
  const price = document.getElementById('price').value;
  const location = document.getElementById('location').value;
  const carOwner = document.getElementById('carOwner').value;
  const images = document.getElementById('images').files;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('location', location);
  formData.append('carOwner', carOwner);
  for (let i = 0; i < images.length; i++) {
    formData.append('images', images[i]);
  }

  try {
    const response = await fetch('/add-car', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      alert('Car added successfully');
      fetchCars();
    } else {
      alert('Failed to add car');
    }
  } catch (error) {
    console.error('Error adding car:', error);
  }
}

async function deleteCar(carId) {
  try {
    const response = await fetch(`/delete-car/${carId}`, { method: 'DELETE' });

    if (response.ok) {
      alert('Car deleted successfully');
      fetchCars();
    } else {
      alert('Failed to delete car');
    }
  } catch (error) {
    console.error('Error deleting car:', error);
  }
}

async function addReservation(carId) {
  const date = document.getElementById(`reservationDate-${carId}`).value;

  if (!date) {
    alert('Please select a date');
    return;
  }

  try {
    const response = await fetch(`/car/${carId}/add-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });

    if (response.ok) {
      alert('Reservation added successfully');
      fetchCars();
    } else {
      alert('Failed to add reservation');
    }
  } catch (error) {
    console.error('Error adding reservation:', error);
  }
}

async function deleteReservation(carId) {
  const date = document.getElementById(`reservationDate-${carId}`).value;

  if (!date) {
    alert('Please select a date');
    return;
  }

  try {
    const response = await fetch(`/car/${carId}/remove-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });

    if (response.ok) {
      alert('Reservation removed successfully');
      fetchCars();
    } else {
      alert('Failed to remove reservation');
    }
  } catch (error) {
    console.error('Error removing reservation:', error);
  }
}

// Function to toggle edit mode
function toggleEdit(carId) {
  const carElement = document.getElementById(`car-${carId}`);
  const editGroups = carElement.getElementsByClassName('edit-group');
  const editBtn = carElement.querySelector('.edit-btn');
  const saveBtn = carElement.querySelector('.save-btn');
  const cancelBtn = carElement.querySelector('.cancel-btn');

  // Store original values for cancel functionality
  Array.from(editGroups).forEach(group => {
    const displayEl = group.querySelector('.display-value');
    const inputEl = group.querySelector('.edit-input');
    inputEl.dataset.original = inputEl.value;
    displayEl.style.display = 'none';
    inputEl.style.display = 'block';
  });

  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
  cancelBtn.style.display = 'inline-block';
}

// Function to save changes
async function saveChanges(carId) {
  const carElement = document.getElementById(`car-${carId}`);
  const editGroups = carElement.getElementsByClassName('edit-group');
  
  // Get values from input fields
  const name = editGroups[0].querySelector('.edit-input').value.trim();
  const price = editGroups[1].querySelector('.edit-input').value.trim();
  const location = editGroups[2].querySelector('.edit-input').value.trim();
  const serialCode = editGroups[3].querySelector('.edit-input').value.trim();
  const carOwner = editGroups[4].querySelector('.edit-input').value.trim();

  // Validate required fields
  if (!name || !price || !location || !serialCode) {
    alert('Name, price, location, and serial code are required fields');
    return;
  }

  try {
    // First check if we're still logged in
    const loginCheck = await fetch('/is-logged-in');
    if (!loginCheck.ok) {
      throw new Error('Failed to verify login status');
    }
    
    const loginStatus = await loginCheck.json();
    if (!loginStatus.loggedIn) {
      alert('Your session has expired. Please log in again.');
      window.location.reload();
      return;
    }

    const response = await fetch(`/update-car/${carId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        price,
        location,
        serialCode,
        carOwner
      })
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      const responseText = await response.text();
      console.error('Response text:', responseText);
      throw new Error('Server returned invalid response. Please try again.');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update car');
    }

    // Update the display
    editGroups[0].querySelector('.display-value').textContent = name;
    editGroups[1].querySelector('.display-value').textContent = `Price: ${price}`;
    editGroups[2].querySelector('.display-value').textContent = `Location: ${location}`;
    editGroups[3].querySelector('.display-value').textContent = `Serial Code: ${serialCode}`;
    editGroups[4].querySelector('.display-value').textContent = `Car Owner: ${carOwner || 'Not specified'}`;

    // Hide all edit inputs
    Array.from(editGroups).forEach(group => {
      group.querySelector('.display-value').style.display = 'block';
      group.querySelector('.edit-input').style.display = 'none';
    });

    // Hide edit buttons
    carElement.querySelector('.edit-btn').style.display = 'inline-block';
    carElement.querySelector('.save-btn').style.display = 'none';
    carElement.querySelector('.cancel-btn').style.display = 'none';

    alert('Car details updated successfully');
    
    // Refresh the car list
    fetchCars();
  } catch (error) {
    console.error('Error updating car:', error);
    alert(error.message);
    
    // Keep the form in edit mode if there's an error
    Array.from(editGroups).forEach(group => {
      group.querySelector('.display-value').style.display = 'none';
      group.querySelector('.edit-input').style.display = 'block';
    });
    
    carElement.querySelector('.edit-btn').style.display = 'none';
    carElement.querySelector('.save-btn').style.display = 'inline-block';
    carElement.querySelector('.cancel-btn').style.display = 'inline-block';
  }
}

// Function to cancel edit
function cancelEdit(carId) {
  const carElement = document.getElementById(`car-${carId}`);
  const editGroups = carElement.getElementsByClassName('edit-group');
  const editBtn = carElement.querySelector('.edit-btn');
  const saveBtn = carElement.querySelector('.save-btn');
  const cancelBtn = carElement.querySelector('.cancel-btn');

  // Restore original values
  Array.from(editGroups).forEach(group => {
    const displayEl = group.querySelector('.display-value');
    const inputEl = group.querySelector('.edit-input');
    inputEl.value = inputEl.dataset.original;
    displayEl.style.display = 'block';
    inputEl.style.display = 'none';
  });

  editBtn.style.display = 'inline-block';
  saveBtn.style.display = 'none';
  cancelBtn.style.display = 'none';
}

// Update the createCarCard function to include gallery functionality
function createCarCard(car) {
  // ... existing car card creation code ...
  
  // Update the image container to be clickable
  const imageContainer = carCard.querySelector('.image-gallery');
  imageContainer.onclick = () => openImageGallery(car.id);
  
  // ... rest of existing car card creation code ...
}
