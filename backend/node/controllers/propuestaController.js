const propuestaRepository = require('../repositories/propuestaRepository');

exports.getPropuestasByFilter = async (req, res) => {
  try {
    const filter = req.body.filter || {};
    const page = req.body.page || { number: 0, size: 50 };
    
    // Configurar el filtro y la paginación
    const propuestaFilter = {
      idIdioma: req.query.idIdioma || 1,
      idsPropuesta: filter.idsPropuesta || [],
      idsUnidadComprasGestora: filter.idsUnidadComprasGestora || [],
      idsAjeno: filter.idsAjeno || [],
      idsMercado: filter.idsMercado || [],
      idsGrupoCadena: filter.idsGrupoCadena || [],
      idsLocalizacion: filter.idsLocalizacion || [],
      idsEvento: filter.idsEvento || [],
      idsEjecucion: filter.idsEjecucion || [],
      idsTipoEstadoPropuesta: filter.idsTipoEstadoPropuesta || [],
      fechaCreacionDesde: filter.fechaCreacionDesde ? new Date(filter.fechaCreacionDesde) : null,
      fechaCreacionHasta: filter.fechaCreacionHasta ? new Date(filter.fechaCreacionHasta) : null,
      offset: page.number || 0,
      limit: page.size || 50
    };
    
    const tipoAlias = req.query.tipoAlias ? 
      req.query.tipoAlias.split(',').map(id => parseInt(id.trim())) : 
      [];
    
    console.log(`Consultando propuestas con filtros:`, propuestaFilter);
    
    const result = await propuestaRepository.findPropuestasByFilter(propuestaFilter, tipoAlias);
    
    // Formatear la respuesta como se espera
    const response = {
      propuestas: result.content,
      page: {
        number: result.offset,
        size: result.limit,
        total: result.totalElements
      }
    };
    
    console.log(`Enviando ${result.content.length} de ${result.totalElements} resultados`);
    
    res.json(response);
  } catch (error) {
    console.error('Error en getPropuestasByFilter:', error);
    res.status(500).json({ 
      message: 'Error al obtener propuestas', 
      error: error.message 
    });
  }
};

exports.getUnidadesCompras = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await propuestaRepository.getUnidadesCompras(parseInt(idIdioma));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getUnidadesCompras:', error);
    res.status(500).json({ 
      message: 'Error al obtener unidades de compras', 
      error: error.message 
    });
  }
};

exports.getTiposEstadoPropuesta = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await propuestaRepository.getTiposEstadoPropuesta(parseInt(idIdioma));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getTiposEstadoPropuesta:', error);
    res.status(500).json({ 
      message: 'Error al obtener tipos de estado de propuesta', 
      error: error.message 
    });
  }
};