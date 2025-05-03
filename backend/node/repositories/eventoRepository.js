// backend/node/repositories/eventoRepository.js
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

// Constantes para enumerados
const TipoAliasEnum = {
  TIPO_IV: { idTipoAlias: 4 }
};

exports.findEventosByFilter = async (filter = {}, tipoAlias = []) => {
  try {
    const cacheKey = `eventos_${JSON.stringify(filter)}_${JSON.stringify(tipoAlias)}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    let sqlQuery = `
      SELECT
        er.ID_EVENTO_RAM AS idEvento,
        er.NOMBRE AS nombreEvento,
        ter.ID_TIPO_EVENTO_RAM AS idTipoEvento,
        teri.DESCRIPCION AS descripcionTipoEvento,
        teer.ID_TIPO_ESTADO_EVENTO_RAM AS idTipoEstadoEvento,
        teeri.DESCRIPCION AS descripcionTipoEstadoEvento,
        tt.ID_TIPO_TAREA AS idTipoTarea,
        tti.DESCRIPCION AS descripcionTipoTarea,
        er.FECHA_ALTA AS fechaCreacion,
        COUNT(DISTINCT CASE WHEN tr.FECHA_BAJA IS NULL THEN etr.ID_TAREA_RAM END) AS tareasAsociadas,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM AJENOS.ALIAS a
                INNER JOIN AJENOS.ALIAS_TAREA at2 ON a.ID_ALIAS = at2.ID_ALIAS
                INNER JOIN AJENOS.TAREA_RAM t ON at2.ID_TAREA_RAM = t.ID_TAREA_RAM AND t.FECHA_BAJA IS NULL
                INNER JOIN AJENOS.EVENTO_TAREA_RAM et ON t.ID_TAREA_RAM = et.ID_TAREA_RAM
                WHERE a.ENTRENADO = 0
                AND et.ID_EVENTO_RAM = er.ID_EVENTO_RAM
            ) THEN 'FALSE'
            ELSE 'TRUE'
        END AS entrenado
      FROM AJENOS.EVENTO_RAM er
      INNER JOIN AJENOS.TIPO_EVENTO_RAM ter ON ter.ID_TIPO_EVENTO_RAM = er.ID_TIPO_EVENTO_RAM
      INNER JOIN AJENOS.TIPO_EVENTO_RAM_IDIOMA teri ON teri.ID_TIPO_EVENTO_RAM = ter.ID_TIPO_EVENTO_RAM AND teri.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_EVENTO_RAM teer ON teer.ID_TIPO_ESTADO_EVENTO_RAM = er.ID_TIPO_ESTADO_EVENTO_RAM
      INNER JOIN AJENOS.TIPO_ESTADO_EVENTO_RAM_IDIOMA teeri ON teeri.ID_TIPO_ESTADO_EVENTO_RAM = teer.ID_TIPO_ESTADO_EVENTO_RAM
        AND teeri.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      INNER JOIN AJENOS.TIPO_TAREA tt ON tt.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tt.ID_TIPO_TAREA <> 3
      LEFT JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tti.ID_TIPO_TAREA = tt.ID_TIPO_TAREA AND tti.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
    `;
    
    let countQuery = `
      SELECT COUNT(DISTINCT er.ID_EVENTO_RAM)
      FROM AJENOS.EVENTO_RAM er
      INNER JOIN AJENOS.TIPO_EVENTO_RAM ter ON ter.ID_TIPO_EVENTO_RAM = er.ID_TIPO_EVENTO_RAM
      INNER JOIN AJENOS.TIPO_ESTADO_EVENTO_RAM teer ON teer.ID_TIPO_ESTADO_EVENTO_RAM = er.ID_TIPO_ESTADO_EVENTO_RAM
      LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      LEFT JOIN AJENOS.TIPO_TAREA tt ON tt.ID_TIPO_TAREA = tr.ID_TIPO_TAREA
      LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
    `;
    
    // Apply fromClausedSql
    if (tipoAlias.length > 0) {
      sqlQuery += `
        INNER JOIN AJENOS.ALIAS_TAREA al ON al.ID_TAREA_RAM = tr.ID_TAREA_RAM
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = al.ID_ALIAS
        WHERE 1=1
        AND er.FECHA_BAJA IS NULL
        AND
      `;
      
      countQuery += `
        INNER JOIN AJENOS.ALIAS_TAREA al ON al.ID_TAREA_RAM = tr.ID_TAREA_RAM
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = al.ID_ALIAS
        WHERE 1=1
        AND er.FECHA_BAJA IS NULL
        AND
      `;
      
      // If TIPO_IV is the only type
      if (tipoAlias.includes(TipoAliasEnum.TIPO_IV.idTipoAlias) && tipoAlias.length === 1) {
        sqlQuery += `
          er.ID_TIPO_TAREA = 2
          AND NOT EXISTS (
            SELECT 1 FROM AJENOS.EVENTO_TAREA_RAM et
            INNER JOIN AJENOS.ALIAS_TAREA at ON et.ID_TAREA_RAM = at.ID_TAREA_RAM
            WHERE et.ID_EVENTO_RAM = er.ID_EVENTO_RAM
            AND at.ID_TIPO_ALIAS <> 4)
        `;
        
        countQuery += `
          er.ID_TIPO_TAREA = 2
          AND NOT EXISTS (
            SELECT 1 FROM AJENOS.EVENTO_TAREA_RAM et
            INNER JOIN AJENOS.ALIAS_TAREA at ON et.ID_TAREA_RAM = at.ID_TAREA_RAM
            WHERE et.ID_EVENTO_RAM = er.ID_EVENTO_RAM
            AND at.ID_TIPO_ALIAS <> 4)
        `;
      } else {
        sqlQuery += `a.ID_TIPO_ALIAS IN (${tipoAlias.join(',')})`;
        countQuery += `a.ID_TIPO_ALIAS IN (${tipoAlias.join(',')})`;
      }
    } else {
      sqlQuery += ` WHERE 1=1 `;
      countQuery += ` WHERE 1=1 `;
    }
    
    // Apply whereClaused
    if (filter.idsEvento && filter.idsEvento.length > 0) {
      sqlQuery += ` AND er.ID_EVENTO_RAM IN (${filter.idsEvento.join(',')})`;
      countQuery += ` AND er.ID_EVENTO_RAM IN (${filter.idsEvento.join(',')})`;
    }
    
    if (filter.idsTipoEvento && filter.idsTipoEvento.length > 0) {
      sqlQuery += ` AND ter.ID_TIPO_EVENTO_RAM IN (${filter.idsTipoEvento.join(',')})`;
      countQuery += ` AND ter.ID_TIPO_EVENTO_RAM IN (${filter.idsTipoEvento.join(',')})`;
    }
    
    if (filter.idsTipoEstadoEvento && filter.idsTipoEstadoEvento.length > 0) {
      sqlQuery += ` AND teer.ID_TIPO_ESTADO_EVENTO_RAM IN (${filter.idsTipoEstadoEvento.join(',')})`;
      countQuery += ` AND teer.ID_TIPO_ESTADO_EVENTO_RAM IN (${filter.idsTipoEstadoEvento.join(',')})`;
    }
    
    if (filter.idsEjecucion && filter.idsEjecucion.length > 0) {
      sqlQuery += ` AND er.ID_EVENTO_RAM IN 
        (SELECT er3.ID_EVENTO_RAM 
        FROM AJENOS.EVENTO_RAM er3 
        LEFT JOIN AJENOS.EVENTO_EJECUCION_RAM eer ON eer.ID_EVENTO_RAM = er3.ID_EVENTO_RAM
        WHERE er3.FECHA_BAJA IS NULL AND
        eer.COD_EJECUCION IN (${filter.idsEjecucion.join(',')}))`;
        
      countQuery += ` AND er.ID_EVENTO_RAM IN 
        (SELECT er3.ID_EVENTO_RAM 
        FROM AJENOS.EVENTO_RAM er3 
        LEFT JOIN AJENOS.EVENTO_EJECUCION_RAM eer ON eer.ID_EVENTO_RAM = er3.ID_EVENTO_RAM
        WHERE er3.FECHA_BAJA IS NULL AND
        eer.COD_EJECUCION IN (${filter.idsEjecucion.join(',')}))`;
    }
    
    if (filter.idsAlias && filter.idsAlias.length > 0) {
      sqlQuery += ` AND er.ID_EVENTO_RAM IN
        (SELECT er2.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er2
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
        LEFT JOIN AJENOS.ALIAS_TAREA at2 ON tr.ID_TAREA_RAM = at2.ID_TAREA_RAM
        LEFT JOIN AJENOS.ALIAS a ON at2.ID_ALIAS = a.ID_ALIAS
        WHERE er2.FECHA_BAJA IS NULL AND
        a.ID_ALIAS IN (${filter.idsAlias.join(',')}))`;
        
      countQuery += ` AND er.ID_EVENTO_RAM IN
        (SELECT er2.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er2
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
        LEFT JOIN AJENOS.ALIAS_TAREA at2 ON tr.ID_TAREA_RAM = at2.ID_TAREA_RAM
        LEFT JOIN AJENOS.ALIAS a ON at2.ID_ALIAS = a.ID_ALIAS
        WHERE er2.FECHA_BAJA IS NULL AND
        a.ID_ALIAS IN (${filter.idsAlias.join(',')}))`;
    }
    
    const hasGrupoCadena = filter.idsGrupoCadena && filter.idsGrupoCadena.length > 0;
    const hasMercado = filter.idsMercado && filter.idsMercado.length > 0;
    
    if (hasGrupoCadena || hasMercado) {
      let subQuery = ` AND er.ID_EVENTO_RAM IN (SELECT er4.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er4
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er4.ID_EVENTO_RAM
        LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
        LEFT JOIN MAESTROS.PAIS p ON lc.ID_PAIS = p.ID_PAIS
        LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
        LEFT JOIN MAESTROS.CADENA c ON lc.ID_CADENA = c.ID_CADENA
        LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
        LEFT JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
        WHERE er4.FECHA_BAJA IS NULL AND `;
        
      const conditions = [];
      
      if (hasGrupoCadena) {
        conditions.push(`gc.ID_GRUPO_CADENA IN (${filter.idsGrupoCadena.join(',')})`);
      }
      
      if (hasMercado) {
        conditions.push(`p.ID_PAIS IN (${filter.idsMercado.join(',')})`);
      }
      
      subQuery += conditions.join(' AND ') + ')';
      
      sqlQuery += subQuery;
      countQuery += subQuery;
    }
    
    if (filter.idsLocalizacion && filter.idsLocalizacion.length > 0) {
      const subQuery = ` AND er.ID_EVENTO_RAM IN (SELECT er111.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er111
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er111.ID_EVENTO_RAM
        LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
        WHERE er111.FECHA_BAJA IS NULL AND
        lc.ID_LOCALIZACION_COMPRA IN (${filter.idsLocalizacion.join(',')}))`;
        
      sqlQuery += subQuery;
      countQuery += subQuery;
    }
    
    if (filter.idsGrupoLocalizacion && filter.idsGrupoLocalizacion.length > 0) {
      const subQuery = ` AND er.ID_EVENTO_RAM IN (SELECT er5.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er5
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er5.ID_EVENTO_RAM
        LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
        LEFT JOIN AJENOS.GRUPO_LOCALIZACION_COMPRA_LOCALIZACION_COMPRA glclc ON glclc.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
        LEFT JOIN AJENOS.GRUPO_LOCALIZACION_COMPRA glc ON glc.ID_GRUPO_LOCALIZACION_COMPRA = glclc.ID_GRUPO_LOCALIZACION_COMPRA
        WHERE er5.FECHA_BAJA IS NULL AND
        glc.ID_GRUPO_LOCALIZACION_COMPRA IN (${filter.idsGrupoLocalizacion.join(',')}))`;
        
      sqlQuery += subQuery;
      countQuery += subQuery;
    }
    
    if (filter.idsAjeno && filter.idsAjeno.length > 0) {
      const subQuery = ` AND er.ID_EVENTO_RAM IN (SELECT er6.ID_EVENTO_RAM
        FROM AJENOS.EVENTO_RAM er6
        LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er6.ID_EVENTO_RAM
        LEFT JOIN AJENOS.ALIAS_TAREA at2 ON at2.ID_TAREA_RAM = etr.ID_TAREA_RAM
        LEFT JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = at2.ID_ALIAS
        LEFT JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO
        WHERE er6.FECHA_BAJA IS NULL AND
        aaa.ID_AJENO_SECCION_GLOBAL IN (${filter.idsAjeno.join(',')}))`;
        
      sqlQuery += subQuery;
      countQuery += subQuery;
    }
    
    // Group by clause
    sqlQuery += ` GROUP BY er.ID_EVENTO_RAM, er.NOMBRE, ter.ID_TIPO_EVENTO_RAM, teri.DESCRIPCION, teer.ID_TIPO_ESTADO_EVENTO_RAM, 
      teeri.DESCRIPCION, er.FECHA_ALTA, tt.ID_TIPO_TAREA, tti.DESCRIPCION`;
      
    // Order by clause
    sqlQuery += ` ORDER BY er.ID_EVENTO_RAM DESC LIMIT ${filter.limit} OFFSET ${filter.offset * filter.limit}`;
    
    const replacements = { idIdioma: filter.idIdioma };
    
    const [countResult, eventos] = await Promise.all([
      sequelizeAjenos.query(countQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT,
        plain: true
      }),
      
      sequelizeAjenos.query(sqlQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      })
    ]);
    
    const totalElements = parseInt(countResult ? Object.values(countResult)[0] : 0);
    
    // Process the eventos results
    const processedEventos = eventos.map(evento => ({
      idEvento: evento.idEvento,
      nombreEvento: fixEncoding(evento.nombreEvento),
      idTipoEvento: evento.idTipoEvento,
      descripcionTipoEvento: fixEncoding(evento.descripcionTipoEvento),
      idTipoEstadoEvento: evento.idTipoEstadoEvento,
      descripcionTipoEstadoEvento: fixEncoding(evento.descripcionTipoEstadoEvento),
      idTipoTarea: evento.idTipoTarea,
      descripcionTipoTarea: fixEncoding(evento.descripcionTipoTarea),
      fechaCreacion: evento.fechaCreacion ? new Date(evento.fechaCreacion).toISOString().split('T')[0] : null,
      tareasAsociadas: parseInt(evento.tareasAsociadas) || 0,
      entrenado: evento.entrenado === 'TRUE'
    }));
    
    // If we have eventos, get the cadenas and mercados
    if (processedEventos.length > 0) {
      const idsEvento = processedEventos.map(evento => evento.idEvento);
      const eventosAmbito = await findNombreCadenasAndDescripcionMercadosByIdEvento(idsEvento, filter.idIdioma);
      
      // Create a map for quick lookup
      const eventoAmbitoMap = {};
      eventosAmbito.forEach(ambito => {
        eventoAmbitoMap[ambito.idEvento] = ambito;
      });
      
      // Add cadenas and mercados to the processed eventos
      processedEventos.forEach(evento => {
        const ambito = eventoAmbitoMap[evento.idEvento];
        if (ambito) {
          evento.cadenas = ambito.cadenas || [];
          evento.mercados = ambito.mercados || [];
        } else {
          evento.cadenas = [];
          evento.mercados = [];
        }
      });
    }
    
    const result = {
      content: processedEventos,
      totalElements,
      offset: filter.offset,
      limit: filter.limit
    };
    
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error en findEventosByFilter:', error);
    throw error;
  }
};

// Function to get the cadenas and mercados for eventos
async function findNombreCadenasAndDescripcionMercadosByIdEvento(idsEvento, idIdioma) {
  try {
    const query = `
      SELECT 
        er.ID_EVENTO_RAM as idEvento,
        GROUP_CONCAT(DISTINCT pi.DESCRIPCION SEPARATOR ',') as mercados,
        GROUP_CONCAT(DISTINCT c.NOMBRE SEPARATOR ',') as cadenas
      FROM AJENOS.EVENTO_RAM er
      LEFT JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      LEFT JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
      LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      LEFT JOIN MAESTROS.CADENA c ON lc.ID_CADENA = c.ID_CADENA
      LEFT JOIN MAESTROS.PAIS p ON lc.ID_PAIS = p.ID_PAIS
      LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
      WHERE er.FECHA_BAJA IS NULL
      AND er.ID_EVENTO_RAM IN (:idsEvento)
      GROUP BY er.ID_EVENTO_RAM
      ORDER BY er.ID_EVENTO_RAM
    `;
    
    const results = await sequelizeAjenos.query(query, {
      replacements: { 
        idsEvento, 
        idIdioma 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return results.map(result => ({
      idEvento: result.idEvento,
      mercados: result.mercados ? result.mercados.split(',').map(m => fixEncoding(m)) : [],
      cadenas: result.cadenas ? result.cadenas.split(',').map(c => fixEncoding(c)) : []
    }));
  } catch (error) {
    console.error('Error en findNombreCadenasAndDescripcionMercadosByIdEvento:', error);
    return [];
  }
}

exports.findEventosByTarea = async (idsTarea) => {
    try {
      let query = `
        SELECT DISTINCT er.ID_EVENTO_RAM as idEvento, er.NOMBRE as nombre
        FROM AJENOS.EVENTO_RAM er
        INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON er.ID_EVENTO_RAM = etr.ID_EVENTO_RAM
        INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
        WHERE er.FECHA_BAJA IS NULL
        AND tr.ID_TIPO_TAREA <> 3
      `;
      
      const replacements = {};
      
      if (idsTarea && idsTarea.length > 0) {
        query += ` AND tr.ID_TAREA_RAM IN (:idsTarea)`;
        replacements.idsTarea = idsTarea;
      }
      
      query += ` ORDER BY er.ID_EVENTO_RAM DESC`;
      
      const result = await sequelizeAjenos.query(query, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(item => ({
        idEvento: item.idEvento,
        nombre: fixEncoding(item.nombre)
      }));
    } catch (error) {
      console.error('Error en findEventosByTarea:', error);
      throw error;
    }
};

exports.getTiposEstadoEvento = async (idIdioma = 1) => {
    try {
      const query = `
        SELECT tee.ID_TIPO_ESTADO_EVENTO_RAM as id, teei.DESCRIPCION as descripcion
        FROM AJENOS.TIPO_ESTADO_EVENTO_RAM tee
        LEFT JOIN AJENOS.TIPO_ESTADO_EVENTO_RAM_IDIOMA teei ON tee.ID_TIPO_ESTADO_EVENTO_RAM = teei.ID_TIPO_ESTADO_EVENTO_RAM
        WHERE teei.ID_IDIOMA = :idIdioma 
        AND UPPER(teei.DESCRIPCION) NOT IN ('BORRADO', 'DELETED')
        ORDER BY teei.ID_TIPO_ESTADO_EVENTO_RAM
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(item => ({
        id: item.id,
        descripcion: fixEncoding(item.descripcion)
      }));
    } catch (error) {
      console.error('Error al obtener tipos de estado de evento:', error);
      return [];
    }
};

exports.getTiposEvento = async (idIdioma = 1) => {
    try {
      const query = `
        SELECT te.ID_TIPO_EVENTO_RAM as id, tei.DESCRIPCION as descripcion
        FROM AJENOS.TIPO_EVENTO_RAM te
        INNER JOIN AJENOS.TIPO_EVENTO_RAM_IDIOMA tei ON te.ID_TIPO_EVENTO_RAM = tei.ID_TIPO_EVENTO_RAM
        WHERE tei.ID_IDIOMA = :idIdioma
        ORDER BY te.ID_TIPO_EVENTO_RAM
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(item => ({
        id: item.id,
        descripcion: fixEncoding(item.descripcion)
      }));
    } catch (error) {
      console.error('Error al obtener tipos de evento:', error);
      return [];
    }
};

module.exports = {
    findEventosByFilter: exports.findEventosByFilter,
    findEventosByTarea: exports.findEventosByTarea,
    getTiposEstadoEvento: exports.getTiposEstadoEvento,
    getTiposEvento: exports.getTiposEvento,
    cache
};