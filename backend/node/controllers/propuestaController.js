const propuestaRepository = require('../repositories/propuestaRepository');

exports.getPropuestasByFilter = async (req, res) => {
  try {
    const filter = req.body.filter || {};
    const page = req.body.page || { number: 0, size: 50 };
    
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
    
    const result = await propuestaRepository.findPropuestasByFilter(propuestaFilter, tipoAlias);
    
    const response = {
      propuestas: result.content,
      page: {
        number: result.offset,
        size: result.limit,
        total: result.totalElements
      }
    };
    
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

exports.deletePropuestas = async (req, res) => {
  try {
    const { idsPropuesta } = req.body;
    
    if (!idsPropuesta || !Array.isArray(idsPropuesta) || idsPropuesta.length === 0) {
      return res.status(400).json({
        message: 'Es necesario proporcionar al menos un ID de propuesta válido'
      });
    }
    
    const usuarioBaja = req.body.usuarioBaja || req.user?.username || 'sistema';
    const fechaBaja = req.body.fechaBaja ? new Date(req.body.fechaBaja) : new Date();
    
    await propuestaRepository.deletePropuestas(idsPropuesta, usuarioBaja, fechaBaja);
    
    res.json({
      message: `Se han eliminado ${idsPropuesta.length} propuesta(s) correctamente`,
      eliminados: idsPropuesta
    });
  } catch (error) {
    console.error('Error en deletePropuestas:', error);
    res.status(500).json({
      message: 'Error al eliminar propuestas',
      error: error.message
    });
  }
};