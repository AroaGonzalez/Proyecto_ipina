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
      INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      INNER JOIN AJENOS.TIPO_TAREA tt ON tt.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tt.ID_TIPO_TAREA <> 3
      LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
    `;
    
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
        let subQuery = ` AND er.ID_EVENTO_RAM IN (SELECT DISTINCT er4.ID_EVENTO_RAM
          FROM AJENOS.EVENTO_RAM er4
          INNER JOIN AJENOS.EVENTO_TAREA_RAM etr4 ON etr4.ID_EVENTO_RAM = er4.ID_EVENTO_RAM
          INNER JOIN AJENOS.TAREA_RAM tr4 ON tr4.ID_TAREA_RAM = etr4.ID_TAREA_RAM
          INNER JOIN AJENOS.TAREA_AMBITO ta4 ON ta4.ID_TAREA_RAM = tr4.ID_TAREA_RAM
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa4 ON taa4.ID_TAREA_AMBITO = ta4.ID_TAREA_AMBITO
          INNER JOIN AJENOS.LOCALIZACION_COMPRA lc4 ON lc4.ID_LOCALIZACION_COMPRA = taa4.ID_LOCALIZACION_COMPRA
          INNER JOIN MAESTROS.PAIS p4 ON lc4.ID_PAIS = p4.ID_PAIS
          INNER JOIN MAESTROS.PAIS_IDIOMA pi4 ON pi4.ID_PAIS = p4.ID_PAIS AND pi4.ID_IDIOMA = :idIdioma`;
          
        if (hasGrupoCadena) {
          subQuery += `
          INNER JOIN MAESTROS.CADENA c4 ON lc4.ID_CADENA = c4.ID_CADENA
          INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc4 ON gcc4.ID_CADENA = c4.ID_CADENA
          INNER JOIN MAESTROS.GRUPO_CADENA gc4 ON gc4.ID_GRUPO_CADENA = gcc4.ID_GRUPO_CADENA`;
        }
          
        subQuery += ` WHERE er4.FECHA_BAJA IS NULL AND `;
            
        const conditions = [];
            
        if (hasGrupoCadena) {
          conditions.push(`gc4.ID_GRUPO_CADENA IN (${filter.idsGrupoCadena.join(',')})`);
        }
            
        if (hasMercado) {
          conditions.push(`p4.ID_PAIS IN (${filter.idsMercado.join(',')})`);
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
    
    sqlQuery += ` GROUP BY er.ID_EVENTO_RAM, er.NOMBRE, ter.ID_TIPO_EVENTO_RAM, teri.DESCRIPCION, teer.ID_TIPO_ESTADO_EVENTO_RAM, 
      teeri.DESCRIPCION, er.FECHA_ALTA, tt.ID_TIPO_TAREA, tti.DESCRIPCION`;
      
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
    
    const processedEventos = eventos.map(evento => ({
      idEvento: evento.idEvento,
      nombreEvento: fixEncoding(evento.nombreEvento),
      idTipoEvento: evento.idTipoEvento,
      descripcionTipoEvento: fixEncoding(evento.descripcionTipoEvento),
      idEstadoEvento: evento.idTipoEstadoEvento,
      descripcionEstadoEvento: fixEncoding(evento.descripcionTipoEstadoEvento),
      idTipoTarea: evento.idTipoTarea,
      descripcionTipoTarea: fixEncoding(evento.descripcionTipoTarea),
      fechaCreacion: evento.fechaCreacion ? new Date(evento.fechaCreacion).toISOString().split('T')[0] : null,
      tareasAsociadas: parseInt(evento.tareasAsociadas) || 0,
      entrenado: evento.entrenado === 'TRUE'
    }));
    
    if (processedEventos.length > 0) {
      const idsEvento = processedEventos.map(evento => evento.idEvento);
      const eventosAmbito = await findNombreCadenasAndDescripcionMercadosByIdEvento(idsEvento, filter.idIdioma);
      
      const eventoAmbitoMap = {};
      eventosAmbito.forEach(ambito => {
        eventoAmbitoMap[ambito.idEvento] = ambito;
      });
      
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

exports.updateEventoEstado = async (idsEvento, idTipoEstadoEvento, usuario) => {
    try {
      if (!idsEvento || !Array.isArray(idsEvento) || idsEvento.length === 0) {
        throw new Error('Se requiere al menos un ID de evento');
      }
      
      if (!idTipoEstadoEvento) {
        throw new Error('Se requiere el ID del tipo de estado del evento');
      }

      let query = `
        UPDATE AJENOS.EVENTO_RAM 
        SET USUARIO_MODIFICACION = :usuario,
            ID_TIPO_ESTADO_EVENTO_RAM = :idTipoEstadoEvento,
            FECHA_MODIFICACION = CURRENT_TIMESTAMP
        WHERE ID_EVENTO_RAM IN (:idsEvento)
      `;
      
      const result = await sequelizeAjenos.query(query, {
        replacements: { 
          usuario,
          idTipoEstadoEvento: parseInt(idTipoEstadoEvento),
          idsEvento
        },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      cache.clear('eventos_');
      
      return {
        success: true,
        affectedRows: result[1] || 0,
        message: `Se han actualizado ${result[1] || 0} eventos al estado ${idTipoEstadoEvento}`
      };
    } catch (error) {
      console.error('Error en updateEventoEstado:', error);
      throw error;
    }
};

exports.findTareasByTipoTarea = async (idIdioma, idTipoTarea) => {
    try {
      const tareaBasicaQuery = `
        SELECT DISTINCT
          t.ID_TAREA_RAM AS idTarea,
          t.NOMBRE AS nombreTarea,
          t.ID_TIPO_TAREA AS idTipoTarea,
          t.ID_TIPO_ESTADO_TAREA_RAM AS idTipoEstadoTarea,
          tai.DESCRIPCION AS descripcionTipoTarea,
          teti.DESCRIPCION AS descripcionTipoEstadoTarea,
          t.FECHA_ALTA AS fechaAlta
        FROM AJENOS.TAREA_RAM t
        LEFT JOIN AJENOS.TIPO_ESTADO_TAREA_RAM_IDIOMA teti ON teti.ID_TIPO_ESTADO_TAREA_RAM = t.ID_TIPO_ESTADO_TAREA_RAM 
          AND teti.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.TIPO_TAREA_IDIOMA tai ON tai.ID_TIPO_TAREA = t.ID_TIPO_TAREA 
          AND tai.ID_IDIOMA = :idIdioma
        INNER JOIN AJENOS.ALIAS_TAREA at1 ON at1.ID_TAREA_RAM = t.ID_TAREA_RAM
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = at1.ID_ALIAS
        LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = t.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
        LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
        LEFT JOIN MAESTROS.PAIS p ON lc.ID_PAIS = p.ID_PAIS
        LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
        WHERE t.ID_TIPO_TAREA = :idTipoTarea AND t.FECHA_BAJA IS NULL
        ORDER BY t.FECHA_ALTA DESC
      `;
      
      const tareaBasicaList = await sequelizeAjenos.query(tareaBasicaQuery, {
        replacements: { idIdioma, idTipoTarea },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      if (!tareaBasicaList || tareaBasicaList.length === 0) {
        return [];
      }
      
      const idTareas = tareaBasicaList.map(tarea => tarea.idTarea);
      
      const cadenasMercadoQuery = `
        SELECT 
          t.ID_TAREA_RAM as idTarea,
          GROUP_CONCAT(DISTINCT pi.DESCRIPCION SEPARATOR ',') as mercados,
          GROUP_CONCAT(DISTINCT c.NOMBRE SEPARATOR ',') as cadenas
        FROM AJENOS.TAREA_RAM t
        LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = t.ID_TAREA_RAM
        LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
        LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
        LEFT JOIN MAESTROS.CADENA c ON lc.ID_CADENA = c.ID_CADENA
        LEFT JOIN MAESTROS.PAIS p ON lc.ID_PAIS = p.ID_PAIS
        LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
        WHERE t.ID_TAREA_RAM IN (:idTareas)
        GROUP BY t.ID_TAREA_RAM
        ORDER BY t.ID_TAREA_RAM
      `;
      
      const tareaCadenasMercados = await sequelizeAjenos.query(cadenasMercadoQuery, {
        replacements: { idTareas, idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      const tareaCadenasMercadoMap = {};
      tareaCadenasMercados.forEach(item => {
        tareaCadenasMercadoMap[item.idTarea] = item;
      });
      
      const result = await Promise.all(tareaBasicaList.map(async (tarea) => {
        const tareaCadenasMercado = tareaCadenasMercadoMap[tarea.idTarea];
        if (tareaCadenasMercado) {
          tarea.cadenas = tareaCadenasMercado.cadenas ? 
            tareaCadenasMercado.cadenas.split(',').map(c => fixEncoding(c)) : [];
          tarea.mercados = tareaCadenasMercado.mercados ? 
            tareaCadenasMercado.mercados.split(',').map(m => fixEncoding(m)) : [];
        } else {
          tarea.cadenas = [];
          tarea.mercados = [];
        }
        
        const idsAliasQuery = `
          SELECT DISTINCT at.ID_ALIAS
          FROM AJENOS.ALIAS_TAREA at
          WHERE at.ID_TAREA_RAM = :idTarea AND at.FECHA_BAJA IS NULL
        `;
        
        const idsAlias = await sequelizeAjenos.query(idsAliasQuery, {
          replacements: { idTarea: tarea.idTarea },
          type: sequelizeAjenos.QueryTypes.SELECT
        });
        
        tarea.idsAlias = idsAlias.map(item => item.ID_ALIAS);
        
        tarea.nombreTarea = fixEncoding(tarea.nombreTarea);
        tarea.descripcionTipoTarea = fixEncoding(tarea.descripcionTipoTarea);
        tarea.descripcionTipoEstadoTarea = fixEncoding(tarea.descripcionTipoEstadoTarea);
        
        if (tarea.fechaAlta) {
          tarea.fechaAlta = new Date(tarea.fechaAlta).toISOString().split('T')[0];
        }
        
        return tarea;
      }));
      
      return result;
    } catch (error) {
      console.error('Error en findTareasByTipoTarea:', error);
      throw error;
    }
};

exports.getTiposTarea = async (idIdioma = 1) => {
    try {
      const query = `
        SELECT tt.ID_TIPO_TAREA as id, tti.DESCRIPCION as descripcion
        FROM AJENOS.TIPO_TAREA tt
        INNER JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tt.ID_TIPO_TAREA = tti.ID_TIPO_TAREA
        WHERE tti.ID_IDIOMA = :idIdioma AND tt.ID_TIPO_TAREA <> 3
        ORDER BY tt.ID_TIPO_TAREA
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
      console.error('Error al obtener tipos de tarea:', error);
      return [];
    }
};

