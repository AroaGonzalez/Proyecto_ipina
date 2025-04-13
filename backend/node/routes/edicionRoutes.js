// backend/node/routes/edicionRoutes.js
const express = require('express');
const router = express.Router();
const aliasController = require('../controllers/aliasController');

// Rutas para edición de alias
router.get('/alias/:id', aliasController.getAliasInfoUpdate);
router.get('/alias/:id/articulos', aliasController.getAliasArticulos);
router.get('/alias/:id/idiomas', aliasController.getAliasIdiomas);
router.get('/alias/:id/ambitos', aliasController.getAliasAmbitos);

// Rutas para obtener datos de referencia para selects
router.get('/idiomas', aliasController.getIdiomas);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.get('/cadenas', aliasController.getCadenas);
router.get('/mercados', aliasController.getMercados);

module.exports = router;