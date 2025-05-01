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

exports.findAliasWithAcoples = async (idIdioma = 1, idTipoTarea) => {
  try {
    const idTipoAlias = [parseInt(idTipoTarea)];
    
    const sqlQuery = `
      SELECT a.ID_ALIAS as idAlias, ai.NOMBRE as nombre, a.ID_TIPO_ALIAS as idTipoAlias, 
        tai.DESCRIPCION as descripcionTipoAlias, a.ID_TIPO_ESTADO_ALIAS as idTipoEstadoAlias, 
        teai.DESCRIPCION as descripcionTipoEstadoAlias, a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        aa.ID_ALIAS_ACOPLE as idAliasAcople, aa.RATIO_ACOPLE as ratioAcople, ai_acople.NOMBRE as nombreAcople,
        acople.ID_TIPO_ALIAS as idTipoAliasAcople, acople.ID_TIPO_ESTADO_ALIAS as idTipoEstadoAliasAcople,
        teai_acople.DESCRIPCION as descripcionTipoEstadoAliasAcople, acople.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAliasAcople
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS AND tai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS AND teai.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.ALIAS_ACOPLE aa ON aa.ID_ALIAS = a.ID_ALIAS AND aa.FECHA_BAJA IS NULL
      LEFT JOIN AJENOS.ALIAS acople ON acople.ID_ALIAS = aa.ID_ALIAS_ACOPLE
      LEFT JOIN AJENOS.ALIAS_IDIOMA ai_acople ON ai_acople.ID_ALIAS = acople.ID_ALIAS AND ai_acople.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ALIAS_IDIOMA tai_acople ON tai_acople.ID_TIPO_ALIAS = acople.ID_TIPO_ALIAS AND tai_acople.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai_acople ON teai_acople.ID_TIPO_ESTADO_ALIAS = acople.ID_TIPO_ESTADO_ALIAS AND teai_acople.ID_IDIOMA = :idIdioma
      WHERE UPPER(teai.DESCRIPCION) NOT IN ('ELIMINADO', 'DELETED')
      AND (teai_acople.DESCRIPCION IS NULL OR UPPER(teai_acople.DESCRIPCION) NOT IN ('ELIMINADO', 'DELETED'))
      AND (a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS = 1 OR a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS IS NULL)
      AND a.FECHA_BAJA IS NULL
      AND a.ID_TIPO_ALIAS IN (:idTipoAlias)
      ORDER BY a.ID_ALIAS ASC
    `;
    
    const result = await sequelizeAjenos.query(sqlQuery, {
      replacements: { 
        idIdioma,
        idTipoAlias
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return createAliasWithAcoples(result);
  } catch (error) {
    console.error('Error en findAliasWithAcoples:', error);
    throw error;
  }
};

function createAliasWithAcoples(results) {
  const aliasMap = {};
  
  for (const result of results) {
    const idAlias = result.idAlias;
    
    if (!aliasMap[idAlias]) {
      aliasMap[idAlias] = {
        idAlias,
        nombre: fixEncoding(result.nombre),
        idTipoAlias: result.idTipoAlias,
        descripcionTipoAlias: fixEncoding(result.descripcionTipoAlias),
        idTipoEstadoAlias: result.idTipoEstadoAlias,
        descripcionTipoEstadoAlias: fixEncoding(result.descripcionTipoEstadoAlias),
        idTipoConexionOrigenDatoAlias: result.idTipoConexionOrigenDatoAlias,
        acoples: []
      };
    }
    
    if (result.idAliasAcople) {
      const acople = {
        idAliasAcople: result.idAliasAcople,
        ratioAcople: result.ratioAcople,
        nombreAcople: fixEncoding(result.nombreAcople),
        idTipoAliasAcople: result.idTipoAliasAcople,
        idTipoEstadoAliasAcople: result.idTipoEstadoAliasAcople,
        descripcionTipoEstadoAliasAcople: fixEncoding(result.descripcionTipoEstadoAliasAcople),
        idTipoConexionOrigenDatoAliasAcople: result.idTipoConexionOrigenDatoAliasAcople
      };
      
      const acopleExists = aliasMap[idAlias].acoples.some(a => a.idAliasAcople === acople.idAliasAcople);
      
      if (!acopleExists) {
        aliasMap[idAlias].acoples.push(acople);
      }
    }
  }
  
  return Object.values(aliasMap);
}

exports.findTareaAmbitoAplanadoByIdAlias = async function(idIdioma, idsAlias, idsPais, idsGrupoCadena, idsCadena, idTipoEstadoLocalizacionTarea) {
  try {
    const { sequelizeAjenos } = require('../utils/database');
    
    const query = `
      SELECT 
        GC.ID_GRUPO_CADENA as idGrupoCadena,
        GC.DESCRIPCION as descripcionGrupoCadena,
        C.ID_CADENA as idCadena,
        C.NOMBRE as descripcionCadena,
        LC.ID_PAIS as idMercado,
        P.DESCRIPCION as descripcionMercado,
        LC.ID_LOCALIZACION as idLocalizacionCompra,
        LC.DESCRIPCION as descripcionLocalizacionCompra,
        TELR.ID_TIPO_ESTADO_LOCALIZACION as idEstadoLocalizacionRam,
        COALESCE(TELRI.DESCRIPCION, TELR.DESCRIPCION) as descripcionEstadoLocalizacionRam,
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA as idEstadoLocalizacionTarea,
        COALESCE(TELTCI.DESCRIPCION, TELTC.DESCRIPCION) as descripcionEstadoLocalizacionTarea,
        P.PAIS_ISO as codigoIsoMercado
      FROM AJENOS.ALIAS_AMBITO AA
      INNER JOIN AJENOS.ALIAS A ON A.ID_ALIAS = AA.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO AAA ON AA.ID_ALIAS_AMBITO = AAA.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA LC ON AAA.ID_LOCALIZACION_COMPRA = LC.ID_LOCALIZACION_COMPRA
      INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM LCR ON LC.ID_LOCALIZACION_COMPRA = LCR.ID_LOCALIZACION_COMPRA
      INNER JOIN MAESTROS.PAIS P ON LC.ID_PAIS = P.ID_PAIS
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA GCC ON LC.ID_CADENA = GCC.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA GC ON GCC.ID_GRUPO_CADENA = GC.ID_GRUPO_CADENA
      INNER JOIN MAESTROS.CADENA C ON C.ID_CADENA = GCC.ID_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM TELR ON LCR.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA TELRI ON TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELRI.ID_TIPO_ESTADO_LOCALIZACION_RAM
      AND TELRI.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA TELTC ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = :idTipoEstadoLocalizacionTarea
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA_IDIOMA TELTCI ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = TELTCI.ID_TIPO_ESTADO_LOCALIZACION_TAREA
      AND TELTCI.ID_IDIOMA = :idIdioma
      WHERE AA.ID_ALIAS IN (:idsAlias)
      AND LC.ID_PAIS IN (:idsPais)
      AND GC.ID_GRUPO_CADENA IN (:idsGrupoCadena)
      AND C.ID_CADENA IN (:idsCadena)
      AND AA.FECHA_BAJA IS NULL
      AND AAA.FECHA_BAJA IS NULL
      AND LC.FECHA_BAJA IS NULL
      GROUP BY GC.ID_GRUPO_CADENA, GC.DESCRIPCION,
      C.ID_CADENA, C.NOMBRE, LC.ID_PAIS, P.DESCRIPCION, LC.ID_LOCALIZACION, LC.DESCRIPCION, TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM,
      COALESCE(TELRI.DESCRIPCION, TELR.DESCRIPCION), TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA, COALESCE(TELTCI.DESCRIPCION, TELTC.DESCRIPCION),
      P.PAIS_ISO
      ORDER BY LC.ID_LOCALIZACION
    `;
    
    const results = await sequelizeAjenos.query(query, {
      replacements: {
        idIdioma,
        idsAlias,
        idsPais,
        idsGrupoCadena,
        idsCadena,
        idTipoEstadoLocalizacionTarea
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return formatResults(results);
  } catch (error) {
    console.error('Error en findTareaAmbitoAplanadoByIdAlias:', error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoByIdAliasConAcople = async function(idIdioma, idsAlias, idsPais, idsGrupoCadena, idsCadena, idTipoEstadoLocalizacionTarea) {
  try {
    const { sequelizeAjenos } = require('../utils/database');
    
    const query = `
      SELECT 
        GC.ID_GRUPO_CADENA as idGrupoCadena,
        GC.DESCRIPCION as descripcionGrupoCadena,
        C.ID_CADENA as idCadena, 
        C.NOMBRE as descripcionCadena, 
        LC.ID_PAIS as idMercado, 
        P.DESCRIPCION as descripcionMercado,
        LC.ID_LOCALIZACION as idLocalizacionCompra, 
        LC.DESCRIPCION as descripcionLocalizacionCompra,
        TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM as idEstadoLocalizacionRam, 
        COALESCE(TELRI.DESCRIPCION, TELR.DESCRIPCION) as descripcionEstadoLocalizacionRam,
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA as idEstadoLocalizacionTarea,
        COALESCE(TELTCI.DESCRIPCION, TELTC.DESCRIPCION) as descripcionEstadoLocalizacionTarea, 
        P.PAIS_ISO as codigoIsoMercado
      FROM AJENOS.ALIAS_AMBITO as AA
      INNER JOIN AJENOS.ALIAS A ON A.ID_ALIAS = AA.ID_ALIAS
      LEFT JOIN AJENOS.ALIAS_ACOPLE AC ON A.ID_ALIAS = AC.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO AAA ON AA.ID_ALIAS_AMBITO = AAA.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA LC ON AAA.ID_LOCALIZACION_COMPRA = LC.ID_LOCALIZACION_COMPRA
      INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM LCR ON LC.ID_LOCALIZACION_COMPRA = LCR.ID_LOCALIZACION_COMPRA
      INNER JOIN MAESTROS.PAIS P ON LC.ID_PAIS = P.ID_PAIS
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA GCC ON LC.ID_CADENA = GCC.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA GC ON GCC.ID_GRUPO_CADENA = GC.ID_GRUPO_CADENA
      INNER JOIN MAESTROS.CADENA C ON C.ID_CADENA = GCC.ID_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM TELR ON LCR.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA TELRI ON TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELRI.ID_TIPO_ESTADO_LOCALIZACION_RAM
      AND TELRI.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA TELTC ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = :idTipoEstadoLocalizacionTarea
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA_IDIOMA TELTCI ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = TELTCI.ID_TIPO_ESTADO_LOCALIZACION_TAREA
      AND TELTCI.ID_IDIOMA = :idIdioma
      WHERE AA.ID_ALIAS IN (:idsAlias) AND AAA.ID_LOCALIZACION_COMPRA IN (
        SELECT AAAC.ID_LOCALIZACION_COMPRA
        FROM AJENOS.ALIAS_AMBITO_APLANADO AAAC
        INNER JOIN AJENOS.ALIAS_AMBITO as AAC ON AAC.ID_ALIAS_AMBITO = AAAC.ID_ALIAS_AMBITO
        LEFT JOIN AJENOS.ALIAS_ACOPLE ACOPLE ON (AAC.ID_ALIAS = ACOPLE.ID_ALIAS_ACOPLE)
        WHERE GC.ID_GRUPO_CADENA IN (:idsGrupoCadena) AND C.ID_CADENA IN (:idsCadena) 
        AND P.ID_PAIS IN (:idsPais) AND AA.FECHA_BAJA IS NULL
        AND AAA.FECHA_BAJA IS NULL AND LC.FECHA_BAJA IS NULL
        AND (ACOPLE.ID_ALIAS IN (:idsAlias) OR ACOPLE.ID_ALIAS IS NULL)
      )
      GROUP BY GC.ID_GRUPO_CADENA, GC.DESCRIPCION,
      C.ID_CADENA, C.NOMBRE, LC.ID_PAIS, P.DESCRIPCION, LC.ID_LOCALIZACION, LC.DESCRIPCION, TELR.ID_TIPO_ESTADO_LOCALIZACION_RAM,
      COALESCE(TELRI.DESCRIPCION, TELR.DESCRIPCION), TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA, COALESCE(TELTCI.DESCRIPCION, TELTC.DESCRIPCION),
      P.PAIS_ISO
      ORDER BY LC.ID_LOCALIZACION
    `;
    
    const results = await sequelizeAjenos.query(query, {
      replacements: {
        idIdioma,
        idsAlias,
        idsPais,
        idsGrupoCadena,
        idsCadena,
        idTipoEstadoLocalizacionTarea
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return formatResults(results);
  } catch (error) {
    console.error('Error en findTareaAmbitoAplanadoByIdAliasConAcople:', error);
    throw error;
  }
};

function formatResults(results) {
  return results.map(result => ({
    idGrupoCadena: result.idGrupoCadena,
    descripcionGrupoCadena: fixEncoding(result.descripcionGrupoCadena),
    idCadena: result.idCadena,
    descripcionCadena: fixEncoding(result.descripcionCadena),
    idMercado: result.idMercado,
    descripcionMercado: fixEncoding(result.descripcionMercado),
    idLocalizacionCompra: result.idLocalizacionCompra,
    descripcionLocalizacionCompra: fixEncoding(result.descripcionLocalizacionCompra),
    idEstadoLocalizacionRam: result.idEstadoLocalizacionRam,
    descripcionEstadoLocalizacionRam: fixEncoding(result.descripcionEstadoLocalizacionRam),
    idEstadoLocalizacionTarea: result.idEstadoLocalizacionTarea,
    descripcionEstadoLocalizacionTarea: fixEncoding(result.descripcionEstadoLocalizacionTarea),
    codigoIsoMercado: result.codigoIsoMercado
  }));
}