exports.getTareasInfo = async (idsTarea) => {
  try {
    if (!idsTarea || idsTarea.length === 0) {
      return [];
    }
    
    const query = `
      SELECT t.ID_TAREA_RAM as idTarea, t.ID_TIPO_TAREA as idTipoTarea
      FROM AJENOS.TAREA_RAM t
      WHERE t.ID_TAREA_RAM IN (:idsTarea)
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idsTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error('Error en getTareasInfo:', error);
    throw error;
  }
};

exports.createEvento = async (eventoData) => {
  const transaction = await sequelizeAjenos.transaction();
  
  try {
    const { 
      nombre, 
      descripcion, 
      idTipoEvento, 
      idTipoEstadoEvento, 
      idTipoTarea,
      idTipoEstadoLineaCompras,
      createEventoTarea,
      usuarioAlta 
    } = eventoData;

    const [maxIdResult] = await sequelizeAjenos.query(
      "SELECT MAX(ID_EVENTO_RAM) as maxId FROM AJENOS.EVENTO_RAM",
      { type: sequelizeAjenos.QueryTypes.SELECT, transaction }
    );
    
    const idEvento = (maxIdResult.maxId || 0) + 1;
    
    const insertEventoQuery = `
      INSERT INTO AJENOS.EVENTO_RAM 
        (ID_EVENTO_RAM, NOMBRE, DESCRIPCION, ID_TIPO_EVENTO_RAM, ID_TIPO_ESTADO_EVENTO_RAM, 
        ID_TIPO_ESTADO_LINEA_COMPRAS, ID_TIPO_TAREA, USUARIO_ALTA, FECHA_ALTA)
      VALUES
        (:idEvento, :nombre, :descripcion, :idTipoEvento, :idTipoEstadoEvento, 
        :idTipoEstadoLineaCompras, :idTipoTarea, :usuarioAlta, CURRENT_TIMESTAMP)
    `;
  
    await sequelizeAjenos.query(insertEventoQuery, {
      replacements: {
        idEvento,
        nombre,
        descripcion,
        idTipoEvento,
        idTipoEstadoEvento,
        idTipoEstadoLineaCompras,
        idTipoTarea,
        usuarioAlta
      },
      type: sequelizeAjenos.QueryTypes.INSERT,
      transaction
    });
    
    if (createEventoTarea && createEventoTarea.length > 0) {
      const insertEventoTareaQuery = `
        INSERT INTO AJENOS.EVENTO_TAREA_RAM
          (ID_EVENTO_RAM, ID_TAREA_RAM)
        VALUES
          (:idEvento, :idTarea)
      `;
      
      for (const tareaItem of createEventoTarea) {
        await sequelizeAjenos.query(insertEventoTareaQuery, {
          replacements: {
            idEvento,
            idTarea: tareaItem.idTarea
          },
          type: sequelizeAjenos.QueryTypes.INSERT,
          transaction
        });
      }
    }
    
    await transaction.commit();
    
    cache.clear('eventos_');
    
    return idEvento;
  } catch (error) {
    await transaction.rollback();
    console.error('Error en createEvento:', error);
    throw error;
  }
};

exports.findEventoById = async (idEvento, idIdioma = 1) => {
  try {
    const eventoQuery = `
      SELECT 
        er.ID_EVENTO_RAM AS idEvento,
        er.NOMBRE AS nombreEvento,
        er.DESCRIPCION AS descripcionEvento,
        er.ID_TIPO_EVENTO_RAM AS idTipoEvento,
        er.ID_TIPO_ESTADO_EVENTO_RAM AS idTipoEstadoEvento,
        er.ID_TIPO_TAREA AS idTipoTarea,
        tti.DESCRIPCION AS descripcionTipoTarea,
        er.ID_TIPO_ESTADO_LINEA_COMPRAS AS idTipoEstadoLineaCompras,
        telci.DESCRIPCION AS descripcionTipoEstadoLineaCompras
      FROM AJENOS.EVENTO_RAM er
      INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      INNER JOIN AJENOS.TIPO_TAREA_IDIOMA tti ON tti.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tti.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_LINEA_COMPRAS_IDIOMA telci ON telci.ID_TIPO_ESTADO_LINEA_COMPRAS = er.ID_TIPO_ESTADO_LINEA_COMPRAS 
        AND telci.ID_IDIOMA = :idIdioma
      WHERE er.ID_EVENTO_RAM = :idEvento
      AND er.FECHA_BAJA IS NULL
      LIMIT 1
    `;
    
    const [eventoResult] = await sequelizeAjenos.query(eventoQuery, {
      replacements: { idIdioma, idEvento },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (!eventoResult) {
      return null;
    }

    const tareasQuery = `
      SELECT DISTINCT
        tr.ID_TAREA_RAM AS idTarea,
        tr.NOMBRE AS nombreTarea,
        tr.ID_TIPO_TAREA AS idTipoTarea,
        tr.ID_TIPO_ESTADO_TAREA_RAM AS idTipoEstadoTarea,
        tai.DESCRIPCION AS descripcionTipoTarea,
        teti.DESCRIPCION AS descripcionTipoEstadoTarea,
        GROUP_CONCAT(DISTINCT pi.DESCRIPCION SEPARATOR ',') AS mercados,
        GROUP_CONCAT(DISTINCT c.NOMBRE SEPARATOR ',') AS cadenas,
        tr.FECHA_ALTA AS fechaAlta
      FROM AJENOS.EVENTO_RAM er
      INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      LEFT JOIN AJENOS.TIPO_ESTADO_TAREA_RAM_IDIOMA teti ON teti.ID_TIPO_ESTADO_TAREA_RAM = tr.ID_TIPO_ESTADO_TAREA_RAM 
        AND teti.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_TAREA_IDIOMA tai ON tai.ID_TIPO_TAREA = tr.ID_TIPO_TAREA AND tai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.ALIAS_TAREA at1 ON at1.ID_TAREA_RAM = tr.ID_TAREA_RAM
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = at1.ID_ALIAS
      LEFT JOIN AJENOS.TAREA_AMBITO ta ON ta.ID_TAREA_RAM = tr.ID_TAREA_RAM
      LEFT JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON taa.ID_TAREA_AMBITO = ta.ID_TAREA_AMBITO
      LEFT JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      LEFT JOIN MAESTROS.PAIS p ON lc.ID_PAIS = p.ID_PAIS
      LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
      WHERE er.ID_EVENTO_RAM = :idEvento
      AND tr.FECHA_BAJA IS NULL
      GROUP BY tr.ID_TAREA_RAM, tr.NOMBRE, tr.ID_TIPO_TAREA, tai.DESCRIPCION, 
        tr.ID_TIPO_ESTADO_TAREA_RAM, teti.DESCRIPCION, tr.FECHA_ALTA
      ORDER BY tr.ID_TAREA_RAM DESC
    `;
    
    const tareasResult = await sequelizeAjenos.query(tareasQuery, {
      replacements: { idIdioma, idEvento },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const tareas = await Promise.all(tareasResult.map(async (tarea) => {
      const aliasQuery = `
        SELECT at.ID_ALIAS
        FROM AJENOS.ALIAS_TAREA at
        WHERE at.ID_TAREA_RAM = :idTarea
        AND at.FECHA_BAJA IS NULL
      `;
      
      const aliasResult = await sequelizeAjenos.query(aliasQuery, {
        replacements: { idTarea: tarea.idTarea },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return {
        ...tarea,
        idsAlias: aliasResult.map(a => a.ID_ALIAS),
        mercados: tarea.mercados ? fixEncoding(tarea.mercados).split(',') : [],
        cadenas: tarea.cadenas ? fixEncoding(tarea.cadenas).split(',') : [],
        nombreTarea: fixEncoding(tarea.nombreTarea),
        descripcionTipoTarea: fixEncoding(tarea.descripcionTipoTarea),
        descripcionTipoEstadoTarea: fixEncoding(tarea.descripcionTipoEstadoTarea),
        fechaAlta: tarea.fechaAlta ? new Date(tarea.fechaAlta).toISOString().split('T')[0] : null
      };
    }));
    
    return {
      idEvento: eventoResult.idEvento,
      nombreEvento: fixEncoding(eventoResult.nombreEvento),
      descripcionEvento: fixEncoding(eventoResult.descripcionEvento),
      idTipoEvento: eventoResult.idTipoEvento,
      idTipoEstadoEvento: eventoResult.idTipoEstadoEvento,
      idTipoTarea: eventoResult.idTipoTarea,
      descripcionTipoTarea: fixEncoding(eventoResult.descripcionTipoTarea),
      idTipoEstadoLineaCompras: eventoResult.idTipoEstadoLineaCompras,
      descripcionTipoEstadoLineaCompras: eventoResult.descripcionTipoEstadoLineaCompras 
        ? fixEncoding(eventoResult.descripcionTipoEstadoLineaCompras) 
        : null,
      tareas: tareas
    };
  } catch (error) {
    console.error('Error en findEventoById:', error);
    throw error;
  }
};

exports.updateEvento = async (idEvento, eventoData) => {
  const transaction = await sequelizeAjenos.transaction();
  
  try {
    const { 
      nombreEvento, 
      descripcion,
      idTipoTarea,
      createEventoTarea
    } = eventoData;
    
    const currentEventQuery = `
      SELECT * FROM AJENOS.EVENTO_RAM
      WHERE ID_EVENTO_RAM = :idEvento AND FECHA_BAJA IS NULL
    `;
    
    const [currentEvent] = await sequelizeAjenos.query(currentEventQuery, {
      replacements: { idEvento },
      type: sequelizeAjenos.QueryTypes.SELECT,
      transaction
    });
    
    if (!currentEvent) {
      throw new Error('Evento no encontrado o ya eliminado');
    }
    
    const updateEventoQuery = `
      UPDATE AJENOS.EVENTO_RAM
      SET NOMBRE = :nombreEvento,
          DESCRIPCION = :descripcion,
          ID_TIPO_TAREA = :idTipoTarea,
          USUARIO_MODIFICACION = :usuario,
          FECHA_MODIFICACION = CURRENT_TIMESTAMP
      WHERE ID_EVENTO_RAM = :idEvento
    `;
    
    await sequelizeAjenos.query(updateEventoQuery, {
      replacements: {
        idEvento,
        nombreEvento,
        descripcion,
        idTipoTarea: idTipoTarea || currentEvent.ID_TIPO_TAREA,
        usuario: 'sistema'
      },
      type: sequelizeAjenos.QueryTypes.UPDATE,
      transaction
    });
    
    const currentTareasQuery = `
      SELECT ID_TAREA_RAM FROM AJENOS.EVENTO_TAREA_RAM
      WHERE ID_EVENTO_RAM = :idEvento
    `;
    
    const currentTareas = await sequelizeAjenos.query(currentTareasQuery, {
      replacements: { idEvento },
      type: sequelizeAjenos.QueryTypes.SELECT,
      transaction
    });
    
    const currentTareaIds = currentTareas.map(tarea => tarea.ID_TAREA_RAM);
    
    let tareaIds = [];
    if (Array.isArray(createEventoTarea)) {
      tareaIds = createEventoTarea.map(tarea => tarea.idTarea);
    }
    
    const tareasToAdd = tareaIds.filter(id => !currentTareaIds.includes(id));
    const tareasToRemove = currentTareaIds.filter(id => !tareaIds.includes(id));
    
    if (tareasToAdd.length > 0) {
      const insertEventoTareaQuery = `
        INSERT INTO AJENOS.EVENTO_TAREA_RAM (ID_EVENTO_RAM, ID_TAREA_RAM)
        VALUES (:idEvento, :idTarea)
      `;
      
      for (const idTarea of tareasToAdd) {
        await sequelizeAjenos.query(insertEventoTareaQuery, {
          replacements: {
            idEvento,
            idTarea
          },
          type: sequelizeAjenos.QueryTypes.INSERT,
          transaction
        });
      }
    }
    
    if (tareasToRemove.length > 0) {
      const deleteEventoTareaQuery = `
        DELETE FROM AJENOS.EVENTO_TAREA_RAM
        WHERE ID_EVENTO_RAM = :idEvento AND ID_TAREA_RAM IN (:tareasToRemove)
      `;
      
      await sequelizeAjenos.query(deleteEventoTareaQuery, {
        replacements: {
          idEvento,
          tareasToRemove
        },
        type: sequelizeAjenos.QueryTypes.DELETE,
        transaction
      });
    }
    
    await transaction.commit();
    
    cache.clear('eventos_');
    
    return {
      success: true,
      idEvento,
      message: 'Evento actualizado correctamente'
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error en updateEvento:', error);
    throw error;
  }
};

exports.getNextCodigoEventoEjecucion = async () => {
  try {
    // En MySQL no existe la sintaxis "NEXT VALUE FOR"
    // Alternativa 1: Si existe una tabla de secuencias
    const query = "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'AJENOS' AND TABLE_NAME = 'EVENTO_EJECUCION_RAM'";
    
    // Alternativa 2: Usar MAX + 1
    // const query = "SELECT COALESCE(MAX(COD_EJECUCION), 0) + 1 AS nextId FROM AJENOS.EVENTO_EJECUCION_RAM";
    
    const [result] = await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (result && result.AUTO_INCREMENT) {
      return result.AUTO_INCREMENT;
    } else if (result && result.nextId) {
      return result.nextId;
    }
    
    // Si no podemos obtener el valor, generamos uno basado en timestamp
    return Date.now();
  } catch (error) {
    console.error('Error al obtener el siguiente código de ejecución:', error);
    
    // Fallback en caso de error - usar timestamp
    console.log('Usando timestamp como código de ejecución alternativo');
    return Date.now();
  }
};

exports.findEventosByIds = async (idsEvento, idIdioma = 1) => {
  try {
    if (!idsEvento || idsEvento.length === 0) {
      return [];
    }
    
    const query = `
      SELECT 
        er.ID_EVENTO_RAM as idEvento,
        er.ID_TIPO_TAREA as idTipoTarea,
        er.ID_TIPO_ESTADO_EVENTO_RAM as idTipoEstadoEvento
      FROM AJENOS.EVENTO_RAM er
      WHERE er.ID_EVENTO_RAM IN (:idsEvento)
      AND er.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idsEvento },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error('Error en findEventosByIds:', error);
    throw error;
  }
};

