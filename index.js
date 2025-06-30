// index.js
const express = require('express');
const app = express();
const PORT = 3000;

// Basic GET route
app.get('/', (req, res) => {
  res.send('Hello from API!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
