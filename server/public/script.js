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
      localStorage.setItem('isAdminLoggedIn', true); // Save login state
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

// Check login status on page load
document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isAdminLoggedIn')) {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    fetchCars(); // Load cars on refresh
  }
});

// Logout function
function logout() {
  localStorage.removeItem('isAdminLoggedIn'); // Clear login state
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('adminPanel').style.display = 'none';
}

async function fetchCars() {
  try {
    const response = await fetch('/cars');
    const cars = await response.json();
    renderCars(cars);
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
      <h3>${car.name}</h3>
      <p>Price: ${car.price}</p>
      <p>Location: ${car.location}</p>
      <p>Serial Code: ${car.serialCode}</p>
      <div class="image-gallery">
        ${car.images.map(img => `<img src="${img}" width="100">`).join('')}
      </div>
      <input type="date" id="reservationDate-${car._id}">
      <button onclick="addReservation('${car._id}')">Add Reservation</button>
      <button onclick="deleteReservation('${car._id}')">Remove Reservation</button>
      <button onclick="deleteCar('${car._id}')">Delete</button>
      <div id="reservations-${car._id}">
        <h4>Reservations:</h4>
        ${car.reservations.map(date => `<p>${new Date(date).toLocaleDateString()}</p>`).join('')}
      </div>
    `;
    carList.appendChild(li);
  });
}

function renderCarsForUsers(cars) {
  const userCarList = document.getElementById('userCarList');
  if (!userCarList) return; // Ensure we are on the user page

  userCarList.innerHTML = ''; // Clear previous cars

  cars.forEach((car) => {
    const div = document.createElement('div');
    div.className = 'user-car-box';
    div.style.border = '1px solid #ddd';
    div.style.margin = '10px';
    div.style.padding = '10px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    div.style.borderRadius = '5px';

    const message = encodeURIComponent(
      `Hello, I am interested in renting this car:\n\nName: ${car.name}\nPrice: ${car.price}\nLocation: ${car.location}`
    );

    div.innerHTML = `
      <img src="${car.images[0] || 'placeholder.jpg'}" alt="Car Image" style="width: 150px; height: 100px; margin-right: 15px; object-fit: cover; border-radius: 5px;">
      <div>
        <h3>${car.name}</h3>
        <p><strong>Price:</strong> ${car.price}</p>
        <p><strong>Location:</strong> ${car.location}</p>
        <a href="https://wa.me/355694577986?text=${message}" target="_blank" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px;">
          Rent
        </a>
      </div>
    `;
    userCarList.appendChild(div);
  });
}

// Fetch and render cars on page load
async function loadCarsForUsers() {
  try {
    const response = await fetch('/cars');
    const cars = await response.json();
    renderCarsForUsers(cars);
  } catch (error) {
    console.error('Error loading cars for users:', error);
    alert('Failed to load cars. Please try again later.');
  }
}

// Call the function on page load
loadCarsForUsers();

async function addCar() {
  const name = document.getElementById('name').value;
  const price = document.getElementById('price').value;
  const location = document.getElementById('location').value;
  const images = document.getElementById('images').files;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('price', price);
  formData.append('location', location);
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

async function searchCars() {
  const query = document.getElementById('searchBar').value;

  try {
    const response = await fetch(`/admin/search-cars?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
      alert('Search failed. Please try again.');
      return;
    }

    const cars = await response.json();
    renderCars(cars);
  } catch (error) {
    console.error('Error searching for cars:', error);
    alert('Failed to search for cars');
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
