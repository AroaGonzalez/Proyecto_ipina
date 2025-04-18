// backend/node/controllers/tareaController.js
const tareaRepository = require('../repositories/tareaRepository');

exports.getTareas = async (req, res) => {
  try {
    const {
      page = 0,
      size = 50,
      idIdioma = 1,
      idsTarea,
      idsAlias,
      idsAjeno,
      idsMercado,
      idsCadena,
      idsGrupoCadena,
      idsLocalizacion,
      idsGrupoLocalizacion,
      idsTipoTarea,
      idsTipoEstadoTarea
    } = req.query;
   
    const filter = {
      idIdioma: parseInt(idIdioma)
    };
   
    // Convertir todos los parámetros de la petición a arrays de números
    if (idsTarea) {
      filter.idsTarea = parseIntArray(idsTarea);
    }
   
    if (idsAlias) {
      filter.idsAlias = parseIntArray(idsAlias);
    }
   
    if (idsAjeno) {
      filter.idsAjeno = parseIntArray(idsAjeno);
    }
   
    if (idsMercado) {
      filter.idsMercado = parseIntArray(idsMercado);
    }
   
    if (idsCadena) {
      filter.idsCadena = parseIntArray(idsCadena);
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
   
    if (idsTipoTarea) {
      filter.idsTipoTarea = parseIntArray(idsTipoTarea);
    }
   
    if (idsTipoEstadoTarea) {
      filter.idsTipoEstadoTarea = parseIntArray(idsTipoEstadoTarea);
    }
    
    const pageable = {
      page: parseInt(page),
      size: parseInt(size)
    };
    
    console.log(`Consultando tareas con filtros:`, filter);
    const result = await tareaRepository.findTareasByFilter(filter, pageable);
   
    console.log(`Enviando ${result.content.length} de ${result.totalElements} resultados`);
   
    res.json(result);
  } catch (error) {
    console.error('Error en getTareas:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasByTareaId = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'ID de tarea requerido' });
    }
    
    const result = await tareaRepository.getAliasesByTaskId(parseInt(id));
    res.json(result);
  } catch (error) {
    console.error(`Error al obtener alias para tarea ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getTiposTarea = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
   
    const result = await tareaRepository.getTiposTarea(parseInt(idIdioma));
    console.log('Tipos de tarea obtenidos:', result.length);
   
    res.json(result);
  } catch (error) {
    console.error('Error en getTiposTarea:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getTiposEstadoTarea = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
   
    const result = await tareaRepository.getTiposEstadoTarea(parseInt(idIdioma));
    console.log('Estados de tarea obtenidos:', result.length);
   
    res.json(result);
  } catch (error) {
    console.error('Error en getTiposEstadoTarea:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Función auxiliar para convertir parámetros a arrays de enteros
function parseIntArray(param) {
  if (!param) return null;
 
  if (Array.isArray(param)) {
    return param.map(Number);
  }
 
  return param.toString().split(',').map(item => parseInt(item.trim(), 10));
}