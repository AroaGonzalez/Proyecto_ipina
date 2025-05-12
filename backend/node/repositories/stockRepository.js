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

exports.findStocksByFilter = async (stockFilter) => {
  try {
    const cacheKey = `stocks_${JSON.stringify(stockFilter)}`;
    const cachedResult = cache.get(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    let searchQuery = `
      SELECT DISTINCT slr.ID_ALIAS AS idAlias,
        ai.NOMBRE AS nombreAlias,
        CAST(CEIL(slr.STOCK_TEORICO / COALESCE(ar.UNIDADES_EMPAQUETADO * 1.0, 1)) AS SIGNED) AS stockTeorico,
        slr.STOCK_RECUENTOS_VALIDADO_BULTOS AS stockRecuentos,
        slr.CAPACIDAD_MAXIMA_VALIDADA_BULTOS AS capacidadMaxima,
        slr.STOCK_MINIMO_BULTOS AS stockMinimo,
        slr.STOCK_MAXIMO AS stockMaximo,
        slr.ID_LOCALIZACION_COMPRA AS idLocalizacionCompra,
        lc.DESCRIPCION AS descripcionLocalizacionCompra,
        p.ID_PAIS AS idPais,
        pi.DESCRIPCION AS descripcionPais,
        p.PAIS_ISO AS codigoIsoPais,
        c.ID_CADENA AS idCadena,
        c.NOMBRE AS nombreCadena,
        slr.FECHA_HORA_EJECUCION_STOCK_RECUENTOS AS fechaRecuento,
        slr.FECHA_MODIFICACION AS fechaModificacion,
        slr.USUARIO_MODIFICACION AS usuarioModificacion,
        slr.FECHA_HORA_EJECUCION_STOCK_TEORICO AS fechaHoraEjecucionStockTeorico,
        aaa.ID_AJENO_SECCION_GLOBAL AS relacionAliasLocalizacion,
        a.ID_TIPO_ALIAS AS idTipoAlias,
        slr.FECHA_ALTA AS fechaAlta,
        a.ID_TIPO_ESTADO_ALIAS,
        teai.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_ALIAS,
        ar.ID_TIPO_ESTADO_AJENO_RAM,
        teari.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_AJENO_RAM,
        tei.ID_TIPO_ESTADO AS ID_TIPO_ESTADO_AJENO_COMPRAS,
        tei.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_AJENO_COMPRAS,
        aaj.ID_TIPO_ESTADO_AJENO_RAM AS ID_TIPO_ESTADO_ALIAS_AJENO,
        teari2.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO,
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM AS ID_TIPO_ESTADO_RELACION,
        telri2.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_RELACION,
        lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM,
        telri.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_LOCALIZACION_RAM,
        et.ID_ESTADO_TIENDA AS ID_ESTADO_TIENDA_MTU,
        eti.DESCRIPCION AS ESTADO_TIENDA_MTU
      FROM AJENOS.STOCK_LOCALIZACION_RAM slr
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = slr.ID_ALIAS
        INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS
        AND teai.ID_IDIOMA = :idIdioma
        INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
        INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
        LEFT JOIN (SELECT ID_ALIAS_AMBITO, ID_LOCALIZACION_COMPRA, MAX(ID_AJENO_SECCION_GLOBAL) AS ID_AJENO_SECCION_GLOBAL,
        ID_TIPO_ESTADO_LOCALIZACION_RAM
        FROM AJENOS.ALIAS_AMBITO_APLANADO
        GROUP BY ID_ALIAS_AMBITO, ID_LOCALIZACION_COMPRA, ID_TIPO_ESTADO_LOCALIZACION_RAM) aaa ON
        aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.ID_LOCALIZACION_COMPRA = slr.ID_LOCALIZACION_COMPRA
        INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = slr.ID_LOCALIZACION_COMPRA
        INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lcr.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
        INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telri ON
        telri.ID_TIPO_ESTADO_LOCALIZACION_RAM = lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM AND telri.ID_IDIOMA = :idIdioma
        INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telri2 ON
        telri2.ID_TIPO_ESTADO_LOCALIZACION_RAM = aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM AND telri2.ID_IDIOMA = :idIdioma
        INNER JOIN MAESTROS.PAIS p ON p.ID_PAIS = lc.ID_PAIS
        INNER JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
        INNER JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
        LEFT JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION_COMPRA
        LEFT JOIN MAESTROS.TIENDA_HISTORICO th ON th.ID_TIENDA = t.ID_TIENDA AND th.ESTADO_VIGENTE = 1
        LEFT JOIN MAESTROS.ESTADO_TIENDA et ON et.ID_ESTADO_TIENDA = th.ID_ESTADO_TIENDA
        LEFT JOIN MAESTROS.ESTADO_TIENDA_IDIOMA eti ON eti.ID_ESTADO_TIENDA = et.ID_ESTADO_TIENDA AND eti.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
        LEFT JOIN AJENOS.ALIAS_AJENO aaj ON aaj.ID_AJENO = ar.ID_AJENO AND aaj.ID_ALIAS = slr.ID_ALIAS
        LEFT JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON teari.ID_TIPO_ESTADO_AJENO_RAM = ar.ID_TIPO_ESTADO_AJENO_RAM
        AND teari.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari2 ON teari2.ID_TIPO_ESTADO_AJENO_RAM = aaj.ID_TIPO_ESTADO_AJENO_RAM
        AND teari2.ID_IDIOMA = :idIdioma
        LEFT JOIN AJENOS.AJENO aj ON aj.ID_AJENO = ar.ID_AJENO
        LEFT JOIN AJENOS.MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = aj.ID_MAQUINA_ESTADO_AJENOS
        LEFT JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON mea.ID_TIPO_ESTADO_ACTUAL = tei.ID_TIPO_ESTADO AND tei.ID_IDIOMA = :idIdioma
        WHERE slr.FECHA_BAJA IS NULL
    `;
    
    let countQuery = `
      SELECT COUNT(slr.ID_ALIAS)
        FROM AJENOS.STOCK_LOCALIZACION_RAM slr
        INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = slr.ID_ALIAS
        INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = a.ID_ALIAS
        LEFT JOIN (
          SELECT ID_ALIAS_AMBITO, ID_LOCALIZACION_COMPRA, MAX(ID_AJENO_SECCION_GLOBAL) AS ID_AJENO_SECCION_GLOBAL,
          ID_TIPO_ESTADO_LOCALIZACION_RAM
          FROM AJENOS.ALIAS_AMBITO_APLANADO
          GROUP BY ID_ALIAS_AMBITO, ID_LOCALIZACION_COMPRA, ID_TIPO_ESTADO_LOCALIZACION_RAM
        ) aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.ID_LOCALIZACION_COMPRA = slr.ID_LOCALIZACION_COMPRA
        INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = slr.ID_LOCALIZACION_COMPRA
        INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lcr.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
        INNER JOIN MAESTROS.PAIS p ON p.ID_PAIS = lc.ID_PAIS
        INNER JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
        LEFT JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION_COMPRA
        LEFT JOIN MAESTROS.TIENDA_HISTORICO th ON th.ID_TIENDA = t.ID_TIENDA AND th.ESTADO_VIGENTE = 1
        LEFT JOIN MAESTROS.ESTADO_TIENDA et ON et.ID_ESTADO_TIENDA = th.ID_ESTADO_TIENDA
        LEFT JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
        LEFT JOIN AJENOS.ALIAS_AJENO aaj ON aaj.ID_AJENO = ar.ID_AJENO AND aaj.ID_ALIAS = slr.ID_ALIAS
        LEFT JOIN AJENOS.AJENO aj ON aj.ID_AJENO = ar.ID_AJENO
        WHERE slr.FECHA_BAJA IS NULL
    `;
    
    if (stockFilter.allExecutionsAllowed) {
      searchQuery += " AND ar.ID_TIPO_ESTADO_AJENO_RAM = 1 ";
      searchQuery += " AND a.ID_TIPO_ESTADO_ALIAS != 3 ";
      searchQuery += " AND lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 ";
      searchQuery += " AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 ";
      searchQuery += " AND aaj.ID_TIPO_ESTADO_AJENO_RAM = 1 ";
      searchQuery += " AND et.ID_ESTADO_TIENDA = 3 ";
      searchQuery += " AND aaa.ID_AJENO_SECCION_GLOBAL IS NOT NULL ";
      
      countQuery += " AND ar.ID_TIPO_ESTADO_AJENO_RAM = 1 ";
      countQuery += " AND a.ID_TIPO_ESTADO_ALIAS != 3 ";
      countQuery += " AND lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 ";
      countQuery += " AND aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM = 1 ";
      countQuery += " AND aaj.ID_TIPO_ESTADO_AJENO_RAM = 1 ";
      countQuery += " AND et.ID_ESTADO_TIENDA = 3 ";
      countQuery += " AND aaa.ID_AJENO_SECCION_GLOBAL IS NOT NULL ";
    }
    
    if (stockFilter.idsTipoAlias && stockFilter.idsTipoAlias.length > 0) {
      searchQuery += ` AND a.ID_TIPO_ALIAS IN (${stockFilter.idsTipoAlias.join(',')}) `;
      countQuery += ` AND a.ID_TIPO_ALIAS IN (${stockFilter.idsTipoAlias.join(',')}) `;
    }
    
    if (stockFilter.idsAlias && stockFilter.idsAlias.length > 0) {
      searchQuery += ` AND slr.ID_ALIAS IN (${stockFilter.idsAlias.join(',')}) `;
      countQuery += ` AND slr.ID_ALIAS IN (${stockFilter.idsAlias.join(',')}) `;
    }
    
    if (stockFilter.idsLocalizacion && stockFilter.idsLocalizacion.length > 0) {
      searchQuery += ` AND slr.ID_LOCALIZACION_COMPRA IN (${stockFilter.idsLocalizacion.join(',')}) `;
      countQuery += ` AND slr.ID_LOCALIZACION_COMPRA IN (${stockFilter.idsLocalizacion.join(',')}) `;
    }
    
    if (stockFilter.idsMercado && stockFilter.idsMercado.length > 0) {
      searchQuery += ` AND p.ID_PAIS IN (${stockFilter.idsMercado.join(',')}) `;
      countQuery += ` AND p.ID_PAIS IN (${stockFilter.idsMercado.join(',')}) `;
    }
    
    if (stockFilter.idsGrupoCadena && stockFilter.idsGrupoCadena.length > 0) {
      searchQuery += ` AND lcr.ID_GRUPO_CADENA IN (${stockFilter.idsGrupoCadena.join(',')}) `;
      countQuery += ` AND lcr.ID_GRUPO_CADENA IN (${stockFilter.idsGrupoCadena.join(',')}) `;
    }
    
    if (stockFilter.idsCadena && stockFilter.idsCadena.length > 0) {
      searchQuery += ` AND lc.ID_CADENA IN (${stockFilter.idsCadena.join(',')}) `;
      countQuery += ` AND lc.ID_CADENA IN (${stockFilter.idsCadena.join(',')}) `;
    }
    
    searchQuery += ` ORDER BY idAlias, idLocalizacionCompra LIMIT ${stockFilter.limit} OFFSET ${stockFilter.offset * stockFilter.limit}`;

    const [countResult, results] = await Promise.all([
      sequelizeAjenos.query(countQuery, {
        replacements: { idIdioma: stockFilter.idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT,
        plain: true
      }),
      
      sequelizeAjenos.query(searchQuery, {
        replacements: { idIdioma: stockFilter.idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      })
    ]);
    
    const totalElements = parseInt(countResult ? Object.values(countResult)[0] : 0);
    
    const processedStocks = results.map(stock => ({
      idAlias: stock.idAlias,
      nombreAlias: fixEncoding(stock.nombreAlias),
      idTipoAlias: stock.idTipoAlias,
      
      stockTeorico: stock.stockTeorico,
      stockRecuentos: stock.stockRecuentos,
      capacidadMaxima: stock.capacidadMaxima,
      stockMinimo: stock.stockMinimo,
      stockMaximo: stock.stockMaximo,
      idLocalizacionCompra: stock.idLocalizacionCompra,
      descripcionLocalizacionCompra: fixEncoding(stock.descripcionLocalizacionCompra),
      idPais: stock.idPais,
      descripcionPais: fixEncoding(stock.descripcionPais),
      codigoIsoPais: stock.codigoIsoPais,
      
      idCadena: stock.idCadena,
      nombreCadena: fixEncoding(stock.nombreCadena),
      
      fechaRecuento: stock.fechaRecuento,
      fechaModificacion: stock.fechaModificacion,
      fechaHoraEjecucionStockTeorico: stock.fechaHoraEjecucionStockTeorico,
      fechaAlta: stock.fechaAlta,
      usuarioModificacion: stock.usuarioModificacion,
      relacionAliasLocalizacion: stock.relacionAliasLocalizacion,
      idTipoEstadoAlias: stock.ID_TIPO_ESTADO_ALIAS,
      descripcionTipoEstadoAlias: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_ALIAS),
      idTipoEstadoAjenoRam: stock.ID_TIPO_ESTADO_AJENO_RAM,
      descripcionTipoEstadoAjenoRam: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_AJENO_RAM),
      idTipoEstadoAjenoCompras: stock.ID_TIPO_ESTADO_AJENO_COMPRAS,
      descripcionTipoEstadoAjenoCompras: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_AJENO_COMPRAS),
      idTipoEstadoAliasAjeno: stock.ID_TIPO_ESTADO_ALIAS_AJENO,
      descripcionTipoEstadoAliasAjeno: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO),
      idTipoEstadoRelacion: stock.ID_TIPO_ESTADO_RELACION,
      descripcionTipoEstadoRelacion: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_RELACION),
      idTipoEstadoLocalizacionRam: stock.ID_TIPO_ESTADO_LOCALIZACION_RAM,
      descripcionTipoEstadoLocalizacionRam: fixEncoding(stock.DESCRIPCION_TIPO_ESTADO_LOCALIZACION_RAM),
      idEstadoTiendaMtu: stock.ID_ESTADO_TIENDA_MTU,
      estadoTiendaMtu: fixEncoding(stock.ESTADO_TIENDA_MTU)
    }));
    
    const result = {
      content: processedStocks,
      totalElements,
      offset: stockFilter.offset,
      limit: stockFilter.limit
    };
    
    cache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error en findStocksByFilter:', error);
    throw error;
  }
};

