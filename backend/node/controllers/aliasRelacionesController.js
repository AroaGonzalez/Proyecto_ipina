// backend/node/controllers/aliasRelacionesController.js
const aliasRelacionesRepository = require('../repositories/aliasRelacionesRepository');

exports.findRelacionesByFilter = async (req, res) => {
    try {
      const { filter, idsAliasSelected, processAllAlias, aliasTableOriginalFilter, page } = req.body;
      
      if (!idsAliasSelected || !Array.isArray(idsAliasSelected) || idsAliasSelected.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requiere al menos un ID de alias seleccionado' 
        });
      }
  
      console.log(`Buscando relaciones para alias: ${idsAliasSelected.join(', ')}`);
  
      const idIdioma = filter?.idIdioma || 1;
      const pageInfo = {
        page: page?.number || 0,
        size: page?.size || 50
      };
  
      const result = await aliasRelacionesRepository.findRelacionesByFilter(
        filter || {},
        idsAliasSelected,
        processAllAlias || false,
        aliasTableOriginalFilter || {},
        pageInfo
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error en findRelacionesByFilter:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error del servidor', 
        error: error.message 
      });
    }
};

exports.getUnidadesCompra = async (req, res) => {
  try {
    const result = await aliasRelacionesRepository.getUnidadesCompra();
    res.json(result);
  } catch (error) {
    console.error('Error en getUnidadesCompra:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener unidades de compra', 
      error: error.message 
    });
  }
};

exports.getRelacionesUnidadesCompra = async (req, res) => {
  try {
    const result = await aliasRelacionesRepository.getRelacionesUnidadesCompra();
    res.json(result);
  } catch (error) {
    console.error('Error en getRelacionesUnidadesCompra:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener unidades de compra para relaciones', 
      error: error.message 
    });
  }
};