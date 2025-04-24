// backend/node/routes/creationRoutes.js
const express = require('express');
const router = express.Router();
const aliasController = require('../controllers/aliasController');
const ajenoController = require('../controllers/ajenoController');

router.get('/idiomas', aliasController.getIdiomas);
router.get('/grupos-cadena', aliasController.getGruposCadena);
router.get('/cadenas', aliasController.getCadenas);
router.get('/tipo-Conexion-Origen-Dato', aliasController.getTipoConexionOrigenDato);
router.get('/mercados', aliasController.getMercados);
router.get('/ajenos', ajenoController.getAllAjenos);
router.get('/tipos-estacionalidad', aliasController.getEstacionalidades);
router.get('/tipos-alias', aliasController.getTiposAlias);

router.post('/creacion-Alias', aliasController.createAlias);

module.exports = router;