// backend/node/routes/tiendaRoutes.js
const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');

router.get('/', tiendaController.getTiendas);
router.get('/mercados', tiendaController.getMercados);
router.get('/grupos-cadena', tiendaController.getGruposCadena);
router.get('/cadenas', tiendaController.getCadenas);

module.exports = router;