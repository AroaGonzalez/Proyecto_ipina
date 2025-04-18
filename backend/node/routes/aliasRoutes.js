// backend/node/routes/aliasRoutes.js
const express = require('express');
const router = express.Router();
const aliasController = require('../controllers/aliasController');

router.get('/filter', aliasController.getAlias);
router.get('/tipos-alias', aliasController.getTiposAlias);
router.get('/alias', aliasController.getAliasFilter);
router.get('/tipos-estado', aliasController.getEstadosAlias);
router.get('/tipos-estacionalidad', aliasController.getEstacionalidades);
router.get('/ajeno', aliasController.getAjenos);
router.get('/alias/ajenos/filter', aliasController.getAliasAjenos);

module.exports = router;