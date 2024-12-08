require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const basicAuth = require('express-basic-auth'); // Add this for basic authentication
const multer = require('multer');  // Import multer for file uploads
const fs = require('fs'); // To handle file deletions

const app = express();
app.use(express.json()); // To parse incoming JSON requests
app.use(cors()); // Enable CORS for all routes

// Basic Authentication Middleware for Admin Routes
app.use('/admin.html', basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS }, // Username and password from .env
  challenge: true,  // This ensures that the browser will show a login prompt
  unauthorizedResponse: 'Unauthorized Access'  // Custom unauthorized message
}));

// Serve static files (like HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer storage for car images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate unique file name
  }
});

const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define a schema for the car with an array of image URLs
const carSchema = new mongoose.Schema({
  name: String,
  price: String,
  location: String,
  images: [String]  // Array of image URLs
});

const Car = mongoose.model('Car', carSchema, 'cars');

// Routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Add a new car with images via POST
app.post('/add-car', upload.array('images', 10), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const imageUrls = req.files.map(file => '/uploads/' + file.filename);  // Store file paths

    const newCar = new Car({
      name: req.body.name,
      price: req.body.price,
      location: req.body.location,
      images: imageUrls  // Save image URLs
    });

    await newCar.save();
    res.send('Car added successfully');
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Server error');
  }
});

// Get all cars with images
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// Delete a car by ID
app.delete('/delete-car/:id', async (req, res) => {
  const carId = req.params.id;

  try {
    const car = await Car.findByIdAndDelete(carId);
    if (!car) {
      return res.status(404).send('Car not found');
    }

    // Delete the images from the server
    car.images.forEach(imagePath => {
      const imagePathToDelete = path.join(__dirname, 'public', imagePath);
      fs.unlink(imagePathToDelete, (err) => {
        if (err) {
          console.error('Error deleting image:', err);
        }
      });
    });

    res.send('Car deleted successfully');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).send('Server error');
  }
});

// Serve the admin panel at /admin.html
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
