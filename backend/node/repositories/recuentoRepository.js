const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');
const CACHE_DURATION = 30 * 1000;

const cache = {
  data: {},
  set: function(key, value, ttl = CACHE_DURATION) {
    const now = Date.now();
    this.data[key] = {
      value,
      expiry: now + ttl
    };
  },
  get: function(key) {
    const item = this.data[key];
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      delete this.data[key];
      return null;
    }
    
    return item.value;
  },
  clear: function(pattern = null) {
    if (pattern) {
      Object.keys(this.data).forEach(key => {
        if (key.includes(pattern)) {
          delete this.data[key];
        }
      });
    } else {
      this.data = {};
    }
  }
};

exports.getTiposEstadoRecuento = async (idIdioma = 1) => {
  try {
    const cacheKey = `tipos_estado_recuento_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const query = `
      SELECT 
        ter.ID_TIPO_ESTADO_RECUENTO as id,
        teri.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTADO_RECUENTO_RAM ter
      JOIN AJENOS.TIPO_ESTADO_RECUENTO_RAM_IDIOMA teri ON ter.ID_TIPO_ESTADO_RECUENTO_RAM = teri.ID_TIPO_ESTADO_RECUENTO_RAM
      WHERE teri.ID_IDIOMA = :idIdioma
      ORDER BY ter.ID_TIPO_ESTADO_RECUENTO
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const processedResult = result.map(item => ({
      id: item.id,
      descripcion: item.descripcion
    }));
    
    cache.set(cacheKey, processedResult);
    
    return processedResult;
  } catch (error) {
    console.error('Error al obtener tipos de estado de recuento:', error);
    return [];
  }
};