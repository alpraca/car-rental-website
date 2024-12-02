require('dotenv').config();  // Load environment variables from .env file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());  // Parse incoming JSON request bodies
app.use(cors());          // Enable Cross-Origin Resource Sharing

// Load environment variables
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const API_KEY = process.env.API_KEY;

console.log('MongoDB URI:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define the car schema and model
const carSchema = new mongoose.Schema({
  name: String,
  price: String,
  location: String,
});

const Car = mongoose.model('Car', carSchema, 'cars');

// Routes

// Root route to check server is working
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Route to add a car (Authorization required using API Key)
app.post('/add-car', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const newCar = new Car(req.body);  // Create a new car document from request body
    await newCar.save();  // Save the car document to MongoDB
    res.send('Car added successfully');
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).send('Server error');
  }
});

// Route to get all cars from the database
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();  // Fetch all cars from MongoDB
    res.json(cars);  // Respond with the cars as JSON
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
