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