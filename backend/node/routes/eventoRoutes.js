// backend/node/routes/eventoRoutes.js
const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const aliasController = require('../controllers/aliasController');
const tiendaController = require('../controllers/tiendaController');

router.get('/filter', eventoController.getEventosFilter);
router.get('/ajenos', aliasController.getAjenos);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.get('/mercados', aliasController.getMercados);
router.get('/grupos-localizacion', tiendaController.getGruposLocalizacion);
router.get('/alias', aliasController.getAliasFilter);
router.get('/tipos-evento', eventoController.getTiposEvento);
router.get('/tipos-estado-evento', eventoController.getTiposEstadoEvento);
router.get('/eventos', eventoController.getEventos);

module.exports = router;