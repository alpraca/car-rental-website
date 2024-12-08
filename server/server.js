require('dotenv').config();
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

app.use('/admin.html', basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Unauthorized Access'
}));

app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

const carSchema = new mongoose.Schema({
  name: String,
  price: String,
  location: String,
  images: [String]
});

const Car = mongoose.model('Car', carSchema, 'cars');

app.get('/', (req, res) => {
  res.send('Server is running!');
});

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

app.get('/cars', async (req, res) => {
  try {
    const cars = await Car.find();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).send('Server error');
  }
});

// DELETE route for admin to delete a car by ID
app.delete('/delete-car/:id', basicAuth({
  users: { [process.env.ADMIN_USER]: process.env.ADMIN_PASS },
  challenge: true,
  unauthorizedResponse: 'Unauthorized Access'
}), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    car.images.forEach(image => {
      const imagePath = path.join(__dirname, 'public', image);
      fs.unlinkSync(imagePath);
    });

    await Car.findByIdAndDelete(req.params.id);
    res.send('Car deleted successfully');
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).send('Server error');
  }
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
