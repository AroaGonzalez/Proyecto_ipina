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
    const { idIdioma = 1 } = req.query;
    
    const result = await tareaRepository.findAliasWithAcoples(parseInt(idIdioma));
    
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
    
    const { idsGrupoCadena, idsCadena, idsMercado, idTipoTarea, alias } = requestData;
    
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
    
    const allAliasIds = [...idsAlias, ...Array.from(acoplesMap.keys())];
    
    const idTipoEstadoLocalizacionTarea = 1;
    
    const result = [];
    
    if (idTipoTarea === 2) { // COUNT type 
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
    
    if (idTipoTarea === 1) { // DISTRIBUTION type 
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

exports.createTarea = async (req, res) => {
  try {
    const request = req.body;
    const usuarioAlta = req.user ? req.user.username : 'sistema';
    const fechaAlta = new Date();
    
    if (!request.nombreTarea || !request.idTipoTarea || !request.idTipoEstadoTarea) {
      return res.status(400).json({ message: 'Datos incompletos. Se requiere nombreTarea, idTipoTarea e idTipoEstadoTarea' });
    }
    
    const idTarea = await tareaRepository.createTarea(
      request.nombreTarea,
      request.descripcion,
      request.idTipoTarea,
      request.idTipoEstadoTarea,
      usuarioAlta,
      fechaAlta
    );
    
    if (request.createTareaAlias && request.createTareaAlias.length > 0) {
      await tareaRepository.createTareaAlias(
        idTarea,
        request.createTareaAlias,
        usuarioAlta,
        fechaAlta
      );
      
      const tieneAcoples = request.createTareaAlias.some(alias => 
        alias.acoples && alias.acoples.length > 0
      );
      
      if (tieneAcoples) {
        await tareaRepository.createTareaAliasAcople(
          idTarea,
          request.createTareaAlias,
          usuarioAlta,
          fechaAlta
        );
      }
    }
    
    const idTareaAmbito = await tareaRepository.createTareaAmbito(
      idTarea,
      request.createTareaAmbito ? request.createTareaAmbito.idTipoReglaAmbito : 3,
      usuarioAlta,
      fechaAlta
    );
    
    let tareaAmbitoAplanados = [];
    
    if (request.idTipoTarea === 1) { // DISTRIBUTION
      tareaAmbitoAplanados = await tareaRepository.findTareaAmbitoAplanadoDistribution(
        request.createTareaAmbito.createTareaAmbitoAplanado,
        idTareaAmbito
      );
    } else if (request.idTipoTarea === 2) { // COUNT
      tareaAmbitoAplanados = await tareaRepository.findTareaAmbitoAplanadoCount(
        request.createTareaAmbito.createTareaAmbitoAplanado,
        idTareaAmbito
      );
    }
    
    if (tareaAmbitoAplanados.length > 0) {
      await tareaRepository.createTareaAmbitoAplanado(
        idTareaAmbito,
        tareaAmbitoAplanados,
        usuarioAlta,
        fechaAlta
      );
    }
    
    res.status(201).json({ 
      success: true,
      message: 'Tarea creada correctamente',
      idTarea
    });
    
  } catch (error) {
    console.error('Error en createTarea:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear la tarea', 
      error: error.message 
    });
  }
};

exports.deleteTareas = async (req, res) => {
  try {
    const { idsTarea } = req.body;
    
    if (!idsTarea || !Array.isArray(idsTarea) || idsTarea.length === 0) {
      return res.status(400).json({ 
        message: 'Se requiere un arreglo de IDs de tareas' 
      });
    }
    
    const usuarioBaja = req.user?.username || 'sistema';
    const fechaBaja = new Date();
    
    await tareaRepository.deleteTareas(idsTarea, usuarioBaja, fechaBaja);
    
    for (const idTarea of idsTarea) {
      const eventos = await tareaRepository.findEventosByIdTarea(idTarea);
      
      for (const idEvento of eventos) {
        const tareas = await tareaRepository.findTareasByIdEvento(idEvento);
        
        if (tareas.every(t => t.idTipoEstadoTarea === 3)) {
          await tareaRepository.updateEvento(idEvento, usuarioBaja, fechaBaja);
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Tareas eliminadas correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar tareas:', error);
    res.status(500).json({ 
      message: 'Error del servidor al eliminar tareas', 
      error: error.message 
    });
  }
};
exports.getTareaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { idIdioma = 1 } = req.query;
        
    const tareaInfo = await tareaRepository.findTareaInfoUpdate(parseInt(id), parseInt(idIdioma));
    
    if (!tareaInfo) {
      console.log(`[CONTROLLER] No se encontró la tarea con id: ${id}`);
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    const response = {
      ...tareaInfo,
      alias: tareaInfo.alias || [],
      cadenas: tareaInfo.cadenas || [],
      mercados: tareaInfo.mercados || [],
      gruposCadena: tareaInfo.gruposCadena || [],
      ambitos: tareaInfo.ambitos || []
    };
    
    console.log(`[CONTROLLER] Respuesta final:`, JSON.stringify(response, null, 2));
    
    res.json(response);
  } catch (error) {
    console.error(`[CONTROLLER] Error en getTareaById para id ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.updateTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const request = req.body;
    const usuarioModificacion = req.user ? req.user.username : 'sistema';
    const fechaModificacion = new Date();
    
    console.log(`[CONTROLLER] Iniciando updateTarea - id: ${id}`);
    
    await tareaRepository.updateNombreTarea(
      parseInt(id), 
      request.nombreTarea, 
      usuarioModificacion, 
      fechaModificacion
    );
    
    await tareaRepository.updateDescripcionTarea(
      parseInt(id), 
      request.descripcion, 
      usuarioModificacion, 
      fechaModificacion
    );
    
    await tareaRepository.updateTareaAlias(
      parseInt(id), 
      request.alias || request.createTareaAlias, 
      usuarioModificacion, 
      fechaModificacion
    );
    
    const idTareaAmbito = await tareaRepository.findTareaAmbitoByIdTarea(parseInt(id));
    
    if (!idTareaAmbito) {
      return res.status(404).json({ 
        message: 'No se encontró el ámbito de la tarea' 
      });
    }
    
    let tareaAmbitoAplanados = [];
    
    const idsLocalizacionCompra = request.idsLocalizacionCompra || 
      (request.createTareaAmbito && request.createTareaAmbito.createTareaAmbitoAplanado 
        ? [...new Set(request.createTareaAmbito.createTareaAmbitoAplanado.map(item => item.idLocalizacionCompra))] 
        : []);
    
    if (idsLocalizacionCompra.length > 0) {
      if (request.idTipoTarea === 1) { // DISTRIBUTION
        tareaAmbitoAplanados = await tareaRepository.findTareaAmbitoAplanadoDistributionEdit(
          idsLocalizacionCompra, 
          idTareaAmbito
        );
      } else if (request.idTipoTarea === 2) { // COUNT
        tareaAmbitoAplanados = await tareaRepository.findTareaAmbitoAplanadoCountEdit(
          idsLocalizacionCompra, 
          idTareaAmbito
        );
      }
      
      const createTareaAmbito = {
        createTareaAmbitoAplanado: tareaAmbitoAplanados
      };
      
      if (tareaAmbitoAplanados.length > 0) {
        await tareaRepository.updateTareaAmbitoAplanado(
          idTareaAmbito, 
          parseInt(id), 
          request.idTipoTarea, 
          createTareaAmbito,
          usuarioModificacion, 
          fechaModificacion
        );
      }
    }
    
    res.json({
      success: true,
      message: 'Tarea actualizada correctamente',
      idTarea: parseInt(id)
    });
    
  } catch (error) {
    console.error(`[CONTROLLER] Error en updateTarea para id ${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar la tarea', 
      error: error.message 
    });
  }
};