const express = require('express');
const router = express.Router();
const recuentoController = require('../controllers/recuentoController');

router.get('/estados', recuentoController.getEstados);
router.post('/filter', recuentoController.getRecuentosByFilter);
router.put('/update-estado', recuentoController.updateEstadoRecuentos);
router.put('/update-values', recuentoController.updateValues);

module.exports = router;