exports.updateEventoEstado = async (idsEvento, idTipoEstadoEvento, usuario, fechaEjecucion = null) => {
  try {
    if (!idsEvento || !Array.isArray(idsEvento) || idsEvento.length === 0) {
      throw new Error('Se requiere al menos un ID de evento');
    }
    
    if (!idTipoEstadoEvento) {
      throw new Error('Se requiere el ID del tipo de estado del evento');
    }

    const query = `
      UPDATE AJENOS.EVENTO_RAM 
      SET USUARIO_MODIFICACION = :usuario,
          ID_TIPO_ESTADO_EVENTO_RAM = :idTipoEstadoEvento,
          FECHA_MODIFICACION = CURRENT_TIMESTAMP
      WHERE ID_EVENTO_RAM IN (:idsEvento)
    `;
    
    const replacements = { 
      usuario,
      idTipoEstadoEvento: parseInt(idTipoEstadoEvento),
      idsEvento
    };
    
    const result = await sequelizeAjenos.query(query, {
      replacements,
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    cache.clear('eventos_');
    
    return {
      success: true,
      affectedRows: result[1] || 0,
      message: `Se han actualizado ${result[1] || 0} eventos al estado ${idTipoEstadoEvento}`
    };
  } catch (error) {
    console.error('Error en updateEventoEstado:', error);
    throw error;
  }
};


exports.ejecutarEventos = async (idsEvento, idTipoTarea, codEjecucion, fechaEjecucion, usuarioEjecucion, idIdioma) => {
  try {
    
    // Ejecutar según el tipo de tarea
    switch (idTipoTarea) {
      case 1: // Distribución
        await ejecutarEventosDistribucion(idsEvento, codEjecucion, idIdioma, usuarioEjecucion, fechaEjecucion);
        break;
      case 2: // Recuento
        await ejecutarEventosRecuento(idsEvento, codEjecucion, idIdioma, usuarioEjecucion, fechaEjecucion);
        break;
      default:
        throw new Error(`Tipo de tarea no soportado: ${idTipoTarea}`);
    }
    
    return {
      success: true,
      codEjecucion,
      message: `Se han ejecutado ${idsEvento.length} eventos`
    };
  } catch (error) {
    console.error('Error en ejecutarEventos:', error);
    
    // En caso de error, actualizar los eventos a ACTIVO nuevamente
    try {
      await exports.updateEventoEstado(idsEvento, 2, usuarioEjecucion); // 2 = ACTIVO
    } catch (updateError) {
      console.error('Error al restaurar estado de eventos tras fallo:', updateError);
    }
    
    throw error;
  }
};

const TipoEstadoTareaRamEnum = {
  PUBLICADA: 1,
  PAUSADA: 2,
  ELIMINADA: 3
};

const TipoEstadoEventoEjecucionEnum = {
  COMPLETADO: 1,
  PAUSADO: 2,
  PREPARADO: 3,
  FALLIDO: 4,
  EN_EJECUCION: 5
};

const TipoEstadoPropuestaEnum = {
  PUBLICADO: 1,
  PENDIENTE: 2,
  BORRADO: 3
};

async function ejecutarEventosDistribucion(idsEvento, codEjecucion, idIdioma, usuarioEjecucion, fechaEjecucion) {
  try {
    console.log(`Iniciando ejecución de distribución para eventos: ${idsEvento.join(', ')} con código ${codEjecucion}`);
    const fechaBaja = new Date();
    
    // Procesar cada evento
    for (const idEvento of idsEvento) {
      console.log(`Ejecutando evento ${idEvento}`);
      
      // Buscar tareas activas asociadas al evento
      const idsTareaActivas = await findIdsTareasByIdEventoIdTipoEstadoTarea(
        idEvento, 
        [TipoEstadoTareaRamEnum.PUBLICADA]
      );
      
      if (idsTareaActivas && idsTareaActivas.length > 0) {
        // Procesar cada tarea activa
        for (const idTarea of idsTareaActivas) {
          console.log(`Ejecutando tarea ${idTarea}`);
          
          const propuestasMap = {};
          
          // Obtener información de ambitos aplanados de la tarea
          const tareaAmbitoAplanadoElegible = await findBaseTareaAmbitoAplanadoEventoByIdTarea(idTarea);
          
          if (tareaAmbitoAplanadoElegible && tareaAmbitoAplanadoElegible.length > 0) {
            // Crear objetos de ejecución de eventos
            const eventosEjecucion = tareaAmbitoAplanadoElegible.map(taa => ({
              idEventoEjecucion: null, // Se asignará después
              codEjecucion: codEjecucion,
              idEvento: idEvento,
              idAjeno: taa.idAjeno,
              idLocalizacionCompra: taa.idLocalizacionCompra,
              idTipoEstadoEventoEjecucion: TipoEstadoEventoEjecucionEnum.COMPLETADO,
              fechaHoraInicioEjecucion: fechaEjecucion,
              fechaHoraFinEjecucion: fechaEjecucion,
              usuarioAlta: usuarioEjecucion,
              fechaAlta: fechaEjecucion,
              idAlias: taa.idAliasAcople ? taa.idAliasAcople : taa.idAlias
            }));
            
            // Crear ejecuciones en BD
            await createEventosEjecucion(eventosEjecucion, fechaEjecucion, usuarioEjecucion);
            
            // Preparar solicitud para Analytics
            const analyticsProposalRequest = {};
            
            tareaAmbitoAplanadoElegible.forEach(taa => {
              // Encontrar el ID de ejecución correspondiente
              const eventoEjecucion = eventosEjecucion.find(ee => 
                ee.idAjeno === taa.idAjeno && 
                ee.idLocalizacionCompra === taa.idLocalizacionCompra && 
                ee.idAlias === (taa.idAliasAcople ? taa.idAliasAcople : taa.idAlias)
              );
              
              const idEventoEjecucion = eventoEjecucion ? eventoEjecucion.idEventoEjecucion : codEjecucion;
              
              // Crear propuesta
              const propuestaJpa = {
                idTipoEstadoPropuesta: TipoEstadoPropuestaEnum.PENDIENTE,
                idAlias: taa.idAliasAcople ? taa.idAliasAcople : taa.idAlias,
                idLocalizacionCompra: taa.idLocalizacionCompra,
                idEventoEjecucion: idEventoEjecucion,
                usuarioAlta: usuarioEjecucion,
                fechaAlta: fechaEjecucion,
                fechaHoraEjecucion: fechaEjecucion,
                cantidadDataAnalytics: null,
                stockTeoricoDataAnalytics: null,
                fechaCalculoDataAnalytics: null
              };
              
              // Preparar cuerpo para solicitud a Analytics
              const diaEjecucion = formatDateToLocalDate(fechaEjecucion);
              const proposalRequestBody = {
                idEventoEjecucion: idEventoEjecucion.toString(),
                diaEjecucion: diaEjecucion,
                idLocalizacion: taa.idLocalizacionCompra,
                idAlias: taa.idAliasAcople ? taa.idAliasAcople : taa.idAlias
              };
              
              // Configurar valores adicionales
              setProposalRequestBodyValues(proposalRequestBody, taa);
              
              // Agregar a las colecciones
              analyticsProposalRequest[idEventoEjecucion.toString()] = proposalRequestBody;
              propuestasMap[idEventoEjecucion.toString()] = propuestaJpa;
            });
            
            try {
              // Llamar al servicio de Analytics
              const analyticsProposalResponse = await getAnalyticsProposal(analyticsProposalRequest);
              
              // Procesar respuestas
              Object.entries(analyticsProposalResponse.propuestas || {}).forEach(([idEventoEjecucion, proposalResponseBody]) => {
                if (propuestasMap[idEventoEjecucion]) {
                  const propuestaJpa = propuestasMap[idEventoEjecucion];
                  
                  if (!proposalResponseBody.unidadesPropuestas) {
                    propuestaJpa.idTipoEstadoPropuesta = TipoEstadoPropuestaEnum.BORRADO;
                    propuestaJpa.fechaBaja = fechaBaja;
                  } else {
                    const tareaAmbitoAplanadoEvento = tareaAmbitoAplanadoElegible.find(taa => 
                      taa.idAlias === propuestaJpa.idAlias &&
                      taa.idLocalizacionCompra === propuestaJpa.idLocalizacionCompra
                    );
                    
                    if (tareaAmbitoAplanadoEvento) {
                      // Ajustar propuesta según stock mínimo
                      if (tareaAmbitoAplanadoEvento.stockMinimo && 
                          proposalResponseBody.unidadesPropuestas < tareaAmbitoAplanadoEvento.stockMinimo) {
                        proposalResponseBody.unidadesPropuestas = tareaAmbitoAplanadoEvento.stockMinimo;
                      }
                      
                      // Calcular stock teórico
                      const stockTeoricoCalculado = calcularPropuestaFinal(
                        proposalResponseBody.unidadesPropuestas,
                        tareaAmbitoAplanadoEvento.unidadesEmpaquetado,
                        tareaAmbitoAplanadoEvento.multiploMinimo
                      );
                      
                      propuestaJpa.cantidadDataAnalytics = proposalResponseBody.unidadesPropuestas;
                      propuestaJpa.stockTeoricoDataAnalytics = stockTeoricoCalculado;
                      propuestaJpa.fechaCalculoDataAnalytics = fechaEjecucion;
                    } else {
                      propuestaJpa.idTipoEstadoPropuesta = TipoEstadoPropuestaEnum.BORRADO;
                    }
                  }
                  
                  propuestasMap[idEventoEjecucion] = propuestaJpa;
                }
              });
            } catch (error) {
              console.error(`Error al ejecutar getAnalyticsProposal: ${error.message}`);
              
              // Marcar todas las propuestas como borradas en caso de error
              Object.values(propuestasMap).forEach(p => {
                p.idTipoEstadoPropuesta = TipoEstadoPropuestaEnum.BORRADO;
                p.fechaBaja = fechaBaja;
              });
            } finally {
              // Guardar propuestas
              await createPropuestas(
                Object.values(propuestasMap), 
                fechaEjecucion, 
                usuarioEjecucion
              );
            }
          }
        }
      }
    }
    
    console.log("Distribución finalizada con éxito");
    
    // Actualizar estado de eventos a ACTIVO
    await exports.updateEventoEstado(idsEvento, 2, usuarioEjecucion, fechaEjecucion);
    
  } catch (error) {
    console.error("Error al ejecutar distEventExecutionAsync", error);
    throw error;
  }
}

async function findIdsTareasByIdEventoIdTipoEstadoTarea(idEvento, idTipoEstadoTarea) {
  try {
    const query = `
      SELECT tr.ID_TAREA_RAM as idTarea
      FROM AJENOS.EVENTO_RAM er
      INNER JOIN AJENOS.EVENTO_TAREA_RAM etr ON etr.ID_EVENTO_RAM = er.ID_EVENTO_RAM
      INNER JOIN AJENOS.TAREA_RAM tr ON tr.ID_TAREA_RAM = etr.ID_TAREA_RAM
      WHERE er.ID_EVENTO_RAM = :idEvento
      AND tr.ID_TIPO_ESTADO_TAREA_RAM IN (:idTipoEstadoTarea)
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idEvento, 
        idTipoEstadoTarea 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => item.idTarea);
  } catch (error) {
    console.error('Error en findIdsTareasByIdEventoIdTipoEstadoTarea:', error);
    throw error;
  }
}

async function findBaseTareaAmbitoAplanadoEventoByIdTarea(idTarea) {
  try {
    console.log(`[AMBITOS] INICIO - Buscando ámbitos aplanados para tarea ${idTarea}`);
    
    // Consulta original con logging adicional
    const query = `
    SELECT 
      taa.ID_ALIAS as idAlias,
      taa.ID_ALIAS_ACOPLE as idAliasAcople,
      taa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
      aaj.ID_AJENO as idAjeno,
      ar.UNIDADES_EMPAQUETADO as unidadesEmpaquetado,
      ar.MULTIPLO_MINIMO as multiploMinimo,
      slr.FECHA_HORA_EJECUCION_STOCK_RECUENTOS as fechaHoraEjecucionStockRecuentos,
      slr.STOCK_MAXIMO as stockMaximo,
      slr.CAPACIDAD_MAXIMA as capacidadMaxima,
      slr.STOCK_RECUENTOS as stockRecuentos,
      slr.STOCK_MINIMO as stockMinimo
    FROM AJENOS.TAREA_AMBITO ta
    JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
    JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
    JOIN AJENOS.ALIAS_AJENO aaj ON aaj.ID_ALIAS = a.ID_ALIAS
    JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaj.ID_AJENO
    LEFT JOIN AJENOS.STOCK_LOCALIZACION_RAM slr ON slr.ID_ALIAS = COALESCE(taa.ID_ALIAS_ACOPLE, taa.ID_ALIAS)
      AND slr.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
    WHERE ta.ID_TAREA_RAM = :idTarea
      AND taa.FECHA_BAJA IS NULL
      AND ar.ID_TIPO_ESTADO_AJENO_RAM = 1
      AND aaj.ID_TIPO_ESTADO_AJENO_RAM = 1
  `;
    
    // Verificar cada join por separado para identificar dónde falla la consulta
    const diagnosticos = [
      {
        nombre: 'Tarea ámbito',
        query: `SELECT COUNT(*) as total FROM AJENOS.TAREA_AMBITO ta WHERE ta.ID_TAREA_RAM = :idTarea`
      },
      {
        nombre: 'Tarea ámbito aplanado',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL
        `
      },
      {
        nombre: 'Localización compra',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lcr.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1
        `
      },
      {
        nombre: 'Tienda',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lcr.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
          INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA
          INNER JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 AND lc.FECHA_BAJA IS NULL
        `
      },
      {
        nombre: 'Alias',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
        `
      },
      {
        nombre: 'Alias ámbito',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
        `
      },
      {
        nombre: 'Alias ámbito aplanado',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
            AND aaa.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
            AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 AND aaa.FECHA_BAJA IS NULL
        `
      },
      {
        nombre: 'Ajeno RAM',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
            AND aaa.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
          INNER JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
            AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 AND aaa.FECHA_BAJA IS NULL 
            AND aaa.ID_AJENO_SECCION_GLOBAL IS NOT NULL AND ar.ID_TIPO_ESTADO_AJENO_RAM = 1
        `
      },
      {
        nombre: 'Alias ajeno',
        query: `
          SELECT COUNT(*) as total 
          FROM AJENOS.TAREA_AMBITO ta
          INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
          INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
          INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
            AND aaa.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
          INNER JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
          INNER JOIN AJENOS.ALIAS_AJENO aaj ON aaj.ID_ALIAS = taa.ID_ALIAS AND aaj.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
          WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
            AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 AND aaa.FECHA_BAJA IS NULL
            AND aaa.ID_AJENO_SECCION_GLOBAL IS NOT NULL AND ar.ID_TIPO_ESTADO_AJENO_RAM = 1
            AND aaj.ID_TIPO_ESTADO_AJENO_RAM = 1
        `
      }
    ];
    
    // Ejecutar diagnósticos para identificar el problema
    console.log(`[AMBITOS] DIAGNÓSTICO - Ejecutando diagnósticos para tarea ${idTarea}`);
    
    for (const diag of diagnosticos) {
      try {
        const [result] = await sequelizeAjenos.query(diag.query, {
          replacements: { idTarea },
          type: sequelizeAjenos.QueryTypes.SELECT
        });
        
        console.log(`[AMBITOS] DIAGNÓSTICO - ${diag.nombre}: ${result.total} resultados`);
        
        if (result.total === 0) {
          console.error(`[AMBITOS] DIAGNÓSTICO - ERROR: No hay resultados para el join "${diag.nombre}"`);
        }
      } catch (diagError) {
        console.error(`[AMBITOS] DIAGNÓSTICO - ERROR en diagnóstico "${diag.nombre}":`, diagError.message);
      }
    }
    
    // Ejecutar la consulta original
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    console.log(`[AMBITOS] RESULTADOS - Se encontraron ${result.length} ámbitos aplanados para tarea ${idTarea}`);
    
    if (result.length > 0) {
      console.log(`[AMBITOS] RESULTADOS - Primer ámbito: ${JSON.stringify(result[0])}`);
    }
    
    // Diagnóstico adicional: verificar si faltan IDs de ajeno
    const sinAjenoQuery = `
      SELECT COUNT(*) as total
      FROM AJENOS.TAREA_AMBITO ta
      INNER JOIN AJENOS.TAREA_AMBITO_APLANADO taa ON ta.ID_TAREA_AMBITO = taa.ID_TAREA_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = taa.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
        AND aaa.ID_LOCALIZACION_COMPRA = taa.ID_LOCALIZACION_COMPRA
      WHERE ta.ID_TAREA_RAM = :idTarea AND taa.FECHA_BAJA IS NULL AND a.ID_TIPO_ESTADO_ALIAS = 2
        AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 AND aaa.FECHA_BAJA IS NULL
        AND aaa.ID_AJENO_SECCION_GLOBAL IS NULL
    `;
    
    const [sinAjenoResult] = await sequelizeAjenos.query(sinAjenoQuery, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (sinAjenoResult.total > 0) {
      console.error(`[AMBITOS] DIAGNÓSTICO - ERROR: Se encontraron ${sinAjenoResult.total} registros donde ID_AJENO_SECCION_GLOBAL es NULL`);
    }
    
    return result;
  } catch (error) {
    console.error(`[AMBITOS] ERROR - En findBaseTareaAmbitoAplanadoEventoByIdTarea para tarea ${idTarea}:`, error);
    console.error(`[AMBITOS] ERROR STACK: ${error.stack}`);
    throw error;
  }
}

async function createEventosEjecucion(eventosEjecucion, fechaAlta, usuarioAlta) {
  try {
    // Get next available ID
    const [maxIdResult] = await sequelizeAjenos.query(
      "SELECT COALESCE(MAX(ID_EVENTO_EJECUCION_RAM), 0) + 1 as nextId FROM AJENOS.EVENTO_EJECUCION_RAM",
      { type: sequelizeAjenos.QueryTypes.SELECT }
    );
    
    let nextId = maxIdResult.nextId || 1;

    for (const eventoEjecucion of eventosEjecucion) {
      const query = `
        INSERT INTO AJENOS.EVENTO_EJECUCION_RAM (
          ID_EVENTO_EJECUCION_RAM, ID_EVENTO_RAM, COD_EJECUCION, ID_TIPO_ESTADO_EVENTO_EJECUCION_RAM,
          FECHA_HORA_INICIO_EJECUCION, FECHA_HORA_FIN_EJECUCION, ID_AJENO,
          ID_LOCALIZACION_COMPRA, FECHA_ALTA, USUARIO_ALTA, ID_TIPO_EJECUCION_RAM
        ) VALUES (
          :idEventoEjecucion, :idEvento, :codEjecucion, :idTipoEstadoEventoEjecucion,
          :fechaHoraInicioEjecucion, :fechaHoraFinEjecucion, :idAjeno,
          :idLocalizacionCompra, :fechaAlta, :usuarioAlta, 1
        )
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: {
          idEventoEjecucion: nextId++,
          idEvento: eventoEjecucion.idEvento,
          codEjecucion: eventoEjecucion.codEjecucion,
          idTipoEstadoEventoEjecucion: eventoEjecucion.idTipoEstadoEventoEjecucion,
          fechaHoraInicioEjecucion: eventoEjecucion.fechaHoraInicioEjecucion,
          fechaHoraFinEjecucion: eventoEjecucion.fechaHoraFinEjecucion,
          idAjeno: eventoEjecucion.idAjeno,
          idLocalizacionCompra: eventoEjecucion.idLocalizacionCompra,
          fechaAlta: fechaAlta,
          usuarioAlta: usuarioAlta
        },
        type: sequelizeAjenos.QueryTypes.INSERT
      });
      
      // Set the ID in the object for reference
      eventoEjecucion.idEventoEjecucion = nextId - 1;
    }
    
    return eventosEjecucion;
  } catch (error) {
    console.error('Error en createEventosEjecucion:', error);
    throw error;
  }
}

function setProposalRequestBodyValues(proposalRequestBody, tareaAmbitoAplanadoEvento) {
  // Stock de recuento
  if (tareaAmbitoAplanadoEvento.stockRecuentos != null) {
    proposalRequestBody.stockRecuento = 
      tareaAmbitoAplanadoEvento.stockRecuentos > 0 ? 
      tareaAmbitoAplanadoEvento.stockRecuentos : null;
  } else {
    proposalRequestBody.stockRecuento = null;
  }
  
  // Fecha de validación
  proposalRequestBody.fechaValidacionUltimoRecuento = 
    tareaAmbitoAplanadoEvento.fechaHoraEjecucionStockRecuentos ? 
    formatDateToLocalDate(tareaAmbitoAplanadoEvento.fechaHoraEjecucionStockRecuentos) : null;
  
  // Capacidad máxima
  if (tareaAmbitoAplanadoEvento.capacidadMaxima != null) {
    proposalRequestBody.capacidadMaxima = 
      tareaAmbitoAplanadoEvento.capacidadMaxima > 0 ? 
      tareaAmbitoAplanadoEvento.capacidadMaxima : null;
  } else {
    proposalRequestBody.capacidadMaxima = null;
  }
  
  // Stock objetivo
  proposalRequestBody.stockObjetivo = 
    tareaAmbitoAplanadoEvento.stockMaximo ? 
    tareaAmbitoAplanadoEvento.stockMaximo / 100 : null;
}

function calcularPropuestaFinal(propuesta, unidadesEmpaquetado, multiploMinimo) {
  if (propuesta != null && propuesta !== 0 && unidadesEmpaquetado && multiploMinimo) {
    let propuestaFinal = Math.floor(propuesta / unidadesEmpaquetado);
    
    if (propuesta % unidadesEmpaquetado !== 0) {
      propuestaFinal++;
    }
    
    if (propuestaFinal < multiploMinimo) {
      propuestaFinal = multiploMinimo;
    }
    
    return propuestaFinal * unidadesEmpaquetado;
  }
  
  return propuesta;
}

async function createPropuestas(propuestas, fechaAlta, usuarioAlta) {
  try {
    // Obtener el siguiente ID disponible
    const [maxIdResult] = await sequelizeAjenos.query(
      "SELECT COALESCE(MAX(ID_PROPUESTA_RAM), 0) + 1 as nextId FROM AJENOS.PROPUESTA_RAM",
      { type: sequelizeAjenos.QueryTypes.SELECT }
    );
    
    let nextId = maxIdResult.nextId || 1;
    
    for (const propuesta of propuestas) {
      const query = `
        INSERT INTO AJENOS.PROPUESTA_RAM (
          ID_PROPUESTA_RAM, ID_ALIAS, ID_LOCALIZACION_COMPRA, ID_TIPO_ESTADO_PROPUESTA_RAM,
          USUARIO_ALTA, FECHA_ALTA, FECHA_HORA_EJECUCION, ID_EVENTO_EJECUCION_RAM,
          CANTIDAD_DATA_ANALYTICS, STOCK_TEORICO_DATA_ANALYTICS, FECHA_CALCULO_DATA_ANALYTICS
        ) VALUES (
          :idPropuestaRam, :idAlias, :idLocalizacionCompra, :idTipoEstadoPropuesta,
          :usuarioAlta, :fechaAlta, :fechaHoraEjecucion, :idEventoEjecucion,
          :cantidadDataAnalytics, :stockTeoricoDataAnalytics, :fechaCalculoDataAnalytics
        )
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: {
          idPropuestaRam: nextId++,
          idAlias: propuesta.idAlias,
          idLocalizacionCompra: propuesta.idLocalizacionCompra,
          idTipoEstadoPropuesta: propuesta.idTipoEstadoPropuesta,
          usuarioAlta: propuesta.usuarioAlta,
          fechaAlta: propuesta.fechaAlta,
          fechaHoraEjecucion: propuesta.fechaHoraEjecucion,
          idEventoEjecucion: propuesta.idEventoEjecucion,
          cantidadDataAnalytics: propuesta.cantidadDataAnalytics,
          stockTeoricoDataAnalytics: propuesta.stockTeoricoDataAnalytics,
          fechaCalculoDataAnalytics: propuesta.fechaCalculoDataAnalytics
        },
        type: sequelizeAjenos.QueryTypes.INSERT
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error en createPropuestas:', error);
    throw error;
  }
}

async function getAnalyticsProposal(analyticsProposalRequest) {
  try {
    console.log('Llamando a Analytics API con datos:', JSON.stringify(analyticsProposalRequest));
    
    const respuesta = {
      propuestas: {}
    };
    
    Object.keys(analyticsProposalRequest).forEach(idEventoEjecucion => {
      respuesta.propuestas[idEventoEjecucion] = {
        unidadesPropuestas: Math.floor(Math.random() * 100) + 10, // Valor aleatorio entre 10 y 109
        fechaCalculo: new Date().toISOString()
      };
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return respuesta;
  } catch (error) {
    console.error('Error en getAnalyticsProposal:', error);
    throw error;
  }
}

function formatDateToLocalDate(date) {
  if (!date) return null;
  
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const TipoEstadoRecuentoEnum = {
  PENDIENTE: 1,
  RECOGIDO: 2,
  RESPUESTA: 3,
  VALIDADO: 4,
  DESCARTADO: 5
};

async function ejecutarEventosRecuento(idsEvento, codEjecucion, idIdioma, usuarioEjecucion, fechaEjecucion) {
  try {
    for (const idEvento of idsEvento) {
      console.log(`[RECUENTO] EVENTO ${idEvento} - Comenzando procesamiento`);
      
      const idsTareaActivas = await findIdsTareasByIdEventoIdTipoEstadoTarea(
        idEvento, 
        [TipoEstadoTareaRamEnum.PUBLICADA]
      );
      
      if (!idsTareaActivas || idsTareaActivas.length === 0) {
        console.error(`[RECUENTO] EVENTO ${idEvento} - ERROR: No se encontraron tareas activas, verificar si las tareas están en estado PUBLICADA`);
        continue;
      }
      
      for (const idTarea of idsTareaActivas) {

        const tareaAmbitoAplanadoElegible = await findBaseTareaAmbitoAplanadoEventoByIdTarea(idTarea);
        
        const recuentos = tareaAmbitoAplanadoElegible.map((taa, index) => {
          const recuento = {
            codEjecucion: codEjecucion,
            idAlias: taa.idAlias,
            idLocalizacionCompra: taa.idLocalizacionCompra,
            idAjeno: taa.idAjeno,
            idEvento: idEvento,
            stockTeoricoEnviado: 0,
            orden: index,
            usuarioAlta: usuarioEjecucion,
            fechaAlta: fechaEjecucion,
            idTipoEstadoRecuento: TipoEstadoRecuentoEnum.PENDIENTE
          };
          console.log(`[RECUENTO] RECUENTO ${index} - Creado objeto: ${JSON.stringify(recuento)}`);
          return recuento;
        });
          
        const eventosEjecucion = tareaAmbitoAplanadoElegible.map((taa, index) => {
          const evento = {
            idEventoEjecucion: null, // Se asignará después
            codEjecucion: codEjecucion,
            idEvento: idEvento,
            idAjeno: taa.idAjeno,
            idLocalizacionCompra: taa.idLocalizacionCompra,
            idTipoEstadoEventoEjecucion: TipoEstadoEventoEjecucionEnum.COMPLETADO,
            fechaHoraInicioEjecucion: fechaEjecucion,
            fechaHoraFinEjecucion: fechaEjecucion,
            usuarioAlta: usuarioEjecucion,
            fechaAlta: fechaEjecucion,
            idAlias: taa.idAlias
          };
          return evento;
        });
          
        try {
          await deleteCurrentPendingCounts(recuentos, fechaEjecucion, usuarioEjecucion);
          console.log(`[RECUENTO] TAREA ${idTarea} - Recuentos pendientes eliminados con éxito`);
        } catch (deletePendingError) {
          console.error(`[RECUENTO] ERROR - Al eliminar recuentos pendientes para tarea ${idTarea}:`, deletePendingError);
          console.error(`[RECUENTO] ERROR DETALLE: ${deletePendingError.message}`);
          console.error(`[RECUENTO] ERROR STACK: ${deletePendingError.stack}`);
        }
        
        try {
          await createRecuentos(recuentos, fechaEjecucion, usuarioEjecucion);
          console.log(`[RECUENTO] TAREA ${idTarea} - Recuentos creados con éxito`);
          
          
        } catch (createRecuentosError) {
          console.error(`[RECUENTO] ERROR CRÍTICO - Al crear recuentos para tarea ${idTarea}:`, createRecuentosError);
          console.error(`[RECUENTO] ERROR DETALLE: ${createRecuentosError.message}`);
          console.error(`[RECUENTO] ERROR STACK: ${createRecuentosError.stack}`);
          throw createRecuentosError; // Este error sí es crítico, detener la ejecución
        }
          
        try {
          await createEventosEjecucion(eventosEjecucion, fechaEjecucion, usuarioEjecucion);
                    
        } catch (createEjecucionError) {
          console.error(`[RECUENTO] ERROR CRÍTICO - Al crear ejecuciones para tarea ${idTarea}:`, createEjecucionError);
          console.error(`[RECUENTO] ERROR DETALLE: ${createEjecucionError.message}`);
          console.error(`[RECUENTO] ERROR STACK: ${createEjecucionError.stack}`);
          throw createEjecucionError; // Este error sí es crítico, detener la ejecución
        }
      }
    }
      
    await exports.updateEventoEstado(idsEvento, 2, usuarioEjecucion, fechaEjecucion);
    
      
  } catch (error) {
    console.error(`[RECUENTO] ERROR FATAL - Al ejecutar eventos de recuento: ${error.message}`, error);
    console.error(`[RECUENTO] ERROR DETALLE: ${error.stack}`);
    throw error;
  }
}

async function deleteCurrentPendingCounts(recuentos, fechaModificacion, usuarioModificacion) {
  try {
    console.log(`[RECUENTO] DELETE PENDING - Iniciando eliminación de ${recuentos.length} recuentos pendientes`);
    
    for (const recuento of recuentos) {
      console.log(`[RECUENTO] DELETE PENDING - Eliminando recuento: Alias=${recuento.idAlias}, Loc=${recuento.idLocalizacionCompra}`);
      
      const query = `
        UPDATE AJENOS.RECUENTO_RAM 
        SET ID_TIPO_ESTADO_RECUENTO_RAM = ${TipoEstadoRecuentoEnum.DESCARTADO}, 
          USUARIO_MODIFICACION = :usuarioModificacion, 
          FECHA_MODIFICACION = :fechaModificacion 
        WHERE ID_ALIAS = :idAlias 
        AND ID_LOCALIZACION_COMPRA = :idLocalizacionCompra 
        AND ID_TIPO_ESTADO_RECUENTO_RAM IN (${TipoEstadoRecuentoEnum.PENDIENTE}, ${TipoEstadoRecuentoEnum.RECOGIDO})
      `;
      
      const [result, metadata] = await sequelizeAjenos.query(query, {
        replacements: {
          usuarioModificacion,
          fechaModificacion,
          idAlias: recuento.idAlias,
          idLocalizacionCompra: recuento.idLocalizacionCompra
        },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
    }
    
    return true;
  } catch (error) {
    console.error(`[RECUENTO] DELETE PENDING ERROR - ${error.message}`, error);
    throw error;
  }
}

async function createRecuentos(recuentos, fechaAlta, usuarioAlta) {
  try {
    console.log(`[RECUENTO] CREATE - Iniciando creación de ${recuentos.length} recuentos`);
    
    const [maxIdResult] = await sequelizeAjenos.query(
      "SELECT COALESCE(MAX(ID_RECUENTO_RAM), 0) + 1 as nextId FROM AJENOS.RECUENTO_RAM",
      { type: sequelizeAjenos.QueryTypes.SELECT }
    );
    
    let nextId = maxIdResult.nextId || 1;
    
    for (const recuento of recuentos) {
      const query = `
        INSERT INTO AJENOS.RECUENTO_RAM (
          ID_RECUENTO_RAM,
          COD_EJECUCION, ID_ALIAS, ID_LOCALIZACION_COMPRA, ID_AJENO, ID_EVENTO_RAM,
          STOCK_TEORICO_ENVIADO, ORDEN, USUARIO_ALTA, FECHA_ALTA, ID_TIPO_ESTADO_RECUENTO_RAM
        ) VALUES (
          :idRecuentoRam,
          :codEjecucion, :idAlias, :idLocalizacionCompra, :idAjeno, :idEvento,
          :stockTeoricoEnviado, :orden, :usuarioAlta, :fechaAlta, :idTipoEstadoRecuento
        )
      `;
      
      await sequelizeAjenos.query(query, {
        replacements: {
          idRecuentoRam: nextId++,
          codEjecucion: recuento.codEjecucion,
          idAlias: recuento.idAlias,
          idLocalizacionCompra: recuento.idLocalizacionCompra,
          idAjeno: recuento.idAjeno,
          idEvento: recuento.idEvento,
          stockTeoricoEnviado: recuento.stockTeoricoEnviado || 0,
          orden: recuento.orden,
          usuarioAlta,
          fechaAlta,
          idTipoEstadoRecuento: recuento.idTipoEstadoRecuento
        },
        type: sequelizeAjenos.QueryTypes.INSERT
      });
    }
    
    return true;
  } catch (error) {
    console.error(`[RECUENTO] CREATE ERROR GENERAL - ${error.message}`, error);
    throw error;
  }
}