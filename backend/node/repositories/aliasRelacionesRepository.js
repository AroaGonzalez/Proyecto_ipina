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
      ORDER BY deg.ID_DEPARTAMENTO_EMPRESA_GRUPO
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
      ORDER BY aaa.ID_DEPARTAMENTO_EMPRESA_GRUPO
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
      INNER JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telr ON telr.ID_TIPO_ESTADO_LOCALIZACION_RAM
        = aaa.ID_TIPO_ESTADO_LOCALIZACION_RAM AND telr.ID_IDIOMA = :idIdioma
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
    
    const getAliasIdsForAjenos = () => {
      if (idsAliasSelected && idsAliasSelected.length > 0) {
        return idsAliasSelected;
      }
      
      if (filter.idsAlias && filter.idsAlias.length > 0) {
        return filter.idsAlias;
      }
      
      return [];
    };
    
    let whereClause = "";
    const replacements = { 
      idIdioma: filter.idIdioma,
      limit: pageInfo.size || 50,
      offset: (pageInfo.page || 0) * (pageInfo.size || 50)
    };
    
    if (idsAliasSelected && idsAliasSelected.length > 0) {
      if (!processAllAlias) {
        whereClause += " AND aam.ID_ALIAS IN (:idsAliasSelected)";
        replacements.idsAliasSelected = idsAliasSelected;
      } else {
        whereClause += " AND aam.ID_ALIAS NOT IN (:idsAliasSelected)";
        replacements.idsAliasSelected = idsAliasSelected;
      }
    }
    
    if (!idsAliasSelected.length && filter.idsAlias && filter.idsAlias.length > 0) {
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
      
      if (filter.idsUnidadComprasGestora.includes(0)) {
        whereClause += "deg.ID_DEPARTAMENTO_EMPRESA_GRUPO IS NULL";
        
        if (filter.idsUnidadComprasGestora.some(id => id !== 0)) {
          whereClause += " OR ";
        }
      }
      
      const nonZeroIds = filter.idsUnidadComprasGestora.filter(id => id !== 0);
      if (nonZeroIds.length > 0) {
        whereClause += "deg.ID_DEPARTAMENTO_EMPRESA_GRUPO IN (:idsUnidadComprasGestora)";
        replacements.idsUnidadComprasGestora = nonZeroIds;
      }
      
      whereClause += ")";
    }
    
    if (processAllAlias && aliasTableOriginalFilter) {
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
    
    const finalMainQuery = mainQuery + whereClause + " ORDER BY aaa.ID_LOCALIZACION_COMPRA DESC LIMIT :limit OFFSET :offset";
    const finalCountQuery = countQuery + whereClause;
    
    const aliasIdsForAjenos = getAliasIdsForAjenos();
    
    let ajenosPromise;
    if (aliasIdsForAjenos.length > 0) {
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
      
      const ajenosReplacements = { 
        idIdioma: filter.idIdioma || 1,
        idsAlias: aliasIdsForAjenos
      };
      
      ajenosPromise = sequelizeAjenos.query(ajenosQuery, {
        replacements: ajenosReplacements,
        type: QueryTypes.SELECT
      });
    } else {
      ajenosPromise = Promise.resolve([]);
    }
    
    const [relaciones, countResult, ajenos] = await Promise.all([
      sequelizeAjenos.query(finalMainQuery, {
        replacements,
        type: QueryTypes.SELECT
      }),
      sequelizeAjenos.query(finalCountQuery, {
        replacements,
        type: QueryTypes.SELECT
      }),
      ajenosPromise
    ]);
    
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

exports.activateRelaciones = async (relaciones, usuario) => {
  try {
    if (!relaciones || relaciones.length === 0) {
      return { success: false, message: 'No se proporcionaron relaciones para activar', updatedCount: 0 };
    }

    const idsAmbitoAplanado = relaciones.map(rel => rel.idAliasAmbitoAplanado);
    
    const query = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO
      SET ID_TIPO_ESTADO_LOCALIZACION_RAM = 1,
          FECHA_MODIFICACION = CURRENT_TIMESTAMP,
          USUARIO_MODIFICACION = :usuario,
          FECHA_HORA_FIN_PAUSA = NULL
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:idsAmbitoAplanado)
      AND FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idsAmbitoAplanado, usuario },
      type: QueryTypes.UPDATE
    });
    
    return {
      success: true,
      message: 'Relaciones activadas correctamente',
      updatedCount: result[1] || relaciones.length
    };
  } catch (error) {
    console.error('Error al activar relaciones:', error);
    throw new Error('Error al activar relaciones: ' + error.message);
  }
};

