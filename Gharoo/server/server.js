const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Serve API example
app.get('/api/health', (req, res) => {
  res.json({status: 'ok'});
});

// Serve static files from client/dist if it exists
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  const indexHtml = path.join(distPath, 'index.html');
  res.sendFile(indexHtml, err => {
    if (err) {
      res.status(404).send('Not found. Build the client and try again.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
