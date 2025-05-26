// Admin functionality
class AdminPanel {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCars();
    }

    setupEventListeners() {
        // Search functionality
        const searchBar = document.getElementById('searchBar1');
        if (searchBar) {
            searchBar.addEventListener('input', (e) => this.filterCars(e.target.value));
        }

        // Price filter
        const priceFilter = document.getElementById('priceFilter');
        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => this.filterCars());
        }

        // Location filter
        const locationFilter = document.getElementById('locationFilter');
        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => this.filterCars());
        }
    }

    async loadCars() {
        try {
            const response = await fetch('/cars');
            const cars = await response.json();
            this.renderCars(cars);
            this.updateLocationFilter(cars);
        } catch (error) {
            console.error('Error loading cars:', error);
            alert('Failed to load cars. Please try again later.');
        }
    }

    updateLocationFilter(cars) {
        const locationFilter = document.getElementById('locationFilter');
        if (!locationFilter) return;

        const locations = [...new Set(cars.map(car => car.location))];
        locationFilter.innerHTML = '<option value="">All Locations</option>' +
            locations.map(location => `<option value="${location}">${location}</option>`).join('');
    }

    renderCars(cars) {
        const carList = document.getElementById('carList');
        if (!carList) return;

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
                            <button class="edit-btn" onclick="admin.toggleEdit('${car._id}')">Edit</button>
                            <button class="save-btn" onclick="admin.saveChanges('${car._id}')" style="display: none;">Save</button>
                            <button class="cancel-btn" onclick="admin.cancelEdit('${car._id}')" style="display: none;">Cancel</button>
                            <button class="delete-btn" onclick="admin.deleteCar('${car._id}')">Delete</button>
                        </div>

                        <div class="reservation-section">
                            <h4>Add Reservation</h4>
                            <div class="reservation-inputs">
                                <input type="date" id="reservationDate-${car._id}" class="date-input">
                                <button class="add-reservation-btn" onclick="admin.addReservation('${car._id}')">Add</button>
                                <button class="remove-reservation-btn" onclick="admin.deleteReservation('${car._id}')">Remove</button>
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

    filterCars(query = '') {
        const priceFilter = document.getElementById('priceFilter')?.value;
        const locationFilter = document.getElementById('locationFilter')?.value;
        const searchQuery = query.toLowerCase();

        const carList = document.getElementById('carList');
        if (!carList) return;

        const cars = carList.querySelectorAll('.card');
        cars.forEach(car => {
            const carName = car.querySelector('h3').textContent.toLowerCase();
            const carLocation = car.querySelector('.edit-group:nth-child(3) .display-value').textContent.toLowerCase();
            const carPrice = parseFloat(car.querySelector('.edit-group:nth-child(2) .display-value').textContent.replace('Price: ', ''));

            const matchesSearch = carName.includes(searchQuery) || carLocation.includes(searchQuery);
            const matchesLocation = !locationFilter || carLocation.includes(locationFilter.toLowerCase());
            const matchesPrice = !priceFilter || 
                (priceFilter === 'low' && carPrice <= 50) || 
                (priceFilter === 'high' && carPrice > 50);

            car.style.display = matchesSearch && matchesLocation && matchesPrice ? 'block' : 'none';
        });
    }

    toggleEdit(carId) {
        const carElement = document.getElementById(`car-${carId}`);
        if (!carElement) return;

        const editGroups = carElement.getElementsByClassName('edit-group');
        const editBtn = carElement.querySelector('.edit-btn');
        const saveBtn = carElement.querySelector('.save-btn');
        const cancelBtn = carElement.querySelector('.cancel-btn');

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

    async saveChanges(carId) {
        const carElement = document.getElementById(`car-${carId}`);
        if (!carElement) return;

        const editGroups = carElement.getElementsByClassName('edit-group');
        
        const name = editGroups[0].querySelector('.edit-input').value.trim();
        const price = editGroups[1].querySelector('.edit-input').value.trim();
        const location = editGroups[2].querySelector('.edit-input').value.trim();
        const serialCode = editGroups[3].querySelector('.edit-input').value.trim();
        const carOwner = editGroups[4].querySelector('.edit-input').value.trim();

        if (!name || !price || !location || !serialCode) {
            alert('Name, price, location, and serial code are required fields');
            return;
        }

        try {
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

            if (!response.ok) {
                throw new Error('Failed to update car');
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
            this.loadCars();
        } catch (error) {
            console.error('Error updating car:', error);
            alert(error.message);
        }
    }

    cancelEdit(carId) {
        const carElement = document.getElementById(`car-${carId}`);
        if (!carElement) return;

        const editGroups = carElement.getElementsByClassName('edit-group');
        const editBtn = carElement.querySelector('.edit-btn');
        const saveBtn = carElement.querySelector('.save-btn');
        const cancelBtn = carElement.querySelector('.cancel-btn');

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

    async deleteCar(carId) {
        if (!confirm('Are you sure you want to delete this car?')) return;

        try {
            const response = await fetch(`/delete-car/${carId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete car');
            
            alert('Car deleted successfully');
            this.loadCars();
        } catch (error) {
            console.error('Error deleting car:', error);
            alert(error.message);
        }
    }

    async addReservation(carId) {
        const dateInput = document.getElementById(`reservationDate-${carId}`);
        if (!dateInput || !dateInput.value) {
            alert('Please select a date');
            return;
        }

        try {
            const response = await fetch(`/car/${carId}/add-reservation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateInput.value })
            });

            if (!response.ok) throw new Error('Failed to add reservation');
            
            alert('Reservation added successfully');
            this.loadCars();
        } catch (error) {
            console.error('Error adding reservation:', error);
            alert(error.message);
        }
    }

    async deleteReservation(carId) {
        const dateInput = document.getElementById(`reservationDate-${carId}`);
        if (!dateInput || !dateInput.value) {
            alert('Please select a date');
            return;
        }

        try {
            const response = await fetch(`/car/${carId}/remove-reservation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: dateInput.value })
            });

            if (!response.ok) throw new Error('Failed to remove reservation');
            
            alert('Reservation removed successfully');
            this.loadCars();
        } catch (error) {
            console.error('Error removing reservation:', error);
            alert(error.message);
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminPanel();
}); 