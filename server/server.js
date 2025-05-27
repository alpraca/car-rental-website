// server.js
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session'); // For session management
const nodemailer = require('nodemailer');

const app = express();

// Global lock tracker
const lockedCars = new Set(); // Store locked car IDs

// Middleware setup - IMPORTANT: Order matters!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Change to a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }, // 1 hour session timeout
  })
);

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
  carOwner: { type: String } // Car owner field
});
const Car = mongoose.model('Car', carSchema, 'cars');

// Middleware to check admin session
function requireAdmin(req, res, next) {
  if (req.session.admin) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
}

// API Routes
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.admin = true;
    res.status(200).json({ message: 'Login successful' });
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});

app.get('/is-logged-in', (req, res) => {
  res.json({ loggedIn: !!req.session.admin });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Car routes
app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/add-car', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const imageUrls = req.files.map((file) => '/uploads/' + file.filename);
    const newCar = new Car({
      name: req.body.name,
      price: req.body.price,
      location: req.body.location,
      images: imageUrls,
      serialCode: generateSerialCode(),
      reservations: [],
      carOwner: req.body.carOwner,
    });
    await newCar.save();
    res.json({ message: 'Car added successfully', car: newCar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update car route
app.put('/update-car/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    
    console.log('Updating car:', { id, update });

    // First check if the serial code exists on a different car
    if (update.serialCode) {
      const existingCar = await Car.findOne({ 
        serialCode: update.serialCode,
        _id: { $ne: id } // Exclude current car
      });
      
      if (existingCar) {
        return res.status(400).json({ 
          error: 'Serial code already exists on another car' 
        });
      }
    }

    // Find and update the car with validation
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Validate required fields
    if (!update.name || !update.price || !update.location) {
      return res.status(400).json({ 
        error: 'Name, price, and location are required fields' 
      });
    }

    // Update fields
    car.name = update.name;
    car.price = update.price;
    car.location = update.location;
    car.serialCode = update.serialCode;
    car.carOwner = update.carOwner;

    // Save with validation
    await car.save();

    console.log('Car updated successfully:', car);
    res.json(car);
  } catch (error) {
    console.error('Update error:', error);
    // Check for MongoDB duplicate key error
    if (error.code === 11000) {
      res.status(400).json({ 
        error: 'Serial code must be unique' 
      });
    } else {
      res.status(500).json({ 
        error: error.message || 'Failed to update car' 
      });
    }
  }
});

app.delete('/delete-car/:id', requireAdmin, async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search for cars 
app.get('/admin/search-cars', requireAdmin, async (req, res) => {
  try {
    const { query } = req.query;

    const filter = query
      ? {
          $or: [
            { serialCode: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } },
            { price: { $regex: query, $options: 'i' } },
            { location: { $regex: query, $options: 'i' } },
            { carOwner: { $regex: query, $options: 'i' } },
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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.EMAIL_USER, // Use .env to keep it secure
      pass: process.env.EMAIL_PASS
  }
});

app.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'caralbaniarent@gmail.com',
      subject: 'New Contact Form Message',
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Message:</strong> ${message}</p>`
  };

  try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Error sending email', error: error.message });
  }
});

// Add reservation date with locking
app.post('/car/:id/add-reservation', requireAdmin, async (req, res) => {
  const carId = req.params.id;

  if (lockedCars.has(carId)) {
    return res.status(409).json({ error: 'This car is being updated by another admin. Try again later.' });
  }

  try {
    lockedCars.add(carId);

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const reservationDate = new Date(date);
    if (isNaN(reservationDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    car.reservations.push(reservationDate);
    await car.save();
    res.json({ message: 'Reservation added successfully' });
  } catch (error) {
    console.error('Error adding reservation:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    lockedCars.delete(carId);
  }
});

// Remove reservation date with locking
app.post('/car/:id/remove-reservation', requireAdmin, async (req, res) => {
  const carId = req.params.id;

  if (lockedCars.has(carId)) {
    return res.status(409).json({ error: 'This car is being updated by another admin. Try again later.' });
  }

  try {
    lockedCars.add(carId);

    const { date } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    car.reservations = car.reservations.filter(
      (reservation) => reservation.toISOString() !== new Date(date).toISOString()
    );
    await car.save();
    res.json({ message: 'Reservation removed successfully' });
  } catch (error) {
    console.error('Error removing reservation:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    lockedCars.delete(carId);
  }
});

// Start the server
const PORT = process.env.PORT || 3001;

// Serve static files - IMPORTANT: This should be before the catch-all route
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Generate unique serial code
function generateSerialCode() {
  return 'CAR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}
