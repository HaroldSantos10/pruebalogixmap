require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const markerRoutes = require('./routes/markerRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/config', (req, res) => {
  res.json({ stadiaKey: process.env.STADIA_API_KEY });
});

app.use('/api/auth', authRoutes);
app.use('/api/markers', markerRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;