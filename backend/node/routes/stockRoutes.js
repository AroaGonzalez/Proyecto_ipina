const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const aliasController = require('../controllers/aliasController');

router.post('/filter', stockController.getStocksByFilter);

router.get('/alias', aliasController.getAlias);
router.get('/cadenas', aliasController.getCadenas);
router.get('/mercados', aliasController.getMercados);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.get('/tipos-alias', aliasController.getTiposAlias);

module.exports = router;