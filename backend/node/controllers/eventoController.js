// backend/node/controllers/eventoController.js
const eventoRepository = require('../repositories/eventoRepository');

exports.getEventosFilter = async (req, res) => {
  try {
    const {
      page = 0,
      size = 50,
      idIdioma = 1,
      idsEvento,
      idsTipoEvento,
      idsTipoEstadoEvento,
      idsEjecucion,
      idsAlias,
      idsMercado,
      idsGrupoCadena,
      idsLocalizacion,
      idsGrupoLocalizacion,
      idsAjeno,
      tipoAlias
    } = req.query;

    const filter = {
      idIdioma: parseInt(idIdioma),
      offset: parseInt(page),
      limit: parseInt(size)
    };

    if (idsEvento) {
      filter.idsEvento = parseIntArray(idsEvento);
    }

    if (idsTipoEvento) {
      filter.idsTipoEvento = parseIntArray(idsTipoEvento);
    }

    if (idsTipoEstadoEvento) {
      filter.idsTipoEstadoEvento = parseIntArray(idsTipoEstadoEvento);
    }

    if (idsEjecucion) {
      filter.idsEjecucion = parseIntArray(idsEjecucion);
    }

    if (idsAlias) {
      filter.idsAlias = parseIntArray(idsAlias);
    }

    if (idsMercado) {
      filter.idsMercado = parseIntArray(idsMercado);
    }

    if (idsGrupoCadena) {
      filter.idsGrupoCadena = parseIntArray(idsGrupoCadena);
    }

    if (idsLocalizacion) {
      filter.idsLocalizacion = parseIntArray(idsLocalizacion);
    }

    if (idsGrupoLocalizacion) {
      filter.idsGrupoLocalizacion = parseIntArray(idsGrupoLocalizacion);
    }

    if (idsAjeno) {
      filter.idsAjeno = parseIntArray(idsAjeno);
    }

    const tipoAliasArray = tipoAlias ? parseIntArray(tipoAlias) : [];

    console.log(`Consultando eventos con filtros:`, filter);
    const result = await eventoRepository.findEventosByFilter(filter, tipoAliasArray);
    
    console.log(`Enviando ${result.content.length} de ${result.totalElements} resultados`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getEventos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

function parseIntArray(param) {
  if (!param) return null;
 
  if (Array.isArray(param)) {
    return param.map(Number);
  }
  return param.toString().split(',').map(item => parseInt(item.trim(), 10));
}

exports.getEventos = async (req, res) => {
    try {
      const { idsTarea } = req.query;
      
      const idsTareaArray = idsTarea ? parseIntArray(idsTarea) : null;

      const result = await eventoRepository.findEventosByTarea(idsTareaArray);
      
      res.json(result);
    } catch (error) {
      console.error('Error en getEventosByTarea:', error);
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

exports.getTiposEstadoEvento = async (req, res) => {
    try {
      const { idIdioma = 1 } = req.query;
      
      const result = await eventoRepository.getTiposEstadoEvento(parseInt(idIdioma));

      res.json(result);
    } catch (error) {
      console.error('Error en getTiposEstadoEvento:', error);
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};

exports.getTiposEvento = async (req, res) => {
    try {
      const { idIdioma = 1 } = req.query;
      
      const result = await eventoRepository.getTiposEvento(parseInt(idIdioma));
      console.log('Tipos de evento obtenidos:', result.length);
      
      res.json(result);
    } catch (error) {
      console.error('Error en getTiposEvento:', error);
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};