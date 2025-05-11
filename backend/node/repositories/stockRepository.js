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
      slr.ID_LOCALIZACION_COMPRA AS idLocalizacion,
      lc.DESCRIPCION AS nombreLocalizacion,
      p.ID_PAIS AS idMercado,
      pi.DESCRIPCION AS nombreMercado,
      p.PAIS_ISO AS codigoIsoMercado,
      c.ID_CADENA AS idCadena,
      c.NOMBRE AS nombreCadena,
      slr.FECHA_HORA_EJECUCION_STOCK_RECUENTOS AS fechaActualizacion,
      slr.FECHA_MODIFICACION AS fechaModificacion,
      slr.USUARIO_MODIFICACION AS usuarioModificacion,
      a.ID_TIPO_ALIAS AS idTipoAlias,
      ta.DESCRIPCION AS tipoAlias,
      lcr.ID_GRUPO_CADENA AS idGrupoCadena,
      gc.DESCRIPCION AS nombreGrupoCadena
      FROM AJENOS.STOCK_LOCALIZACION_RAM slr
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = slr.ID_ALIAS
      INNER JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS
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
      INNER JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = lcr.ID_GRUPO_CADENA
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
      LEFT JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aaa.ID_AJENO_SECCION_GLOBAL
      LEFT JOIN AJENOS.ALIAS_AJENO aaj ON aaj.ID_AJENO = ar.ID_AJENO AND aaj.ID_ALIAS = slr.ID_ALIAS
      LEFT JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON teari.ID_TIPO_ESTADO_AJENO_RAM = ar.ID_TIPO_ESTADO_AJENO_RAM
        AND teari.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari2 ON teari2.ID_TIPO_ESTADO_AJENO_RAM = aaj.ID_TIPO_ESTADO_AJENO_RAM
        AND teari2.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.AJENO aj ON aj.ID_AJENO = ar.ID_AJENO
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
    
    searchQuery += ` ORDER BY idAlias, idLocalizacion LIMIT ${stockFilter.limit} OFFSET ${stockFilter.offset * stockFilter.limit}`;

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
      stockTeorico: stock.stockTeorico,
      stockRecuentos: stock.stockRecuentos,
      capacidadMaxima: stock.capacidadMaxima,
      stockMinimo: stock.stockMinimo,
      stockMaximo: stock.stockMaximo,
      idLocalizacion: stock.idLocalizacion,
      nombreLocalizacion: fixEncoding(stock.nombreLocalizacion),
      idMercado: stock.idMercado,
      nombreMercado: fixEncoding(stock.nombreMercado),
      codigoIsoMercado: stock.codigoIsoMercado,
      idCadena: stock.idCadena,
      nombreCadena: fixEncoding(stock.nombreCadena),
      idGrupoCadena: stock.idGrupoCadena,
      nombreGrupoCadena: fixEncoding(stock.nombreGrupoCadena),
      idTipoAlias: stock.idTipoAlias,
      tipoAlias: fixEncoding(stock.tipoAlias),
      fechaActualizacion: stock.fechaActualizacion
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