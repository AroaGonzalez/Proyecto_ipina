const express = require('express');
const router = express.Router();
const propuestaController = require('../controllers/propuestaController');

// Ruta para buscar propuestas con filtros
router.post('/filter', propuestaController.getPropuestasByFilter);

// Rutas para obtener datos auxiliares
router.get('/unidades-compras', propuestaController.getUnidadesCompras);
router.get('/tipos-estado-propuesta', propuestaController.getTiposEstadoPropuesta);

module.exports = router;