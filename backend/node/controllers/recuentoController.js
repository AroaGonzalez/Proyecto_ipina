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