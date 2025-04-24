// backend/node/repositories/tareaRepository.js
const { sequelizeAjenos } = require('../utils/database');

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
  
  if (filter.idsTarea) {
    const idsTarea = Array.isArray(filter.idsTarea) ? filter.idsTarea : [filter.idsTarea];
    whereClauses.push('tr.ID_TAREA_RAM IN (:idsTarea)');
    params.idsTarea = idsTarea;
  }
  
  if (filter.idsAlias) {
    whereClauses.push('a.ID_ALIAS IN (:idsAlias)');
    params.idsAlias = filter.idsAlias;
  }
  
  if (filter.idsAjeno) {
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr3.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr3 LEFT JOIN AJENOS.ALIAS_TAREA at2 ON at2.ID_TAREA_RAM = tr3.ID_TAREA_RAM LEFT JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = at2.ID_ALIAS LEFT JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO WHERE tr3.FECHA_BAJA IS NULL AND aaa.ID_AJENO_SECCION_GLOBAL IN (:idsAjeno))');
    params.idsAjeno = filter.idsAjeno;
  }
  
  if (filter.idsMercado) {
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr2.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr2 LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr2.ID_TAREA_RAM LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO=ta.ID_TAREA_AMBITO LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA WHERE tr2.FECHA_BAJA IS NULL AND lc.ID_PAIS IN (:idsMercado))');
    params.idsMercado = filter.idsMercado;
  }
  
  if (filter.idsCadena) {
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr2.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr2 LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr2.ID_TAREA_RAM LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO=ta.ID_TAREA_AMBITO LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA WHERE tr2.FECHA_BAJA IS NULL AND lc.ID_CADENA IN (:idsCadena))');
    params.idsCadena = filter.idsCadena;
  }
  
  if (filter.idsGrupoCadena) {
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr5.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr5 LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr5.ID_TAREA_RAM LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO=ta.ID_TAREA_AMBITO LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA LEFT JOIN MAESTROS.CADENA c ON lc.ID_CADENA = c.ID_CADENA LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON c.ID_CADENA = gcc.ID_CADENA LEFT JOIN MAESTROS.GRUPO_CADENA gc ON gcc.ID_GRUPO_CADENA = gc.ID_GRUPO_CADENA WHERE tr5.FECHA_BAJA IS NULL AND gc.ID_TIPO_GRUPO_CADENA = 6 AND gc.ID_GRUPO_CADENA IN (:idsGrupoCadena))');
    params.idsGrupoCadena = filter.idsGrupoCadena;
  }
  
  if (filter.idsLocalizacion) {
    const idsLocalizacion = Array.isArray(filter.idsLocalizacion) ? filter.idsLocalizacion : [filter.idsLocalizacion];
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr6.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr6 LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr6.ID_TAREA_RAM LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO=ta.ID_TAREA_AMBITO WHERE tr6.FECHA_BAJA IS NULL AND taa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion))');
    params.idsLocalizacion = idsLocalizacion;
  }
  
  if (filter.idsGrupoLocalizacion) {
    whereClauses.push('tr.ID_TAREA_RAM IN (SELECT tr7.ID_TAREA_RAM FROM AJENOS.TAREA_RAM tr7 LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr7.ID_TAREA_RAM LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO=ta.ID_TAREA_AMBITO LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA LEFT JOIN AJENOS.GRUPO_LOCALIZACION_COMPRA_LOCALIZACION_COMPRA glclc ON glclc.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA LEFT JOIN AJENOS.GRUPO_LOCALIZACION_COMPRA glc ON glc.ID_GRUPO_LOCALIZACION_COMPRA = glclc.ID_GRUPO_LOCALIZACION_COMPRA WHERE tr7.FECHA_BAJA IS NULL AND glc.ID_GRUPO_LOCALIZACION_COMPRA IN (:idsGrupoLocalizacion))');
    params.idsGrupoLocalizacion = filter.idsGrupoLocalizacion;
  }
  
  if (filter.idsTipoTarea) {
    whereClauses.push('tt.ID_TIPO_TAREA IN (:idsTipoTarea)');
    params.idsTipoTarea = filter.idsTipoTarea;
  }
  
  if (filter.idsTipoEstadoTarea) {
    whereClauses.push('tetr.ID_TIPO_ESTADO_TAREA_RAM IN (:idsTipoEstadoTarea)');
    params.idsTipoEstadoTarea = filter.idsTipoEstadoTarea;
  }
  
  return { whereClauses, params };
};

