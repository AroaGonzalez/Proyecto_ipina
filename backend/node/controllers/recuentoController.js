const recuentoRepository = require('../repositories/recuentoRepository');

exports.getEstados = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await recuentoRepository.getTiposEstadoRecuento(parseInt(idIdioma));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getEstados:', error);
    res.status(500).json({
      message: 'Error al obtener tipos de estado de recuento',
      error: error.message
    });
  }
};

exports.getRecuentosByFilter = async (req, res) => {
  try {
    const filter = req.body.filter || {};
    const page = req.body.page || { number: 0, size: 50 };
    
    const recuentoFilter = {
      idIdioma: req.query.idIdioma || 1,
      idsRecuento: filter.idsRecuento || [],
      idsEvento: filter.idsEvento || [],
      idsMercado: filter.idsMercado || [],
      idsGrupoCadena: filter.idsGrupoCadena || [],
      idsLocalizacion: filter.idsLocalizacion || [],
      idsEjecucion: filter.idsEjecucion || [],
      idsTipoEstadoRecuento: filter.idsTipoEstadoRecuento || [],
      idsTipoAlias: filter.idsTipoAlias || [],
      idsAlias: filter.idsAlias || [],
      fechaCreacionDesde: filter.fechaCreacionDesde ? new Date(filter.fechaCreacionDesde) : null,
      fechaCreacionHasta: filter.fechaCreacionHasta ? new Date(filter.fechaCreacionHasta) : null,
      sortRecuento: filter.sortRecuento || { sortField: 'ID_RECUENTO_RAM', sortDescending: false },
      offset: page.number || 0,
      limit: page.size || 50
    };
    
    const result = await recuentoRepository.findRecuentosByFilter(recuentoFilter);
    
    const response = {
      recuentos: result.content,
      page: {
        number: result.offset,
        size: result.limit,
        total: result.totalElements
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error en getRecuentosByFilter:', error);
    res.status(500).json({
      message: 'Error al obtener recuentos',
      error: error.message
    });
  }
};

exports.updateEstadoRecuentos = async (req, res) => {
  try {
    const { idsRecuento, idTipoEstadoRecuento, stockFisico, capacidadMaximaFisica, usuario } = req.body;
    
    if (!idsRecuento || idsRecuento.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron IDs de recuento'
      });
    }
    
    const result = await recuentoRepository.updateEstadoRecuentos({
      idsRecuento,
      idTipoEstadoRecuento,
      stockFisico,
      capacidadMaximaFisica,
      usuario
    });
    
    res.json({
      success: true,
      totalUpdated: result.totalUpdated,
      message: 'Estado de recuentos actualizado correctamente'
    });
  } catch (error) {
    console.error('Error en updateEstadoRecuentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de recuentos',
      error: error.message
    });
  }
};

exports.updateValues = async (req, res) => {
  try {
    const result = await recuentoRepository.updateRecuentoValues(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error al actualizar valores:', error);
    res.status(500).json({ error: 'Error al actualizar valores del recuento' });
  }
};