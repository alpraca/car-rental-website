// Gallery functionality
class ImageGallery {
    constructor() {
        this.currentImageIndex = 0;
        this.currentCarImages = [];
        this.cars = [];
        this.modal = document.getElementById('imageModal');
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
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showPrevImage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNextImage();
            });
        }

        // Close modal when clicking outside the image
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeGallery();
                }
            });
        }

        // Keyboard navigation
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
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    updateGalleryView() {
        const mainImage = document.querySelector('.gallery-container img');
        const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
        
        if (!mainImage || !thumbnailsContainer || !this.currentCarImages.length) return;
        
        // Ensure currentImageIndex is within bounds
        this.currentImageIndex = Math.max(0, Math.min(this.currentImageIndex, this.currentCarImages.length - 1));
        
        // Update main image
        mainImage.src = this.currentCarImages[this.currentImageIndex];
        
        // Update thumbnails
        thumbnailsContainer.innerHTML = '';
        this.currentCarImages.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.alt = `Thumbnail ${index + 1}`;
            thumbnail.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
            thumbnail.onclick = (e) => {
                e.stopPropagation();
                this.currentImageIndex = index;
                this.updateGalleryView();
            };
            thumbnailsContainer.appendChild(thumbnail);
        });

        // Update navigation buttons visibility
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.style.visibility = this.currentCarImages.length > 1 ? 'visible' : 'hidden';
        }
        if (nextBtn) {
            nextBtn.style.visibility = this.currentCarImages.length > 1 ? 'visible' : 'hidden';
        }
    }

    showNextImage() {
        if (!this.currentCarImages.length) return;
        
        this.currentImageIndex++;
        if (this.currentImageIndex >= this.currentCarImages.length) {
            this.currentImageIndex = 0;
        }
        this.updateGalleryView();
    }

    showPrevImage() {
        if (!this.currentCarImages.length) return;
        
        this.currentImageIndex--;
        if (this.currentImageIndex < 0) {
            this.currentImageIndex = this.currentCarImages.length - 1;
        }
        this.updateGalleryView();
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new ImageGallery();
    window.gallery.init();
}); 