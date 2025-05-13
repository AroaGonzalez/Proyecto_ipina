const express = require('express');
const router = express.Router();
const aliasRelacionesController = require('../controllers/aliasRelacionesController');
const aliasController = require('../controllers/aliasController');

router.post('/filter', aliasRelacionesController.findRelacionesByFilter);
router.get('/maestros/unidades-compra', aliasRelacionesController.getUnidadesCompra);
router.get('/unidades-compra', aliasRelacionesController.getRelacionesUnidadesCompra);
router.get('/cadenas', aliasController.getCadenas);
router.get('/mercados', aliasController.getMercados);
router.get('/lista-alias', aliasController.getAliasFilter);
router.put('/activate', aliasRelacionesController.activateRelaciones);
router.put('/pause', aliasRelacionesController.pauseRelaciones);
router.get('/checkPausedRelations', aliasRelacionesController.checkPausedRelations);
router.patch('/update', aliasRelacionesController.updateRelaciones);

module.exports = router;