// backend/node/controllers/aliasController.js
const aliasRepository = require('../repositories/aliasRepository');

const queryCache = {
  data: {},
  timeout: 60 * 1000,
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
  },
  clear() {
    this.data = {};
  }
};

queryCache.clear();

exports.getAlias = async (req, res) => {
  try {
    const { 
      page = 0, 
      size = 50, 
      idIdioma = 1,
      tipoAlias,
      idAlias,
      estadoAlias,
      estacionalidad,
      articulos 
    } = req.query;
    
    const filter = {
      idIdioma: parseInt(idIdioma)
    };
    
    if (tipoAlias) {
      filter.tipoAlias = tipoAlias;
    }
    
    if (idAlias) {
      filter.idAlias = idAlias;
    }
    
    if (estadoAlias) {
      filter.estadoAlias = estadoAlias;
    }
    
    if (estacionalidad) {
      filter.estacionalidad = estacionalidad;
    }
    
    if (articulos) {
      filter.articulos = articulos;
    }

    const pageable = {
      page: parseInt(page),
      size: parseInt(size)
    };

    console.log(`Consultando alias con filtros:`, filter);

    const result = await aliasRepository.findAliasByFilter(filter, pageable);
    
    console.log(`Enviando ${result.content.length} de ${result.totalElements} resultados`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getAlias:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getTiposAlias = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await aliasRepository.getTiposAlias(parseInt(idIdioma));
    console.log('Tipos de alias obtenidos:', result.length);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getTiposAlias:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getEstadosAlias = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await aliasRepository.getEstadosAlias(parseInt(idIdioma));
    console.log('Estados de alias obtenidos:', result.length);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getEstadosAlias:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getEstacionalidades = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await aliasRepository.getEstacionalidades(parseInt(idIdioma));
    console.log('Estacionalidades obtenidas:', result.length);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getEstacionalidades:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAjenos = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;

    console.log(`Consultando ajenos con idIdioma: ${idIdioma}`);

    const result = await aliasRepository.getAjenos(parseInt(idIdioma));

    console.log(`Ajenos obtenidos: ${result.length}`);
    if (result.length > 0) {
      console.log('Muestra de datos:', result[0]);
    }

    res.json(result);
  } catch (error) {
    console.error('Error al obtener ajenos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasFilter = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await aliasRepository.getAliasesForFilter(parseInt(idIdioma));
    
    console.log(`Alias para filtro obtenidos: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error al obtener alias para filtro:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasAjenos = async (req, res) => {
  try {
    const { 
      page = 0, 
      size = 50, 
      idIdioma = 1,
      idAlias,
      tipoEstadoRam,
      tipoEstadoCompras,
      idAjeno
    } = req.query;
    
    const filter = {
      idIdioma: parseInt(idIdioma)
    };
    
    if (idAlias) {
      filter.idAlias = Array.isArray(idAlias) ? idAlias : [idAlias];
    }
    
    if (tipoEstadoRam) {
      filter.tipoEstadoRam = Array.isArray(tipoEstadoRam) ? tipoEstadoRam : [tipoEstadoRam];
    }
    
    if (tipoEstadoCompras) {
      filter.tipoEstadoCompras = Array.isArray(tipoEstadoCompras) ? tipoEstadoCompras : [tipoEstadoCompras];
    }
    
    if (idAjeno) {
      filter.idAjeno = Array.isArray(idAjeno) ? idAjeno : [idAjeno];
    }

    const pageable = {
      page: parseInt(page),
      size: parseInt(size)
    };

    console.log(`Consultando alias ajenos con filtros:`, filter);

    const result = await aliasRepository.findAliasAjenosByFilter(filter, pageable);
    
    console.log(`Enviando ${result.content.length} de ${result.totalElements} resultados de alias ajenos`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getAliasAjenos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasInfoUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { idIdioma = 1 } = req.query;
    
    console.log(`Consultando información completa del alias ID: ${id}, idIdioma: ${idIdioma}`);
    
    const alias = await aliasRepository.findAliasById(id, parseInt(idIdioma));
    
    if (!alias) {
      return res.status(404).json({ message: 'Alias no encontrado' });
    }
    
    const aliasInfoUpdate = {
      idAlias: alias.id,
      nombreAlias: alias.nombreAlias,
      descripcionAlias: alias.descripcion,
      idTipoAlias: alias.idTipoAlias,
      idTipoEstadoAlias: alias.idEstado,
      idTipoEstacionalidad: alias.idEstacionalidad,
      idTipoConexionOrigenDatoAlias: alias.idTipoConexion,
      descripcionTipoAlias: alias.tipoAlias,
      descripcionTipoEstadoAlias: alias.estado,
      descripcionTipoEstacionalidad: alias.estacionalidad,
      descripcionTipoConexionOrigenDatoAlias: alias.tipoConexion,
      numeroAjenos: alias.numArticulos || 0,
      fechaAlta: alias.fechaAlta,
      usuarioAlta: alias.usuario,
      fechaModificacion: alias.ultimaModificacion
    };
    
    try {
      const [idiomas, acoples, ajenos, gruposCadena, cadenas, mercados] = await Promise.all([
        aliasRepository.findIdiomasByIdAlias(id),
        aliasRepository.findAcoplesInfoByIdAlias(id, parseInt(idIdioma)),
        aliasRepository.findAliasAjenoInfoByIdAlias(id, parseInt(idIdioma)),
        aliasRepository.findGruposCadenaByIdAlias(id),
        aliasRepository.findCadenasByIdAlias(id),
        aliasRepository.findMercadosByIdAlias(id, parseInt(idIdioma))
      ]);
      
      aliasInfoUpdate.aliasIdioma = idiomas;
      aliasInfoUpdate.acoples = acoples;
      aliasInfoUpdate.ajenos = ajenos;
      aliasInfoUpdate.gruposCadena = gruposCadena;
      aliasInfoUpdate.cadenas = cadenas;
      aliasInfoUpdate.mercados = mercados;
      
    } catch (error) {
      console.error(`Error al obtener datos adicionales:`, error);
      aliasInfoUpdate.aliasIdioma = aliasInfoUpdate.aliasIdioma || [];
      aliasInfoUpdate.acoples = [];
      aliasInfoUpdate.ajenos = [];
      aliasInfoUpdate.gruposCadena = [];
      aliasInfoUpdate.cadenas = [];
      aliasInfoUpdate.mercados = [];
    }
    
    res.json(aliasInfoUpdate);
  } catch (error) {
    console.error('Error en getAliasInfoUpdate:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasById = async (req, res) => {
  try {
    const { id } = req.params;
    const { idIdioma = 1 } = req.query;
    
    console.log(`Consultando alias con ID: ${id}, idIdioma: ${idIdioma}`);
    
    const alias = await aliasRepository.findAliasById(id, parseInt(idIdioma));
    
    if (!alias) {
      return res.status(404).json({ message: 'Alias no encontrado' });
    }
    
    res.json(alias);
  } catch (error) {
    console.error('Error en getAliasById:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasIdiomas = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Consultando idiomas del alias ID: ${id}`);
    
    const idiomas = await aliasRepository.findIdiomasByIdAlias(id);
    
    res.json(idiomas);
  } catch (error) {
    console.error('Error en getAliasIdiomas:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasArticulos = async (req, res) => {
  try {
    const { id } = req.params;
    const { idIdioma = 1 } = req.query;
    
    console.log(`Consultando artículos del alias ID: ${id}, idIdioma: ${idIdioma}`);
    
    const articulos = await aliasRepository.findAliasAjenoInfoByIdAlias(id, parseInt(idIdioma));
    
    res.json(articulos);
  } catch (error) {
    console.error('Error en getAliasArticulos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getAliasAmbitos = async (req, res) => {
  try {
    const { id } = req.params;
    const { idIdioma = 1 } = req.query;
    
    console.log(`Consultando ámbitos del alias ID: ${id}, idIdioma: ${idIdioma}`);
    
    const ambitos = await aliasRepository.findAmbitosByIdAlias(id, parseInt(idIdioma));
    
    res.json(ambitos);
  } catch (error) {
    console.error('Error en getAliasAmbitos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getIdiomas = async (req, res) => {
  try {
    const result = await aliasRepository.getIdiomas();
    console.log(`Idiomas obtenidos: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getIdiomas:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getGruposCadena = async (req, res) => {
  try {
    const result = await aliasRepository.getGruposCadena();
    console.log(`Grupos cadena obtenidos: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getGruposCadena:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getCadenas = async (req, res) => {
  try {
    const result = await aliasRepository.getCadenas();
    console.log(`Cadenas obtenidas: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getCadenas:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

exports.getMercados = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await aliasRepository.getMercados(parseInt(idIdioma));
    console.log(`Mercados obtenidos: ${result.length}`);
    
    res.json(result);
  } catch (error) {
    console.error('Error en getMercados:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

// Añade estos métodos a backend/node/controllers/aliasController.js

exports.activarAliasAjeno = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de elementos' 
      });
    }
    
    console.log(`Activando ${items.length} elementos`, items);
    
    let successCount = 0;
    for (const item of items) {
      try {
        await aliasRepository.updateEstadoAliasAjeno(
          item.idAlias, 
          item.idAjeno, 
          1  // ID para estado ACTIVO
        );
        successCount++;
      } catch (itemError) {
        console.error(`Error activando alias-ajeno (ID Alias: ${item.idAlias}, ID Ajeno: ${item.idAjeno}):`, itemError);
      }
    }
    
    res.json({
      success: true,
      message: `${successCount} elementos activados correctamente`,
      totalProcessed: items.length,
      successCount
    });
    
  } catch (error) {
    console.error('Error al activar alias-ajeno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al activar elementos', 
      error: error.message 
    });
  }
};

exports.pausarAliasAjeno = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de elementos' 
      });
    }
    
    console.log(`Pausando ${items.length} elementos`, items);
    
    let successCount = 0;
    for (const item of items) {
      try {
        await aliasRepository.updateEstadoAliasAjeno(
          item.idAlias, 
          item.idAjeno, 
          2  // ID para estado PAUSADO
        );
        successCount++;
      } catch (itemError) {
        console.error(`Error pausando alias-ajeno (ID Alias: ${item.idAlias}, ID Ajeno: ${item.idAjeno}):`, itemError);
      }
    }
    
    res.json({
      success: true,
      message: `${successCount} elementos pausados correctamente`,
      totalProcessed: items.length,
      successCount
    });
    
  } catch (error) {
    console.error('Error al pausar alias-ajeno:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al pausar elementos', 
      error: error.message 
    });
  }
};

// Corrección para el método deleteAliasAjeno en aliasController.js
exports.deleteAliasAjeno = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de elementos' 
      });
    }
    
    console.log(`Eliminando ${items.length} relaciones alias-artículo`, items);
    
    const usuarioBaja = req.body.usuario || 'WEBAPP';
    const fechaBaja = new Date();
    
    let successCount = 0;
    let errors = [];
    
    for (const item of items) {
      try {
        const idAlias = parseInt(item.idAlias);
        const idAjeno = parseInt(item.idAjeno);
        
        console.log(`Procesando eliminación para idAlias: ${idAlias}, idAjeno: ${idAjeno}`);
        
        const bajaResult = await aliasRepository.deleteAliasAjeno(
          idAlias, 
          idAjeno, 
          usuarioBaja, 
          fechaBaja
        );
        
        console.log(`Resultado baja: ${bajaResult}`);
        
        if (bajaResult) {
          successCount++;
        } else {
          errors.push({
            idAlias,
            idAjeno, 
            error: 'No se pudo eliminar la relación. Es posible que ya haya sido eliminada o no exista.'
          });
        }
      } catch (itemError) {
        console.error(`Error eliminando relación alias-artículo (ID Alias: ${item.idAlias}, ID Ajeno: ${item.idAjeno}):`, itemError);
        errors.push({
          idAlias: item.idAlias,
          idAjeno: item.idAjeno,
          error: itemError.message
        });
      }
    }
    
    res.json({
      success: successCount > 0,
      message: `${successCount} relaciones alias-artículo eliminadas correctamente`,
      totalProcessed: items.length,
      successCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error al eliminar relaciones alias-artículo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error del servidor al eliminar relaciones alias-artículo', 
      error: error.message 
    });
  }
};

exports.updateAlias = async (req, res) => {
  try {
    const { id } = req.params;
    const aliasData = req.body;
    
    console.log(`Editando alias ID: ${id}`, aliasData);
    
    // En una aplicación real, obtendríamos el usuario autenticado
    // const usuarioModificacion = req.user.username;
    const usuarioModificacion = aliasData.usuario || 'WEBAPP'; // Usuario por defecto o del request
    const fechaModificacion = new Date();
    
    // Inicializamos las banderas
    let setAliasUntrained = false;
    let propagateTareaAmbitoAplanado = false;
    
    // 1. Actualizar el tipo de estado del alias si se proporciona
    if (aliasData.idEstado || aliasData.idTipoEstadoAlias) {
      const idTipoEstadoAlias = aliasData.idEstado || aliasData.idTipoEstadoAlias;
      console.log(`Actualizando estado del alias a: ${idTipoEstadoAlias}`);
      await aliasRepository.updateTipoEstadoAlias(
        parseInt(id), 
        idTipoEstadoAlias, 
        usuarioModificacion, 
        fechaModificacion
      );
    }
    
    // 2. Actualizar los idiomas del alias
    if (aliasData.idiomas && Array.isArray(aliasData.idiomas)) {
      console.log(`Actualizando ${aliasData.idiomas.length} idiomas para el alias`);
      
      const formattedIdiomas = aliasData.idiomas.map(idioma => ({
        idIdioma: idioma.idIdioma,
        nombre: idioma.nombre || '',
        descripcion: idioma.descripcion || ''
      }));
      
      await aliasRepository.updateAliasIdioma(
        parseInt(id),
        formattedIdiomas,
        usuarioModificacion,
        fechaModificacion
      );
    }
    
    // 3. Actualizar los artículos asociados al alias
    if (aliasData.aliasAjeno && Array.isArray(aliasData.aliasAjeno)) {
      console.log(`Actualizando ${aliasData.aliasAjeno.length} artículos para el alias`);
      
      const formattedArticulos = aliasData.aliasAjeno.map(articulo => ({
        idAjeno: articulo.idAjeno,
        idTipoEstadoAjenoRam: articulo.idTipoEstadoAliasAjenoRam || articulo.idTipoEstadoAjenoRam || 1, // Por defecto ACTIVO
        idSint: articulo.idSint || null
      }));
      
      const result = await aliasRepository.updateAliasAjeno(
        parseInt(id),
        formattedArticulos,
        usuarioModificacion,
        fechaModificacion
      );
      
      setAliasUntrained = result || setAliasUntrained;
    }
    
    // 4. Actualizar los acoples si es un alias de tipo II con conexión ACOPLE
    const idTipoAlias = aliasData.idTipoAlias || 1;
    const idTipoConexion = aliasData.idTipoConexionOrigenDatoAlias || aliasData.idTipoConexion || 1;
    
    if (idTipoAlias === 2 && idTipoConexion === 2) { // 2 = TIPO_II y ACOPLE
      console.log('Procesando acoples para alias tipo II con conexión ACOPLE');
      
      if (aliasData.acoples && Array.isArray(aliasData.acoples)) {
        const formattedAcoples = aliasData.acoples.map(acople => ({
          idAlias: acople.idAlias,
          ratioAcople: acople.ratioAcople || 1,
          idTipoAlias: acople.idTipoAlias || 2 // Por defecto TIPO_II
        }));
        
        // Actualizar los acoples
        const updatedAliasAcople = await aliasRepository.updateAliasAcople(
          parseInt(id),
          formattedAcoples,
          usuarioModificacion,
          fechaModificacion
        );
        
        if (updatedAliasAcople) {
          // Actualizar alias_acople_tarea y alias_tarea si hubo cambios en los acoples
          await aliasRepository.updateAliasAcopleTarea(
            parseInt(id),
            formattedAcoples,
            usuarioModificacion,
            fechaModificacion
          );
          
          await aliasRepository.updateAliasTarea(
            parseInt(id),
            formattedAcoples,
            usuarioModificacion,
            fechaModificacion
          );
        }
        
        propagateTareaAmbitoAplanado = updatedAliasAcople;
        setAliasUntrained = setAliasUntrained || updatedAliasAcople;
      }
    }
    
    // 5. Actualizar el ámbito del alias
    if (aliasData.aliasAmbito) {
      console.log('Procesando ámbito del alias');
      
      const idAliasAmbito = await aliasRepository.getIdAliasAmbito(parseInt(id));
      
      // Obtener las localizaciones para el ámbito
      const localizaciones = await aliasRepository.findLocalizacionCompraByCadenaMercado(
        aliasData.aliasAmbito.idsCadena || [],
        aliasData.aliasAmbito.idsMercado || []
      );
      
      if (!idAliasAmbito) {
        // Si no existe un ámbito, lo creamos
        console.log('Creando nuevo ámbito para el alias');
        
        const newIdAmbito = await aliasRepository.createAliasAmbito(
          parseInt(id), 
          fechaModificacion, 
          usuarioModificacion
        );
        
        await aliasRepository.createAliasAmbitoAplanado(
          newIdAmbito,
          fechaModificacion, 
          usuarioModificacion, 
          localizaciones
        );
        
        // Crear stock localización
        const stockMaximo = idTipoAlias === 4 ? null : 100; // 4 = TIPO_IV
        await aliasRepository.createStockLocalizacion(
          parseInt(id),
          localizaciones.map(loc => loc.idLocalizacionCompra),
          stockMaximo,
          fechaModificacion, 
          usuarioModificacion
        );
      } else {
        // Si existe un ámbito, lo actualizamos
        console.log('Actualizando ámbito existente para el alias');
        
        const updatedAliasAmbitoAplanado = await aliasRepository.updateAliasAmbitoAplanado(
          parseInt(id), 
          idAliasAmbito, 
          localizaciones, 
          usuarioModificacion, 
          fechaModificacion
        );
        
        propagateTareaAmbitoAplanado = propagateTareaAmbitoAplanado || updatedAliasAmbitoAplanado;
        setAliasUntrained = setAliasUntrained || updatedAliasAmbitoAplanado;
      }
    }
    
    // 6. Propagar cambios en ámbitos aplanados de tareas si es necesario
    if (propagateTareaAmbitoAplanado && aliasData.aliasAmbito) {
      console.log('Propagando cambios en ámbitos aplanados de tareas');
      
      if (aliasData.acoples && aliasData.acoples.length > 0) {
        // Si hay acoples definidos, propagar por alias acople
        await aliasRepository.propagateTareaAmbitoAplanadoByUpdatedAliasAcople(
          parseInt(id),
          aliasData.acoples.map(acople => acople.idAlias),
          aliasData.aliasAmbito,
          usuarioModificacion,
          fechaModificacion
        );
      } else {
        // Si no hay acoples definidos, buscar acoples existentes y propagar
        const aliasAcoples = await aliasRepository.findAcoplesByMainAlias(parseInt(id));
        
        const idsAliasAcople = (aliasAcoples && aliasAcoples.length > 0)
          ? aliasAcoples
              .filter(acople => acople.fechaBaja === null)
              .map(acople => acople.idAliasAcople)
          : [];
        
        await aliasRepository.propagateTareaAmbitoAplanadoByUpdatedAlias(
          parseInt(id),
          idsAliasAcople,
          aliasData.aliasAmbito,
          usuarioModificacion,
          fechaModificacion
        );
      }
    }
    
    // 7. Marcar el alias como no entrenado si es necesario
    if (setAliasUntrained) {
      console.log('Marcando alias como no entrenado');
      await aliasRepository.updateAliasUntrained([parseInt(id)]);
    }
    
    // Respondemos con éxito
    res.json({
      success: true,
      message: 'Alias actualizado correctamente',
      data: {
        idAlias: id,
        timestamp: fechaModificacion,
        aliasUntrained: setAliasUntrained,
        propagateTareaAmbitoAplanado
      }
    });
  } catch (error) {
    console.error('Error al actualizar alias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar el alias', 
      error: error.message 
    });
  }
};

exports.getAliasInfo = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    console.log(`Consultando información de alias principales con idIdioma: ${idIdioma}`);
    
    const results = await aliasRepository.findAliasInfoById(idIdioma);
    
    res.json(results);
  } catch (error) {
    console.error('Error al obtener información de alias:', error);
    res.status(500).json({ message: 'Error al obtener información de alias', error: error.message });
  }
};

exports.createAlias = async (req, res) => {
  try {
    const aliasData = req.body;
    
    if (!aliasData.idiomas || aliasData.idiomas.length === 0) {
      return res.status(400).json({ message: 'Se requieren datos de idiomas para el alias' });
    }
    
    if (!aliasData.aliasAjeno || aliasData.aliasAjeno.length === 0) {
      return res.status(400).json({ message: 'Se requiere asociar al menos un artículo al alias' });
    }
    
    if (!aliasData.aliasAmbito || 
        !aliasData.aliasAmbito.idsGrupoCadena || 
        !aliasData.aliasAmbito.idsCadena || 
        !aliasData.aliasAmbito.idsMercado ||
        aliasData.aliasAmbito.idsGrupoCadena.length === 0 || 
        aliasData.aliasAmbito.idsCadena.length === 0 || 
        aliasData.aliasAmbito.idsMercado.length === 0) {
      return res.status(400).json({ message: 'Se requiere definir al menos un ámbito para el alias' });
    }
    
    console.log('Datos recibidos para crear alias:', aliasData);
    
    const result = await aliasRepository.createAlias(aliasData);
    
    res.status(201).json({
      success: true,
      message: 'Alias creado correctamente',
      idAlias: result.idAlias
    });
  } catch (error) {
    console.error('Error en createAlias:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear el alias', 
      error: error.message 
    });
  }
};