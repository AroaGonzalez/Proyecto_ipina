// controllers/inventarioController.js
const ajenoRamRepository = require('../repositories/ajenoRamRepository.js');

exports.getInventario = async (req, res) => {
 try {
   const page = parseInt(req.query.page) || 0;
   const size = parseInt(req.query.size) || 10;
   const idIdioma = parseInt(req.query.idIdioma) || 1;
   const idsAjeno = req.query.idsAjeno ? req.query.idsAjeno.split(',').map(id => parseInt(id)) : null;
   
   const pageable = { page, size };
   const result = await ajenoRamRepository.findAllWithPagination(pageable, idIdioma, idsAjeno);
   
   // Transformar los datos para el formato que espera el frontend
   const inventarioData = result.content.map(item => ({
     idArticulo: item.idAjeno,
     articulo: item.nombreAjeno,
     estado: item.descripcionTipoEstadoRam,
     unidadesBox: item.descripcionUnidadesMedida,
     unidadEmpaquetado: item.unidadesEmpaquetado,
     multiploMinimo: item.multiploMinimo,
     estadoSFI: item.descripcionEstadoCompras
   }));

   res.json({
     content: inventarioData,
     totalElements: result.totalElements,
     number: result.number,
     size: result.size,
     totalPages: result.totalPages
   });
 } catch (error) {
   console.error('Error al obtener inventario:', error);
   res.status(500).json({ message: 'Error al obtener inventario', error: error.message });
 }
};

exports.updateEstado = async (req, res) => {
 const { ids, estado } = req.body;
 if (!ids || !estado) {
   return res.status(400).json({ message: 'Se requieren IDs y estado' });
 }
 
 try {
   await ajenoRamRepository.updateEstadoRam(ids, estado);
   res.json({ message: 'Estado actualizado correctamente', ids, estado });
 } catch (error) {
   console.error('Error al actualizar estado:', error);
   res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
 }
};