exports.updateStocks = async (stocks, usuarioModificacion, fechaModificacion) => {
  try {
    let updatedCount = 0;
    
    for (const stock of stocks) {
      const currentStockQuery = `
        SELECT 
          slr.STOCK_RECUENTOS,
          slr.STOCK_MINIMO,
          slr.STOCK_MAXIMO,
          slr.CAPACIDAD_MAXIMA,
          slr.STOCK_RECUENTOS_VALIDADO_BULTOS,
          slr.STOCK_MINIMO_BULTOS,
          slr.CAPACIDAD_MAXIMA_VALIDADA_BULTOS,
          COALESCE(ar.UNIDADES_EMPAQUETADO, 1) as unidadesEmpaquetado
        FROM AJENOS.STOCK_LOCALIZACION_RAM slr
        LEFT JOIN (
          SELECT aaa.ID_AJENO_SECCION_GLOBAL, aa.ID_ALIAS_AMBITO
          FROM AJENOS.ALIAS_AMBITO aa
          LEFT JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa 
            ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
            AND aaa.ID_LOCALIZACION_COMPRA = :idLocalizacionCompra
          WHERE aa.ID_ALIAS = :idAlias
          LIMIT 1
        ) alias_data ON 1=1
        LEFT JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = alias_data.ID_AJENO_SECCION_GLOBAL
        WHERE slr.ID_ALIAS = :idAlias 
          AND slr.ID_LOCALIZACION_COMPRA = :idLocalizacionCompra
          AND slr.FECHA_BAJA IS NULL
      `;
      
      const [currentStock] = await sequelizeAjenos.query(currentStockQuery, {
        replacements: {
          idAlias: stock.idAlias,
          idLocalizacionCompra: stock.idLocalizacionCompra
        },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      if (!currentStock) {
        continue;
      }
      
      const unidadesEmpaquetado = currentStock.unidadesEmpaquetado || 1;
      
      const stockRecuentosUnidades = stock.stockRecuentos !== null && stock.stockRecuentos !== undefined
        ? stock.stockRecuentos * unidadesEmpaquetado
        : currentStock.STOCK_RECUENTOS;
        
      const stockMinimoUnidades = stock.stockMinimo !== null && stock.stockMinimo !== undefined
        ? stock.stockMinimo * unidadesEmpaquetado
        : currentStock.STOCK_MINIMO;
        
      const capacidadMaximaUnidades = stock.capacidadMaxima !== null && stock.capacidadMaxima !== undefined
        ? stock.capacidadMaxima * unidadesEmpaquetado
        : currentStock.CAPACIDAD_MAXIMA;
      
      const updateQuery = `
        UPDATE AJENOS.STOCK_LOCALIZACION_RAM 
        SET 
          STOCK_RECUENTOS = :stockRecuentosUnidades,
          STOCK_MINIMO = :stockMinimoUnidades,
          STOCK_MAXIMO = :stockMaximo,
          CAPACIDAD_MAXIMA = :capacidadMaximaUnidades,
          USUARIO_MODIFICACION = :usuarioModificacion,
          STOCK_RECUENTOS_VALIDADO_BULTOS = :stockRecuentos,
          STOCK_MINIMO_BULTOS = :stockMinimo,
          CAPACIDAD_MAXIMA_VALIDADA_BULTOS = :capacidadMaxima,
          FECHA_MODIFICACION = :fechaModificacion,
          FECHA_HORA_EJECUCION_STOCK_RECUENTOS = 
            CASE WHEN :fechaEjecucionRecuentos IS NOT NULL 
            THEN :fechaEjecucionRecuentos 
            ELSE FECHA_HORA_EJECUCION_STOCK_RECUENTOS END
        WHERE ID_ALIAS = :idAlias 
          AND ID_LOCALIZACION_COMPRA = :idLocalizacionCompra
      `;
      
      const result = await sequelizeAjenos.query(updateQuery, {
        replacements: {
          stockRecuentosUnidades: stockRecuentosUnidades,
          stockMinimoUnidades: stockMinimoUnidades,
          stockMaximo: stock.stockMaximo !== null && stock.stockMaximo !== undefined 
            ? stock.stockMaximo 
            : currentStock.STOCK_MAXIMO,
          capacidadMaximaUnidades: capacidadMaximaUnidades,
          usuarioModificacion: usuarioModificacion,
          stockRecuentos: stock.stockRecuentos !== null && stock.stockRecuentos !== undefined
            ? stock.stockRecuentos
            : currentStock.STOCK_RECUENTOS_VALIDADO_BULTOS,
          stockMinimo: stock.stockMinimo !== null && stock.stockMinimo !== undefined
            ? stock.stockMinimo
            : currentStock.STOCK_MINIMO_BULTOS,
          capacidadMaxima: stock.capacidadMaxima !== null && stock.capacidadMaxima !== undefined
            ? stock.capacidadMaxima
            : currentStock.CAPACIDAD_MAXIMA_VALIDADA_BULTOS,
          fechaModificacion: fechaModificacion,
          fechaEjecucionRecuentos: stock.fechaEjecucionRecuentosActualizada || null,
          idAlias: stock.idAlias,
          idLocalizacionCompra: stock.idLocalizacionCompra
        },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      if (result[1] > 0) {
        updatedCount++;
      }
    }
    
    cache.clear('stocks_');
    
    return { updatedCount };
  } catch (error) {
    console.error('Error en updateStocks:', error);
    throw error;
  }
};