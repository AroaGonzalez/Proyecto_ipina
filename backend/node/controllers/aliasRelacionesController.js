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

exports.activateRelaciones = async (req, res) => {
  try {
    const { relaciones, usuario } = req.body;
    
    if (!relaciones || !Array.isArray(relaciones) || relaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una relación para activar'
      });
    }
    
    console.log(`Activando ${relaciones.length} relaciones por usuario ${usuario || 'SISTEMA'}`);
    
    const result = await aliasRelacionesRepository.activateRelaciones(
      relaciones,
      usuario || 'SISTEMA'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error en activateRelaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar relaciones',
      error: error.message
    });
  }
};

exports.pauseRelaciones = async (req, res) => {
  try {
    const { relaciones, fechaHoraFinPausa, usuario } = req.body;
    
    if (!relaciones || !Array.isArray(relaciones) || relaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una relación para pausar'
      });
    }
    
    console.log(`Pausando ${relaciones.length} relaciones hasta ${fechaHoraFinPausa} por usuario ${usuario || 'SISTEMA'}`);
    
    const result = await aliasRelacionesRepository.pauseRelaciones(
      relaciones,
      fechaHoraFinPausa,
      usuario || 'SISTEMA'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error en pauseRelaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al pausar relaciones',
      error: error.message
    });
  }
};

exports.checkPausedRelations = async (req, res) => {
  try {
    const result = await aliasRelacionesRepository.activateExpiredPauses();
    res.json(result);
  } catch (error) {
    console.error('Error al comprobar relaciones pausadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al comprobar relaciones pausadas',
      error: error.message
    });
  }
};

exports.updateRelaciones = async (req, res) => {
  try {
    const { relaciones, usuario } = req.body;
    
    if (!relaciones || !Array.isArray(relaciones) || relaciones.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una relación para actualizar'
      });
    }
    
    console.log(`Actualizando ${relaciones.length} relaciones por usuario ${usuario || 'SISTEMA'}`);
    
    const result = await aliasRelacionesRepository.updateRelaciones(
      relaciones,
      usuario || 'SISTEMA'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error en updateRelaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar relaciones',
      error: error.message
    });
  }
};