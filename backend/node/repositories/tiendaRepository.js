// backend/node/repositories/tiendaRepository.js
const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');

const CACHE_DURATION = 60 * 60 * 1000;

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

// Función para corregir problemas de codificación
const correctEncoding = (text) => {
  if (!text) return text;
  
  return text
    .replace(/Ã¡/g, 'á')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã\u0081/g, 'Á')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã\u008D/g, 'Í')
    .replace(/Ã"/g, 'Ó')
    .replace(/Ãš/g, 'Ú')
    .replace(/Ã'/g, 'Ñ')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ãœ/g, 'Ü')
    .replace(/RepÃºblica/g, 'República')
    .replace(/REPÃšBLICA/g, 'REPÚBLICA')
    .replace(/MacÃ©/g, 'Macé')
    .replace(/MACÃ‰/g, 'MACÉ')
    .replace(/MONTENEGR/g, 'MONTENEGRO')
    .replace(/CONCHIÃ/g, 'CONCHÍ');
};

const buildWhereClause = (filter) => {
  let whereClauses = [];
  let params = {};
  
  if (filter.idsMercado && filter.idsMercado.length) {
    whereClauses.push('lc.ID_PAIS IN (:idsMercado)');
    params.idsMercado = Array.isArray(filter.idsMercado) ? filter.idsMercado : [filter.idsMercado];
  }
  
  if (filter.idsGrupoCadena && filter.idsGrupoCadena.length) {
    whereClauses.push('gc.ID_GRUPO_CADENA IN (:idsGrupoCadena)');
    params.idsGrupoCadena = Array.isArray(filter.idsGrupoCadena) ? filter.idsGrupoCadena : [filter.idsGrupoCadena];
  }
  
  if (filter.idsCadena && filter.idsCadena.length) {
    whereClauses.push('c.ID_CADENA IN (:idsCadena)');
    params.idsCadena = Array.isArray(filter.idsCadena) ? filter.idsCadena : [filter.idsCadena];
  }
  
  if (filter.idsGrupoLocalizacion && filter.idsGrupoLocalizacion.length) {
    whereClauses.push(`lc.ID_LOCALIZACION_COMPRA IN 
      (SELECT glclc.ID_LOCALIZACION_COMPRA
       FROM AJENOS.GRUPO_LOCALIZACION_COMPRA_LOCALIZACION_COMPRA glclc 
       WHERE glclc.ID_GRUPO_LOCALIZACION_COMPRA IN (:idsGrupoLocalizacion))`);
    params.idsGrupoLocalizacion = Array.isArray(filter.idsGrupoLocalizacion) ? filter.idsGrupoLocalizacion : [filter.idsGrupoLocalizacion];
  }

  if (filter.idLocalizacion || (filter.idsLocalizacion && filter.idsLocalizacion.length)) {
    whereClauses.push('lc.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)');
    
    if (filter.idLocalizacion) {
      // Si viene como idLocalizacion, convertirlo en array
      params.idsLocalizacion = [filter.idLocalizacion];
    } else {
      // Si ya viene como idsLocalizacion, asegurarse que sea array
      params.idsLocalizacion = Array.isArray(filter.idsLocalizacion) ? 
        filter.idsLocalizacion : [filter.idsLocalizacion];
    }
  }
  
  return { whereClauses, params };
};

exports.findTiendasByFilter = async (filter = {}, pageable = { page: 0, size: 50 }, idIdioma = 1) => {
  try {    
    const cacheKey = `tiendas_${JSON.stringify(filter)}_${pageable.page}_${pageable.size}_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log('Cache hit para:', cacheKey);
      return cachedResult;
    }
    
    console.log('Cache miss para:', cacheKey);
    console.time('queryExecution');
    
    const baseQuery = `
      WITH relevant_estados AS (
        SELECT 
          th.ID_TIENDA,
          et.ID_ESTADO_TIENDA,
          eti.DESCRIPCION AS estadoTiendaMtu
        FROM MAESTROS.TIENDA_HISTORICO th
        JOIN MAESTROS.ESTADO_TIENDA et ON et.ID_ESTADO_TIENDA = th.ID_ESTADO_TIENDA
        LEFT JOIN MAESTROS.ESTADO_TIENDA_IDIOMA eti ON eti.ID_IDIOMA = :idIdioma AND eti.ID_ESTADO_TIENDA = et.ID_ESTADO_TIENDA
        WHERE th.ESTADO_VIGENTE = 1
        GROUP BY th.ID_TIENDA
      )
      SELECT 
        mp.ID_PAIS AS idMercado, 
        COALESCE(mpi.DESCRIPCION, mp.DESCRIPCION) as nombreMercado, 
        gc.DESCRIPCION AS nombreGrupoCadena,
        c.NOMBRE AS nombreCadena, 
        lcr.ID_LOCALIZACION_COMPRA_RAM AS idLocalizacionRam, 
        lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM AS idTipoEstadoLocalizacionRam, 
        lc.ID_LOCALIZACION_COMPRA AS codigoTienda, 
        lc.DESCRIPCION AS nombreTienda, 
        mp.PAIS_ISO AS codigoIsoMercado, 
        telri.DESCRIPCION AS descripcionTipoEstadoLocalizacionRam,
        re.ID_ESTADO_TIENDA AS idEstadoTiendaMtu, 
        re.estadoTiendaMtu
      FROM AJENOS.LOCALIZACION_COMPRA_RAM lcr
      JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA
      JOIN MAESTROS.PAIS mp ON lc.ID_PAIS = mp.ID_PAIS
      LEFT JOIN MAESTROS.PAIS_IDIOMA mpi ON mpi.ID_PAIS = mp.ID_PAIS AND mpi.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telri ON 
          telri.ID_TIPO_ESTADO_LOCALIZACION_RAM = lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM AND telri.ID_IDIOMA = :idIdioma
      JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
      JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION
      LEFT JOIN relevant_estados re ON re.ID_TIENDA = t.ID_TIENDA
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      AND lc.FECHA_BAJA IS NULL
      AND t.ID_TIPO_TIENDA IN (1, 2, 5, 10)
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM AJENOS.LOCALIZACION_COMPRA_RAM lcr
      JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA
      JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
      JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      AND lc.FECHA_BAJA IS NULL
      AND t.ID_TIPO_TIENDA IN (1, 2, 5, 10)
    `;

    const { whereClauses, params } = buildWhereClause(filter);
    
    let queryWithWhere = baseQuery;
    let countQueryWithWhere = countQuery;
    
    if (whereClauses.length > 0) {
      queryWithWhere += ` AND ${whereClauses.join(' AND ')}`;
      countQueryWithWhere += ` AND ${whereClauses.join(' AND ')}`;
    }

    queryWithWhere += ` ORDER BY lc.ID_LOCALIZACION_COMPRA ASC LIMIT :limit OFFSET :offset`;

    const replacements = { 
      idIdioma,
      limit: pageable.size,
      offset: pageable.page * pageable.size,
      ...params
    };

    const countResult = await sequelizeAjenos.query(countQueryWithWhere, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult?.[0]?.total || 0);
    
    let processedResult = [];
    if (totalElements > 0) {
      const result = await sequelizeAjenos.query(queryWithWhere, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });

      processedResult = result.map(item => {
        // Aplicar corrección de codificación a todos los campos relevantes
        return {
          ...item,
          estadoTiendaMtu: correctEncoding(item.estadoTiendaMtu) || 'Sin estado',
          descripcionTipoEstadoLocalizacionRam: correctEncoding(item.descripcionTipoEstadoLocalizacionRam) || '',
          nombreMercado: correctEncoding(item.nombreMercado && item.nombreMercado.includes('ESPA') ? 'ESPAÑA' : item.nombreMercado),
          nombreGrupoCadena: correctEncoding(item.nombreGrupoCadena),
          nombreCadena: correctEncoding(item.nombreCadena),
          nombreTienda: correctEncoding(item.nombreTienda)
        };
      });
    }

    const totalPages = Math.ceil(totalElements / pageable.size);

    const finalResult = {
      content: processedResult,
      totalElements,
      number: pageable.page,
      size: pageable.size,
      totalPages
    };
    
    console.timeEnd('queryExecution');
    
    cache.set(cacheKey, finalResult);
    
    return finalResult;
  } catch (error) {
    console.error('Error en findTiendasByFilter:', error);
    throw error;
  }
};

exports.getInitialTiendas = async (pageable = { page: 0, size: 50 }, idIdioma = 1) => {
  try {
    return await exports.findTiendasByFilter({}, pageable, idIdioma);
  } catch (error) {
    console.error('Error al obtener datos iniciales:', error);
    throw error;
  }
};

exports.getMercados = async (idIdioma = 1) => {
  try {
    const cacheKey = `mercados_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const query = `
      SELECT mp.ID_PAIS as id, COALESCE(mpi.DESCRIPCION, mp.DESCRIPCION) as descripcion
      FROM MAESTROS.PAIS mp
      LEFT JOIN MAESTROS.PAIS_IDIOMA mpi ON mpi.ID_PAIS = mp.ID_PAIS AND mpi.ID_IDIOMA = :idIdioma
      WHERE mp.ID_PAIS IN (
        SELECT DISTINCT lc.ID_PAIS 
        FROM AJENOS.LOCALIZACION_COMPRA lc
        WHERE lc.FECHA_BAJA IS NULL
      )
      ORDER BY mp.ID_PAIS
    `;
    
    const result = await sequelizeMaestros.query(query, {
      replacements: { idIdioma },
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    const correctedResult = result.map(item => {
      return {
        ...item,
        descripcion: correctEncoding(item.descripcion && item.descripcion.includes('ESPA') ? 'ESPAÑA' : item.descripcion)
      };
    });

    cache.set(cacheKey, correctedResult);
    return correctedResult;
  } catch (error) {
    console.error('Error al obtener mercados:', error);
    return [];
  }
};

exports.getGruposCadena = async (idIdioma = 1) => {
  try {
    const cacheKey = `grupos_cadena_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const query = `
      SELECT DISTINCT gc.ID_GRUPO_CADENA as id, gc.DESCRIPCION as descripcion
      FROM MAESTROS.GRUPO_CADENA gc
      JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_GRUPO_CADENA = gc.ID_GRUPO_CADENA
      JOIN MAESTROS.CADENA c ON c.ID_CADENA = gcc.ID_CADENA
      JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_CADENA = c.ID_CADENA
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      AND lc.FECHA_BAJA IS NULL
      ORDER BY gc.ID_GRUPO_CADENA
    `;
    
    const result = await sequelizeMaestros.query(query, {
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    // Corregir codificación
    const correctedResult = result.map(item => ({
      ...item,
      descripcion: correctEncoding(item.descripcion)
    }));

    cache.set(cacheKey, correctedResult);
    return correctedResult;
  } catch (error) {
    console.error('Error al obtener grupos de cadena:', error);
    return [];
  }
};

exports.getCadenas = async (idGrupoCadena = null, idIdioma = 1) => {
  try {
    const cacheKey = `cadenas_${idGrupoCadena || 'todas'}_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    let query = `
      SELECT DISTINCT c.ID_CADENA as id, c.NOMBRE as descripcion
      FROM MAESTROS.CADENA c
      JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_CADENA = c.ID_CADENA
    `;
    
    const replacements = {};
    
    if (idGrupoCadena) {
      query += ` JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA 
                WHERE gcc.ID_GRUPO_CADENA = :idGrupoCadena
                AND lc.FECHA_BAJA IS NULL`;
      replacements.idGrupoCadena = idGrupoCadena;
    } else {
      query += ` WHERE lc.FECHA_BAJA IS NULL`;
    }
    
    query += ` ORDER BY c.ID_CADENA `;
    
    const result = await sequelizeMaestros.query(query, {
      replacements,
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    // Corregir codificación
    const correctedResult = result.map(item => ({
      ...item,
      descripcion: correctEncoding(item.descripcion)
    }));

    cache.set(cacheKey, correctedResult);
    return correctedResult;
  } catch (error) {
    console.error('Error al obtener cadenas:', error);
    return [];
  }
};

exports.getGruposLocalizacion = async (idIdioma = 1) => {
  try {
    const cacheKey = `grupos_localizacion_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }

    const query = `
      SELECT DISTINCT glc.ID_GRUPO_LOCALIZACION_COMPRA as id, glc.DESCRIPCION as descripcion
      FROM AJENOS.GRUPO_LOCALIZACION_COMPRA glc
      JOIN AJENOS.GRUPO_LOCALIZACION_COMPRA_LOCALIZACION_COMPRA glclc ON glclc.ID_GRUPO_LOCALIZACION_COMPRA = glc.ID_GRUPO_LOCALIZACION_COMPRA
      JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = glclc.ID_LOCALIZACION_COMPRA
      WHERE lc.FECHA_BAJA IS NULL
      ORDER BY glc.ID_GRUPO_LOCALIZACION_COMPRA
    `;
    
    const result = await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    const correctedResult = result.map(item => ({
      ...item,
      descripcion: correctEncoding(item.descripcion)
    }));

    cache.set(cacheKey, correctedResult);
    return correctedResult;
  } catch (error) {
    console.error('Error al obtener grupos de localización:', error);
    return [];
  }
};

// En backend/node/repositories/tiendaRepository.js
exports.cambiarEstadoLocalizaciones = async (ids, estado) => {
  try {
    // Obtener el ID del estado según el valor recibido
    const estadoQuery = `
      SELECT ID_TIPO_ESTADO_LOCALIZACION_RAM 
      FROM AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA 
      WHERE DESCRIPCION LIKE :estado
    `;
    
    const estadoResult = await sequelizeAjenos.query(estadoQuery, {
      replacements: { estado: `%${estado}%` },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (!estadoResult || estadoResult.length === 0) {
      throw new Error(`Estado '${estado}' no encontrado`);
    }
    
    const idEstado = estadoResult[0].ID_TIPO_ESTADO_LOCALIZACION_RAM;
    
    // Actualizar los registros
    const updateQuery = `
      UPDATE AJENOS.LOCALIZACION_COMPRA_RAM
      SET ID_TIPO_ESTADO_LOCALIZACION_RAM = :idEstado,
          FECHA_MODIFICACION = NOW()
      WHERE ID_LOCALIZACION_COMPRA_RAM IN (:ids)
    `;
    
    await sequelizeAjenos.query(updateQuery, {
      replacements: { 
        idEstado,
        ids
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    // Invalidar caché relacionada
    cache.clear('tiendas_');
    
    return { success: true, idsActualizados: ids.length };
  } catch (error) {
    console.error(`Error al cambiar estado a '${estado}':`, error);
    throw error;
  }
};

exports.invalidateCache = (pattern = null) => {
  cache.clear(pattern);
};