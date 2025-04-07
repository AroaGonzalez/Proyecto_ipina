// backend/node/repositories/aliasRepository.js
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

function fixEncoding(text) {
  if (!text) return text;
  return text
    .replace(/Ã³/g, 'ó')
    .replace(/Ã­/g, 'í')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/ProducciÃ³n/g, 'Producción');
}

const buildWhereClause = (filter) => {
  let whereClauses = [];
  let params = {};
  
  if (filter.tipoAlias) {
    whereClauses.push('ta.ID_TIPO_ALIAS IN (:tipoAlias)');
    params.tipoAlias = filter.tipoAlias;
  }
  
  if (filter.idAlias) {
    whereClauses.push('a.ID_ALIAS IN (:idAlias)');
    params.idAlias = filter.idAlias;
  }
  
  if (filter.estadoAlias) {
    whereClauses.push('tea.ID_TIPO_ESTADO_ALIAS IN (:estadoAlias)');
    params.estadoAlias = filter.estadoAlias;
  }
  
  if (filter.estacionalidad) {
    whereClauses.push('te.ID_TIPO_ESTACIONALIDAD IN (:estacionalidad)');
    params.estacionalidad = filter.estacionalidad;
  }
  
  if (filter.articulos) {
    whereClauses.push('aa.ID_AJENO IN (:articulos)');
    params.articulos = filter.articulos;
  }
  
  return { whereClauses, params };
};

exports.findAliasByFilter = async (filter = {}, pageable = { page: 0, size: 50 }) => {
  try {    
    const cacheKey = `alias_${JSON.stringify(filter)}_${pageable.page}_${pageable.size}`;
    cache.clear(cacheKey);
    
    console.log('Ejecutando consulta de alias...');
    
    const searchQuery = `
      SELECT DISTINCT a.ID_ALIAS, 
        ai.NOMBRE, 
        ai.DESCRIPCION, 
        ta.ID_TIPO_ALIAS, 
        tai.DESCRIPCION as DESCRIPCIONTIPOALIAS,
        tea.ID_TIPO_ESTADO_ALIAS, 
        teai.DESCRIPCION as DESCRIPCIONTIPOESTADOALIAS,
        (SELECT COUNT(aa2.ID_AJENO) FROM AJENOS.ALIAS_AJENO aa2 WHERE aa2.ID_ALIAS = a.ID_ALIAS 
        AND aa2.FECHA_BAJA IS NULL) AS NUMEROAJENOS, 
        te.ID_TIPO_ESTACIONALIDAD, 
        tei.DESCRIPCION as DESCRIPCIONTIPOESTACIONALIDAD, 
        a.FECHA_ALTA, 
        a.USUARIO_ALTA, 
        a.FECHA_MODIFICACION 
      FROM AJENOS.ALIAS a 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = a.ID_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS AND tai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS tea ON tea.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS 
        AND teai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD te ON te.ID_TIPO_ESTACIONALIDAD = a.ID_TIPO_ESTACIONALIDAD 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD 
        AND tei.ID_IDIOMA = :idIdioma 
      WHERE a.FECHA_BAJA IS NULL 
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT a.ID_ALIAS) as total
      FROM AJENOS.ALIAS a 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = a.ID_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS 
        AND tai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS tea ON tea.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS 
        AND teai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD te ON te.ID_TIPO_ESTACIONALIDAD = a.ID_TIPO_ESTACIONALIDAD 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD 
        AND tei.ID_IDIOMA = :idIdioma 
      WHERE a.FECHA_BAJA IS NULL 
    `;
    
    let finalSearchQuery = searchQuery;
    let finalCountQuery = countQuery;
    
    const { whereClauses, params } = buildWhereClause(filter);
    if (whereClauses.length > 0) {
      finalSearchQuery += ` AND ${whereClauses.join(' AND ')}`;
      finalCountQuery += ` AND ${whereClauses.join(' AND ')}`;
    }
    
    finalSearchQuery += ` ORDER BY a.ID_ALIAS DESC`;
    
    if (pageable && pageable.size) {
      finalSearchQuery += ` LIMIT :limit OFFSET :offset`;
    }
    
    const replacements = { 
      idIdioma: filter.idIdioma || 1,
      limit: pageable.size,
      offset: pageable.page * pageable.size,
      ...params 
    };
    
    console.log('Ejecutando consulta count...');
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    console.log(`Total de elementos: ${totalElements}`);
    
    let processedResult = [];
    if (totalElements > 0) {
      console.log('Ejecutando consulta principal...');
      const result = await sequelizeAjenos.query(finalSearchQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      processedResult = result.map(item => ({
        id: item.ID_ALIAS,
        nombreAlias: fixEncoding(item.NOMBRE),
        descripcion: fixEncoding(item.DESCRIPCION),
        tipo: fixEncoding(item.DESCRIPCIONTIPOALIAS),
        idTipo: item.ID_TIPO_ALIAS,
        estado: fixEncoding(item.DESCRIPCIONTIPOESTADOALIAS),
        idEstado: item.ID_TIPO_ESTADO_ALIAS,
        numArticulos: parseInt(item.NUMEROAJENOS),
        estacionalidad: fixEncoding(item.DESCRIPCIONTIPOESTACIONALIDAD),
        idEstacionalidad: item.ID_TIPO_ESTACIONALIDAD,
        ultimaModificacion: item.FECHA_MODIFICACION ? new Date(item.FECHA_MODIFICACION).toISOString().split('T')[0] : null,
        fechaAlta: item.FECHA_ALTA ? new Date(item.FECHA_ALTA).toISOString().split('T')[0] : null,
        usuario: item.USUARIO_ALTA
      }));
    }
    
    const totalPages = Math.ceil(totalElements / pageable.size);
    
    const finalResult = {
      content: processedResult,
      totalElements,
      number: pageable.page,
      size: pageable.size,
      totalPages
    };
    
    console.log(`Procesados ${processedResult.length} registros`);
    
    if (processedResult.length > 0) {
      console.log('Muestra:', processedResult[0]);
    }
    
    return finalResult;
  } catch (error) {
    console.error('Error en findAliasByFilter:', error);
    throw error;
  }
};

exports.getTiposAlias = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT ta.ID_TIPO_ALIAS as id, tai.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ALIAS ta
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS
      WHERE tai.ID_IDIOMA = :idIdioma
      ORDER BY ta.ID_TIPO_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener tipos de alias:', error);
    return [];
  }
};

