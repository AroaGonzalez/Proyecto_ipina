// backend/node/routes/eventoRoutes.js
const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');

router.get('/filter', eventoController.getEventos);

module.exports = router;