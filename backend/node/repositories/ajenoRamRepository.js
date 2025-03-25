const { sequelizeAjenos } = require('../utils/database');

exports.findAllWithPagination = async (pageable = { page: 0, size: 10000 }, idIdioma = 1, idsAjeno = null) => {
  const query = `
    SELECT 
        ar.ID_AJENO as idAjeno,
        ar.UNIDADES_EMPAQUETADO as unidadesEmpaquetado,
        ar.MULTIPLO_MINIMO as multiploMinimo,
        ar.ID_TIPO_ESTADO_AJENO_RAM as idTipoEstadoRam,
        ar.ID_UNIDADES_MEDIDA as idUnidadesMedida,
        ar.IMAGE_REF as imageRef,
        teari.DESCRIPCION as descripcionTipoEstadoRam,
        tei.ID_TIPO_ESTADO as idTipoEstadoCompras,
        tei.DESCRIPCION as descripcionEstadoCompras,
        umi.DESCRIPCION as descripcionUnidadesMedida,
        COALESCE(ai.NOMBRE, a.NOMBRE) as nombreAjeno
        FROM AJENO_RAM ar 
        INNER JOIN AJENO a ON ar.ID_AJENO = a.ID_AJENO
        INNER JOIN AJENO_IDIOMA ai ON a.ID_AJENO = ai.ID_AJENO
        INNER JOIN TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON ar.ID_TIPO_ESTADO_AJENO_RAM = teari.ID_TIPO_ESTADO_AJENO_RAM
        INNER JOIN MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = a.ID_MAQUINA_ESTADO_AJENOS
        INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON mea.ID_TIPO_ESTADO_ACTUAL = tei.ID_TIPO_ESTADO
        INNER JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON ar.ID_UNIDADES_MEDIDA = umi.ID_UNIDADES_MEDIDA
        WHERE teari.ID_IDIOMA = :idIdioma 
        AND tei.ID_IDIOMA = :idIdioma 
        AND umi.ID_IDIOMA = :idIdioma 
        AND ai.ID_IDIOMA = :idIdioma
      ${idsAjeno ? 'AND ar.ID_AJENO IN (:idsAjeno)' : ''}
    ORDER BY ar.ID_AJENO DESC
    LIMIT :limit OFFSET :offset
  `;

  const result = await sequelizeAjenos.query(query, {
    replacements: { 
      idIdioma, 
      idsAjeno: idsAjeno || [],
      limit: pageable.size, 
      offset: pageable.page * pageable.size 
    },
    type: sequelizeAjenos.QueryTypes.SELECT
  });

  const countQuery = `
    SELECT COUNT(*) as total
    FROM AJENO_RAM ar 
    INNER JOIN AJENO a ON ar.ID_AJENO = a.ID_AJENO
    INNER JOIN AJENO_IDIOMA ai ON a.ID_AJENO = ai.ID_AJENO
    INNER JOIN TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON ar.ID_TIPO_ESTADO_AJENO_RAM = teari.ID_TIPO_ESTADO_AJENO_RAM
    WHERE teari.ID_IDIOMA = :idIdioma AND ai.ID_IDIOMA = :idIdioma
    ${idsAjeno ? 'AND ar.ID_AJENO IN (:idsAjeno)' : ''}
  `;

  const countResult = await sequelizeAjenos.query(countQuery, {
    replacements: { 
      idIdioma, 
      idsAjeno: idsAjeno || []
    },
    type: sequelizeAjenos.QueryTypes.SELECT
  });

  return {
    content: result,
    totalElements: countResult[0].total,
    number: pageable.page,
    size: pageable.size,
    totalPages: Math.ceil(countResult[0].total / pageable.size)
  };
};

exports.updateEstadoRam = async (ids, nuevoEstado) => {
  const query = `
    UPDATE AJENO_RAM
    SET ID_TIPO_ESTADO_AJENO_RAM = (
      SELECT ID_TIPO_ESTADO_AJENO_RAM 
      FROM TIPO_ESTADO_AJENO_RAM_IDIOMA 
      WHERE DESCRIPCION = :nuevoEstado 
      LIMIT 1
    )
    WHERE ID_AJENO IN (:ids)
  `;

  return await sequelizeAjenos.query(query, {
    replacements: { ids, nuevoEstado },
    type: sequelizeAjenos.QueryTypes.UPDATE
  });
};