exports.getEstadosAlias = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT tea.ID_TIPO_ESTADO_ALIAS as id, teai.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTADO_ALIAS tea
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS
      WHERE teai.ID_IDIOMA = :idIdioma
      ORDER BY tea.ID_TIPO_ESTADO_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener estados de alias:', error);
    return [];
  }
};

exports.getEstacionalidades = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT te.ID_TIPO_ESTACIONALIDAD as id, tei.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTACIONALIDAD te
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD
      WHERE tei.ID_IDIOMA = :idIdioma
      ORDER BY te.ID_TIPO_ESTACIONALIDAD
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener estacionalidades:', error);
    return [];
  }
};

exports.getAliasesForFilter = async (idIdioma = 1) => {
  try {
    console.log(`[DEBUG] Obteniendo alias para filtro con idIdioma=${idIdioma}`);
    
    const result = await sequelizeAjenos.query(`
      SELECT 
        ai.ID_ALIAS as id, ai.NOMBRE as nombre
      FROM AJENOS.ALIAS_IDIOMA ai
      INNER JOIN AJENOS.ALIAS a ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      WHERE a.FECHA_BAJA IS NULL
      ORDER BY ai.ID_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });
    
    console.log(`[DEBUG] Consulta completada. Resultados obtenidos: ${result.length}`);
    
    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.nombre)
    }));
  } catch (error) {
    console.error('[ERROR] Error al obtener alias para filtro:', error);
    console.error('Mensaje del error:', error.message);
    return [];
  }
};

exports.getAjenos = async (idIdioma = 1) => {
  try {
    try {
      const result = await sequelizeAjenos.query(`
        SELECT ai.ID_AJENO as id, ai.NOMBRE as nombre
        FROM AJENOS.AJENO_RAM a
        INNER JOIN AJENOS.AJENO_IDIOMA ai ON ai.ID_AJENO = a.ID_AJENO AND ai.ID_IDIOMA = :idIdioma
        ORDER BY a.ID_AJENO
        `, {
        replacements: { idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(item => ({
        id: item.id,
        nombre: String(item.nombre)
      }));
    } catch (error) {
      console.error('Error consultando AJENO_RAM, intentando con AJENO:', error);
    }
  } catch (error) {
    console.error('Error al obtener ajenos:', error);
    return [];
  }
};

exports.invalidateCache = (pattern = null) => {
  cache.clear(pattern);
};