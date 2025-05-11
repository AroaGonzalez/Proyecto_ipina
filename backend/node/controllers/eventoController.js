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

    if (req.query.idsArticulo) {
        filter.idsAjeno = parseIntArray(req.query.idsArticulo);
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

exports.updateEventoEstado = async (req, res) => {
    try {
      const { idEstadoEvento } = req.body;
      const idsEvento = req.params.id ? [parseInt(req.params.id)] : parseIntArray(req.body.idsEvento);
      
      const usuario = req.user?.username || 'sistema';
      
      if (!idsEvento || idsEvento.length === 0) {
        return res.status(400).json({ 
          message: 'Se requiere al menos un ID de evento' 
        });
      }
      
      if (!idEstadoEvento) {
        return res.status(400).json({ 
          message: 'Se requiere el ID del tipo de estado del evento' 
        });
      }
      
      console.log(`Actualizando estado de eventos ${idsEvento.join(', ')} a ${idEstadoEvento}`);
      
      const result = await eventoRepository.updateEventoEstado(
        idsEvento,
        idEstadoEvento,
        usuario
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error en updateEventoEstado:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el estado del evento', 
        error: error.message 
      });
    }
};

exports.getTareasByTipo = async (req, res) => {
    try {
      const { idIdioma = 1, idTipoTarea } = req.query;
      
      if (!idTipoTarea) {
        return res.status(400).json({ 
          message: 'Se requiere el tipo de tarea' 
        });
      }
      
      const result = await eventoRepository.findTareasByTipoTarea(
        parseInt(idIdioma),
        parseInt(idTipoTarea)
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error en getTareasByTipo:', error);
      res.status(500).json({ 
        message: 'Error al obtener las tareas', 
        error: error.message 
      });
    }
};

exports.getTiposTarea = async (req, res) => {
    try {
      const { idIdioma = 1 } = req.query;
      
      const result = await eventoRepository.getTiposTarea(parseInt(idIdioma));
      
      res.json(result);
    } catch (error) {
      console.error('Error en getTiposTarea:', error);
      res.status(500).json({ 
        message: 'Error al obtener tipos de tarea', 
        error: error.message 
      });
    }
};

exports.createEvento = async (req, res) => {
  try {
    const { 
      nombreEvento, 
      descripcion, 
      idTipoEvento = 1, 
      idTipoEstadoEvento = 1,
      estadoSolicitud,
      idsTarea 
    } = req.body;
    
    if (!nombreEvento || !descripcion || !idsTarea || idsTarea.length === 0) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios'
      });
    }
    
    const usuario = req.user?.username || 'sistema';
    
    const tareasInfo = await eventoRepository.getTareasInfo(idsTarea);
    const idTipoTarea = tareasInfo.length > 0 ? tareasInfo[0].idTipoTarea : 1;
    
    const eventoData = {
      nombre: nombreEvento,
      descripcion: descripcion,
      idTipoEvento: idTipoEvento,
      idTipoEstadoEvento: idTipoEstadoEvento,
      idTipoTarea: idTipoTarea,
      idTipoEstadoLineaCompras: estadoSolicitud === 'PROPUESTA' ? 1 : 
        estadoSolicitud === 'ENVIADA' ? 2 : 
        estadoSolicitud === 'RECHAZADA' ? 3 : null,
      createEventoTarea: idsTarea.map(idTarea => ({ idTarea })),
      usuarioAlta: usuario
    };
    
    const idEvento = await eventoRepository.createEvento(eventoData);
    
    res.status(201).json({
      success: true,
      idEvento,
      message: 'Evento creado correctamente'
    });
  } catch (error) {
    console.error('Error en createEvento:', error);
    res.status(500).json({
      message: 'Error al crear el evento',
      error: error.message
    });
  }
};

exports.getEventoById = async (req, res) => {
  try {
    const id = req.params.id;
    const evento = await eventoRepository.findEventoById(parseInt(id));
    
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    res.json(evento);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getEventoById = async (req, res) => {
  try {
    const id = req.params.id;
    const { idIdioma = 1 } = req.query;
    
    const evento = await eventoRepository.findEventoById(parseInt(id), parseInt(idIdioma));
    
    if (!evento) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }
    
    res.json(evento);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.updateEvento = async (req, res) => {
  try {
    const id = req.params.id;
    const eventoData = req.body;
    
    if (!eventoData.nombreEvento || !eventoData.descripcion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: nombre o descripción'
      });
    }
    
    if (eventoData.idsTarea && Array.isArray(eventoData.idsTarea)) {
      eventoData.createEventoTarea = eventoData.idsTarea.map(idTarea => ({ idTarea }));
    }
    
    const dataToUpdate = {
      nombreEvento: eventoData.nombreEvento,
      descripcion: eventoData.descripcion,
      idTipoTarea: eventoData.idTipoTarea,
      idTipoEvento: eventoData.idTipoEvento,
      idTipoEstadoEvento: eventoData.idTipoEstadoEvento,
      createEventoTarea: eventoData.createEventoTarea,
      usuario: req.user?.username || 'sistema'
    };
    
    const result = await eventoRepository.updateEvento(parseInt(id), dataToUpdate);
    
    res.json(result);
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ message: 'Error al actualizar el evento', error: error.message });
  }
};

const TipoEstadoEventoEnum = {
  ACTIVO: 2,
  PAUSADO: 1,
  ELIMINADO: 3,
  EN_EJECUCION: 5 
};

exports.ejecutarEventos = async (req, res) => {
  try {
    const idEvento = req.params.id ? parseInt(req.params.id) : null;
    const idsEvento = idEvento ? [idEvento] : (req.body.idsEvento ? parseIntArray(req.body.idsEvento) : []);
    const { idIdioma = 1 } = req.query;
    
    if (!idsEvento || idsEvento.length === 0) {
      return res.status(400).json({ 
        message: 'Se requiere al menos un ID de evento' 
      });
    }
    
    const usuario = req.user?.username || 'sistema';
    const fechaEjecucion = new Date();
    
    const eventosInfo = await eventoRepository.findEventosByIds(idsEvento, parseInt(idIdioma));
    
    if (eventosInfo.length === 0) {
      return res.status(404).json({ 
        message: 'No se encontraron eventos para ejecutar' 
      });
    }
    
    const idTipoTarea = eventosInfo[0].idTipoTarea;
    const todosIguales = eventosInfo.every(evento => evento.idTipoTarea === idTipoTarea);
    
    if (!todosIguales) {
      return res.status(400).json({ 
        message: 'Todos los eventos deben tener el mismo tipo de tarea para ejecutarlos juntos' 
      });
    }
    
    const codEjecucion = await eventoRepository.getNextCodigoEventoEjecucion();
    
    await eventoRepository.updateEventoEstado(
      idsEvento,
      TipoEstadoEventoEnum.EN_EJECUCION,
      usuario,
      fechaEjecucion
    );
    
    await eventoRepository.ejecutarEventos(
      idsEvento, 
      idTipoTarea, 
      codEjecucion, 
      fechaEjecucion, 
      usuario, 
      parseInt(idIdioma)
    );
    
    return res.json({
      success: true,
      codEjecucion,
      message: `Se ha iniciado la ejecución de ${idsEvento.length} evento(s)`
    });
    
  } catch (error) {
    console.error('Error en ejecutarEventos:', error);
    return res.status(500).json({ 
      message: 'Error al ejecutar eventos', 
      error: error.message 
    });
  }
};