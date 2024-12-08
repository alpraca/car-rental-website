require('dotenv').config(); // Ensures environment variables are loaded
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const basicAuth = require('express-basic-auth');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(cors());

// Validate required environment variables
if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS || !process.env.MONGODB_URI || !process.env.API_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Authentication middleware setup for multiple pages
const authMiddleware = basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Unauthorized Access'
});

// Apply authentication to the required pages
app.use('/admin.html', authMiddleware);
app.use('/settings.html', authMiddleware);
app.use('/dashboard.html', authMiddleware);

// Serve static files (public folder)
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads/';
    // Ensure the upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit if database connection fails
  });

// Car schema and model
const carSchema = new mongoose.Schema({
  name: String,
  price: String,
  location: String,
  images: [String]
});

const Car = mongoose.model('Car', carSchema, 'cars');

// Test route to check server status
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Route to add a car (only for authorized API requests)
app.post('/add-car', upload.array('images', 10), async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const imageUrls = req.files.map(file => '/uploads/' + file.filename);

    const newCar = new Car({
      name: req.body.name,
      price: req.body.price,
      location: req.body.location,
      images: imageUrls
    });

    await newCar.save();
    res.send('Car added successfully');
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Server error');
  }
});

// Route to fetch all cars
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// Route to delete a car (admin only)
app.delete('/delete-car/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    car.images.forEach(image => {
      const imagePath = path.join(__dirname, 'public', image);
      fs.unlinkSync(imagePath); // Delete the image files
    });

    await Car.findByIdAndDelete(req.params.id); // Delete car record from database
    res.send('Car deleted successfully');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).send('Server error');
  }
});

// Routes to serve protected admin-related pages
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
