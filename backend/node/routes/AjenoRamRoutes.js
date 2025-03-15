const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/InventarioController.js');

router.get('/', inventarioController.getInventario);
router.put('/estado', inventarioController.updateEstado);

module.exports = router;