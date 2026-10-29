const Marker = require('../models/Marker');
const { markers } = require('../store');

// Obtener marcadores del usuario autenticado
const getMarkers = (req, res) => {
  const userMarkers = markers.filter(m => m.userId === req.user.id);
  res.json(userMarkers);
};

const createMarker = (req, res) => {
  const { lat, lng, label, color } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ message: 'lat y lng son requeridos' });
  }

  const marker = new Marker(req.user.id, lat, lng, label, color);
  markers.push(marker);

  res.status(201).json(marker);
};

const updateMarker = (req, res) => {
  const { id } = req.params;
  const { lat, lng, label, color } = req.body;

  const marker = markers.find(m => m.id === id && m.userId === req.user.id);
  if (!marker) {
    return res.status(404).json({ message: 'Marcador no encontrado' });
  }

  if (lat !== undefined) marker.lat = lat;
  if (lng !== undefined) marker.lng = lng;
  if (label !== undefined) marker.label = label;
  if (color !== undefined) marker.color = color;
  marker.updatedAt = new Date();

  res.json(marker);
};

// Eliminar marcador
const deleteMarker = (req, res) => {
  const { id } = req.params;

  const index = markers.findIndex(m => m.id === id && m.userId === req.user.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Marcador no encontrado' });
  }

  markers.splice(index, 1);
  res.json({ message: 'Marcador eliminado' });
};

module.exports = { getMarkers, createMarker, updateMarker, deleteMarker };