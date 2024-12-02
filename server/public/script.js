// Load cars from JSON and display them
fetch('./cars.json')
  .then(response => response.json())
  .then(data => {
    const carList = document.getElementById('carList');
    const searchBar = document.getElementById('searchBar');

    function renderCars(cars) {
      carList.innerHTML = '';
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

    renderCars(data);

    searchBar.addEventListener('input', () => {
      const searchQuery = DOMPurify.sanitize(searchBar.value.toLowerCase());
      const filteredCars = data.filter(car => car.name.toLowerCase().includes(searchQuery));
      renderCars(filteredCars);
    });
  });

// Book a car
function bookCar(carName) {
  alert(`Booking request sent for ${carName}.`);
  // Replace with EmailJS or backend API call for booking notifications
}
