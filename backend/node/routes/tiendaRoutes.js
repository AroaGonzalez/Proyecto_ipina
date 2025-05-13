const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');

router.get('/', tiendaController.getTiendas);
router.get('/mercados', tiendaController.getMercados);
router.get('/grupos-cadena', tiendaController.getGruposCadena);
router.get('/cadenas', tiendaController.getCadenas);
router.get('/grupos-localizacion', tiendaController.getGruposLocalizacion);
router.put('/activar-localizacion', tiendaController.activarLocalizacion);
router.put('/pausar-localizacion', tiendaController.pausarLocalizacion);

module.exports = router;