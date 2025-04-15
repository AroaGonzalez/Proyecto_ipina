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