// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Configure file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Car schema and model
const carSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true },
  images: [String],
  serialCode: { type: String, unique: true, required: true }, // Unique serial code
  reservations: [{ type: Date }], // Array of reservation dates
});
const Car = mongoose.model('Car', carSchema, 'cars');

// Generate unique serial code
const generateSerialCode = () => {
  return 'CAR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Global lock tracker
let lockedCars = new Set(); // Store locked car IDs

// Authentication middleware
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    res.status(200).send({ message: 'Login successful' });
  } else {
    res.status(403).send({ message: 'Invalid username or password' });
  }
});

// Add a car
app.post('/add-car', upload.array('images', 10), async (req, res) => {
  try {
    const imageUrls = req.files.map((file) => '/uploads/' + file.filename);

    const newCar = new Car({
      name: req.body.name,
      price: req.body.price,
      location: req.body.location,
      images: imageUrls,
      serialCode: generateSerialCode(),
      reservations: [],
    });

    await newCar.save();
    res.send('Car added successfully');
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Server error');
  }
});

// Fetch all cars
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find({}, 'name price location images serialCode reservations'); // Include all fields for admin
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// Search for cars based on admin input
app.get('/admin/search-cars', async (req, res) => {
  try {
    const { query } = req.query;

    // If no query is provided, return all cars
    const filter = query
      ? {
          $or: [
            { serialCode: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { price: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } },
          ],
        }
      : {};

    const cars = await Car.find(filter);
    res.json(cars);
  } catch (error) {
    console.error('Error searching for cars:', error);
    res.status(500).send('Server error');
  }
});

// Add reservation date with locking
app.post('/car/:id/add-reservation', async (req, res) => {
  const carId = req.params.id;

  // Check if the car is locked
  if (lockedCars.has(carId)) {
    return res.status(409).send('This car is being updated by another admin. Try again later.');
  }

  try {
    // Lock the car
    lockedCars.add(carId);

    const { date } = req.body;
    if (!date) return res.status(400).send('Date is required');

    const car = await Car.findById(carId);
    if (!car) return res.status(404).send('Car not found');

    const reservationDate = new Date(date);
    if (isNaN(reservationDate.getTime())) {
      return res.status(400).send('Invalid date format');
    }

    car.reservations.push(reservationDate); // Add reservation
    await car.save(); // Save changes to the database
    res.send('Reservation added successfully');
  } catch (error) {
    console.error('Error adding reservation:', error);
    res.status(500).send('Server error');
  } finally {
    // Unlock the car
    lockedCars.delete(carId);
  }
});

// Remove reservation date with locking
app.post('/car/:id/remove-reservation', async (req, res) => {
  const carId = req.params.id;

  // Check if the car is locked
  if (lockedCars.has(carId)) {
    return res.status(409).send('This car is being updated by another admin. Try again later.');
  }

  try {
    // Lock the car
    lockedCars.add(carId);

    const { date } = req.body;
    if (!date) return res.status(400).send('Date is required');

    const car = await Car.findById(carId);
    if (!car) return res.status(404).send('Car not found');

    car.reservations = car.reservations.filter(
      (reservation) => reservation.toISOString() !== new Date(date).toISOString()
    );
    await car.save();
    res.send('Reservation removed successfully');
  } catch (error) {
    console.error('Error removing reservation:', error);
    res.status(500).send('Server error');
  } finally {
    // Unlock the car
    lockedCars.delete(carId);
  }
});

// Delete a car with locking
app.delete('/delete-car/:id', async (req, res) => {
  const carId = req.params.id;

  // Check if the car is locked
  if (lockedCars.has(carId)) {
    return res.status(409).send('This car is being updated by another admin. Try again later.');
  }

  try {
    // Lock the car
    lockedCars.add(carId);

    const car = await Car.findById(carId);
    if (!car) return res.status(404).send('Car not found');

    if (car.images) {
      car.images.forEach((image) => {
        const imagePath = path.join(__dirname, 'public', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Car.findByIdAndDelete(carId);
    res.send('Car deleted successfully');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).send('Server error');
  } finally {
    // Unlock the car
    lockedCars.delete(carId);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
