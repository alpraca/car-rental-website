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
