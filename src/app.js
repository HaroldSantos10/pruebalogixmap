require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');

console.log('Cargando authRoutes...');
const authRoutes = require('./routes/authRoutes');
console.log('authRoutes:', authRoutes);

console.log('Cargando markerRoutes...');
const markerRoutes = require('./routes/markerRoutes');
console.log('markerRoutes:', markerRoutes);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/markers', markerRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;