exports.pauseRelaciones = async (relaciones, fechaHoraFinPausa, usuario) => {
  try {
    if (!relaciones || relaciones.length === 0) {
      return { success: false, message: 'No se proporcionaron relaciones para pausar', updatedCount: 0 };
    }

    const idsAmbitoAplanado = relaciones.map(rel => rel.idAliasAmbitoAplanado);
    
    let formattedDate = null;
    if (fechaHoraFinPausa) {
      const date = new Date(fechaHoraFinPausa);
      formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    const query = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO
      SET ID_TIPO_ESTADO_LOCALIZACION_RAM = 2,
        FECHA_MODIFICACION = CURRENT_TIMESTAMP,
        USUARIO_MODIFICACION = :usuario,
        FECHA_HORA_FIN_PAUSA = :fechaHoraFinPausa
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:idsAmbitoAplanado)
        AND ID_TIPO_ESTADO_LOCALIZACION_RAM = 1
        AND FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idsAmbitoAplanado, 
        usuario,
        fechaHoraFinPausa: formattedDate
      },
      type: QueryTypes.UPDATE
    });
    
    return {
      success: true,
      message: 'Relaciones pausadas correctamente',
      updatedCount: result[1] || relaciones.length
    };
  } catch (error) {
    console.error('Error en pauseRelations:', error);
    throw new Error('Error al pausar relaciones: ' + error.message);
  }
};

exports.activateExpiredPauses = async () => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO
      SET ID_TIPO_ESTADO_LOCALIZACION_RAM = 1,
        FECHA_MODIFICACION = CURRENT_TIMESTAMP,
        USUARIO_MODIFICACION = 'SISTEMA',
        FECHA_HORA_FIN_PAUSA = NULL
      WHERE ID_TIPO_ESTADO_LOCALIZACION_RAM = 2
        AND FECHA_HORA_FIN_PAUSA IS NOT NULL
        AND DATE(FECHA_HORA_FIN_PAUSA) <= CURRENT_DATE()
        AND FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      type: QueryTypes.UPDATE
    });
    
    return {
      success: true,
      message: 'Relaciones con pausa expirada activadas correctamente',
      updatedCount: result[1] || 0
    };
  } catch (error) {
    console.error('Error al activar relaciones con pausa expirada:', error);
    throw error;
  }
};

exports.updateRelaciones = async (relaciones, usuario) => {
  try {
    if (!relaciones || relaciones.length === 0) {
      return { success: false, message: 'No se proporcionaron relaciones para actualizar', updatedCount: 0 };
    }

    const batchSize = 500;
    let updatedCount = 0;
    
    for (let i = 0; i < relaciones.length; i += batchSize) {
      const batch = relaciones.slice(i, i + batchSize);
      
      const queries = batch.map(relacion => {
        const idUnidadComprasGestora = relacion.idUnidadComprasGestora === 0 ? null : relacion.idUnidadComprasGestora;
        
        const updateFields = [];
        const replacements = {
          usuario,
          idAliasAmbitoAplanado: relacion.idAliasAmbitoAplanado
        };
        
        updateFields.push("FECHA_MODIFICACION = CURRENT_TIMESTAMP");
        updateFields.push("USUARIO_MODIFICACION = :usuario");
        
        if (relacion.idAjenoSeccionGlobal !== undefined) {
          updateFields.push("ID_AJENO_SECCION_GLOBAL = :idAjenoSeccionGlobal");
          replacements.idAjenoSeccionGlobal = relacion.idAjenoSeccionGlobal || 0;
        }
        
        if (relacion.esSolicitable !== undefined) {
          updateFields.push("ES_SOLICITABLE = :esSolicitable");
          replacements.esSolicitable = relacion.esSolicitable ? 1 : 0;
        }
        
        if (relacion.idUnidadComprasGestora !== undefined) {
          updateFields.push("ID_DEPARTAMENTO_EMPRESA_GRUPO = :idUnidadComprasGestora");
          replacements.idUnidadComprasGestora = idUnidadComprasGestora;
        }
        
        const query = `
          UPDATE AJENOS.ALIAS_AMBITO_APLANADO
          SET ${updateFields.join(', ')}
          WHERE ID_ALIAS_AMBITO_APLANADO = :idAliasAmbitoAplanado
            AND FECHA_BAJA IS NULL
        `;
        
        return { query, replacements };
      });
      
      const results = await Promise.all(
        queries.map(({ query, replacements }) => 
          sequelizeAjenos.query(query, {
            replacements,
            type: QueryTypes.UPDATE
          })
        )
      );
      
      const batchUpdated = results.reduce((sum, result) => sum + (result[1] || 0), 0);
      updatedCount += batchUpdated;
    }
    
    return {
      success: true,
      message: 'Relaciones actualizadas correctamente',
      updatedCount
    };
  } catch (error) {
    console.error('Error al actualizar relaciones:', error);
    throw new Error('Error al actualizar relaciones: ' + error.message);
  }
};