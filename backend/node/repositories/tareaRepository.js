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

exports.findAliasWithAcoples = async (idIdioma = 1) => {
  try {
    
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
      ORDER BY a.ID_ALIAS ASC
    `;
    
    const result = await sequelizeAjenos.query(sqlQuery, {
      replacements: { 
        idIdioma
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

exports.createTarea = async (nombreTarea, descripcion, idTipoTarea, idTipoEstadoTarea, usuarioAlta, fechaAlta) => {
  try {
    const maxIdQuery = `
      SELECT MAX(ID_TAREA_RAM) as maxId 
      FROM AJENOS.TAREA_RAM
    `;
    
    const maxIdResult = await sequelizeAjenos.query(maxIdQuery, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const idTarea = (maxIdResult[0]?.maxId || 0) + 1;
    
    const query = `
      INSERT INTO AJENOS.TAREA_RAM (
        ID_TAREA_RAM,
        NOMBRE, 
        DESCRIPCION, 
        ID_TIPO_TAREA, 
        ID_TIPO_ESTADO_TAREA_RAM, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        :idTarea,
        :nombreTarea, 
        :descripcion, 
        :idTipoTarea, 
        :idTipoEstadoTarea, 
        :usuarioAlta, 
        :fechaAlta
      )
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: {
        idTarea,
        nombreTarea,
        descripcion,
        idTipoTarea,
        idTipoEstadoTarea,
        usuarioAlta,
        fechaAlta
      },
      type: sequelizeAjenos.QueryTypes.INSERT
    });
    
    return idTarea;
  } catch (error) {
    console.error('Error al crear tarea:', error);
    throw error;
  }
};

