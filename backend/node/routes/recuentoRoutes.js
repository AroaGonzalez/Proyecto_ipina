const express = require('express');
const router = express.Router();
const recuentoController = require('../controllers/recuentoController');

router.get('/estados', recuentoController.getEstados);
router.post('/filter', recuentoController.getRecuentosByFilter);

module.exports = router;