// backend/node/controllers/tiendaController.js
const tiendaRepository = require('../repositories/tiendaRepository');

// Inicializar caché a nivel de controlador
const queryCache = {
  data: {},
  timeout: 60 * 60 * 1000, // 1 hora
  set(key, value) {
    this.data[key] = {
      value,
      timestamp: Date.now()
    };
  },
  get(key) {
    const item = this.data[key];
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.timeout) {
      delete this.data[key];
      return null;
    }
    return item.value;
  }
};

// Añadir middleware para monitoreo de rendimiento
const measurePerformance = (req, res, next) => {
  req.startTime = Date.now();
  
  // Capturar el res.json original
  const originalJson = res.json;
  
  // Sobreescribir el método res.json
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    console.log(`[RENDIMIENTO] ${req.method} ${req.originalUrl} completado en ${duration}ms`);
    
    // Añadir cabecera de tiempo para depuración del cliente
    res.set('X-Response-Time', `${duration}ms`);
    
    // Llamar al método json original
    return originalJson.call(this, data);
  };
  
  next();
};

exports.getGruposLocalizacion = [measurePerformance, async (req, res) => {
  try {
    const { idIdioma = 1, formatoSelector } = req.query;
    
    const cacheKey = formatoSelector === 'true'
      ? `grupos_localizacion_selector_${idIdioma}` 
      : `grupos_localizacion_${idIdioma}`;         
      
    const cachedResult = queryCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Caché de controlador encontrada para:', cacheKey);
      return res.json(cachedResult);
    }
    
    const result = await tiendaRepository.getGruposLocalizacion(idIdioma);
    
    if (formatoSelector === 'true') {
      const formattedResult = result.map(grupo => ({
        id: grupo.id,
        descripcion: `${grupo.id} - ${grupo.descripcion}`
      }));
      
      formattedResult.push({
        id: 'all',
        descripcion: 'Seleccionar todo'
      });
      
      queryCache.set(cacheKey, formattedResult);
      return res.json(formattedResult);
    }
    
    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en getGruposLocalizacion:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}];

exports.getTiendas = [measurePerformance, async (req, res) => {
  try {
    const { idIdioma = 1, page = 0, size = 50 } = req.query;
    
    const filter = {};
    
    if (req.query.idsMercado) {
      filter.idsMercado = Array.isArray(req.query.idsMercado) 
        ? req.query.idsMercado 
        : [req.query.idsMercado];
    }
    
    if (req.query.idsGrupoCadena) {
      filter.idsGrupoCadena = Array.isArray(req.query.idsGrupoCadena) 
        ? req.query.idsGrupoCadena 
        : [req.query.idsGrupoCadena];
    }
    
    if (req.query.idsCadena) {
      filter.idsCadena = Array.isArray(req.query.idsCadena) 
        ? req.query.idsCadena 
        : [req.query.idsCadena];
    }
    
    if (req.query.idsLocalizacion) {
      filter.idsLocalizacion = Array.isArray(req.query.idsLocalizacion) 
        ? req.query.idsLocalizacion 
        : [req.query.idsLocalizacion];
    }

    if (req.query.idsGrupoLocalizacion) {
      filter.idsGrupoLocalizacion = Array.isArray(req.query.idsGrupoLocalizacion) 
        ? req.query.idsGrupoLocalizacion 
        : [req.query.idsGrupoLocalizacion];
    }

    const pageable = {
      page: parseInt(page),
      size: parseInt(size)
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Tiempo de consulta excedido'));
      }, 25000);
    });

    const resultPromise = tiendaRepository.findTiendasByFilter(filter, pageable, idIdioma);
    const result = await Promise.race([resultPromise, timeoutPromise]);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getTiendas:', error);
    if (error.message === 'Tiempo de consulta excedido') {
      return res.status(408).json({ 
        message: 'La consulta ha excedido el tiempo máximo permitido. Por favor, intente con filtros más específicos.'
      });
    }
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}];

