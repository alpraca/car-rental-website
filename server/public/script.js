// Load cars from backend and display them
fetch('http://localhost:3000/cars')  // Fetch from backend
  .then(response => response.json())  // Parse the JSON response
  .then(data => {
    const carList = document.getElementById('carList');
    const searchBar = document.getElementById('searchBar');

    // Function to render the cars
    function renderCars(cars) {
      carList.innerHTML = '';  // Clear the current list of cars
      cars.forEach(car => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <h3>${DOMPurify.sanitize(car.name)}</h3>
          <p>Price: ${DOMPurify.sanitize(car.price)}</p>
          <p>Location: ${DOMPurify.sanitize(car.location)}</p>
          <div class="image-gallery">
            ${car.images.map(img => `<img src="${img}" width="100" height="100" onclick="viewImage('${img}')">`).join('')}
          </div>
        `;
        
        // Check if the user is an admin by checking the URL (admin page will show delete buttons)
        if (window.location.pathname.includes('admin.html')) { // Check if on the admin page
          card.innerHTML += `<button onclick="deleteCar('${car._id}')">Delete Car</button>`;
        }
        
        carList.appendChild(card);
      });
    }

    renderCars(data);

    // Event listener for search bar to filter cars based on name
    searchBar.addEventListener('input', function () {
      const filteredCars = data.filter(car => car.name.toLowerCase().includes(searchBar.value.toLowerCase()));
      renderCars(filteredCars);
    });
  })
  .catch(error => {
    console.error('Error fetching cars:', error);
    alert('Failed to load cars');
  });

// Function to view images in a larger view
function viewImage(imageUrl) {
  window.open(imageUrl, '_blank');
}

// Function to delete a car (called from the admin panel only)
function deleteCar(carId) {
  const apiKey = 'd3c661fb937d9a1fd4a31ec6f3b48aa0';  // Your API key
  fetch(`http://localhost:3000/delete-car/${carId}`, {
    method: 'DELETE',
    headers: {
      'x-api-key': apiKey
    }
  })
  .then(response => {
    if (response.ok) {
      alert('Car deleted successfully!');
      location.reload();  // Reload the page to update the car list
    } else {
      alert('Failed to delete car');
    }
  })
  .catch(error => {
    console.error('Error deleting car:', error);
    alert('Error occurred while deleting the car');
  });
}
