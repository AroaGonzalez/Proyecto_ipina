const express = require('express');
const router = express.Router();
const recuentoController = require('../controllers/recuentoController');

router.get('/estados', recuentoController.getEstados);

module.exports = router;