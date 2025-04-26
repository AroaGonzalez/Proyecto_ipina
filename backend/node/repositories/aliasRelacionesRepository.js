// backend/node/repositories/aliasRelacionesRepository.js
const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');
const { QueryTypes } = require('sequelize');

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

exports.getUnidadesCompra = async () => {
  try {
    const query = `
      SELECT deg.ID_DEPARTAMENTO_EMPRESA_GRUPO as id, 
        deg.NOMBRE as descripcion
      FROM MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO deg
      WHERE deg.FECHA_BAJA IS NULL
      ORDER BY deg.NOMBRE
    `;

    const result = await sequelizeMaestros.query(query, {
      type: QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener unidades de compra:', error);
    return [];
  }
};

exports.getRelacionesUnidadesCompra = async () => {
  try {
    const query = `
      SELECT DISTINCT aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO as id, 
        ucg.NOMBRE as descripcion
      FROM AJENOS.ALIAS_AMBITO_APLANADO aaa
      INNER JOIN MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO ucg ON ucg.ID_DEPARTAMENTO_EMPRESA_GRUPO = aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO
      WHERE aaa.FECHA_BAJA IS NULL AND aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO IS NOT NULL
      ORDER BY ucg.NOMBRE
    `;

    const result = await sequelizeAjenos.query(query, {
      type: QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener unidades de compra para relaciones:', error);
    return [];
  }
};

exports.findRelacionesByFilter = async (filter = {}, idsAliasSelected = [], processAllAlias = false, aliasTableOriginalFilter = {}, pageInfo = { page: 0, size: 50 }) => {
  try {
    const mainQuery = `
      SELECT DISTINCT aam.ID_ALIAS as idAlias, 
        aaa.ID_LOCALIZACION_COMPRA as idLocalizacionCompra, 
        lc.DESCRIPCION as descripcionLocalizacionCompra,
        lc.ID_PAIS as idMercado, 
        mp.DESCRIPCION as descripcionMercado, 
        mp.PAIS_ISO as codigoIsoMercado, 
        aaa.ID_ALIAS_AMBITO as idAliasAmbito,
        aaa.ID_ALIAS_AMBITO_APLANADO as idAliasAmbitoAplanado, 
        c.NOMBRE_CORTO as descripcionCortaCadena,
        aaa.ID_AJENO_SECCION_GLOBAL as idAjenoSeccionGlobal, 
        aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        telr.DESCRIPCION as descripcionTipoEstadoLocalizacionRam, 
        aaa.ES_SOLICITABLE as esSolicitable,
        deg.ID_DEPARTAMENTO_EMPRESA_GRUPO as idUnidadComprasGestora, 
        deg.NOMBRE as nombreUnidadComprasGestora,
        aaa.FECHA_HORA_FIN_PAUSA as fechaHoraFinPausa
      FROM AJENOS.ALIAS_AMBITO_APLANADO aaa
      INNER JOIN AJENOS.ALIAS_AMBITO aam ON aam.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aam.ID_ALIAS
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON aaa.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
      INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM telr ON telr.ID_TIPO_ESTADO_LOCALIZACION_RAM
        = aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = aam.ID_ALIAS
      LEFT JOIN MAESTROS.PAIS mp ON lc.ID_PAIS = mp.ID_PAIS
      LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      LEFT JOIN MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO deg ON
        deg.ID_DEPARTAMENTO_EMPRESA_GRUPO = aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO
      WHERE aaa.FECHA_BAJA IS NULL
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT aaa.ID_ALIAS_AMBITO_APLANADO) as total
      FROM AJENOS.ALIAS_AMBITO_APLANADO aaa
      INNER JOIN AJENOS.ALIAS_AMBITO aam ON aam.ID_ALIAS_AMBITO = aaa.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aam.ID_ALIAS
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON aaa.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
      INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM telr ON telr.ID_TIPO_ESTADO_LOCALIZACION_RAM
        = aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = aam.ID_ALIAS
      LEFT JOIN MAESTROS.PAIS mp ON lc.ID_PAIS = mp.ID_PAIS
      LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      LEFT JOIN MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO deg ON
        deg.ID_DEPARTAMENTO_EMPRESA_GRUPO = aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO
      WHERE aaa.FECHA_BAJA IS NULL
    `;
    
    const ajenosQuery = `
      SELECT DISTINCT aam.ID_ALIAS as idAlias, 
        aj.ID_AJENO as idAjeno, 
        aji.NOMBRE as nombre,
        mea.ID_TIPO_ESTADO_ACTUAL as idTipoEstadoCompras, 
        tei.DESCRIPCION as descripcion,
        aa.ID_TIPO_ESTADO_AJENO_RAM as idTipoEstadoAjenoRam,
        teari.DESCRIPCION as descriptionEstadoRam
      FROM AJENOS.ALIAS_AMBITO aam
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = aam.ID_ALIAS
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON teari.ID_TIPO_ESTADO_AJENO_RAM = aa.ID_TIPO_ESTADO_AJENO_RAM 
        AND teari.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.AJENO aj ON aj.ID_AJENO = aa.ID_AJENO
      INNER JOIN AJENOS.AJENO_IDIOMA aji ON aji.ID_AJENO = aj.ID_AJENO AND aji.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = aj.ID_MAQUINA_ESTADO_AJENOS
      INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON tei.ID_TIPO_ESTADO = mea.ID_TIPO_ESTADO_ACTUAL AND tei.ID_IDIOMA = :idIdioma
      WHERE aam.ID_ALIAS IN (:idsAlias) AND aa.FECHA_BAJA IS NULL
    `;
    
    // Build where clause based on filters
    let whereClause = "";
    const replacements = { 
      idIdioma: filter.idIdioma || 1,
      limit: pageInfo.size || 50,
      offset: (pageInfo.page || 0) * (pageInfo.size || 50)
    };
    
    // First, handle alias IDs selection
    if (!processAllAlias && idsAliasSelected && idsAliasSelected.length > 0) {
      whereClause += " AND aam.ID_ALIAS IN (:idsAliasSelected)";
      replacements.idsAliasSelected = idsAliasSelected;
    } else if (processAllAlias && idsAliasSelected && idsAliasSelected.length > 0) {
      // Si processAllAlias es true y hay IDs seleccionados, excluir estos IDs
      whereClause += " AND aam.ID_ALIAS NOT IN (:idsAliasSelected)";
      replacements.idsAliasSelected = idsAliasSelected;
    }
    
    // Handle other filters
    if (filter.idsAlias && filter.idsAlias.length > 0) {
      whereClause += " AND aam.ID_ALIAS IN (:idsAlias)";
      replacements.idsAlias = filter.idsAlias;
    }
    
    if (filter.idsMercado && filter.idsMercado.length > 0) {
      whereClause += " AND mp.ID_PAIS IN (:idsMercado)";
      replacements.idsMercado = filter.idsMercado;
    }
    
    if (filter.idsCadena && filter.idsCadena.length > 0) {
      whereClause += " AND c.ID_CADENA IN (:idsCadena)";
      replacements.idsCadena = filter.idsCadena;
    }
    
    if (filter.idsLocalizacion && filter.idsLocalizacion.length > 0) {
      whereClause += " AND aaa.ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)";
      replacements.idsLocalizacion = filter.idsLocalizacion;
    }
    
    if (filter.idsUnidadComprasGestora && filter.idsUnidadComprasGestora.length > 0) {
      whereClause += " AND (";
      
      // Handle the special case where we want to include rows with NULL departamento
      if (filter.idsUnidadComprasGestora.includes(0)) {
        whereClause += "deg.ID_DEPARTAMENTO_EMPRESA_GRUPO IS NULL";
        
        if (filter.idsUnidadComprasGestora.some(id => id !== 0)) {
          whereClause += " OR ";
        }
      }
      
      // Add the non-zero IDs
      const nonZeroIds = filter.idsUnidadComprasGestora.filter(id => id !== 0);
      if (nonZeroIds.length > 0) {
        whereClause += "deg.ID_DEPARTAMENTO_EMPRESA_GRUPO IN (:idsUnidadComprasGestora)";
        replacements.idsUnidadComprasGestora = nonZeroIds;
      }
      
      whereClause += ")";
    }
    
    // Si processAllAlias es true, aplicar filtros adicionales del aliasTableOriginalFilter
    if (processAllAlias && aliasTableOriginalFilter) {
      // Aquí aplicaríamos los filtros originales de la tabla de alias
      // (Este es un ejemplo simplificado, deberías adaptarlo según tus necesidades)
      if (aliasTableOriginalFilter.tipoAlias) {
        whereClause += " AND a.ID_TIPO_ALIAS IN (:tipoAlias)";
        replacements.tipoAlias = aliasTableOriginalFilter.tipoAlias;
      }
      
      if (aliasTableOriginalFilter.estadoAlias) {
        whereClause += " AND a.ID_TIPO_ESTADO_ALIAS IN (:estadoAlias)";
        replacements.estadoAlias = aliasTableOriginalFilter.estadoAlias;
      }
      
      if (aliasTableOriginalFilter.estacionalidad) {
        whereClause += " AND a.ID_TIPO_ESTACIONALIDAD IN (:estacionalidad)";
        replacements.estacionalidad = aliasTableOriginalFilter.estacionalidad;
      }
    }
    
    // Append where clause to queries
    const finalMainQuery = mainQuery + whereClause + " ORDER BY aaa.ID_LOCALIZACION_COMPRA DESC LIMIT :limit OFFSET :offset";
    const finalCountQuery = countQuery + whereClause;
    
    // Add idsAlias for ajenos query
    replacements.idsAlias = idsAliasSelected;
    
    // Execute the queries
    const [relaciones, countResult, ajenos] = await Promise.all([
      sequelizeAjenos.query(finalMainQuery, {
        replacements,
        type: QueryTypes.SELECT
      }),
      sequelizeAjenos.query(finalCountQuery, {
        replacements,
        type: QueryTypes.SELECT
      }),
      sequelizeAjenos.query(ajenosQuery, {
        replacements,
        type: QueryTypes.SELECT
      })
    ]);
    
    // Transform ajenos data
    const ajenosByAlias = {};
    ajenos.forEach(ajeno => {
      if (!ajenosByAlias[ajeno.idAlias]) {
        ajenosByAlias[ajeno.idAlias] = {
          idAlias: ajeno.idAlias,
          dataAjenos: []
        };
      }
      
      ajenosByAlias[ajeno.idAlias].dataAjenos.push({
        idAjeno: ajeno.idAjeno,
        nombre: fixEncoding(ajeno.nombre),
        tipoEstadoCompras: {
          id: ajeno.idTipoEstadoCompras,
          descripcion: fixEncoding(ajeno.descripcion)
        },
        tipoEstadoRam: {
          id: ajeno.idTipoEstadoAjenoRam,
          descripcion: fixEncoding(ajeno.descriptionEstadoRam)
        }
      });
    });
    
    // Process relations data
    const processedRelaciones = relaciones.map(item => ({
      idAlias: item.idAlias,
      idLocalizacionCompra: item.idLocalizacionCompra,
      descripcionLocalizacionCompra: fixEncoding(item.descripcionLocalizacionCompra),
      idMercado: item.idMercado,
      descripcionMercado: fixEncoding(item.descripcionMercado),
      codigoIsoMercado: item.codigoIsoMercado,
      idTipoEstadoLocalizacionRam: item.idTipoEstadoLocalizacionRam,
      descripcionTipoEstadoLocalizacionRam: fixEncoding(item.descripcionTipoEstadoLocalizacionRam),
      idAliasAmbito: item.idAliasAmbito,
      idAliasAmbitoAplanado: item.idAliasAmbitoAplanado,
      esSolicitable: item.esSolicitable === 1 || item.esSolicitable === true,
      descripcionCortaCadena: fixEncoding(item.descripcionCortaCadena),
      idAjenoSeccionGlobal: item.idAjenoSeccionGlobal || 0,
      idUnidadComprasGestora: item.idUnidadComprasGestora || 0,
      nombreUnidadComprasGestora: item.nombreUnidadComprasGestora ? fixEncoding(item.nombreUnidadComprasGestora) : null,
      fechaHoraFinPausa: item.fechaHoraFinPausa ? new Date(item.fechaHoraFinPausa).toISOString() : null
    }));
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    
    return {
      relaciones: processedRelaciones,
      ajenos: Object.values(ajenosByAlias),
      page: {
        number: pageInfo.page || 0,
        size: pageInfo.size || 50,
        total: totalElements
      }
    };
  } catch (error) {
    console.error('Error en findRelacionesByFilter:', error);
    throw error;
  }
};