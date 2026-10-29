const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMarkers, createMarker, updateMarker, deleteMarker } = require('../controllers/markerController');

// Todas las rutas de marcadores requieren autenticación
router.use(authMiddleware);

router.get('/', getMarkers);
router.post('/', createMarker);
router.put('/:id', updateMarker);
router.delete('/:id', deleteMarker);

module.exports = router;