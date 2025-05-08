const express = require('express');
const router = express.Router();
const propuestaController = require('../controllers/propuestaController');

router.post('/filter', propuestaController.getPropuestasByFilter);

router.get('/unidades-compras', propuestaController.getUnidadesCompras);
router.get('/tipos-estado-propuesta', propuestaController.getTiposEstadoPropuesta);
router.put('/delete-propuestas', propuestaController.deletePropuestas);

module.exports = router;