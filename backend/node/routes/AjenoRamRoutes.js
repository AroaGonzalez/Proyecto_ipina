const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/InventarioController.js');
const ajenoController = require('../controllers/ajenoController.js');

router.get('/', inventarioController.getInventario);
router.put('/estado', inventarioController.updateEstado);
router.get('/search', ajenoController.searchAjenos);
router.post('/create', ajenoController.createAjenos);
router.get('/all', ajenoController.getAllAjenos);

module.exports = router;