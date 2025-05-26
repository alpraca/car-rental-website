// Gallery functionality
class ImageGallery {
    constructor() {
        this.currentImageIndex = 0;
        this.currentCarImages = [];
        this.cars = [];
        this.modal = document.getElementById('imageModal');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCars();
    }

    setupEventListeners() {
        const closeBtn = document.querySelector('.close-modal');
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeGallery());
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.showPrevImage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.showNextImage());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeGallery();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if (this.modal && this.modal.style.display === 'block') {
                if (e.key === 'Escape') {
                    this.closeGallery();
                } else if (e.key === 'ArrowLeft') {
                    this.showPrevImage();
                } else if (e.key === 'ArrowRight') {
                    this.showNextImage();
                }
            }
        });
    }

    async loadCars() {
        try {
            const response = await fetch('/cars');
            this.cars = await response.json();
            this.renderCars();
        } catch (error) {
            console.error('Error loading cars:', error);
            alert('Failed to load cars. Please try again later.');
        }
    }

    renderCars() {
        const userCarList = document.getElementById('userCarList');
        if (!userCarList) return;

        userCarList.innerHTML = '';

        this.cars.forEach((car) => {
            const div = document.createElement('div');
            div.className = 'user-car-box';
            
            const message = encodeURIComponent(
                `Hello, I am interested in renting this car:\n\nName: ${car.name}\nPrice: ${car.price}\nLocation: ${car.location}\nSerial Code: ${car.serialCode}`
            );

            div.innerHTML = `
                <div class="image-gallery" onclick="gallery.openGallery('${car._id}')">
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

    openGallery(carId) {
        const car = this.cars.find(c => c._id === carId);
        if (!car || !car.images || car.images.length === 0) return;

        this.currentCarImages = car.images;
        this.currentImageIndex = 0;
        this.updateGalleryView();
        
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeGallery() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    updateGalleryView() {
        const mainImage = document.querySelector('.gallery-container img');
        const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
        
        if (!mainImage || !thumbnailsContainer) return;
        
        mainImage.src = this.currentCarImages[this.currentImageIndex];
        
        thumbnailsContainer.innerHTML = '';
        this.currentCarImages.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
            thumbnail.onclick = () => {
                this.currentImageIndex = index;
                this.updateGalleryView();
            };
            thumbnailsContainer.appendChild(thumbnail);
        });
    }

    showNextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentCarImages.length;
        this.updateGalleryView();
    }

    showPrevImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentCarImages.length) % this.currentCarImages.length;
        this.updateGalleryView();
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new ImageGallery();
}); 