exports.findAllAjenos = async (idIdioma) => {
  const query = `
    SELECT
      ar.ID_AJENO as idAjeno,
      ar.UNIDADES_EMPAQUETADO as unidadesEmpaquetado,
      ar.MULTIPLO_MINIMO as multiploMinimo,
      ar.ID_TIPO_ESTADO_AJENO_RAM as idTipoEstadoRam,
      ar.ID_UNIDADES_MEDIDA as idUnidadesMedida,
      ar.IMAGE_REF as imageRef,
      teari.DESCRIPCION as descripcionTipoEstadoRam,
      tei.ID_TIPO_ESTADO as idTipoEstadoCompras,
      tei.DESCRIPCION as descripcionEstadoCompras,
      umi.DESCRIPCION as descripcionUnidadesMedida,
      COALESCE(ai.NOMBRE, a.NOMBRE) as nombreAjeno
    FROM AJENO_RAM ar
    INNER JOIN AJENO a ON ar.ID_AJENO = a.ID_AJENO
    INNER JOIN AJENO_IDIOMA ai ON a.ID_AJENO = ai.ID_AJENO
    INNER JOIN TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON ar.ID_TIPO_ESTADO_AJENO_RAM = teari.ID_TIPO_ESTADO_AJENO_RAM
    INNER JOIN MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = a.ID_MAQUINA_ESTADO_AJENOS
    INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON mea.ID_TIPO_ESTADO_ACTUAL = tei.ID_TIPO_ESTADO
    INNER JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON ar.ID_UNIDADES_MEDIDA = umi.ID_UNIDADES_MEDIDA
    WHERE teari.ID_IDIOMA = :idIdioma
    AND tei.ID_IDIOMA = :idIdioma
    AND umi.ID_IDIOMA = :idIdioma
    AND ai.ID_IDIOMA = :idIdioma
    ORDER BY ar.ID_AJENO ASC
    LIMIT 50
  `;

  return await sequelizeAjenos.query(query, {
    replacements: { idIdioma },
    type: sequelizeAjenos.QueryTypes.SELECT
  });
};

exports.findAjenosRam = async (idIdioma, idAjeno, nombre) => {
  let whereClause = `
    WHERE teari.ID_IDIOMA = :idIdioma
    AND tei.ID_IDIOMA = :idIdioma
    AND umi.ID_IDIOMA = :idIdioma
    AND ai.ID_IDIOMA = :idIdioma
  `;

  if (idAjeno) {
    whereClause += ` AND ar.ID_AJENO = :idAjeno`;
  }

  if (nombre) {
    whereClause += ` AND ai.NOMBRE LIKE :nombre`;
  }

  const query = `
    SELECT
      a.ID_AJENO as idAjeno,
      COALESCE(ai.NOMBRE, a.NOMBRE) as nombreAjeno,
      teari.DESCRIPCION as descripcionTipoEstadoRam,
      umi.DESCRIPCION as descripcionUnidadesMedida,
      ar.UNIDADES_EMPAQUETADO as unidadesEmpaquetado,
      ar.MULTIPLO_MINIMO as multiploMinimo
    FROM AJENO a
    LEFT JOIN AJENO_RAM ar ON a.ID_AJENO = ar.ID_AJENO
    INNER JOIN AJENO_IDIOMA ai ON a.ID_AJENO = ai.ID_AJENO
    LEFT JOIN TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON IFNULL(ar.ID_TIPO_ESTADO_AJENO_RAM, 1) = teari.ID_TIPO_ESTADO_AJENO_RAM
    INNER JOIN MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = a.ID_MAQUINA_ESTADO_AJENOS
    INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON mea.ID_TIPO_ESTADO_ACTUAL = tei.ID_TIPO_ESTADO
    LEFT JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON IFNULL(ar.ID_UNIDADES_MEDIDA, 1) = umi.ID_UNIDADES_MEDIDA
    ${whereClause}
    ORDER BY a.ID_AJENO ASC
    LIMIT 50
  `;

  const replacements = {
    idIdioma,
    idAjeno: idAjeno,
    nombre: nombre ? `%${nombre}%` : null
  };

  return await sequelizeAjenos.query(query, {
    replacements,
    type: sequelizeAjenos.QueryTypes.SELECT
  });
};

// Nueva función para añadir ajenos a RAM
exports.addAjenosToRam = async (ajenos) => {
  try {
    const results = [];
    
    // Para cada ajeno en el array
    for (const ajeno of ajenos) {
      // Verificar si ya existe en AJENO_RAM
      const checkQuery = `
        SELECT COUNT(*) as count FROM AJENO_RAM 
        WHERE ID_AJENO = :idAjeno
      `;
      
      const checkResult = await sequelizeAjenos.query(checkQuery, {
        replacements: { idAjeno: ajeno.idAjeno },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      // Si ya existe, actualizamos
      if (checkResult[0].count > 0) {
        const updateQuery = `
          UPDATE AJENO_RAM 
          SET ID_TIPO_ESTADO_AJENO_RAM = 1, 
              UNIDADES_EMPAQUETADO = 1, 
              MULTIPLO_MINIMO = 1, 
              ID_UNIDADES_MEDIDA = 1
          WHERE ID_AJENO = :idAjeno
        `;
        
        await sequelizeAjenos.query(updateQuery, {
          replacements: { idAjeno: ajeno.idAjeno },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        
        results.push({ idAjeno: ajeno.idAjeno, status: 'updated' });
      } 
      // Si no existe, lo insertamos
      else {
        const insertQuery = `
          INSERT INTO AJENO_RAM 
          (ID_AJENO, ID_TIPO_ESTADO_AJENO_RAM, UNIDADES_EMPAQUETADO, MULTIPLO_MINIMO, ID_UNIDADES_MEDIDA) 
          VALUES (:idAjeno, 1, 1, 1, 1)
        `;
        
        await sequelizeAjenos.query(insertQuery, {
          replacements: { idAjeno: ajeno.idAjeno },
          type: sequelizeAjenos.QueryTypes.INSERT
        });
        
        results.push({ idAjeno: ajeno.idAjeno, status: 'inserted' });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error en addAjenosToRam:', error);
    throw error;
  }
};