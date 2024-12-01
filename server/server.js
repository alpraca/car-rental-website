require('dotenv').config();  // Make sure you have dotenv for environment variables

const express = require('express');
const fs = require('fs');
const app = express();
app.use(express.json());  // To parse JSON bodies

const PORT = process.env.PORT || 3000;

app.post('/add-car', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  console.log('API Key received:', apiKey);

  if (apiKey !== process.env.API_KEY) {
    console.log('Unauthorized request');
    return res.status(403).send('Unauthorized');
  }

  const newCar = req.body;
  console.log('Received new car:', newCar);

  // Use the data folder instead of public for storing cars.json
  fs.readFile('./data/cars.json', 'utf8', (err, data) => {
    if (err) {
      console.log('Error reading cars file:', err);
      return res.status(500).send('Server error');
    }

    const cars = JSON.parse(data);
    cars.push(newCar);

    fs.writeFile('./data/cars.json', JSON.stringify(cars, null, 2), (err) => {
      if (err) {
        console.log('Error writing to cars file:', err);
        return res.status(500).send('Server error');
      }
      console.log('Car added successfully');
      res.send('Car added successfully');
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