exports.createTareaAlias = async (idTarea, aliasesTarea, usuarioAlta, fechaAlta) => {
  try {
    const valores = aliasesTarea.map(alias => `(
      ${alias.idAlias}, 
      ${idTarea}, 
      ${alias.idTipoAlias}, 
      ${alias.idTipoConexionOrigenDatoAlias ? alias.idTipoConexionOrigenDatoAlias : 'NULL'}, 
      '${usuarioAlta}', 
      '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
    )`).join(', ');
    
    if (!valores) {
      return;
    }
    
    const query = `
      INSERT INTO AJENOS.ALIAS_TAREA (
        ID_ALIAS, 
        ID_TAREA_RAM, 
        ID_TIPO_ALIAS, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${valores}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error(`Error al crear alias de tarea para la tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.createTareaAliasAcople = async (idTarea, aliasesTarea, usuarioAlta, fechaAlta) => {
  try {
    const acoples = aliasesTarea
      .filter(alias => alias.acoples && alias.acoples.length > 0)
      .flatMap(alias => alias.acoples.map(acople => ({
        idAlias: acople.idAlias,
        idAliasAcople: acople.idAliasAcople,
        idTipoOrigenDatoAlias: 1 // Equivalente a TipoOrigenDatoAliasEnum.ZARA
      })));
    
    if (acoples.length === 0) {
      return;
    }
    
    const valores = acoples.map(acople => `(
      ${acople.idAlias}, 
      ${acople.idAliasAcople}, 
      ${idTarea}, 
      ${acople.idTipoOrigenDatoAlias}, 
      '${usuarioAlta}', 
      '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
    )`).join(', ');
    
    const query = `
      INSERT INTO AJENOS.ALIAS_ACOPLE_TAREA (
        ID_ALIAS, 
        ID_ALIAS_ACOPLE, 
        ID_TAREA_RAM, 
        ID_TIPO_ORIGEN_DATO_ALIAS, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${valores}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error(`Error al crear acoples de alias para la tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.createTareaAmbito = async (idTarea, idTipoReglaAmbito, usuarioAlta, fechaAlta) => {
  try {
    const maxIdQuery = `
      SELECT MAX(ID_TAREA_AMBITO) as maxId 
      FROM AJENOS.TAREA_AMBITO
    `;
    
    const maxIdResult = await sequelizeAjenos.query(maxIdQuery, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const idTareaAmbito = (maxIdResult[0]?.maxId || 0) + 1;
    
    const query = `
      INSERT INTO AJENOS.TAREA_AMBITO (
        ID_TAREA_AMBITO,
        ID_TAREA_RAM, 
        ID_TIPO_REGLA_AMBITO, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        :idTareaAmbito,
        :idTarea, 
        :idTipoReglaAmbito, 
        :usuarioAlta, 
        :fechaAlta
      )
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: {
        idTareaAmbito,
        idTarea,
        idTipoReglaAmbito,
        usuarioAlta,
        fechaAlta
      },
      type: sequelizeAjenos.QueryTypes.INSERT
    });
    
    return idTareaAmbito;
  } catch (error) {
    console.error(`Error al crear ámbito para la tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoDistribution = async (ambitoAplanados, idTareaAmbito) => {
  try {
    const idsLocalizacionCompra = [...new Set(ambitoAplanados.map(item => item.idLocalizacionCompra))];
    
    if (idsLocalizacionCompra.length === 0) {
      return [];
    }
    
    const principalesQuery = `
      SELECT DISTINCT 
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        a.ID_ALIAS as idAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS_AMBITO aa
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS
      LEFT JOIN AJENOS.ALIAS_ACOPLE ac ON ac.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacionCompra)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
      AND aa.FECHA_BAJA IS NULL 
      AND a.FECHA_BAJA IS NULL 
      AND aaa.FECHA_BAJA IS NULL
    `;
    
    const principales = await sequelizeAjenos.query(principalesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacionCompra
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const compartidosQuery = `
      SELECT DISTINCT 
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        a.ID_ALIAS as idAlias,
        ac.ID_ALIAS_ACOPLE as idAliasAcople
      FROM AJENOS.ALIAS_AMBITO aa
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_ACOPLE ac ON ac.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacionCompra)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
      AND aa.FECHA_BAJA IS NULL 
      AND a.FECHA_BAJA IS NULL 
      AND aaa.FECHA_BAJA IS NULL
      AND EXISTS (
        SELECT 1
        FROM AJENOS.ALIAS_AMBITO aa2
        INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa2 ON aa2.ID_ALIAS_AMBITO = aaa2.ID_ALIAS_AMBITO
        WHERE aa2.ID_ALIAS = ac.ID_ALIAS_ACOPLE
        AND aaa2.ID_LOCALIZACION_COMPRA = aaa.ID_LOCALIZACION_COMPRA
        AND aaa2.FECHA_BAJA IS NULL 
        AND aa2.FECHA_BAJA IS NULL
      )
    `;
    
    const compartidos = await sequelizeAjenos.query(compartidosQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacionCompra
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return [...principales, ...compartidos];
  } catch (error) {
    console.error('Error al obtener datos de ámbito aplanado para distribución:', error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoCount = async (ambitoAplanados, idTareaAmbito) => {
  try {
    const idsLocalizacionCompra = [...new Set(ambitoAplanados.map(item => item.idLocalizacionCompra))];
    
    if (idsLocalizacionCompra.length === 0) {
      return [];
    }
    
    const principalesQuery = `
      SELECT DISTINCT 
        a.ID_ALIAS as idAlias,
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.FECHA_BAJA IS NULL
      AND aa.FECHA_BAJA IS NULL
      AND a.FECHA_BAJA IS NULL
      AND aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacionCompra)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
    `;
    
    const principales = await sequelizeAjenos.query(principalesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacionCompra
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const acoplesQuery = `
      SELECT DISTINCT 
        aAcople.ID_ALIAS as idAlias,
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        aAcople.ID_TIPO_ALIAS as idTipoAlias,
        aAcople.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS_ACOPLE ac
      INNER JOIN AJENOS.ALIAS aAcople ON aAcople.ID_ALIAS = ac.ID_ALIAS_ACOPLE
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = ac.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = aAcople.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.FECHA_BAJA IS NULL
      AND aa.FECHA_BAJA IS NULL
      AND a.FECHA_BAJA IS NULL
      AND aAcople.FECHA_BAJA IS NULL
      AND aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacionCompra)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
    `;
    
    const acoples = await sequelizeAjenos.query(acoplesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacionCompra
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return [...principales, ...acoples];
  } catch (error) {
    console.error('Error al obtener datos de ámbito aplanado para conteo:', error);
    throw error;
  }
};

exports.createTareaAmbitoAplanado = async (idTareaAmbito, tareaAmbitoAplanados, usuarioAlta, fechaAlta) => {
  try {
    if (!tareaAmbitoAplanados || tareaAmbitoAplanados.length === 0) {
      return;
    }
    
    const maxIdQuery = `
      SELECT MAX(ID_TAREA_AMBITO_APLANADO) as maxId 
      FROM AJENOS.TAREA_AMBITO_APLANADO
    `;
    
    const maxIdResult = await sequelizeAjenos.query(maxIdQuery, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    let nextId = (maxIdResult[0]?.maxId || 0) + 1;
    
    const valores = tareaAmbitoAplanados.map((item, index) => {
      const itemId = nextId + index;
      return `(
        ${itemId},
        ${idTareaAmbito}, 
        ${item.idLocalizacionCompra}, 
        ${item.idTipoEstadoLocalizacionRam}, 
        ${item.idTipoEstadoLocalizacionTarea || 1}, 
        ${item.idTipoAlias}, 
        ${item.idTipoConexionOrigenDatoAlias ? item.idTipoConexionOrigenDatoAlias : 'NULL'}, 
        ${item.idAlias}, 
        ${item.idAliasAcople ? item.idAliasAcople : 'NULL'}, 
        '${usuarioAlta}', 
        '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
      )`;
    }).join(', ');
    
    const query = `
      INSERT INTO AJENOS.TAREA_AMBITO_APLANADO (
        ID_TAREA_AMBITO_APLANADO,
        ID_TAREA_AMBITO, 
        ID_LOCALIZACION_COMPRA, 
        ID_TIPO_ESTADO_LOCALIZACION_RAM, 
        ID_TIPO_ESTADO_LOCALIZACION_TAREA, 
        ID_TIPO_ALIAS, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        ID_ALIAS, 
        ID_ALIAS_ACOPLE, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${valores}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error('Error al crear ámbito aplanado de tarea:', error);
    throw error;
  }
};

exports.findAliasByIdTarea = async (idTarea) => {
  try {
    const query = `
      SELECT a.ID_ALIAS as idAlias, a.ID_TIPO_ALIAS as idTipoAlias
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_TAREA at ON at.ID_ALIAS = a.ID_ALIAS
      WHERE at.ID_TAREA_RAM = :idTarea AND at.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar alias para tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.deleteTareas = async (idsTarea, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.TAREA_RAM 
      SET USUARIO_BAJA = :usuarioBaja, 
        FECHA_BAJA = :fechaBaja, 
        ID_TIPO_ESTADO_TAREA_RAM = 3
      WHERE ID_TAREA_RAM IN (:idsTarea)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsTarea,
        usuarioBaja,
        fechaBaja
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar tareas:`, error);
    throw error;
  }
};

exports.findEventosByIdTarea = async (idTarea) => {
  try {
    const query = `
      SELECT etr.ID_EVENTO_RAM as idEvento
      FROM AJENOS.TAREA_RAM tr
      LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE etr.ID_TAREA_RAM = :idTarea
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => item.idEvento);
  } catch (error) {
    console.error(`Error al buscar eventos para tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.findTareasByIdEvento = async (idEvento) => {
  try {
    const query = `
      SELECT tr.ID_TAREA_RAM as idTarea, tr.ID_TIPO_ESTADO_TAREA_RAM as idTipoEstadoTarea
      FROM AJENOS.EVENTO_RAM er
      LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      WHERE etr.ID_EVENTO_RAM = :idEvento
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idEvento },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar tareas para evento ${idEvento}:`, error);
    throw error;
  }
};

exports.updateEvento = async (idEvento, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.EVENTO_RAM 
      SET USUARIO_MODIFICACION = :usuarioBaja, 
        FECHA_MODIFICACION = :fechaBaja, 
        ID_TIPO_ESTADO_EVENTO_RAM = 1
      WHERE ID_EVENTO_RAM = :idEvento
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idEvento,
        usuarioBaja,
        fechaBaja
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar evento ${idEvento}:`, error);
    throw error;
  }
};

exports.findTareaInfoUpdate = async (idTarea, idIdioma = 1) => {
  try {
    const cacheKey = `tarea_info_${idTarea}_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const tareaQuery = `
      SELECT tr.ID_TAREA_RAM as idTarea, 
        tr.NOMBRE as nombreTarea, 
        tr.DESCRIPCION as descripcionTarea,
        tr.ID_TIPO_TAREA as idTipoTarea, 
        tr.ID_TIPO_ESTADO_TAREA_RAM as idTipoEstadoTarea
      FROM AJENOS.TAREA_RAM tr
      WHERE tr.ID_TAREA_RAM = :idTarea
      AND tr.FECHA_BAJA IS NULL
    `;
    
    const tareaResult = await sequelizeAjenos.query(tareaQuery, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (!tareaResult || tareaResult.length === 0) {
      return null;
    }
    
    const tareaData = {
      idTarea: tareaResult[0].idTarea,
      nombreTarea: fixEncoding(tareaResult[0].nombreTarea),
      descripcionTarea: fixEncoding(tareaResult[0].descripcionTarea),
      idTipoTarea: tareaResult[0].idTipoTarea,
      idTipoEstadoTarea: tareaResult[0].idTipoEstadoTarea
    };
    
    const aliasWithAcoples = await findAliasWithAcoplesByTareaId(idTarea, idIdioma);
    tareaData.alias = aliasWithAcoples;
    
    const cadenasQuery = `
      SELECT DISTINCT c.ID_CADENA as id, c.NOMBRE as descripcion, gcc.ID_GRUPO_CADENA as idGrupoCadena
      FROM MAESTROS.CADENA c
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA AND gc.ID_TIPO_GRUPO_CADENA = 6
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = :idTarea
      INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      AND lc.ID_CADENA = c.ID_CADENA
      AND taa.FECHA_BAJA IS NULL
    `;
    
    const cadenasResult = await sequelizeAjenos.query(cadenasQuery, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    tareaData.cadenas = cadenasResult.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion),
      idGrupoCadena: item.idGrupoCadena
    }));
    
    const mercadosQuery = `
      SELECT DISTINCT p.ID_PAIS as id, p.DESCRIPCION as descripcion, p.PAIS_ISO as codigoIsoMercado
      FROM MAESTROS.PAIS p
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = :idTarea
      INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO AND taa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA AND lc.ID_PAIS = p.ID_PAIS
    `;
    
    const mercadosResult = await sequelizeAjenos.query(mercadosQuery, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    tareaData.mercados = mercadosResult.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion),
      codigoIsoMercado: item.codigoIsoMercado
    }));
    
    const gruposCadenaQuery = `
      SELECT DISTINCT g.ID_GRUPO_CADENA as id, g.DESCRIPCION as descripcion
      FROM MAESTROS.GRUPO_CADENA g
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_GRUPO_CADENA = g.ID_GRUPO_CADENA
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = :idTarea
      INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      AND lc.ID_CADENA = gcc.ID_CADENA
      AND taa.FECHA_BAJA IS NULL
      WHERE g.ID_TIPO_GRUPO_CADENA = 6
    `;
    
    const gruposCadenaResult = await sequelizeAjenos.query(gruposCadenaQuery, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    tareaData.gruposCadena = gruposCadenaResult.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
    
    const ambitosQuery = `
      SELECT 
        MIN(taa.ID_TAREA_AMBITO_APLANADO) as idTareaAmbitoAplanado, 
        ta.ID_TAREA_AMBITO as idTareaAmbito,
        MIN(taa.ID_ALIAS) as idAlias, 
        ta.ID_TIPO_REGLA_AMBITO as idTipoReglaAmbito, 
        trai.DESCRIPCION as descripcionTipoReglaAmbito, 
        gc.ID_GRUPO_CADENA as idGrupoCadena, 
        gc.DESCRIPCION as descripcionGrupoCadena, 
        c.ID_CADENA as idCadena,
        c.NOMBRE as descripcionCadena, 
        p.ID_PAIS as idMercado, 
        p.DESCRIPCION as descripcionMercado, 
        lc.ID_LOCALIZACION_COMPRA as idLocalizacionCompra, 
        lc.DESCRIPCION as descripcionLocalizacionCompra, 
        MIN(taa.ID_TIPO_ESTADO_LOCALIZACION_RAM) as idEstadoLocalizacionRam,
        telr.DESCRIPCION as descripcionEstadoLocalizacionRam, 
        MIN(taa.ID_TIPO_ESTADO_LOCALIZACION_TAREA) as idEstadoLocalizacionTarea, 
        telt.DESCRIPCION as descripcionEstadoLocalizacionTarea, 
        p.PAIS_ISO as codigoIsoMercado, 
        MIN(taa.ID_ALIAS_ACOPLE) as idAliasAcople
      FROM AJENOS.TAREA_AMBITO_APLANADO taa
      INNER JOIN AJENOS.TAREA_AMBITO ta ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
      INNER JOIN AJENOS.TIPO_REGLA_AMBITO_IDIOMA trai ON trai.ID_TIPO_REGLA_AMBITO = ta.ID_TIPO_REGLA_AMBITO AND trai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      INNER JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA AND gc.ID_TIPO_GRUPO_CADENA = 6
      INNER JOIN MAESTROS.PAIS p ON p.ID_PAIS = lc.ID_PAIS
      INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telr ON telr.ID_TIPO_ESTADO_LOCALIZACION_RAM = taa.ID_TIPO_ESTADO_LOCALIZACION_RAM
      AND telr.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA_IDIOMA telt ON telt.ID_TIPO_ESTADO_LOCALIZACION_TAREA = taa.ID_TIPO_ESTADO_LOCALIZACION_TAREA
      AND telt.ID_IDIOMA = :idIdioma
      WHERE ta.ID_TAREA_RAM = :idTarea
      AND taa.FECHA_BAJA IS NULL
      GROUP BY lc.ID_LOCALIZACION_COMPRA, ta.ID_TAREA_AMBITO, ta.ID_TIPO_REGLA_AMBITO, trai.DESCRIPCION, 
        gc.ID_GRUPO_CADENA, gc.DESCRIPCION, c.ID_CADENA, c.NOMBRE, 
        p.ID_PAIS, p.DESCRIPCION, lc.DESCRIPCION, 
        telr.DESCRIPCION, telt.DESCRIPCION, p.PAIS_ISO
      ORDER BY lc.ID_LOCALIZACION_COMPRA
    `;
    
    const ambitosResult = await sequelizeAjenos.query(ambitosQuery, {
      replacements: { idTarea, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    tareaData.ambitos = ambitosResult.map(item => ({
      idTareaAmbitoAplanado: item.idTareaAmbitoAplanado,
      idTareaAmbito: item.idTareaAmbito,
      idTipoReglaAmbito: item.idTipoReglaAmbito,
      descripcionTipoReglaAmbito: fixEncoding(item.descripcionTipoReglaAmbito),
      idAlias: item.idAlias,
      idAliasAcople: item.idAliasAcople,
      idGrupoCadena: item.idGrupoCadena,
      descripcionGrupoCadena: fixEncoding(item.descripcionGrupoCadena),
      idCadena: item.idCadena,
      descripcionCadena: fixEncoding(item.descripcionCadena),
      idMercado: item.idMercado,
      descripcionMercado: fixEncoding(item.descripcionMercado),
      codigoIsoMercado: item.codigoIsoMercado,
      idLocalizacionCompra: item.idLocalizacionCompra,
      descripcionLocalizacionCompra: fixEncoding(item.descripcionLocalizacionCompra),
      idEstadoLocalizacionRam: item.idEstadoLocalizacionRam,
      descripcionEstadoLocalizacionRam: fixEncoding(item.descripcionEstadoLocalizacionRam),
      idEstadoLocalizacionTarea: item.idEstadoLocalizacionTarea,
      descripcionEstadoLocalizacionTarea: fixEncoding(item.descripcionEstadoLocalizacionTarea)
    }));

    return tareaData;
  } catch (error) {
    console.error(`Error en findTareaInfoUpdate para idTarea ${idTarea}:`, error);
    throw error;
  }
};

const findAliasWithAcoplesByTareaId = async (idTarea, idIdioma = 1) => {
  try {
    const query = `
      SELECT a.ID_ALIAS as idAlias, 
        ai.NOMBRE as nombre, 
        a.ID_TIPO_ALIAS as idTipoAlias, 
        tai.DESCRIPCION as descripcionTipoAlias,
        a.ID_TIPO_ESTADO_ALIAS as idTipoEstadoAlias, 
        teai.DESCRIPCION as descripcionTipoEstadoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        aa.ID_ALIAS_ACOPLE as idAliasAcople, 
        aa.RATIO_ACOPLE as ratioAcople, 
        ai_acople.NOMBRE as nombreAcople,
        acople.ID_TIPO_ALIAS as idTipoAliasAcople,
        acople.ID_TIPO_ESTADO_ALIAS as idTipoEstadoAliasAcople, 
        teai_acople.DESCRIPCION as descripcionTipoEstadoAliasAcople,
        acople.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAliasAcople
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_TAREA at ON at.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS AND tai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS AND teai.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.ALIAS_ACOPLE aa ON aa.ID_ALIAS = a.ID_ALIAS AND aa.FECHA_BAJA IS NULL
      LEFT JOIN AJENOS.ALIAS acople ON acople.ID_ALIAS = aa.ID_ALIAS_ACOPLE
      LEFT JOIN AJENOS.ALIAS_IDIOMA ai_acople ON ai_acople.ID_ALIAS = acople.ID_ALIAS AND ai_acople.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ALIAS_IDIOMA tai_acople ON tai_acople.ID_TIPO_ALIAS = acople.ID_TIPO_ALIAS AND tai_acople.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai_acople ON teai_acople.ID_TIPO_ESTADO_ALIAS = acople.ID_TIPO_ESTADO_ALIAS
      AND teai_acople.ID_IDIOMA = :idIdioma
      WHERE UPPER(teai.DESCRIPCION) NOT IN ('ELIMINADO', 'DELETED')
      AND (teai_acople.DESCRIPCION IS NULL OR UPPER(teai_acople.DESCRIPCION) NOT IN ('ELIMINADO', 'DELETED'))
      AND at.ID_TAREA_RAM = :idTarea
      AND a.FECHA_BAJA IS NULL
      AND at.FECHA_BAJA IS NULL
      AND (a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS = 1 OR a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS IS NULL)
      ORDER BY a.ID_ALIAS ASC
    `;
    
    const results = await sequelizeAjenos.query(query, {
      replacements: { idTarea, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return createAliasWithAcoples(results);
  } catch (error) {
    console.error(`Error en findAliasWithAcoplesByTareaId para idTarea ${idTarea}:`, error);
    throw error;
  }
};

exports.updateNombreTarea = async (idTarea, nombreTarea, usuarioModificacion, fechaModificacion) => {
  try {
    const query = `
      UPDATE AJENOS.TAREA_RAM 
      SET NOMBRE = :nombreTarea, 
        USUARIO_MODIFICACION = :usuarioModificacion, 
        FECHA_MODIFICACION = :fechaModificacion
      WHERE ID_TAREA_RAM = :idTarea
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea,
        nombreTarea,
        usuarioModificacion,
        fechaModificacion
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar nombre de tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.updateDescripcionTarea = async (idTarea, descripcion, usuarioModificacion, fechaModificacion) => {
  try {
    const query = `
      UPDATE AJENOS.TAREA_RAM 
      SET DESCRIPCION = :descripcion, 
        USUARIO_MODIFICACION = :usuarioModificacion, 
        FECHA_MODIFICACION = :fechaModificacion
      WHERE ID_TAREA_RAM = :idTarea
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea,
        descripcion,
        usuarioModificacion,
        fechaModificacion
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar descripción de tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.findTareaAmbitoByIdTarea = async (idTarea) => {
  try {
    const query = `
      SELECT ta.ID_TAREA_AMBITO as idTareaAmbito
      FROM AJENOS.TAREA_AMBITO ta
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ta.ID_TAREA_RAM
      WHERE tr.ID_TAREA_RAM = :idTarea
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.length > 0 ? result[0].idTareaAmbito : null;
  } catch (error) {
    console.error(`Error al obtener ID de ámbito para tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.updateTareaAlias = async (idTarea, createTareaAlias, usuarioModificacion, fechaModificacion) => {
  try {
    if (!createTareaAlias || !Array.isArray(createTareaAlias) || createTareaAlias.length === 0) {
      return;
    }
    
    const existingAliases = await findTareaAliasByIdTarea(idTarea);
    
    const newAliases = createTareaAlias.filter(alias => 
      !existingAliases.some(existing => 
        existing.idAlias === alias.idAlias && 
        existing.fechaBaja === null
      )
    );
    
    const aliasesToRemove = existingAliases.filter(existing => 
      !createTareaAlias.some(alias => 
        alias.idAlias === existing.idAlias
      )
    );
    
    const aliasesToRestore = existingAliases.filter(existing => 
      createTareaAlias.some(alias => 
        alias.idAlias === existing.idAlias && 
        existing.fechaBaja !== null
      )
    );
    
    if (aliasesToRestore.length > 0) {
      const idsToRestore = aliasesToRestore.map(alias => alias.idAlias);
      await restoreAliasTarea(idsToRestore, idTarea, usuarioModificacion, fechaModificacion);
    }
    
    if (newAliases.length > 0) {
      await insertAliasTarea(idTarea, newAliases, usuarioModificacion, fechaModificacion);
    }
    
    if (aliasesToRemove.length > 0) {
      await deleteAliasTarea(aliasesToRemove, usuarioModificacion, fechaModificacion);
    }
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar aliases de tarea ${idTarea}:`, error);
    throw error;
  }
};

const findTareaAliasByIdTarea = async (idTarea) => {
  try {
    const query = `
      SELECT at.ID_ALIAS as idAlias, at.ID_TAREA_RAM as idTarea, 
        at.ID_TIPO_ALIAS as idTipoAlias, 
        at.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        at.FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_TAREA at
      WHERE at.ID_TAREA_RAM = :idTarea
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al obtener aliases para tarea ${idTarea}:`, error);
    throw error;
  }
};

const restoreAliasTarea = async (idsAlias, idTarea, usuarioModificacion, fechaModificacion) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_TAREA 
      SET FECHA_BAJA = NULL, 
        USUARIO_BAJA = NULL,
        USUARIO_MODIFICACION = :usuarioModificacion,
        FECHA_MODIFICACION = :fechaModificacion
      WHERE ID_TAREA_RAM = :idTarea 
      AND ID_ALIAS IN (:idsAlias)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea,
        idsAlias, 
        usuarioModificacion, 
        fechaModificacion 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error('Error al restaurar aliases de tarea:', error);
    throw error;
  }
};

const insertAliasTarea = async (idTarea, aliases, usuarioAlta, fechaAlta) => {
  try {
    const valores = aliases.map(alias => `(
      ${alias.idAlias}, 
      ${idTarea}, 
      ${alias.idTipoAlias}, 
      ${alias.idTipoConexionOrigenDatoAlias ? alias.idTipoConexionOrigenDatoAlias : 'NULL'}, 
      '${usuarioAlta}', 
      '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
    )`).join(', ');
    
    if (!valores) {
      return;
    }
    
    const query = `
      INSERT INTO AJENOS.ALIAS_TAREA (
        ID_ALIAS, 
        ID_TAREA_RAM, 
        ID_TIPO_ALIAS, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${valores}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
    
    return true;
  } catch (error) {
    console.error(`Error al insertar nuevos aliases para tarea ${idTarea}:`, error);
    throw error;
  }
};

const deleteAliasTarea = async (aliases, usuarioBaja, fechaBaja) => {
  try {
    const idsAlias = aliases.map(alias => alias.idAlias);
    const idsTarea = [...new Set(aliases.map(alias => alias.idTarea))];
    
    const query = `
      UPDATE AJENOS.ALIAS_TAREA 
      SET FECHA_BAJA = :fechaBaja, 
        USUARIO_BAJA = :usuarioBaja
      WHERE ID_TAREA_RAM IN (:idsTarea) 
      AND ID_ALIAS IN (:idsAlias)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsTarea, 
        idsAlias, 
        usuarioBaja, 
        fechaBaja 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error('Error al eliminar aliases de tarea:', error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoDistributionEdit = async (idsLocalizacion, idTareaAmbito) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      return [];
    }
    
    const resultados = [];
    
    const principalesQuery = `
      SELECT DISTINCT 
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        a.ID_ALIAS as idAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS_AMBITO aa
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS
      LEFT JOIN AJENOS.ALIAS_ACOPLE ac ON ac.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
      AND aa.FECHA_BAJA IS NULL 
      AND a.FECHA_BAJA IS NULL 
      AND aaa.FECHA_BAJA IS NULL
    `;
    
    const principales = await sequelizeAjenos.query(principalesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacion
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    resultados.push(...principales);
    
    const compartidosQuery = `
      SELECT DISTINCT 
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        a.ID_ALIAS as idAlias,
        ac.ID_ALIAS_ACOPLE as idAliasAcople
      FROM AJENOS.ALIAS_AMBITO aa
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_ACOPLE ac ON ac.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
      AND aa.FECHA_BAJA IS NULL 
      AND a.FECHA_BAJA IS NULL 
      AND aaa.FECHA_BAJA IS NULL
      AND EXISTS (
        SELECT 1
        FROM AJENOS.ALIAS_AMBITO aa2
        INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa2 ON aa2.ID_ALIAS_AMBITO = aaa2.ID_ALIAS_AMBITO
        WHERE aa2.ID_ALIAS = ac.ID_ALIAS_ACOPLE
        AND aaa2.ID_LOCALIZACION_COMPRA = aaa.ID_LOCALIZACION_COMPRA
        AND aaa2.FECHA_BAJA IS NULL 
        AND aa2.FECHA_BAJA IS NULL
      )
    `;
    
    const compartidos = await sequelizeAjenos.query(compartidosQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacion
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    resultados.push(...compartidos);
    
    return resultados;
  } catch (error) {
    console.error('Error al obtener datos de ámbito aplanado para distribución:', error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoCountEdit = async (idsLocalizacion, idTareaAmbito) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      return [];
    }
    
    const resultados = [];
    
    const principalesQuery = `
      SELECT DISTINCT 
        a.ID_ALIAS as idAlias,
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        a.ID_TIPO_ALIAS as idTipoAlias,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.FECHA_BAJA IS NULL
      AND aa.FECHA_BAJA IS NULL
      AND a.FECHA_BAJA IS NULL
      AND aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
    `;
    
    const principales = await sequelizeAjenos.query(principalesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacion
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    resultados.push(...principales);
    
    const acoplesQuery = `
      SELECT DISTINCT 
        aAcople.ID_ALIAS as idAlias,
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        1 as idTipoEstadoLocalizacionTarea,
        aAcople.ID_TIPO_ALIAS as idTipoAlias,
        aAcople.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        NULL as idAliasAcople
      FROM AJENOS.ALIAS_ACOPLE ac
      INNER JOIN AJENOS.ALIAS aAcople ON aAcople.ID_ALIAS = ac.ID_ALIAS_ACOPLE
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = ac.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = aAcople.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS_TAREA ata ON ata.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = ata.ID_TAREA_RAM
      INNER JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      WHERE aaa.FECHA_BAJA IS NULL
      AND aa.FECHA_BAJA IS NULL
      AND a.FECHA_BAJA IS NULL
      AND aAcople.FECHA_BAJA IS NULL
      AND aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
      AND ta.ID_TAREA_AMBITO = :idTareaAmbito
    `;
    
    const acoples = await sequelizeAjenos.query(acoplesQuery, {
      replacements: { 
        idTareaAmbito,
        idsLocalizacion
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    resultados.push(...acoples);
    
    return resultados;
  } catch (error) {
    console.error('Error al obtener datos de ámbito aplanado para conteo:', error);
    throw error;
  }
};

exports.updateTareaAmbitoAplanado = async (idTareaAmbito, idTarea, idTipoTarea, createTareaAmbito, usuarioModificacion, fechaModificacion) => {
  try {

    if (!createTareaAmbito || !createTareaAmbito.createTareaAmbitoAplanado || createTareaAmbito.createTareaAmbitoAplanado.length === 0) {
      console.log(`No hay ámbitos aplanados para actualizar para tarea ${idTarea}`);
      return;
    }
    
    const existingAmbitos = await exports.findTareaAmbitoAplanadoByIdTareaAmbito(idTareaAmbito);
    console.log(`Ámbitos existentes encontrados: ${existingAmbitos.length}`);
    
    console.log(`Caché limpiada para tarea ${idTarea}`);

    let added = [];
    let removed = [];
    let restored = [];
    
    if (idTipoTarea === 2) { // COUNT type
      
      added = createTareaAmbito.createTareaAmbitoAplanado.filter(newAmbito => 
        !existingAmbitos.some(existing => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra &&
          existing.fechaBaja === null
        )
      );
      
      removed = existingAmbitos.filter(existing => 
        !createTareaAmbito.createTareaAmbitoAplanado.some(newAmbito => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra
        )
      );
      
      restored = existingAmbitos.filter(existing => 
        createTareaAmbito.createTareaAmbitoAplanado.some(newAmbito => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra
        ) &&
        existing.fechaBaja !== null
      );
      
    } else if (idTipoTarea === 1) { // DISTRIBUTION type
      
      added = createTareaAmbito.createTareaAmbitoAplanado.filter(newAmbito => 
        !existingAmbitos.some(existing => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra &&
          ((existing.idAliasAcople === null && newAmbito.idAliasAcople === null) || 
           existing.idAliasAcople === newAmbito.idAliasAcople) &&
          existing.fechaBaja === null
        )
      );
      
      removed = existingAmbitos.filter(existing => 
        !createTareaAmbito.createTareaAmbitoAplanado.some(newAmbito => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra &&
          ((existing.idAliasAcople === null && newAmbito.idAliasAcople === null) || 
           existing.idAliasAcople === newAmbito.idAliasAcople)
        )
      );
      
      restored = existingAmbitos.filter(existing => 
        createTareaAmbito.createTareaAmbitoAplanado.some(newAmbito => 
          existing.idAlias === newAmbito.idAlias &&
          existing.idLocalizacionCompra === newAmbito.idLocalizacionCompra &&
          ((existing.idAliasAcople === null && newAmbito.idAliasAcople === null) || 
           existing.idAliasAcople === newAmbito.idAliasAcople)
        ) &&
        existing.fechaBaja !== null
      );
    }
    
    if (added.length > 0) {
      console.log(`Añadiendo ${added.length} registros nuevos de ámbito aplanado`);
      await exports.createTareaAmbitoAplanado(
        idTareaAmbito,
        added,
        usuarioModificacion,
        fechaModificacion
      );
    }
    
    if (removed.length > 0) {
      console.log(`Eliminando ${removed.length} registros de ámbito aplanado`);
      const idsToRemove = removed.map(item => item.idTareaAmbitoAplanado);
      await exports.deleteTareaAmbitoAplanado(
        idsToRemove,
        fechaModificacion,
        usuarioModificacion
      );
    }
    
    if (restored.length > 0) {
      console.log(`Restaurando ${restored.length} registros de ámbito aplanado`);
      const idsToRestore = restored.map(item => item.idTareaAmbitoAplanado);
      await exports.restoreTareaAmbitoAplanado(
        idsToRestore,
        usuarioModificacion,
        fechaModificacion
      );
    }
    console.log(`findTareaInfoUpdate completado para tarea ${idTarea}`);
    
    return true;
  } catch (error) {
    console.error(`Error al actualizar ámbito aplanado para tarea ${idTarea}:`, error);
    throw error;
  }
};

exports.findTareaAmbitoAplanadoByIdTareaAmbito = async (idTareaAmbito) => {
  try {
    const query = `
      SELECT taa.ID_TAREA_AMBITO_APLANADO as idTareaAmbitoAplanado, 
        taa.ID_ALIAS as idAlias,
        taa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra, 
        taa.ID_ALIAS_ACOPLE as idAliasAcople, 
        taa.FECHA_BAJA as fechaBaja
      FROM AJENOS.TAREA_AMBITO_APLANADO taa
      WHERE taa.ID_TAREA_AMBITO = :idTareaAmbito
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTareaAmbito },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al obtener ámbitos aplanados para tarea ámbito ${idTareaAmbito}:`, error);
    throw error;
  }
};

exports.deleteTareaAmbitoAplanado = async (idsTareaAmbitoAplanado, fechaBaja, usuarioBaja) => {
  try {
    if (!idsTareaAmbitoAplanado || idsTareaAmbitoAplanado.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.TAREA_AMBITO_APLANADO 
      SET USUARIO_BAJA = :usuarioBaja, 
        FECHA_BAJA = :fechaBaja
      WHERE ID_TAREA_AMBITO_APLANADO IN (:idsTareaAmbitoAplanado)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsTareaAmbitoAplanado, 
        fechaBaja, 
        usuarioBaja 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error('Error al eliminar ámbitos aplanados:', error);
    throw error;
  }
};

exports.restoreTareaAmbitoAplanado = async (idsTareaAmbitoAplanado, usuarioModificacion, fechaModificacion) => {
  try {
    if (!idsTareaAmbitoAplanado || idsTareaAmbitoAplanado.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.TAREA_AMBITO_APLANADO 
      SET USUARIO_BAJA = NULL, 
        FECHA_BAJA = NULL, 
        FECHA_MODIFICACION = :fechaModificacion, 
        USUARIO_MODIFICACION = :usuarioModificacion
      WHERE ID_TAREA_AMBITO_APLANADO IN (:idsTareaAmbitoAplanado)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsTareaAmbitoAplanado, 
        usuarioModificacion, 
        fechaModificacion 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return true;
  } catch (error) {
    console.error('Error al restaurar ámbitos aplanados:', error);
    throw error;
  }
};