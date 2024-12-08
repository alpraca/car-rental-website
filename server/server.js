require('dotenv').config();  // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const basicAuth = require('express-basic-auth'); // Add this for basic authentication

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

const PORT = process.env.PORT || 3000;

// Log the MongoDB URI to verify it's loaded correctly
console.log('MongoDB URI:', process.env.MONGODB_URI);

// Connect to MongoDB using the URI from your .env file
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define a schema for the car
const carSchema = new mongoose.Schema({
  name: String,
  price: String,
  location: String,
});

// Create a model for the car using the schema
const Car = mongoose.model('Car', carSchema, 'cars');

// Routes
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Add a new car via POST
app.post('/add-car', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const newCar = new Car(req.body);
    await newCar.save(); // Save the new car to the database
    res.send('Car added successfully');
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Server error');
  }
});

// Get all cars via GET
// Get all cars
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();  // Fetch all cars from the database
    res.json(cars);  // Send the cars as a JSON response
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// Serve the admin panel at /admin.html
app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
