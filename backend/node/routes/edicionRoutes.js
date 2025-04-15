// backend/node/routes/edicionRoutes.js
const express = require('express');
const router = express.Router();
const aliasController = require('../controllers/aliasController');
const ajenoController = require('../controllers/ajenoController');

router.get('/alias/:id', aliasController.getAliasInfoUpdate);
router.get('/alias/:id/articulos', aliasController.getAliasArticulos);
router.get('/alias/:id/idiomas', aliasController.getAliasIdiomas);
router.get('/alias/:id/ambitos', aliasController.getAliasAmbitos);

router.get('/idiomas', aliasController.getIdiomas);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.get('/cadenas', aliasController.getCadenas);
router.get('/mercados', aliasController.getMercados);
router.get('/all', ajenoController.getAllAjenos);

module.exports = router;