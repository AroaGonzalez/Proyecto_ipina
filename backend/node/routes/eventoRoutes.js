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
router.get('/alias', aliasController.getAlias);
router.get('/tipos-evento', eventoController.getTiposEvento);
router.get('/tipos-estado-evento', eventoController.getTiposEstadoEvento);
router.get('/eventos', eventoController.getEventos);
router.put('/:id/estado', eventoController.updateEventoEstado);
router.put('/estado', eventoController.updateEventoEstado);
router.get('/tareas/list', eventoController.getTareasByTipo);
router.get('/tipos-tarea', eventoController.getTiposTarea);
router.post('/create', eventoController.createEvento);
router.get('/:id', eventoController.getEventoById);
router.put('/:id', eventoController.updateEvento);

module.exports = router;