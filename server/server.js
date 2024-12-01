app.post('/add-car', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).send('Unauthorized');
  }

  const newCar = req.body;

  fs.readFile('./public/cars.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Server error');
    const cars = JSON.parse(data);
    cars.push(newCar);

    fs.writeFile('./public/cars.json', JSON.stringify(cars, null, 2), (err) => {
      if (err) return res.status(500).send('Server error');
      res.send('Car added successfully');
    });
  });
});