exports.findTareasByFilter = async (filter = {}, pageable = { page: 0, size: 50 }) => {
  try {
    const cacheKey = `tareas_${JSON.stringify(filter)}_${pageable.page}_${pageable.size}`;
    cache.clear(cacheKey);
    
    const sqlQuery = `
      SELECT tr.ID_TAREA_RAM, tr.NOMBRE AS NOMBRE_TAREA, tt.ID_TIPO_TAREA, tti.DESCRIPCION AS DESCRIPCION_TIPO_TAREA,
      tetr.ID_TIPO_ESTADO_TAREA_RAM, tetri.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_TAREA, tr.FECHA_ALTA,
      GROUP_CONCAT(DISTINCT ai.NOMBRE ORDER BY ai.NOMBRE SEPARATOR ',') AS ALIAS
      FROM AJENOS.TAREA_RAM tr
      INNER JOIN AJENOS.TIPO_TAREA tt ON tt.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tt.ID_TIPO_TAREA <> 3
      INNER JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tti.ID_TIPO_TAREA = tt.ID_TIPO_TAREA AND tti.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_TAREA_RAM tetr ON tetr.ID_TIPO_ESTADO_TAREA_RAM = tr.ID_TIPO_ESTADO_TAREA_RAM
      INNER JOIN AJENOS.TIPO_ESTADO_TAREA_RAM_IDIOMA tetri ON tetri.ID_TIPO_ESTADO_TAREA_RAM = tetr.ID_TIPO_ESTADO_TAREA_RAM
      AND tetri.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.ALIAS_TAREA ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM AND ta.FECHA_BAJA IS NULL
      LEFT JOIN AJENOS.ALIAS a ON a.ID_ALIAS = ta.ID_ALIAS
      LEFT JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      WHERE tr.FECHA_BAJA IS NULL
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT tr.ID_TAREA_RAM) as total
      FROM AJENOS.TAREA_RAM tr
      INNER JOIN AJENOS.TIPO_TAREA tt ON tt.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tt.ID_TIPO_TAREA <> 3
      INNER JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tti.ID_TIPO_TAREA = tt.ID_TIPO_TAREA AND tti.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_TAREA_RAM tetr ON tetr.ID_TIPO_ESTADO_TAREA_RAM = tr.ID_TIPO_ESTADO_TAREA_RAM
      LEFT JOIN AJENOS.ALIAS_TAREA ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM AND ta.FECHA_BAJA IS NULL
      LEFT JOIN AJENOS.ALIAS a ON a.ID_ALIAS = ta.ID_ALIAS
      WHERE tr.FECHA_BAJA IS NULL
    `;
    
    let finalSqlQuery = sqlQuery;
    let finalCountQuery = countQuery;
    
    const { whereClauses, params } = buildWhereClause(filter);
    if (whereClauses.length > 0) {
      finalSqlQuery += ` AND ${whereClauses.join(' AND ')}`;
      finalCountQuery += ` AND ${whereClauses.join(' AND ')}`;
    }
    
    finalSqlQuery += ` GROUP BY tr.ID_TAREA_RAM, tr.NOMBRE, tt.ID_TIPO_TAREA, tti.DESCRIPCION, tetr.ID_TIPO_ESTADO_TAREA_RAM, tetri.DESCRIPCION, tr.FECHA_ALTA`;
    finalSqlQuery += ` ORDER BY tr.FECHA_ALTA DESC`;
    
    if (pageable && pageable.size) {
      finalSqlQuery += ` LIMIT ${pageable.size} OFFSET ${pageable.page * pageable.size}`;
    }
    
    const replacements = { 
      idIdioma: filter.idIdioma || 1,
      ...params 
    };
    
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    
    let processedResult = [];
    if (totalElements > 0) {
      const result = await sequelizeAjenos.query(finalSqlQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      processedResult = result.map(item => ({
        idTarea: item.ID_TAREA_RAM,
        nombreTarea: fixEncoding(item.NOMBRE_TAREA),
        idTipoTarea: item.ID_TIPO_TAREA,
        descripcionTipoTarea: fixEncoding(item.DESCRIPCION_TIPO_TAREA),
        idTipoEstadoTarea: item.ID_TIPO_ESTADO_TAREA_RAM,
        descripcionTipoEstadoTarea: fixEncoding(item.DESCRIPCION_TIPO_ESTADO_TAREA),
        fechaAlta: item.FECHA_ALTA ? new Date(item.FECHA_ALTA).toISOString().split('T')[0] : null,
        alias: item.ALIAS ? item.ALIAS.split(',').filter(a => a.trim() !== '') : []
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
    
    cache.set(cacheKey, finalResult);
    
    return finalResult;
  } catch (error) {
    console.error('Error en findTareasByFilter:', error);
    console.error('Error details:', error.stack);
    if (error.sql) {
      console.error('SQL that caused the error:', error.sql);
    }
    throw error;
  }
};

exports.getTiposTarea = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT tt.ID_TIPO_TAREA as id, tti.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_TAREA tt
      INNER JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tti.ID_TIPO_TAREA = tt.ID_TIPO_TAREA
      WHERE tti.ID_IDIOMA = :idIdioma
      ORDER BY tt.ID_TIPO_TAREA
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener tipos de tarea:', error);
    return [];
  }
};

exports.getTiposEstadoTarea = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT tetr.ID_TIPO_ESTADO_TAREA_RAM as id, tetri.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTADO_TAREA_RAM tetr
      INNER JOIN AJENOS.TIPO_ESTADO_TAREA_RAM_IDIOMA tetri ON tetri.ID_TIPO_ESTADO_TAREA_RAM = tetr.ID_TIPO_ESTADO_TAREA_RAM
      WHERE tetri.ID_IDIOMA = :idIdioma
      ORDER BY tetr.ID_TIPO_ESTADO_TAREA_RAM
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener estados de tarea:', error);
    return [];
  }
};

exports.getAliasesByTaskId = async (idTarea) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT a.ID_ALIAS, ai.NOMBRE, a.ID_TIPO_ALIAS
      FROM AJENOS.ALIAS_TAREA ta
      JOIN AJENOS.ALIAS a ON a.ID_ALIAS = ta.ID_ALIAS
      JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = 1
      WHERE ta.ID_TAREA_RAM = :idTarea
      AND ta.FECHA_BAJA IS NULL
    `, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      idAlias: item.ID_ALIAS,
      nombre: fixEncoding(item.NOMBRE),
      idTipoAlias: item.ID_TIPO_ALIAS
    }));
  } catch (error) {
    console.error(`Error al obtener alias para tarea ${idTarea}:`, error);
    return [];
  }
};

exports.updateEstadoTarea = async (idTarea, idTipoEstadoTarea) => {
  try {
    const query = `
      UPDATE AJENOS.TAREA_RAM
      SET ID_TIPO_ESTADO_TAREA_RAM = :idTipoEstadoTarea
      WHERE ID_TAREA_RAM = :idTarea
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea,
        idTipoEstadoTarea
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar estado de tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.invalidateCache = (pattern = null) => {
  cache.clear(pattern);
};