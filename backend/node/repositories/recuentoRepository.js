const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');
const CACHE_DURATION = 30 * 1000;
const LIMITE_STOCK_CAPACIDAD_MAXIMA = 999999;
const UNIDADES_EMPAQUETADO = 1;

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
    if (recuentoFilter.idsEstadoLinea && !recuentoFilter.idsTipoEstadoRecuento) {
      recuentoFilter.idsTipoEstadoRecuento = recuentoFilter.idsEstadoLinea;
      delete recuentoFilter.idsEstadoLinea;
    }

    if (!recuentoFilter.idsTipoEstadoRecuento || recuentoFilter.idsTipoEstadoRecuento.length === 0) {
      recuentoFilter.idsTipoEstadoRecuento = [1, 2, 3];
    }
    
    const cacheKey = `recuentos_${JSON.stringify(recuentoFilter)}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
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

const TIPO_ESTADO_RECUENTO = {
  DESCARTADO: 5,
  VALIDADO: 4,
  RECOGIDO: 2,
  RESPUESTA: 3,
  PENDIENTE: 1
};

exports.updateEstadoRecuentos = async (recuentoFilterProcess) => {
  const transaction = await sequelizeAjenos.transaction();
  
  try {
    const { idsRecuento, idTipoEstadoRecuento, usuario } = recuentoFilterProcess;
    
    const fechaActual = new Date();
    let totalActualizados = 0;
    let recuentosValidados = [];
    
    const recuentos = await sequelizeAjenos.query(
      `SELECT * FROM AJENOS.RECUENTO_RAM WHERE ID_RECUENTO_RAM IN (${idsRecuento.join(',')})`,
      { 
        type: sequelizeAjenos.QueryTypes.SELECT,
        transaction
      }
    );
    
    if (idTipoEstadoRecuento === TIPO_ESTADO_RECUENTO.DESCARTADO) {
      const [affectedRows] = await sequelizeAjenos.query(
        `UPDATE AJENOS.RECUENTO_RAM 
         SET ID_TIPO_ESTADO_RECUENTO_RAM = :idTipoEstadoRecuento,
            FECHA_MODIFICACION = :fechaModificacion,
            USUARIO_MODIFICACION = :usuario
         WHERE ID_RECUENTO_RAM IN (${idsRecuento.join(',')})`,
        { 
          replacements: { 
            idTipoEstadoRecuento,
            fechaModificacion: fechaActual,
            usuario
          },
          type: sequelizeAjenos.QueryTypes.UPDATE,
          transaction
        }
      );
      
      totalActualizados = affectedRows;
      
    } else if (idTipoEstadoRecuento === TIPO_ESTADO_RECUENTO.VALIDADO) {
      const [affectedRows] = await sequelizeAjenos.query(
        `UPDATE AJENOS.RECUENTO_RAM 
         SET ID_TIPO_ESTADO_RECUENTO_RAM = :idTipoEstadoRecuento,
            FECHA_MODIFICACION = :fechaModificacion,
            FECHA_HORA_VALIDACION = :fechaValidacion,
            STOCK_FISICO_VALIDADO = STOCK_FISICO,
            CAPACIDAD_MAX_FISICA_VALIDADA = CAPACIDAD_MAX_FISICA,
            USUARIO_MODIFICACION = :usuario
         WHERE ID_RECUENTO_RAM IN (${idsRecuento.join(',')})`,
        { 
          replacements: { 
            idTipoEstadoRecuento,
            fechaModificacion: fechaActual,
            fechaValidacion: fechaActual,
            usuario
          },
          type: sequelizeAjenos.QueryTypes.UPDATE,
          transaction
        }
      );
      
      totalActualizados = affectedRows;
      
      recuentosValidados = recuentos.map(recuento => ({
        idRecuento: recuento.ID_RECUENTO_RAM,
        idAlias: recuento.ID_ALIAS,
        idLocalizacionCompra: recuento.ID_LOCALIZACION_COMPRA,
        stockRecuentos: recuento.STOCK_FISICO,
        capacidadMaxima: recuento.CAPACIDAD_MAX_FISICA,
        fechaRespuesta: recuento.FECHA_HORA_RESPUESTA || fechaActual
      }));
      
    } else if (idTipoEstadoRecuento === TIPO_ESTADO_RECUENTO.RECOGIDO) {
      const [affectedRows] = await sequelizeAjenos.query(
        `UPDATE AJENOS.RECUENTO_RAM 
         SET ID_TIPO_ESTADO_RECUENTO_RAM = :idTipoEstadoRecuento,
            FECHA_MODIFICACION = :fechaModificacion,
            FECHA_HORA_RECOGIDA = :fechaRecogida,
            USUARIO_MODIFICACION = :usuario
         WHERE ID_RECUENTO_RAM IN (${idsRecuento.join(',')})`,
        { 
          replacements: { 
            idTipoEstadoRecuento,
            fechaModificacion: fechaActual,
            fechaRecogida: fechaActual,
            usuario
          },
          type: sequelizeAjenos.QueryTypes.UPDATE,
          transaction
        }
      );
      
      totalActualizados = affectedRows;
    }
    
    await transaction.commit();
    
    if (recuentosValidados.length > 0) {
      await updateStock(recuentosValidados);
    }
    
    return {
      totalUpdated: totalActualizados,
      recuentosValidados
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error en updateEstadoRecuentos:', error);
    throw error;
  }
};


exports.updateStock = async (recuentosValidados) => {
  const transaction = await sequelizeAjenos.transaction();
  
  try {
    const stockLocalizacionesToUpdate = [];
    
    for (const recuento of recuentosValidados) {
      const stockLocalizacion = {
        idAlias: recuento.idAlias,
        idLocalizacionCompra: recuento.idLocalizacionCompra,
        stockRecuentos: recuento.stockRecuentos,
        capacidadMaxima: recuento.capacidadMaxima,
        fechaHoraEjecucionStockRecuentos: recuento.fechaRespuesta || new Date(),
        stockRecuentosValidadoBultos: recuento.stockRecuentos,
        capacidadMaximaValidadaBultos: recuento.capacidadMaxima
      };
      
      const [aliasAmbitoAplanado] = await sequelizeAjenos.query(
        `SELECT aaa.*
          FROM AJENOS.ALIAS_AMBITO_APLANADO aaa
          INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
          WHERE aa.ID_ALIAS = :idAlias
          AND aaa.ID_LOCALIZACION_COMPRA = :idLocalizacionCompra`,
        {
          replacements: {
            idAlias: stockLocalizacion.idAlias,
            idLocalizacionCompra: stockLocalizacion.idLocalizacionCompra
          },
          type: sequelizeAjenos.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (aliasAmbitoAplanado && aliasAmbitoAplanado.ID_AJENO_SECCION_GLOBAL) {
        const [ajenoGlobal] = await sequelizeAjenos.query(
          `SELECT * FROM AJENOS.AJENO_RAM WHERE ID_AJENO = :idAjeno`,
          {
            replacements: { idAjeno: aliasAmbitoAplanado.ID_AJENO_SECCION_GLOBAL },
            type: sequelizeAjenos.QueryTypes.SELECT,
            transaction
          }
        );
        
        if (ajenoGlobal && ajenoGlobal.UNIDADES_EMPAQUETADO > UNIDADES_EMPAQUETADO) {
          if (stockLocalizacion.stockRecuentos) {
            stockLocalizacion.stockRecuentos = stockLocalizacion.stockRecuentos * ajenoGlobal.UNIDADES_EMPAQUETADO;
          }
          if (stockLocalizacion.capacidadMaxima) {
            stockLocalizacion.capacidadMaxima = stockLocalizacion.capacidadMaxima * ajenoGlobal.UNIDADES_EMPAQUETADO;
          }
        }
      }
      
      const [aliasInfo] = await sequelizeAjenos.query(
        `SELECT a.ID_ALIAS, a.ID_TIPO_ALIAS
          FROM AJENOS.ALIAS a
          WHERE a.ID_ALIAS = :idAlias`,
        {
          replacements: { idAlias: stockLocalizacion.idAlias },
          type: sequelizeAjenos.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (!stockLocalizacion.capacidadMaxima || 
          (stockLocalizacion.capacidadMaxima > 0 && 
           stockLocalizacion.capacidadMaxima <= LIMITE_STOCK_CAPACIDAD_MAXIMA) ||
          (aliasInfo && aliasInfo.ID_TIPO_ALIAS === 4)) {
        stockLocalizacionesToUpdate.push(stockLocalizacion);
      }
    }
    
    if (stockLocalizacionesToUpdate.length === 0) {
      await transaction.commit();
      return { updated: 0 };
    }
    
    const usuario = 'SYSTEM';
    const fechaActual = new Date();
    
    let updateCount = 0;
    
    for (const stock of stockLocalizacionesToUpdate) {
      const [stockEntity] = await sequelizeAjenos.query(
        `SELECT * FROM AJENOS.STOCK_LOCALIZACION 
          WHERE ID_ALIAS = :idAlias AND ID_LOCALIZACION_COMPRA = :idLocalizacionCompra`,
        {
          replacements: {
            idAlias: stock.idAlias,
            idLocalizacionCompra: stock.idLocalizacionCompra
          },
          type: sequelizeAjenos.QueryTypes.SELECT,
          transaction
        }
      );
      
      if (stockEntity) {
        await sequelizeAjenos.query(
          `UPDATE AJENOS.STOCK_LOCALIZACION
            SET STOCK_RECUENTOS = :stockRecuentos,
              STOCK_RECUENTOS_VALIDADOS_BULTOS = :stockRecuentosValidadoBultos,
              FECHA_HORA_EJECUCION_STOCK_RECUENTOS = :fechaHoraEjecucionStockRecuentos,
              CAPACIDAD_MAXIMA = :capacidadMaxima,
              CAPACIDAD_MAXIMA_VALIDADA_BULTOS = :capacidadMaximaValidadaBultos,
              FECHA_MODIFICACION = :fechaModificacion,
              USUARIO_MODIFICACION = :usuarioModificacion
            WHERE ID_ALIAS = :idAlias AND ID_LOCALIZACION_COMPRA = :idLocalizacionCompra`,
          {
            replacements: {
              stockRecuentos: stock.stockRecuentos,
              stockRecuentosValidadoBultos: stock.stockRecuentosValidadoBultos,
              fechaHoraEjecucionStockRecuentos: stock.fechaHoraEjecucionStockRecuentos,
              capacidadMaxima: stock.capacidadMaxima <= LIMITE_STOCK_CAPACIDAD_MAXIMA ? stock.capacidadMaxima : null,
              capacidadMaximaValidadaBultos: stock.capacidadMaximaValidadaBultos,
              fechaModificacion: fechaActual,
              usuarioModificacion: usuario,
              idAlias: stock.idAlias,
              idLocalizacionCompra: stock.idLocalizacionCompra
            },
            type: sequelizeAjenos.QueryTypes.UPDATE,
            transaction
          }
        );
      } else {
        await sequelizeAjenos.query(
          `INSERT INTO AJENOS.STOCK_LOCALIZACION (
            ID_ALIAS, 
            ID_LOCALIZACION_COMPRA, 
            STOCK_RECUENTOS, 
            STOCK_RECUENTOS_VALIDADOS_BULTOS,
            FECHA_HORA_EJECUCION_STOCK_RECUENTOS,
            CAPACIDAD_MAXIMA,
            CAPACIDAD_MAXIMA_VALIDADA_BULTOS,
            FECHA_ALTA,
            USUARIO_ALTA
          ) VALUES (
            :idAlias,
            :idLocalizacionCompra,
            :stockRecuentos,
            :stockRecuentosValidadoBultos,
            :fechaHoraEjecucionStockRecuentos,
            :capacidadMaxima,
            :capacidadMaximaValidadaBultos,
            :fechaAlta,
            :usuarioAlta
          )`,
          {
            replacements: {
              idAlias: stock.idAlias,
              idLocalizacionCompra: stock.idLocalizacionCompra,
              stockRecuentos: stock.stockRecuentos,
              stockRecuentosValidadoBultos: stock.stockRecuentosValidadoBultos,
              fechaHoraEjecucionStockRecuentos: stock.fechaHoraEjecucionStockRecuentos,
              capacidadMaxima: stock.capacidadMaxima <= LIMITE_STOCK_CAPACIDAD_MAXIMA ? stock.capacidadMaxima : null,
              capacidadMaximaValidadaBultos: stock.capacidadMaximaValidadaBultos,
              fechaAlta: fechaActual,
              usuarioAlta: usuario
            },
            type: sequelizeAjenos.QueryTypes.INSERT,
            transaction
          }
        );
      }
      
      updateCount++;
    }
    
    await transaction.commit();
    
    return {
      updated: updateCount
    };
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error en updateStock:', error);
    throw error;
  }
};