exports.getMercados = [measurePerformance, async (req, res) => {
  try {
    const { idIdioma = 1, formatoSelector } = req.query;
    
    const cacheKey = formatoSelector === 'true'
      ? `mercados_selector_${idIdioma}`
      : `mercados_${idIdioma}`;
      
    const cachedResult = queryCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Caché de controlador encontrada para:', cacheKey);
      return res.json(cachedResult);
    }
    
    const result = await tiendaRepository.getMercados(idIdioma);
    
    if (formatoSelector === 'true') {
      const formattedResult = result.map(mercado => ({
        id: mercado.id,
        descripcion: `${mercado.id} - ${mercado.descripcion}`
      }));
      
      formattedResult.push({
        id: 'all',
        descripcion: 'Seleccionar todo'
      });
      
      queryCache.set(cacheKey, formattedResult);
      return res.json(formattedResult);
    }
    
    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en getMercados:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}];

exports.getGruposCadena = [measurePerformance, async (req, res) => {
  try {
    const { idIdioma = 1, formatoSelector } = req.query;
    
    const cacheKey = formatoSelector === 'true'
      ? `grupos_cadena_selector_${idIdioma}`
      : `grupos_cadena_${idIdioma}`;
      
    const cachedResult = queryCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Caché de controlador encontrada para:', cacheKey);
      return res.json(cachedResult);
    }
    
    const result = await tiendaRepository.getGruposCadena(idIdioma);
    
    if (formatoSelector === 'true') {
      const formattedResult = result.map(grupo => ({
        id: grupo.id,
        descripcion: `${grupo.id} - ${grupo.descripcion}`
      }));
      
      formattedResult.push({
        id: 'all',
        descripcion: 'Seleccionar todo'
      });
      
      queryCache.set(cacheKey, formattedResult);
      return res.json(formattedResult);
    }
    
    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en getGruposCadena:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}];

exports.getCadenas = [measurePerformance, async (req, res) => {
  try {
    const { idGrupoCadena, idIdioma = 1, formatoSelector } = req.query;
    
    const cacheKey = formatoSelector === 'true'
      ? `cadenas_selector_${idGrupoCadena || 'todas'}_${idIdioma}`
      : `cadenas_${idGrupoCadena || 'todas'}_${idIdioma}`;
      
    const cachedResult = queryCache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Caché de controlador encontrada para:', cacheKey);
      return res.json(cachedResult);
    }
    
    const result = await tiendaRepository.getCadenas(idGrupoCadena, idIdioma);
    
    if (formatoSelector === 'true') {
      const formattedResult = result.map(cadena => ({
        id: cadena.id,
        descripcion: `${cadena.id} - ${cadena.descripcion}`
      }));
      
      formattedResult.push({
        id: 'all',
        descripcion: 'Seleccionar todo'
      });
      
      queryCache.set(cacheKey, formattedResult);
      return res.json(formattedResult);
    }
    
    queryCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error('Error en getCadenas:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
}];

exports.activarLocalizacion = [measurePerformance, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs válido' });
    }
    
    const result = await tiendaRepository.cambiarEstadoLocalizaciones(ids, 'ACTIVA');
    
    res.json({
      success: true,
      message: `${ids.length} localizaciones activadas correctamente`,
      result
    });
  } catch (error) {
    console.error('Error al activar localizaciones:', error);
    res.status(500).json({ message: 'Error al activar localizaciones', error: error.message });
  }
}];

exports.pausarLocalizacion = [measurePerformance, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Se requiere un array de IDs válido' });
    }
    
    const result = await tiendaRepository.cambiarEstadoLocalizaciones(ids, 'PAUSADA');
    
    res.json({
      success: true,
      message: `${ids.length} localizaciones pausadas correctamente`,
      result
    });
  } catch (error) {
    console.error('Error al pausar localizaciones:', error);
    res.status(500).json({ message: 'Error al pausar localizaciones', error: error.message });
  }
}];