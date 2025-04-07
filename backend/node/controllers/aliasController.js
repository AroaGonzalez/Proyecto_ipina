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