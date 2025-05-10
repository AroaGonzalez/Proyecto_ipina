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

exports.getTiposEstadoRecuento = async (idIdioma = 1) => {
  try {
    const cacheKey = `tipos_estado_recuento_${idIdioma}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const query = `
      SELECT 
        ter.ID_TIPO_ESTADO_RECUENTO_RAM as id,
        teri.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTADO_RECUENTO_RAM ter
      JOIN AJENOS.TIPO_ESTADO_RECUENTO_RAM_IDIOMA teri ON ter.ID_TIPO_ESTADO_RECUENTO_RAM = teri.ID_TIPO_ESTADO_RECUENTO_RAM
      WHERE teri.ID_IDIOMA = :idIdioma
      ORDER BY ter.ID_TIPO_ESTADO_RECUENTO_RAM
    `;
    
    // Esta consulta solo usa tablas del esquema AJENOS
    const result = await sequelizeAjenos.query(query, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const processedResult = result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
    
    cache.set(cacheKey, processedResult);
    
    return processedResult;
  } catch (error) {
    console.error('Error al obtener tipos de estado de recuento:', error);
    return [];
  }
};

exports.findRecuentosByFilter = async (recuentoFilter) => {
  try {
    console.log("========= INICIANDO BÚSQUEDA DE RECUENTOS =========");
    console.log("Filtros recibidos:", JSON.stringify(recuentoFilter));
    
    // Corrección de nombres de parámetros si es necesario
    if (recuentoFilter.idsEstadoLinea && !recuentoFilter.idsTipoEstadoRecuento) {
      console.log("Corrigiendo idsEstadoLinea a idsTipoEstadoRecuento");
      recuentoFilter.idsTipoEstadoRecuento = recuentoFilter.idsEstadoLinea;
      delete recuentoFilter.idsEstadoLinea;
    }

    if (!recuentoFilter.idsTipoEstadoRecuento || recuentoFilter.idsTipoEstadoRecuento.length === 0) {
      console.log("Asignando valor por defecto a idsTipoEstadoRecuento: [1, 2, 3]");
      recuentoFilter.idsTipoEstadoRecuento = [1, 2, 3];
    }
    
    const cacheKey = `recuentos_${JSON.stringify(recuentoFilter)}`;
    console.log("Verificando cache con clave:", cacheKey);
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      console.log("Devolviendo resultado cacheado");
      return cachedResult;
    }
    
    let sqlQuery = `
      WITH RankedResults AS (
        SELECT r.ID_RECUENTO_RAM AS idRecuento, r.COD_EJECUCION AS codEjecucion, p.ID_PAIS AS idPais, 
          p.PAIS_ISO AS codigoPaisIso, COALESCE(pi.DESCRIPCION, p.DESCRIPCION) AS nombrePais, 
          r.ID_LOCALIZACION_COMPRA AS idLocalizacionCompra, lc.DESCRIPCION AS nombreLocalizacionCompra, 
          a.ID_ALIAS AS idAlias, ai.NOMBRE AS nombreAlias, er.ID_EVENTO_RAM AS idEvento,
          er.NOMBRE AS nombreEvento, aj.ID_AJENO AS idAjeno, COALESCE(aji.NOMBRE, aj.NOMBRE) AS nombreAjeno,
          r.STOCK_TEORICO_ENVIADO AS stockTeoricoEnviado, r.STOCK_FISICO AS stockFisico,
          r.STOCK_FISICO_VALIDADO AS stockFisicoValidado, r.CAPACIDAD_MAX_FISICA AS capacidadMaximaFisica,
          r.CAPACIDAD_MAX_FISICA_VALIDADA AS capacidadMaximaFisicaValidada, r.ID_TIPO_ESTADO_RECUENTO_RAM AS idTipoEstadoRecuento,
          terai.DESCRIPCION AS descripcionEstadoRecuento, r.FECHA_HORA_INICIO_RECUENTO AS col_19_0_,
          r.FECHA_HORA_FIN_RECUENTO AS col_20_0_, r.FECHA_ALTA AS fechaAlta, r.FECHA_HORA_RECOGIDA AS fechaRecogida,
          r.FECHA_HORA_RESPUESTA AS fechaRespuesta, r.FECHA_HORA_VALIDACION AS fechaValidacion, c.ID_CADENA AS idCadena,
          c.NOMBRE AS nombreCadena, r.ORDEN AS orden, a.ID_TIPO_ALIAS AS idTipoAlias, eer.ID_TIPO_EJECUCION_RAM AS idTipoEjecucion,
          ROW_NUMBER() OVER (PARTITION BY r.ID_RECUENTO_RAM ORDER BY r.ID_RECUENTO_RAM DESC) AS rn
        FROM AJENOS.RECUENTO_RAM r
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = r.ID_ALIAS AND a.FECHA_BAJA IS NULL
        INNER JOIN AJENOS.AJENO aj ON aj.ID_AJENO = r.ID_AJENO
        INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = r.ID_LOCALIZACION_COMPRA
        INNER JOIN MAESTROS.PAIS p ON p.ID_PAIS = lc.ID_PAIS
        INNER JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
        INNER JOIN AJENOS.EVENTO_EJECUCION_RAM eer ON eer.ID_EVENTO_RAM = r.ID_EVENTO_RAM
            AND eer.ID_LOCALIZACION_COMPRA = r.ID_LOCALIZACION_COMPRA
            AND eer.ID_AJENO = r.ID_AJENO
        INNER JOIN AJENOS.EVENTO_RAM er ON r.ID_EVENTO_RAM = er.ID_EVENTO_RAM
        LEFT JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.AJENO_IDIOMA aji ON aji.ID_AJENO = aj.ID_AJENO AND aji.ID_IDIOMA = :idIdioma
        LEFT JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.TIPO_ESTADO_RECUENTO_RAM_IDIOMA terai ON terai.ID_TIPO_ESTADO_RECUENTO_RAM = r.ID_TIPO_ESTADO_RECUENTO_RAM
            AND terai.ID_IDIOMA = :idIdioma
    `;
    
    let countQuery = `
      WITH RankedResults AS (
        SELECT
          r.ID_RECUENTO_RAM AS idRecuento,
          ROW_NUMBER() OVER (PARTITION BY r.ID_RECUENTO_RAM ORDER BY r.ID_RECUENTO_RAM DESC) AS rn
          FROM AJENOS.RECUENTO_RAM r
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = r.ID_ALIAS AND a.FECHA_BAJA IS NULL
        INNER JOIN AJENOS.AJENO aj ON aj.ID_AJENO = r.ID_AJENO
        INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = r.ID_LOCALIZACION_COMPRA
        INNER JOIN MAESTROS.PAIS p ON p.ID_PAIS = lc.ID_PAIS
        INNER JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
        INNER JOIN AJENOS.EVENTO_EJECUCION_RAM eer ON eer.ID_EVENTO_RAM = r.ID_EVENTO_RAM
            AND eer.ID_LOCALIZACION_COMPRA = r.ID_LOCALIZACION_COMPRA
            AND eer.ID_AJENO = r.ID_AJENO
        INNER JOIN AJENOS.EVENTO_RAM er ON r.ID_EVENTO_RAM = er.ID_EVENTO_RAM
    `;

    if (recuentoFilter.idsGrupoCadena && recuentoFilter.idsGrupoCadena.length > 0) {
      console.log(`Aplicando filtro de grupos cadena: ${recuentoFilter.idsGrupoCadena.join(',')}`);
      sqlQuery += `INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr on (lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA) `;
      countQuery += `INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr on (lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA) `;
    }
    
    if (recuentoFilter.idsEvento && recuentoFilter.idsEvento.length > 0) {
      if (recuentoFilter.idsEvento.includes(0) && recuentoFilter.idsEvento.length > 1) {
        sqlQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND (eer.ID_TIPO_EJECUCION_RAM = 2 OR r.ID_EVENTO_RAM IN (${recuentoFilter.idsEvento.join(',')})) `;
        countQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND (eer.ID_TIPO_EJECUCION_RAM = 2 OR r.ID_EVENTO_RAM IN (${recuentoFilter.idsEvento.join(',')})) `;
      } else if (recuentoFilter.idsEvento.includes(0) && recuentoFilter.idsEvento.length === 1) {
        sqlQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND eer.ID_TIPO_EJECUCION_RAM = 2 `;
        countQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND eer.ID_TIPO_EJECUCION_RAM = 2 `;
      } else {
        sqlQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND r.ID_EVENTO_RAM IN (${recuentoFilter.idsEvento.join(',')}) `;
        countQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL AND r.ID_EVENTO_RAM IN (${recuentoFilter.idsEvento.join(',')}) `;
      }
    } else {
      sqlQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL `;
      countQuery += `WHERE r.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL `;
    }
    
    if (recuentoFilter.idsRecuento && recuentoFilter.idsRecuento.length > 0) {
      sqlQuery += `AND r.ID_RECUENTO_RAM IN (${recuentoFilter.idsRecuento.join(',')}) `;
      countQuery += `AND r.ID_RECUENTO_RAM IN (${recuentoFilter.idsRecuento.join(',')}) `;
    }
    
    if (recuentoFilter.idsMercado && recuentoFilter.idsMercado.length > 0) {
      sqlQuery += `AND p.ID_PAIS IN (${recuentoFilter.idsMercado.join(',')}) `;
      countQuery += `AND p.ID_PAIS IN (${recuentoFilter.idsMercado.join(',')}) `;
    }
    
    if (recuentoFilter.idsGrupoCadena && recuentoFilter.idsGrupoCadena.length > 0) {
      sqlQuery += `AND lcr.ID_GRUPO_CADENA IN (${recuentoFilter.idsGrupoCadena.join(',')}) `;
      countQuery += `AND lcr.ID_GRUPO_CADENA IN (${recuentoFilter.idsGrupoCadena.join(',')}) `;
    }
    
    if (recuentoFilter.idsLocalizacion && recuentoFilter.idsLocalizacion.length > 0) {
      sqlQuery += `AND lc.ID_LOCALIZACION_COMPRA IN (${recuentoFilter.idsLocalizacion.join(',')}) `;
      countQuery += `AND lc.ID_LOCALIZACION_COMPRA IN (${recuentoFilter.idsLocalizacion.join(',')}) `;
    }
    
    if (recuentoFilter.idsEjecucion && recuentoFilter.idsEjecucion.length > 0) {
      sqlQuery += `AND r.COD_EJECUCION IN (${recuentoFilter.idsEjecucion.join(',')}) `;
      countQuery += `AND r.COD_EJECUCION IN (${recuentoFilter.idsEjecucion.join(',')}) `;
    }
    
    if (recuentoFilter.idsTipoEstadoRecuento && recuentoFilter.idsTipoEstadoRecuento.length > 0) {
      sqlQuery += `AND r.ID_TIPO_ESTADO_RECUENTO_RAM IN (${recuentoFilter.idsTipoEstadoRecuento.join(',')}) `;
      countQuery += `AND r.ID_TIPO_ESTADO_RECUENTO_RAM IN (${recuentoFilter.idsTipoEstadoRecuento.join(',')}) `;
    }
    
    if (recuentoFilter.idsTipoAlias && recuentoFilter.idsTipoAlias.length > 0) {
      sqlQuery += `AND a.ID_TIPO_ALIAS IN (${recuentoFilter.idsTipoAlias.join(',')}) `;
      countQuery += `AND a.ID_TIPO_ALIAS IN (${recuentoFilter.idsTipoAlias.join(',')}) `;
    }
    
    if (recuentoFilter.fechaCreacionDesde && !recuentoFilter.fechaCreacionHasta) {
      sqlQuery += `AND r.FECHA_ALTA >= :fechaDesde `;
      countQuery += `AND r.FECHA_ALTA >= :fechaDesde `;
    }
    
    if (recuentoFilter.fechaCreacionHasta && !recuentoFilter.fechaCreacionDesde) {
      sqlQuery += `AND r.FECHA_ALTA <= :fechaHasta `;
      countQuery += `AND r.FECHA_ALTA <= :fechaHasta `;
    }
    
    if (recuentoFilter.fechaCreacionDesde && recuentoFilter.fechaCreacionHasta) {
      sqlQuery += `AND r.FECHA_ALTA BETWEEN :fechaDesde AND :fechaHasta `;
      countQuery += `AND r.FECHA_ALTA BETWEEN :fechaDesde AND :fechaHasta `;
    }
    
    if (recuentoFilter.idsAlias && recuentoFilter.idsAlias.length > 0) {
      sqlQuery += `AND a.ID_ALIAS IN (${recuentoFilter.idsAlias.join(',')}) `;
      countQuery += `AND a.ID_ALIAS IN (${recuentoFilter.idsAlias.join(',')}) `;
    }
    
    sqlQuery += `) 
        SELECT idRecuento, codEjecucion, idPais, codigoPaisIso, nombrePais, idLocalizacionCompra, nombreLocalizacionCompra, 
            idAlias, nombreAlias, idEvento, nombreEvento, idAjeno, nombreAjeno, stockTeoricoEnviado, stockFisico, 
            stockFisicoValidado, capacidadMaximaFisica, capacidadMaximaFisicaValidada, idTipoEstadoRecuento, 
            descripcionEstadoRecuento, col_19_0_, col_20_0_, fechaAlta, fechaRecogida, fechaRespuesta, fechaValidacion, 
            idCadena, nombreCadena, orden, idTipoAlias, idTipoEjecucion 
        FROM RankedResults 
        WHERE rn = 1 `;
    
    countQuery += `) SELECT COUNT(*) as total FROM RankedResults WHERE rn = 1`;
    
    let sortColumn = "idRecuento";
    if (recuentoFilter.sortRecuento && recuentoFilter.sortRecuento.sortField) {
      switch (recuentoFilter.sortRecuento.sortField) {
        case 'STOCK_FISICO':
          sortColumn = "stockFisico";
          break;
        case 'CAPACIDAD_MAX_FISICA':
          sortColumn = "capacidadMaximaFisica";
          break;
        case 'ID_RECUENTO_RAM':
        default:
          sortColumn = "idRecuento";
          break;
      }
    }
    
    sqlQuery += `ORDER BY ${sortColumn} `;
    
    if (recuentoFilter.sortRecuento && recuentoFilter.sortRecuento.sortDescending) {
      sqlQuery += `DESC `;
    } else {
      sqlQuery += `ASC `;
    }
    
    sqlQuery += `LIMIT ${recuentoFilter.limit} OFFSET ${recuentoFilter.offset * recuentoFilter.limit}`;
    
    const replacements = {
      idIdioma: recuentoFilter.idIdioma || 1,
    };
    
    if (recuentoFilter.fechaCreacionDesde) {
      replacements.fechaDesde = recuentoFilter.fechaCreacionDesde.toISOString().split('T')[0];
    }
    
    if (recuentoFilter.fechaCreacionHasta) {
      replacements.fechaHasta = recuentoFilter.fechaCreacionHasta.toISOString().split('T')[0];
    }
    
    try {
      console.log("Ejecutando consultas SQL...");
      const [countResult, recuentos] = await Promise.all([
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
      
      const processedRecuentos = recuentos.map(recuento => {
        return {
          idRecuento: recuento.idRecuento,
          codEjecucion: recuento.codEjecucion,
          mercado: {
            id: recuento.idPais,
            codigoIso: recuento.codigoPaisIso,
            descripcion: fixEncoding(recuento.nombrePais)
          },
          localizacionCompra: {
            id: recuento.idLocalizacionCompra,
            descripcion: fixEncoding(recuento.nombreLocalizacionCompra)
          },
          alias: {
            id: recuento.idAlias,
            nombre: fixEncoding(recuento.nombreAlias),
            idTipoAlias: recuento.idTipoAlias
          },
          evento: {
            id: recuento.idEvento,
            nombre: fixEncoding(recuento.nombreEvento)
          },
          ajeno: {
            id: recuento.idAjeno,
            nombre: fixEncoding(recuento.nombreAjeno)
          },
          tipoEstadoRecuento: {
            id: recuento.idTipoEstadoRecuento,
            descripcion: fixEncoding(recuento.descripcionEstadoRecuento)
          },
          cadena: {
            id: recuento.idCadena,
            nombre: fixEncoding(recuento.nombreCadena)
          },
          stockTeoricoEnviado: recuento.stockTeoricoEnviado,
          stockFisico: recuento.stockFisico,
          stockFisicoValidado: recuento.stockFisicoValidado,
          capacidadMaximaFisica: recuento.capacidadMaximaFisica,
          capacidadMaximaFisicaValidada: recuento.capacidadMaximaFisicaValidada,
          fechaAlta: recuento.fechaAlta,
          fechaInicioRecuento: recuento.col_19_0_,
          fechaFinRecuento: recuento.col_20_0_,
          fechaRecogida: recuento.fechaRecogida,
          fechaRespuesta: recuento.fechaRespuesta,
          fechaValidacion: recuento.fechaValidacion,
          orden: recuento.orden,
          idTipoEjecucion: recuento.idTipoEjecucion
        };
      });
      
      const result = {
        content: processedRecuentos,
        totalElements,
        offset: recuentoFilter.offset,
        limit: recuentoFilter.limit
      };
      
      console.log("Resultado final:", JSON.stringify({
        contentLength: result.content.length,
        totalElements: result.totalElements
      }));
      
      cache.set(cacheKey, result);
      
      return result;
    } catch (sqlError) {
      console.error('Error SQL en findRecuentosByFilter:', sqlError);
      console.error('Error message:', sqlError.message);
      console.error('Error details:', sqlError.original ? JSON.stringify(sqlError.original) : 'No details');
      throw sqlError;
    }
  } catch (error) {
    console.error('Error general en findRecuentosByFilter:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};