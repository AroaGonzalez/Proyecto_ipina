// backend/node/routes/tareaRoutes.js
const express = require('express');
const router = express.Router();
const tareaController = require('../controllers/tareaController');

router.get('/filter', tareaController.getTareas);
router.get('/tipos-tarea', tareaController.getTiposTarea);
router.get('/tipos-estado-tarea', tareaController.getTiposEstadoTarea);

module.exports = router;