// backend/node/controllers/eventoController.js
const eventoRepository = require('../repositories/eventoRepository');

exports.getEventos = async (req, res) => {
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