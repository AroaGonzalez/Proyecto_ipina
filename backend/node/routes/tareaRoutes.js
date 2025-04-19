// backend/node/routes/tareaRoutes.js
const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');
const aliasController = require('../controllers/aliasController');
const tiendaController = require('../controllers/tiendaController');

router.get('/filter', tareaController.getTareas);
router.get('/tipos-tarea', tareaController.getTiposTarea);
router.get('/tipos-estado-tarea', tareaController.getTiposEstadoTarea);
router.get('/alias', aliasController.getAliasFilter);
router.get('/cadenas', aliasController.getCadenas);
router.get('/mercados', aliasController.getMercados);
router.get('/grupos-localizacion', tiendaController.getGruposLocalizacion);
router.get('/ajenos', aliasController.getAjenos);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.put('/:id/estado', tareaController.updateEstadoTarea);

module.exports = router;