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

function parseIntArray(param) {
  if (!param) return null;
 
  if (Array.isArray(param)) {
    return param.map(Number);
  }
  return param.toString().split(',').map(item => parseInt(item.trim(), 10));
}

exports.updateEstadoTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { idTipoEstadoTarea, idIdioma = 1 } = req.body;
        
    await tareaRepository.updateEstadoTarea(parseInt(id), parseInt(idTipoEstadoTarea));
    
    tareaRepository.invalidateCache('tareas_');
    
    const tiposEstado = await tareaRepository.getTiposEstadoTarea(parseInt(idIdioma));
    const estadoActualizado = tiposEstado.find(estado => estado.id === parseInt(idTipoEstadoTarea));
    
    res.json({
      success: true,
      message: 'Estado de tarea actualizado correctamente',
      estado: estadoActualizado
    });
  } catch (error) {
    console.error(`Error al actualizar estado de tarea ${req.params.id}:`, error);
    res.status(500).json({ 
      message: 'Error del servidor', 
      error: error.message 
    });
  }
};

exports.getAliasAndAcoples = async (req, res) => {
  try {
    const { idIdioma = 1, idTipoTarea } = req.query;
    
    // Validar que idTipoTarea exista
    if (!idTipoTarea) {
      return res.status(400).json({ message: 'El parámetro idTipoTarea es requerido' });
    }
    
    const result = await tareaRepository.findAliasWithAcoples(parseInt(idIdioma), idTipoTarea);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getAliasAndAcoples:', error);
    res.status(500).json({ 
      message: 'Error del servidor al obtener alias y acoples', 
      error: error.message 
    });
  }
};

exports.calculateTareaAmbitoMultiselect = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    const requestData = req.body;
    
    if (!requestData || !requestData.idsGrupoCadena || !requestData.idsCadena || 
        !requestData.idsMercado || !requestData.alias || !requestData.idTipoTarea) {
      return res.status(400).json({ 
        message: 'Los parámetros idsGrupoCadena, idsCadena, idsMercado, idTipoTarea y alias son requeridos' 
      });
    }
    
    // Get the required values from the request
    const { idsGrupoCadena, idsCadena, idsMercado, idTipoTarea, alias } = requestData;
    
    // Extract alias IDs and create acoples map
    const idsAlias = [];
    const acoplesMap = new Map();
    
    alias.forEach(aliasItem => {
      idsAlias.push(aliasItem.idAlias);
      
      if (aliasItem.acoples && aliasItem.acoples.length > 0) {
        aliasItem.acoples.forEach(acople => {
          if (!acoplesMap.has(acople.idAliasAcople)) {
            acoplesMap.set(acople.idAliasAcople, new Set());
          }
          acoplesMap.get(acople.idAliasAcople).add(aliasItem.idAlias);
        });
      }
    });
    
    // Add acoples to the list of alias IDs
    const allAliasIds = [...idsAlias, ...Array.from(acoplesMap.keys())];
    
    // Get the ID for the "ACTIVA" status
    const idTipoEstadoLocalizacionTarea = 1; // This is the equivalent of TipoEstadoLocalizacionTareaEnum.ACTIVA
    
    const result = [];
    
    if (idTipoTarea === 2) { // COUNT type - equivalent to TipoTareaEnum.COUNT
      const ambitoAplanadoAlias = await tareaRepository.findTareaAmbitoAplanadoByIdAlias(
        parseInt(idIdioma),
        allAliasIds,
        idsMercado,
        idsGrupoCadena,
        idsCadena,
        idTipoEstadoLocalizacionTarea
      );
      
      result.push(...ambitoAplanadoAlias);
    }
    
    if (idTipoTarea === 1) { // DISTRIBUTION type - equivalent to TipoTareaEnum.DISTRIBUTION
      const ambitoAplanadoAlias = await tareaRepository.findTareaAmbitoAplanadoByIdAliasConAcople(
        parseInt(idIdioma),
        idsAlias,
        idsMercado,
        idsGrupoCadena,
        idsCadena,
        idTipoEstadoLocalizacionTarea
      );
      
      result.push(...ambitoAplanadoAlias);
    }
    
    // Sort by localization ID
    result.sort((a, b) => a.idLocalizacionCompra - b.idLocalizacionCompra);
    
    return res.json(result);
  } catch (error) {
    console.error('Error en calculateTareaAmbitoMultiselect:', error);
    res.status(500).json({ 
      message: 'Error del servidor al calcular el ámbito de tarea', 
      error: error.message 
    });
  }
};