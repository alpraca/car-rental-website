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
          <button onclick="bookCar('${DOMPurify.sanitize(car.name)}')">Book Now</button>
        `;
        carList.appendChild(card);
      });
    }

    // Render the cars once data is fetched
    renderCars(data);

    // Search filter functionality
    searchBar.addEventListener('input', () => {
      const searchQuery = DOMPurify.sanitize(searchBar.value.toLowerCase());
      const filteredCars = data.filter(car => car.name.toLowerCase().includes(searchQuery));
      renderCars(filteredCars);  // Update the car list based on the search query
    });
  })
  .catch(error => {
    console.error('Error fetching cars:', error);
    alert('Failed to load cars.');
  });

// Book a car
function bookCar(carName) {
  alert(`Booking request sent for ${carName}.`);
  // Replace with EmailJS or backend API call for booking notifications
}
