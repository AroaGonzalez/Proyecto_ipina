// backend/node/repositories/aliasRepository.js
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

const buildWhereClause = (filter) => {
  let whereClauses = [];
  let params = {};
  
  if (filter.tipoAlias) {
    whereClauses.push('ta.ID_TIPO_ALIAS IN (:tipoAlias)');
    params.tipoAlias = filter.tipoAlias;
  }
  
  if (filter.idAlias) {
    whereClauses.push('a.ID_ALIAS IN (:idAlias)');
    params.idAlias = filter.idAlias;
  }
  
  if (filter.estadoAlias) {
    whereClauses.push('tea.ID_TIPO_ESTADO_ALIAS IN (:estadoAlias)');
    params.estadoAlias = filter.estadoAlias;
  }
  
  if (filter.estacionalidad) {
    whereClauses.push('te.ID_TIPO_ESTACIONALIDAD IN (:estacionalidad)');
    params.estacionalidad = filter.estacionalidad;
  }
  
  if (filter.articulos) {
    whereClauses.push('aa.ID_AJENO IN (:articulos)');
    params.articulos = filter.articulos;
  }
  
  return { whereClauses, params };
};

exports.findAliasByFilter = async (filter = {}, pageable = { page: 0, size: 50 }) => {
  try {    
    const cacheKey = `alias_${JSON.stringify(filter)}_${pageable.page}_${pageable.size}`;
    cache.clear(cacheKey);
    
    console.log('Ejecutando consulta de alias...');
    
    const searchQuery = `
      SELECT DISTINCT a.ID_ALIAS, 
        ai.NOMBRE, 
        ai.DESCRIPCION, 
        ta.ID_TIPO_ALIAS, 
        tai.DESCRIPCION as DESCRIPCIONTIPOALIAS,
        tea.ID_TIPO_ESTADO_ALIAS, 
        teai.DESCRIPCION as DESCRIPCIONTIPOESTADOALIAS,
        (SELECT COUNT(aa2.ID_AJENO) FROM AJENOS.ALIAS_AJENO aa2 WHERE aa2.ID_ALIAS = a.ID_ALIAS 
        AND aa2.FECHA_BAJA IS NULL) AS NUMEROAJENOS, 
        te.ID_TIPO_ESTACIONALIDAD, 
        tei.DESCRIPCION as DESCRIPCIONTIPOESTACIONALIDAD, 
        a.FECHA_ALTA, 
        a.USUARIO_ALTA, 
        a.FECHA_MODIFICACION 
      FROM AJENOS.ALIAS a 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = a.ID_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS AND tai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS tea ON tea.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS 
        AND teai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD te ON te.ID_TIPO_ESTACIONALIDAD = a.ID_TIPO_ESTACIONALIDAD 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD 
        AND tei.ID_IDIOMA = :idIdioma 
      WHERE a.FECHA_BAJA IS NULL 
    `;
    
    const countQuery = `
      SELECT COUNT(DISTINCT a.ID_ALIAS) as total
      FROM AJENOS.ALIAS a 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.ALIAS_AJENO aa ON aa.ID_ALIAS = a.ID_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS 
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS 
        AND tai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS tea ON tea.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS 
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS 
        AND teai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD te ON te.ID_TIPO_ESTACIONALIDAD = a.ID_TIPO_ESTACIONALIDAD 
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD 
        AND tei.ID_IDIOMA = :idIdioma 
      WHERE a.FECHA_BAJA IS NULL 
    `;
    
    let finalSearchQuery = searchQuery;
    let finalCountQuery = countQuery;
    
    const { whereClauses, params } = buildWhereClause(filter);
    if (whereClauses.length > 0) {
      finalSearchQuery += ` AND ${whereClauses.join(' AND ')}`;
      finalCountQuery += ` AND ${whereClauses.join(' AND ')}`;
    }
    
    finalSearchQuery += ` ORDER BY a.ID_ALIAS DESC`;
    
    if (pageable && pageable.size) {
      finalSearchQuery += ` LIMIT :limit OFFSET :offset`;
    }
    
    const replacements = { 
      idIdioma: filter.idIdioma || 1,
      limit: pageable.size,
      offset: pageable.page * pageable.size,
      ...params 
    };
    
    console.log('Ejecutando consulta count...');
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    console.log(`Total de elementos: ${totalElements}`);
    
    let processedResult = [];
    if (totalElements > 0) {
      console.log('Ejecutando consulta principal...');
      const result = await sequelizeAjenos.query(finalSearchQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      processedResult = result.map(item => ({
        id: item.ID_ALIAS,
        nombreAlias: fixEncoding(item.NOMBRE),
        descripcion: fixEncoding(item.DESCRIPCION),
        tipo: fixEncoding(item.DESCRIPCIONTIPOALIAS),
        idTipo: item.ID_TIPO_ALIAS,
        estado: fixEncoding(item.DESCRIPCIONTIPOESTADOALIAS),
        idEstado: item.ID_TIPO_ESTADO_ALIAS,
        numArticulos: parseInt(item.NUMEROAJENOS),
        estacionalidad: fixEncoding(item.DESCRIPCIONTIPOESTACIONALIDAD),
        idEstacionalidad: item.ID_TIPO_ESTACIONALIDAD,
        ultimaModificacion: item.FECHA_MODIFICACION ? new Date(item.FECHA_MODIFICACION).toISOString().split('T')[0] : null,
        fechaAlta: item.FECHA_ALTA ? new Date(item.FECHA_ALTA).toISOString().split('T')[0] : null,
        usuario: item.USUARIO_ALTA
      }));
    }
    
    const totalPages = Math.ceil(totalElements / pageable.size);
    
    const finalResult = {
      content: processedResult,
      totalElements,
      number: pageable.page,
      size: pageable.size,
      totalPages
    };
    
    console.log(`Procesados ${processedResult.length} registros`);
    
    if (processedResult.length > 0) {
      console.log('Muestra:', processedResult[0]);
    }
    
    return finalResult;
  } catch (error) {
    console.error('Error en findAliasByFilter:', error);
    throw error;
  }
};

exports.getTiposAlias = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT ta.ID_TIPO_ALIAS as id, tai.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ALIAS ta
      INNER JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS
      WHERE tai.ID_IDIOMA = :idIdioma
      ORDER BY ta.ID_TIPO_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener tipos de alias:', error);
    return [];
  }
};

exports.getEstadosAlias = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT tea.ID_TIPO_ESTADO_ALIAS as id, teai.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTADO_ALIAS tea
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS
      WHERE teai.ID_IDIOMA = :idIdioma
      ORDER BY tea.ID_TIPO_ESTADO_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener estados de alias:', error);
    return [];
  }
};

exports.getEstacionalidades = async (idIdioma = 1) => {
  try {
    const result = await sequelizeAjenos.query(`
      SELECT te.ID_TIPO_ESTACIONALIDAD as id, tei.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_ESTACIONALIDAD te
      INNER JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD
      WHERE tei.ID_IDIOMA = :idIdioma
      ORDER BY te.ID_TIPO_ESTACIONALIDAD
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener estacionalidades:', error);
    return [];
  }
};

exports.getAliasesForFilter = async (idIdioma = 1) => {
  try {
    
    const result = await sequelizeAjenos.query(`
      SELECT 
        ai.ID_ALIAS as id, ai.NOMBRE as nombre
      FROM AJENOS.ALIAS_IDIOMA ai
      INNER JOIN AJENOS.ALIAS a ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      WHERE a.FECHA_BAJA IS NULL
      ORDER BY ai.ID_ALIAS
    `, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });
    
    console.log(`[DEBUG] Consulta completada. Resultados obtenidos: ${result.length}`);
    
    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.nombre)
    }));
  } catch (error) {
    console.error('[ERROR] Error al obtener alias para filtro:', error);
    console.error('Mensaje del error:', error.message);
    return [];
  }
};

exports.getAjenos = async (idIdioma = 1) => {
  try {
    try {
      const result = await sequelizeAjenos.query(`
        SELECT ai.ID_AJENO as id, ai.NOMBRE as nombre
        FROM AJENOS.AJENO_RAM a
        INNER JOIN AJENOS.AJENO_IDIOMA ai ON ai.ID_AJENO = a.ID_AJENO AND ai.ID_IDIOMA = :idIdioma
        ORDER BY a.ID_AJENO
        `, {
        replacements: { idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      return result.map(item => ({
        id: item.id,
        nombre: String(item.nombre)
      }));
    } catch (error) {
      console.error('Error consultando AJENO_RAM, intentando con AJENO:', error);
    }
  } catch (error) {
    console.error('Error al obtener ajenos:', error);
    return [];
  }
};

exports.findAliasAjenosByFilter = async (filter = {}, pageable = { page: 0, size: 50 }) => {
  try {    
    const cacheKey = `alias_ajenos_${JSON.stringify(filter)}_${pageable.page}_${pageable.size}`;
    cache.clear(cacheKey);
    
    console.log('Ejecutando consulta de alias ajenos...');
    
    const searchQuery = `
      SELECT aa.ID_ALIAS, 
        ai.NOMBRE as NOMBRE_ALIAS, 
        ai.DESCRIPCION as DESCRIPCION_ALIAS, 
        a.ID_TIPO_ALIAS, 
        aa.ID_AJENO, 
        aij.NOMBRE as NOMBRE_AJENO, 
        mea.ID_TIPO_ESTADO_ACTUAL as ID_TIPO_ESTADO_COMPRAS, 
        tei.DESCRIPCION as DESCRIPCION_ESTADO_COMPRAS, 
        teari.ID_TIPO_ESTADO_AJENO_RAM as ID_TIPO_ESTADO_RAM, 
        teari.DESCRIPCION as DESCRIPCION_TIPO_ESTADO_RAM, 
        teari2.ID_TIPO_ESTADO_AJENO_RAM as TIPO_ESTADO_ALIAS_AJENO_RAM, 
        teari2.DESCRIPCION as DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO_RAM, 
        umi.ID_UNIDADES_MEDIDA, 
        umi.DESCRIPCION as DESCRIPCION_UNIDADES_MEDIDA, 
        ar.UNIDADES_EMPAQUETADO, 
        ar.MULTIPLO_MINIMO
      FROM AJENOS.ALIAS_AJENO aa 
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aa.ID_AJENO 
      INNER JOIN AJENOS.AJENO_IDIOMA aij ON aij.ID_AJENO = aa.ID_AJENO AND aij.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.AJENO aj ON aj.ID_AJENO = aa.ID_AJENO 
      INNER JOIN AJENOS.MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = aj.ID_MAQUINA_ESTADO_AJENOS
      INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON tei.ID_TIPO_ESTADO = mea.ID_TIPO_ESTADO_ACTUAL AND tei.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON teari.ID_TIPO_ESTADO_AJENO_RAM = ar.ID_TIPO_ESTADO_AJENO_RAM 
        AND teari.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari2 ON teari2.ID_TIPO_ESTADO_AJENO_RAM = aa.ID_TIPO_ESTADO_AJENO_RAM
        AND teari2.ID_IDIOMA = :idIdioma 
      INNER JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON umi.ID_UNIDADES_MEDIDA = ar.ID_UNIDADES_MEDIDA 
        AND umi.ID_IDIOMA = :idIdioma 
      WHERE aa.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL 
    `;
    
    const countQuery = `
      SELECT COUNT(aa.ID_ALIAS) as total
      FROM AJENOS.ALIAS_AJENO aa 
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.AJENO_RAM ar ON ar.ID_AJENO = aa.ID_AJENO 
      INNER JOIN AJENOS.AJENO_IDIOMA aij ON aij.ID_AJENO = aa.ID_AJENO AND aij.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.AJENO aj ON aj.ID_AJENO = aa.ID_AJENO 
      INNER JOIN AJENOS.MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = aj.ID_MAQUINA_ESTADO_AJENOS 
      INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON tei.ID_TIPO_ESTADO = mea.ID_TIPO_ESTADO_ACTUAL AND tei.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON teari.ID_TIPO_ESTADO_AJENO_RAM = ar.ID_TIPO_ESTADO_AJENO_RAM
        AND teari.ID_IDIOMA = :idIdioma 
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari2 ON teari2.ID_TIPO_ESTADO_AJENO_RAM = aa.ID_TIPO_ESTADO_AJENO_RAM 
        AND teari2.ID_IDIOMA = :idIdioma 
      INNER JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON umi.ID_UNIDADES_MEDIDA = ar.ID_UNIDADES_MEDIDA 
        AND umi.ID_IDIOMA = :idIdioma 
      WHERE aa.FECHA_BAJA IS NULL AND a.FECHA_BAJA IS NULL 
    `;
    
    let whereClauses = [];
    let params = {};
    
    if (filter.idAlias && filter.idAlias.length > 0) {
      whereClauses.push('a.ID_ALIAS IN (:idAlias)');
      params.idAlias = filter.idAlias;
    }
    
    if (filter.tipoEstadoRam && filter.tipoEstadoRam.length > 0) {
      whereClauses.push('teari.ID_TIPO_ESTADO_AJENO_RAM IN (:tipoEstadoRam)');
      params.tipoEstadoRam = filter.tipoEstadoRam;
    }
    
    if (filter.tipoEstadoCompras && filter.tipoEstadoCompras.length > 0) {
      whereClauses.push('mea.ID_TIPO_ESTADO_ACTUAL IN (:tipoEstadoCompras)');
      params.tipoEstadoCompras = filter.tipoEstadoCompras;
    }
    
    if (filter.idAjeno && filter.idAjeno.length > 0) {
      whereClauses.push('aa.ID_AJENO IN (:idAjeno)');
      params.idAjeno = filter.idAjeno;
    }
    
    let finalSearchQuery = searchQuery;
    let finalCountQuery = countQuery;
    
    if (whereClauses.length > 0) {
      const whereClause = ` AND ${whereClauses.join(' AND ')}`;
      finalSearchQuery += whereClause;
      finalCountQuery += whereClause;
    }
    
    finalSearchQuery += ` ORDER BY aa.ID_ALIAS DESC`;
    
    if (pageable && pageable.size) {
      finalSearchQuery += ` LIMIT :limit OFFSET :offset`;
    }
    
    const replacements = { 
      idIdioma: filter.idIdioma || 1,
      limit: pageable.size,
      offset: pageable.page * pageable.size,
      ...params 
    };
    
    console.log('Ejecutando consulta count para alias ajenos...');
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    console.log(`Total de elementos de alias ajenos: ${totalElements}`);
    
    let processedResult = [];
    if (totalElements > 0) {
      console.log('Ejecutando consulta principal de alias ajenos...');
      const result = await sequelizeAjenos.query(finalSearchQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      });
      
      processedResult = result.map(item => ({
        idAlias: item.ID_ALIAS,
        nombreAlias: fixEncoding(item.NOMBRE_ALIAS),
        descripcionAlias: fixEncoding(item.DESCRIPCION_ALIAS),
        idTipoAlias: item.ID_TIPO_ALIAS,
        idAjeno: item.ID_AJENO,
        nombreAjeno: fixEncoding(item.NOMBRE_AJENO),
        tipoEstadoCompras: {
          id: item.ID_TIPO_ESTADO_COMPRAS,
          descripcion: fixEncoding(item.DESCRIPCION_ESTADO_COMPRAS)
        },
        tipoEstadoRam: {
          id: item.ID_TIPO_ESTADO_RAM,
          descripcion: fixEncoding(item.DESCRIPCION_TIPO_ESTADO_RAM)
        },
        idTipoEstadoAliasAjenoRam: item.TIPO_ESTADO_ALIAS_AJENO_RAM,
        descripcionTipoEstadoAliasAjenoRam: fixEncoding(item.DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO_RAM),
        unidadesMedida: {
          id: item.ID_UNIDADES_MEDIDA,
          descripcion: fixEncoding(item.DESCRIPCION_UNIDADES_MEDIDA)
        },
        unidadesEmpaquetado: item.UNIDADES_EMPAQUETADO,
        multiploMinimo: item.MULTIPLO_MINIMO
      }));
    }
    
    const totalPages = Math.ceil(totalElements / pageable.size);
    
    const finalResult = {
      content: processedResult,
      totalElements,
      number: pageable.page,
      size: pageable.size,
      totalPages
    };
    
    console.log(`Procesados ${processedResult.length} registros de alias ajenos`);
    
    if (processedResult.length > 0) {
      console.log('Muestra de alias ajenos:', processedResult[0]);
    }
    
    return finalResult;
  } catch (error) {
    console.error('Error en findAliasAjenosByFilter:', error);
    throw error;
  }
};

exports.findAliasById = async (id, idIdioma = 1) => {
  try {
    const query = `
      SELECT a.ID_ALIAS, 
        ai.NOMBRE, 
        ai.DESCRIPCION, 
        a.ID_TIPO_ALIAS, 
        tai.DESCRIPCION as DESCRIPCION_TIPO_ALIAS,
        a.ID_TIPO_ESTADO_ALIAS, 
        teai.DESCRIPCION as DESCRIPCION_TIPO_ESTADO_ALIAS,
        a.ID_TIPO_ESTACIONALIDAD, 
        tei.DESCRIPCION as DESCRIPCION_TIPO_ESTACIONALIDAD,
        a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS,
        tcodai.DESCRIPCION as DESCRIPCION_TIPO_CONEXION,
        (SELECT COUNT(aa.ID_AJENO) FROM AJENOS.ALIAS_AJENO aa WHERE aa.ID_ALIAS = a.ID_ALIAS AND aa.FECHA_BAJA IS NULL) AS NUMERO_AJENOS,
        a.FECHA_ALTA, 
        a.USUARIO_ALTA, 
        a.FECHA_MODIFICACION
      FROM AJENOS.ALIAS a 
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON ai.ID_ALIAS = a.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma 
      LEFT JOIN AJENOS.TIPO_ALIAS ta ON ta.ID_TIPO_ALIAS = a.ID_TIPO_ALIAS 
      LEFT JOIN AJENOS.TIPO_ALIAS_IDIOMA tai ON tai.ID_TIPO_ALIAS = ta.ID_TIPO_ALIAS AND tai.ID_IDIOMA = :idIdioma 
      LEFT JOIN AJENOS.TIPO_ESTADO_ALIAS tea ON tea.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS 
      LEFT JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = tea.ID_TIPO_ESTADO_ALIAS AND teai.ID_IDIOMA = :idIdioma 
      LEFT JOIN AJENOS.TIPO_ESTACIONALIDAD te ON te.ID_TIPO_ESTACIONALIDAD = a.ID_TIPO_ESTACIONALIDAD 
      LEFT JOIN AJENOS.TIPO_ESTACIONALIDAD_IDIOMA tei ON tei.ID_TIPO_ESTACIONALIDAD = te.ID_TIPO_ESTACIONALIDAD AND tei.ID_IDIOMA = :idIdioma
      LEFT JOIN AJENOS.TIPO_CONEXION_ORIGEN_DATO_ALIAS tcoda ON tcoda.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS = a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS
      LEFT JOIN AJENOS.TIPO_CONEXION_ORIGEN_DATO_ALIAS_IDIOMA tcodai ON tcodai.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS = tcoda.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS AND tcodai.ID_IDIOMA = :idIdioma
      WHERE a.ID_ALIAS = :id AND a.FECHA_BAJA IS NULL
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { id, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    if (result && result.length > 0) {
      const alias = result[0];
      return {
        id: alias.ID_ALIAS,
        nombreAlias: fixEncoding(alias.NOMBRE),
        descripcion: fixEncoding(alias.DESCRIPCION),
        idTipoAlias: alias.ID_TIPO_ALIAS,
        tipoAlias: fixEncoding(alias.DESCRIPCION_TIPO_ALIAS),
        idEstado: alias.ID_TIPO_ESTADO_ALIAS,
        estado: fixEncoding(alias.DESCRIPCION_TIPO_ESTADO_ALIAS),
        idEstacionalidad: alias.ID_TIPO_ESTACIONALIDAD,
        estacionalidad: fixEncoding(alias.DESCRIPCION_TIPO_ESTACIONALIDAD),
        idTipoConexion: alias.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS,
        tipoConexion: fixEncoding(alias.DESCRIPCION_TIPO_CONEXION),
        numArticulos: parseInt(alias.NUMERO_AJENOS) || 0,
        ultimaModificacion: alias.FECHA_MODIFICACION ? new Date(alias.FECHA_MODIFICACION).toISOString().split('T')[0] : null,
        fechaAlta: alias.FECHA_ALTA ? new Date(alias.FECHA_ALTA).toISOString().split('T')[0] : null,
        usuario: alias.USUARIO_ALTA
      };
    }
    return null;
  } catch (error) {
    console.error('Error en findAliasById:', error);
    throw error;
  }
};

exports.findIdiomasByIdAlias = async (idAlias) => {
  try {
    const query = `
      SELECT ai.ID_IDIOMA as ID_IDIOMA, 
        ai.NOMBRE as NOMBRE, 
        ai.DESCRIPCION as DESCRIPCION, 
        i.DESCRIPCION as DESCRIPCION_IDIOMA
      FROM AJENOS.ALIAS_IDIOMA ai
      INNER JOIN MAESTROS.IDIOMA i ON i.ID_IDIOMA = ai.ID_IDIOMA
      WHERE ai.ID_ALIAS = :idAlias
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      idIdioma: item.ID_IDIOMA,
      nombre: fixEncoding(item.NOMBRE),
      descripcion: fixEncoding(item.DESCRIPCION),
      descripcionIdioma: fixEncoding(item.DESCRIPCION_IDIOMA)
    }));
  } catch (error) {
    console.error('Error en findIdiomasByIdAlias:', error);
    return [];
  }
};

exports.findAliasAjenoInfoByIdAlias = async (idAlias, idIdioma = 1) => {
  try {
    const query = `
      SELECT aa.ID_ALIAS, 
        ar.ID_AJENO, 
        aa.ID_TIPO_ESTADO_AJENO_RAM,
        aa.ID_SINT, 
        ai.NOMBRE as NOMBRE_ALIAS, 
        ai.DESCRIPCION as DESCRIPCION_ALIAS, 
        a.ID_TIPO_ALIAS, 
        aji.NOMBRE as NOMBRE_AJENO, 
        mea.ID_TIPO_ESTADO_ACTUAL as ID_TIPO_ESTADO_COMPRAS, 
        tei.DESCRIPCION as DESCRIPCION_ESTADO_COMPRAS, 
        ar.ID_TIPO_ESTADO_AJENO_RAM as ID_TIPO_ESTADO_RAM,
        teari.DESCRIPCION as DESCRIPCION_TIPO_ESTADO_RAM, 
        teari2.DESCRIPCION AS DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO_RAM,
        ar.ID_UNIDADES_MEDIDA, 
        umi.DESCRIPCION as DESCRIPCION_UNIDADES_MEDIDA, 
        ar.UNIDADES_EMPAQUETADO, 
        ar.MULTIPLO_MINIMO,
        aa.FECHA_ALTA,
        aa.FECHA_BAJA,
        ar.IMAGE_REF
      FROM AJENOS.ALIAS_AJENO aa
      INNER JOIN AJENOS.ALIAS a ON a.ID_ALIAS = aa.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON a.ID_ALIAS = ai.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.AJENO aj ON aa.ID_AJENO = aj.ID_AJENO
      INNER JOIN AJENOS.AJENO_RAM ar ON aa.ID_AJENO = ar.ID_AJENO
      INNER JOIN AJENOS.AJENO_IDIOMA aji ON aa.ID_AJENO = aji.ID_AJENO AND aji.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari ON ar.ID_TIPO_ESTADO_AJENO_RAM = teari.ID_TIPO_ESTADO_AJENO_RAM
        AND teari.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_AJENO_RAM_IDIOMA teari2 ON aa.ID_TIPO_ESTADO_AJENO_RAM = teari2.ID_TIPO_ESTADO_AJENO_RAM
        AND teari2.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.MAQUINA_ESTADO_AJENOS mea ON mea.ID_MAQUINA_ESTADO_AJENOS = aj.ID_MAQUINA_ESTADO_AJENOS
      INNER JOIN MAESTROS.TIPO_ESTADO_IDIOMA tei ON mea.ID_TIPO_ESTADO_ACTUAL = tei.ID_TIPO_ESTADO AND tei.ID_IDIOMA = :idIdioma
      INNER JOIN MAESTROS.UNIDADES_MEDIDA_IDIOMA umi ON ar.ID_UNIDADES_MEDIDA = umi.ID_UNIDADES_MEDIDA AND umi.ID_IDIOMA = :idIdioma
      WHERE aa.ID_ALIAS = :idAlias AND aa.FECHA_BAJA IS NULL
      ORDER BY aa.ID_AJENO DESC
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      idAlias: item.ID_ALIAS,
      idAjeno: item.ID_AJENO,
      idTipoEstadoAliasAjenoRam: item.ID_TIPO_ESTADO_AJENO_RAM,
      idSint: item.ID_SINT,
      nombreAlias: fixEncoding(item.NOMBRE_ALIAS),
      descripcionAlias: fixEncoding(item.DESCRIPCION_ALIAS),
      idTipoAlias: item.ID_TIPO_ALIAS,
      nombreAjeno: fixEncoding(item.NOMBRE_AJENO),
      tipoEstadoCompras: {
        id: item.ID_TIPO_ESTADO_COMPRAS,
        descripcion: fixEncoding(item.DESCRIPCION_ESTADO_COMPRAS)
      },
      tipoEstadoRam: {
        id: item.ID_TIPO_ESTADO_RAM,
        descripcion: fixEncoding(item.DESCRIPCION_TIPO_ESTADO_RAM)
      },
      descripcionTipoEstadoAliasAjenoRam: fixEncoding(item.DESCRIPCION_TIPO_ESTADO_ALIAS_AJENO_RAM),
      unidadesMedida: {
        id: item.ID_UNIDADES_MEDIDA,
        descripcion: fixEncoding(item.DESCRIPCION_UNIDADES_MEDIDA)
      },
      unidadesEmpaquetado: item.UNIDADES_EMPAQUETADO,
      multiploMinimo: item.MULTIPLO_MINIMO,
      fechaAlta: item.FECHA_ALTA ? new Date(item.FECHA_ALTA).toISOString().split('T')[0] : null,
      fechaBaja: item.FECHA_BAJA ? new Date(item.FECHA_BAJA).toISOString().split('T')[0] : null,
      imageRef: item.IMAGE_REF
    }));
  } catch (error) {
    console.error('Error en findAliasAjenoInfoByIdAlias:', error);
    return [];
  }
};

exports.findAcoplesInfoByIdAlias = async (idAlias, idIdioma = 1) => {
  try {
    console.log(`Ejecutando consulta de acoples para ID: ${idAlias}, idIdioma: ${idIdioma}`);
    const query = `
      SELECT aa.ID_ALIAS, aa.ID_ALIAS_ACOPLE, aa.RATIO_ACOPLE, aa.FECHA_BAJA, ai.NOMBRE as NOMBRE_ALIAS_PRINCIPAL
      FROM AJENOS.ALIAS_ACOPLE aa
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON aa.ID_ALIAS = ai.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      WHERE aa.ID_ALIAS_ACOPLE = :idAlias AND aa.FECHA_BAJA IS NULL
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    console.log(`Acoples encontrados: ${result.length}`);
    return result.map(item => ({
      idAlias: item.ID_ALIAS,
      idAliasAcople: item.ID_ALIAS_ACOPLE,
      ratioAcople: item.RATIO_ACOPLE,
      fechaBaja: item.FECHA_BAJA,
      nombreAliasPrincipal: fixEncoding(item.NOMBRE_ALIAS_PRINCIPAL)
    }));
  } catch (error) {
    console.error('Error en findAcoplesInfoByIdAlias:', error);
    return [];
  }
};

// En aliasRepository.js
exports.findGruposCadenaByIdAlias = async (idAlias) => {
  try {
    console.log(`Consultando grupos cadena para el alias ID: ${idAlias}`);
    const query = `
      SELECT DISTINCT g.ID_GRUPO_CADENA as ID, g.DESCRIPCION
      FROM MAESTROS.GRUPO_CADENA g
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_GRUPO_CADENA = g.ID_GRUPO_CADENA
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = :idAlias
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION = aaa.ID_LOCALIZACION_COMPRA AND lc.ID_CADENA = gcc.ID_CADENA
      WHERE g.ID_TIPO_GRUPO_CADENA = 6
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });

    console.log(`Grupos cadena encontrados: ${result.length}`);
    return result.map(item => ({
      id: item.ID,
      descripcion: fixEncoding(item.DESCRIPCION)
    }));
  } catch (error) {
    console.error('Error en findGruposCadenaByIdAlias:', error);
    return [];
  }
};

exports.findCadenasByIdAlias = async (idAlias) => {
  try {
    console.log(`Consultando cadenas para el alias ID: ${idAlias}`);
    const query = `
      SELECT DISTINCT c.ID_CADENA as ID, c.NOMBRE as DESCRIPCION, gc.ID_GRUPO_CADENA
      FROM MAESTROS.CADENA c
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA AND gc.ID_TIPO_GRUPO_CADENA = 6
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = :idAlias
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION = aaa.ID_LOCALIZACION_COMPRA AND lc.ID_CADENA = c.ID_CADENA
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });

    console.log(`Cadenas encontradas: ${result.length}`);
    return result.map(item => ({
      id: item.ID,
      descripcion: fixEncoding(item.DESCRIPCION),
      idGrupoCadena: item.ID_GRUPO_CADENA
    }));
  } catch (error) {
    console.error('Error en findCadenasByIdAlias:', error);
    return [];
  }
};

exports.findMercadosByIdAlias = async (idAlias, idIdioma = 1) => {
  try {
    console.log(`Consultando mercados para el alias ID: ${idAlias}, idIdioma: ${idIdioma}`);
    const query = `
      SELECT DISTINCT p.ID_PAIS as ID, p.DESCRIPCION, p.PAIS_ISO as CODIGO_ISO_PAIS
      FROM MAESTROS.PAIS p
      INNER JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = :idAlias
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION = aaa.ID_LOCALIZACION_COMPRA AND lc.ID_PAIS = p.ID_PAIS
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });

    console.log(`Mercados encontrados: ${result.length}`);
    return result.map(item => ({
      id: item.ID,
      descripcion: fixEncoding(item.DESCRIPCION),
      codigoIsoMercado: item.CODIGO_ISO_PAIS
    }));
  } catch (error) {
    console.error('Error en findMercadosByIdAlias:', error);
    return [];
  }
};

exports.findAmbitosByIdAlias = async (idAlias, idIdioma = 1) => {
  try {
    console.log(`Consultando ámbitos para el alias ID: ${idAlias}, idIdioma: ${idIdioma}`);
    
    const [gruposCadena, cadenas, mercados] = await Promise.all([
      exports.findGruposCadenaByIdAlias(idAlias),
      exports.findCadenasByIdAlias(idAlias),
      exports.findMercadosByIdAlias(idAlias, idIdioma)
    ]);
    
    return {
      gruposCadena,
      cadenas,
      mercados
    };
  } catch (error) {
    console.error('Error en findAmbitosByIdAlias:', error);
    return {
      gruposCadena: [],
      cadenas: [],
      mercados: []
    };
  }
};

exports.getIdiomas = async () => {
  try {
    const query = `
      SELECT i.ID_IDIOMA as id, i.DESCRIPCION as descripcion
      FROM MAESTROS.IDIOMA i
      ORDER BY i.DESCRIPCION
    `;

    const result = await sequelizeMaestros.query(query, {
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener idiomas:', error);
    return [];
  }
};

exports.getGruposCadena = async () => {
  try {
    const query = `
      SELECT gc.ID_GRUPO_CADENA as id, gc.DESCRIPCION as descripcion
      FROM MAESTROS.GRUPO_CADENA gc
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      ORDER BY gc.ID_GRUPO_CADENA
    `;

    const result = await sequelizeMaestros.query(query, {
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error al obtener grupos cadena:', error);
    return [];
  }
};

exports.getCadenas = async () => {
  try {
    const query = `
      SELECT c.ID_CADENA as id, c.NOMBRE as descripcion, gc.ID_GRUPO_CADENA as idGrupoCadena
      FROM MAESTROS.CADENA c
      LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      LEFT JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      ORDER BY c.NOMBRE
    `;

    const result = await sequelizeMaestros.query(query, {
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion),
      idGrupoCadena: item.idGrupoCadena
    }));
  } catch (error) {
    console.error('Error al obtener cadenas:', error);
    return [];
  }
};

exports.getMercados = async (idIdioma = 1) => {
  try {
    const query = `
      SELECT p.ID_PAIS as id, p.DESCRIPCION as descripcion, p.PAIS_ISO as codigoIsoMercado
      FROM MAESTROS.PAIS p
      INNER JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
      ORDER BY pi.DESCRIPCION
    `;

    const result = await sequelizeMaestros.query(query, {
      replacements: { idIdioma },
      type: sequelizeMaestros.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion),
      codigoIsoMercado: item.codigoIsoMercado
    }));
  } catch (error) {
    console.error('Error al obtener mercados:', error);
    return [];
  }
};

exports.updateEstadoAliasAjeno = async (idAlias, idAjeno, idTipoEstadoAliasAjenoRam) => {
  try {
    cache.clear('alias_ajenos_');
    
    console.log(`Actualizando estado de alias-ajeno: ${idAlias}-${idAjeno} a estado ${idTipoEstadoAliasAjenoRam}`);
    
    const query = `
      UPDATE AJENOS.ALIAS_AJENO
      SET ID_TIPO_ESTADO_AJENO_RAM = :idTipoEstadoAliasAjenoRam,
      FECHA_MODIFICACION = CURRENT_TIMESTAMP
      WHERE ID_ALIAS = :idAlias 
        AND ID_AJENO = :idAjeno
    `;
    
    const [affectedRows] = await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias,
        idAjeno,
        idTipoEstadoAliasAjenoRam
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Actualización completada. Filas afectadas: ${affectedRows}`);
    
    return affectedRows > 0;
  } catch (error) {
    console.error(`Error al actualizar estado de alias-ajeno:`, error);
    throw error;
  }
};

exports.deleteAliasAjeno = async (idAlias, idAjeno, usuarioBaja, fechaBaja) => {
  try {
    cache.clear('alias_ajenos_');
    
    console.log(`Eliminando relación alias-artículo: ${idAlias}-${idAjeno}`);
    
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM AJENOS.ALIAS_AJENO 
      WHERE ID_ALIAS = :idAlias 
        AND ID_AJENO = :idAjeno
        AND FECHA_BAJA IS NULL
    `;
    
    const checkResults = await sequelizeAjenos.query(checkQuery, {
      replacements: { idAlias, idAjeno },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const exists = checkResults && checkResults.length > 0 && checkResults[0].count > 0;
    console.log(`Verificación de existencia de relación ${idAlias}-${idAjeno}: ${exists ? 'Existe' : 'No existe'}`);
    
    if (!exists) {
      console.log(`No se encontró la relación ${idAlias}-${idAjeno} para eliminar o ya estaba eliminada`);
      return false;
    }
    
    const updateQuery = `
      UPDATE AJENOS.ALIAS_AJENO 
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias 
        AND ID_AJENO = :idAjeno
        AND FECHA_BAJA IS NULL
    `;
    
    try {
      await sequelizeAjenos.query(updateQuery, {
        replacements: { idAlias, idAjeno, usuarioBaja, fechaBaja },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      console.log(`Actualización de ALIAS_AJENO completada.`);
      
      return true;
    } catch (updateError) {
      console.error(`Error durante la actualización de ALIAS_AJENO: ${updateError.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error general al eliminar relación alias-artículo:`, error);
    return false;
  }
};

exports.updateAliasAmbitoAplanado = async (idAlias, idAjeno, usuarioModificacion, fechaModificacion) => {
  try {
    const findQuery = `
      SELECT aaa.ID_ALIAS_AMBITO_APLANADO 
      FROM AJENOS.ALIAS_AMBITO aa 
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO 
      WHERE aa.ID_ALIAS = :idAlias AND aaa.ID_AJENO_SECCION_GLOBAL = :idAjeno
        AND aaa.FECHA_BAJA IS NULL
    `;
    
    const results = await sequelizeAjenos.query(findQuery, {
      replacements: { 
        idAlias,
        idAjeno
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    console.log(`Registros encontrados en ALIAS_AMBITO_APLANADO: ${results.length}`);
    
    if (!results || results.length === 0) {
      console.log(`No se encontraron registros para actualizar en ALIAS_AMBITO_APLANADO para idAlias=${idAlias}, idAjeno=${idAjeno}`);
      return 0;
    }
    
    const ids = results.map(row => row.ID_ALIAS_AMBITO_APLANADO);
    console.log(`IDs a actualizar en ALIAS_AMBITO_APLANADO: ${ids.join(', ')}`);
    
    const updateQuery = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO 
      SET USUARIO_MODIFICACION = :usuarioModificacion,
          FECHA_MODIFICACION = :fechaModificacion,
          ID_AJENO_SECCION_GLOBAL = NULL
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:ids)
    `;
    
    const [rowsAffected] = await sequelizeAjenos.query(updateQuery, {
      replacements: { 
        usuarioModificacion,
        fechaModificacion,
        ids
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Actualización de ALIAS_AMBITO_APLANADO completada.`);
    
    return rowsAffected;
  } catch (error) {
    console.error(`Error al actualizar ALIAS_AMBITO_APLANADO:`, error);
    throw error;
  }
};

/**
 * Actualiza el tipo de estado de un alias
 * @param {number} idAlias - ID del alias
 * @param {number} idTipoEstadoAlias - ID del tipo de estado
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<boolean>} - Resultado de la operación
 */
exports.updateTipoEstadoAlias = async (idAlias, idTipoEstadoAlias, usuarioModificacion, fechaModificacion) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS 
      SET ID_TIPO_ESTADO_ALIAS = :idTipoEstadoAlias, 
          USUARIO_MODIFICACION = :usuarioModificacion, 
          FECHA_MODIFICACION = :fechaModificacion
      WHERE ID_ALIAS = :idAlias
    `;
    
    const [result] = await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias, 
        idTipoEstadoAlias, 
        usuarioModificacion, 
        fechaModificacion 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    console.log(`Actualizado tipo estado alias ${idAlias} a ${idTipoEstadoAlias}. Filas afectadas:`, result);
    
    return result > 0;
  } catch (error) {
    console.error(`Error al actualizar tipo estado de alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Actualiza los idiomas del alias
 * @param {number} idAlias - ID del alias
 * @param {Array} idiomas - Lista de idiomas
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<boolean>} - Resultado de la operación
 */
exports.updateAliasIdioma = async (idAlias, idiomas, usuarioModificacion, fechaModificacion) => {
  try {
    // 1. Obtenemos los idiomas existentes para este alias
    const existingIdiomasQuery = `
      SELECT ID_IDIOMA as idIdioma, NOMBRE as nombre, DESCRIPCION as descripcion 
      FROM AJENOS.ALIAS_IDIOMA 
      WHERE ID_ALIAS = :idAlias
    `;
    
    const existingIdiomas = await sequelizeAjenos.query(existingIdiomasQuery, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    console.log(`Idiomas existentes para alias ${idAlias}:`, existingIdiomas);
    
    // 2. Identificamos los idiomas nuevos, eliminados y actualizados
    const existingIdiomasMap = new Map(existingIdiomas.map(idioma => [idioma.idIdioma, idioma]));
    const incomingIdiomasMap = new Map(idiomas.map(idioma => [idioma.idIdioma, idioma]));
    
    // Idiomas nuevos: los que están en la petición pero no en la BD
    const newIdiomas = idiomas.filter(idioma => !existingIdiomasMap.has(idioma.idIdioma));
    
    // Idiomas eliminados: los que están en la BD pero no en la petición
    const removedIdiomas = existingIdiomas.filter(idioma => !incomingIdiomasMap.has(idioma.idIdioma));
    
    // Idiomas actualizados: los que están en ambos pero han cambiado nombre o descripción
    const updatedIdiomas = idiomas.filter(idioma => {
      const existing = existingIdiomasMap.get(idioma.idIdioma);
      return existing && (
        existing.nombre !== idioma.nombre ||
        existing.descripcion !== idioma.descripcion
      );
    });
    
    console.log(`Nuevos idiomas: ${newIdiomas.length}, Eliminados: ${removedIdiomas.length}, Actualizados: ${updatedIdiomas.length}`);
    
    // 3. Aplicamos los cambios
    const operations = [];
    
    // Insertar nuevos idiomas
    if (newIdiomas.length > 0) {
      const insertQuery = `
        INSERT INTO AJENOS.ALIAS_IDIOMA (ID_ALIAS, ID_IDIOMA, NOMBRE, DESCRIPCION)
        VALUES (:idAlias, :idIdioma, :nombre, :descripcion)
      `;
      
      for (const idioma of newIdiomas) {
        const operation = sequelizeAjenos.query(insertQuery, {
          replacements: { 
            idAlias, 
            idIdioma: idioma.idIdioma, 
            nombre: idioma.nombre, 
            descripcion: idioma.descripcion 
          },
          type: sequelizeAjenos.QueryTypes.INSERT
        });
        operations.push(operation);
      }
    }
    
    // Eliminar idiomas removidos
    if (removedIdiomas.length > 0) {
      const deleteQuery = `
        DELETE FROM AJENOS.ALIAS_IDIOMA 
        WHERE ID_ALIAS = :idAlias AND ID_IDIOMA = :idIdioma
      `;
      
      for (const idioma of removedIdiomas) {
        const operation = sequelizeAjenos.query(deleteQuery, {
          replacements: { 
            idAlias, 
            idIdioma: idioma.idIdioma 
          },
          type: sequelizeAjenos.QueryTypes.DELETE
        });
        operations.push(operation);
      }
    }
    
    // Actualizar idiomas existentes
    if (updatedIdiomas.length > 0) {
      const updateQuery = `
        UPDATE AJENOS.ALIAS_IDIOMA 
        SET NOMBRE = :nombre, 
            DESCRIPCION = :descripcion 
        WHERE ID_ALIAS = :idAlias AND ID_IDIOMA = :idIdioma
      `;
      
      for (const idioma of updatedIdiomas) {
        const operation = sequelizeAjenos.query(updateQuery, {
          replacements: { 
            idAlias, 
            idIdioma: idioma.idIdioma, 
            nombre: idioma.nombre, 
            descripcion: idioma.descripcion 
          },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        operations.push(operation);
      }
    }
    
    // Ejecutamos todas las operaciones
    await Promise.all(operations);
    
    return newIdiomas.length > 0 || removedIdiomas.length > 0 || updatedIdiomas.length > 0;
  } catch (error) {
    console.error(`Error al actualizar idiomas de alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Actualiza los artículos asociados al alias
 * @param {number} idAlias - ID del alias
 * @param {Array} aliasAjeno - Lista de artículos
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<boolean>} - Resultado de la operación
 */
exports.updateAliasAjeno = async (idAlias, aliasAjeno, usuarioModificacion, fechaModificacion) => {
  try {
    console.log(`========== INICIO updateAliasAjeno para idAlias=${idAlias} ==========`);
    console.log(`Artículos recibidos en el request:`, JSON.stringify(aliasAjeno, null, 2));
    
    let aliasUntrained = false;
    
    // 1. Obtenemos los artículos existentes para este alias
    const existingAliasAjenoQuery = `
      SELECT ID_ALIAS as idAlias, 
        ID_AJENO as idAjeno, 
        ID_TIPO_ESTADO_AJENO_RAM as idTipoEstadoAjenoRam,
        ID_SINT as idSint,
        FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_AJENO 
      WHERE ID_ALIAS = :idAlias
    `;
    
    console.log(`Ejecutando consulta SQL para obtener artículos existentes:`, existingAliasAjenoQuery);
    
    const existingAliasAjeno = await sequelizeAjenos.query(existingAliasAjenoQuery, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    console.log(`Artículos existentes encontrados para alias ${idAlias}:`, JSON.stringify(existingAliasAjeno, null, 2));
    console.log(`Total artículos existentes: ${existingAliasAjeno.length}`);
    
    // 2. Identificamos los artículos nuevos, eliminados y actualizados
    
    // Nuevos artículos: los que están en la petición pero no en la BD
    const newAliasAjeno = aliasAjeno.filter(ajeno => 
      !existingAliasAjeno.some(existing => 
        existing.idAjeno === ajeno.idAjeno &&
        existing.idAlias === idAlias
      )
    );
    
    console.log(`Artículos nuevos identificados:`, JSON.stringify(newAliasAjeno, null, 2));
    
    // Artículos eliminados: los que están en la BD pero no en la petición
    const removedAliasAjeno = existingAliasAjeno.filter(existing => 
      !aliasAjeno.some(ajeno => 
        ajeno.idAjeno === existing.idAjeno && 
        idAlias === existing.idAlias
      ) && existing.fechaBaja === null // Solo consideramos los que no tienen fecha de baja
    );
    
    console.log(`Artículos a eliminar identificados:`, JSON.stringify(removedAliasAjeno, null, 2));

    // Artículos a restaurar: los que tienen fecha de baja pero están en la petición actual
    const restoreAliasAjeno = aliasAjeno.filter(ajeno => 
      existingAliasAjeno.some(existing => 
        existing.idAjeno === ajeno.idAjeno && 
        existing.idAlias === idAlias && 
        existing.fechaBaja !== null
      )
    );
    
    console.log(`Artículos a restaurar identificados:`, JSON.stringify(restoreAliasAjeno, null, 2));
    
    // Artículos actualizados: los que están en ambos pero cambiaron estado o idSint
    const existingUpdatedAliasAjeno = aliasAjeno.filter(ajeno => {
      const existing = existingAliasAjeno.find(e => 
        e.idAjeno === ajeno.idAjeno && 
        e.idAlias === idAlias &&
        e.fechaBaja === null // Solo consideramos los activos
      );

      if (!existing) return false;
      
      const needsUpdate = 
        existing.idTipoEstadoAjenoRam !== ajeno.idTipoEstadoAjenoRam ||
        (existing.idSint && existing.idSint !== ajeno.idSint) ||
        (!existing.idSint && ajeno.idSint);
        
      console.log(`Evaluando actualización para artículo ${ajeno.idAjeno}:
        - Estado RAM actual: ${existing.idTipoEstadoAjenoRam}, nuevo: ${ajeno.idTipoEstadoAjenoRam}
        - SINT actual: ${existing.idSint}, nuevo: ${ajeno.idSint}
        - ¿Necesita actualización?: ${needsUpdate}`);
        
      return needsUpdate;
    });
    
    console.log(`Artículos a actualizar identificados:`, JSON.stringify(existingUpdatedAliasAjeno, null, 2));
    console.log(`Resumen - Nuevos: ${newAliasAjeno.length}, Eliminados: ${removedAliasAjeno.length}, Restaurar: ${restoreAliasAjeno.length}, Actualizados: ${existingUpdatedAliasAjeno.length}`);
    
    // 3. Aplicamos los cambios
    const operations = [];
    
    // Insertar nuevos artículos
    if (newAliasAjeno.length > 0) {
      const insertQuery = `
        INSERT INTO AJENOS.ALIAS_AJENO 
        (ID_ALIAS, ID_AJENO, ID_TIPO_ESTADO_AJENO_RAM, ID_SINT, USUARIO_ALTA, FECHA_ALTA)
        VALUES (:idAlias, :idAjeno, :idTipoEstadoAjenoRam, :idSint, :usuarioAlta, :fechaAlta)
      `;
      
      console.log(`Preparando inserción de ${newAliasAjeno.length} nuevos artículos con query:`, insertQuery);
      
      for (const ajeno of newAliasAjeno) {
        console.log(`Insertando artículo: ${ajeno.idAjeno} con estado ${ajeno.idTipoEstadoAjenoRam} y SINT ${ajeno.idSint || 'NULL'}`);
        
        const operation = sequelizeAjenos.query(insertQuery, {
          replacements: { 
            idAlias, 
            idAjeno: ajeno.idAjeno, 
            idTipoEstadoAjenoRam: ajeno.idTipoEstadoAjenoRam, 
            idSint: ajeno.idSint || null, 
            usuarioAlta: usuarioModificacion, 
            fechaAlta: fechaModificacion 
          },
          type: sequelizeAjenos.QueryTypes.INSERT
        });
        operations.push(operation);
      }
      
      aliasUntrained = true;
    }
    
    // Eliminar artículos removidos (marcarlos como dados de baja)
    if (removedAliasAjeno.length > 0) {
      const deleteQuery = `
        UPDATE AJENOS.ALIAS_AJENO 
        SET FECHA_BAJA = :fechaBaja, 
            USUARIO_BAJA = :usuarioBaja
        WHERE ID_ALIAS = :idAlias AND ID_AJENO = :idAjeno AND FECHA_BAJA IS NULL
      `;
      
      console.log(`Preparando eliminación (baja lógica) de ${removedAliasAjeno.length} artículos con query:`, deleteQuery);
      
      for (const ajeno of removedAliasAjeno) {
        console.log(`Marcando como baja el artículo: ${ajeno.idAjeno}`);
        
        const operation = sequelizeAjenos.query(deleteQuery, {
          replacements: { 
            idAlias, 
            idAjeno: ajeno.idAjeno, 
            fechaBaja: fechaModificacion, 
            usuarioBaja: usuarioModificacion 
          },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        operations.push(operation);
      }
      
      aliasUntrained = true;
    }

    // Restaurar artículos dados de baja que ahora se deben reactivar
    if (restoreAliasAjeno.length > 0) {
      const restoreQuery = `
        UPDATE AJENOS.ALIAS_AJENO 
        SET ID_TIPO_ESTADO_AJENO_RAM = :idTipoEstadoAjenoRam, 
            ID_SINT = :idSint, 
            FECHA_MODIFICACION = :fechaModificacion, 
            USUARIO_MODIFICACION = :usuarioModificacion,
            FECHA_BAJA = NULL, 
            USUARIO_BAJA = NULL
        WHERE ID_ALIAS = :idAlias AND ID_AJENO = :idAjeno AND FECHA_BAJA IS NOT NULL
      `;
      
      console.log(`Preparando restauración de ${restoreAliasAjeno.length} artículos con query:`, restoreQuery);
      
      for (const ajeno of restoreAliasAjeno) {
        console.log(`Restaurando artículo: ${ajeno.idAjeno} con estado ${ajeno.idTipoEstadoAjenoRam} y SINT ${ajeno.idSint || 'NULL'}`);
        
        const operation = sequelizeAjenos.query(restoreQuery, {
          replacements: { 
            idAlias, 
            idAjeno: ajeno.idAjeno, 
            idTipoEstadoAjenoRam: ajeno.idTipoEstadoAjenoRam, 
            idSint: ajeno.idSint || null, 
            fechaModificacion, 
            usuarioModificacion 
          },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        operations.push(operation);
      }
      
      aliasUntrained = true;
    }
    
    // Actualizar artículos existentes
    if (existingUpdatedAliasAjeno.length > 0) {
      const updateQuery = `
        UPDATE AJENOS.ALIAS_AJENO 
        SET ID_TIPO_ESTADO_AJENO_RAM = :idTipoEstadoAjenoRam, 
            ID_SINT = :idSint, 
            FECHA_MODIFICACION = :fechaModificacion, 
            USUARIO_MODIFICACION = :usuarioModificacion
        WHERE ID_ALIAS = :idAlias AND ID_AJENO = :idAjeno AND FECHA_BAJA IS NULL
      `;
      
      console.log(`Preparando actualización de ${existingUpdatedAliasAjeno.length} artículos con query:`, updateQuery);
      
      for (const ajeno of existingUpdatedAliasAjeno) {
        console.log(`Actualizando artículo: ${ajeno.idAjeno} a estado ${ajeno.idTipoEstadoAjenoRam} y SINT ${ajeno.idSint || 'NULL'}`);
        
        const operation = sequelizeAjenos.query(updateQuery, {
          replacements: { 
            idAlias, 
            idAjeno: ajeno.idAjeno, 
            idTipoEstadoAjenoRam: ajeno.idTipoEstadoAjenoRam, 
            idSint: ajeno.idSint || null, 
            fechaModificacion, 
            usuarioModificacion 
          },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
        operations.push(operation);
      }
      
      aliasUntrained = true;
    }
    
    console.log(`Ejecutando ${operations.length} operaciones en la base de datos...`);
    
    // Ejecutamos todas las operaciones
    await Promise.all(operations);
    
    console.log(`Operaciones completadas. Alias entrenado: ${aliasUntrained}`);
    console.log(`========== FIN updateAliasAjeno para idAlias=${idAlias} ==========`);
    
    return aliasUntrained;
  } catch (error) {
    console.error(`ERROR en updateAliasAjeno para idAlias=${idAlias}:`, error);
    throw error;
  }
};

/**
 * Encuentra los acoples asociados a un alias acople específico
 * @param {number} idAliasAcople - ID del alias acople
 * @returns {Promise<Array>} - Lista de acoples
 */
exports.findAcoplesByIdAliasAcople = async (idAliasAcople) => {
  try {
    const query = `
      SELECT 
        aa.ID_ALIAS as idAlias, 
        aa.ID_ALIAS_ACOPLE as idAliasAcople, 
        aa.RATIO_ACOPLE as ratioAcople, 
        aa.FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_ACOPLE aa
      WHERE aa.ID_ALIAS_ACOPLE = :idAliasAcople
        AND aa.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAliasAcople },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar acoples para el alias acople ${idAliasAcople}:`, error);
    throw error;
  }
};

/**
 * Actualiza los acoples de un alias
 * @param {number} idAliasAcople - ID del alias acople
 * @param {Array} acoples - Lista de acoples
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<boolean>} - Indica si se realizaron cambios que requieren marcar el alias como no entrenado
 */
exports.updateAliasAcople = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    let aliasUntrained = false;
    
    // 1. Obtenemos los acoples existentes
    const aliasAcopleByIdAcople = await exports.findAcoplesByIdAliasAcople(idAliasAcople);
    
    // 2. Identificamos acoples añadidos, eliminados y actualizados
    const aliasAcopleAdded = acoples.filter(acople => 
      !aliasAcopleByIdAcople.some(existing => 
        existing.idAlias === acople.idAlias && existing.fechaBaja === null
      )
    );
    
    const aliasAcopleRemoved = aliasAcopleByIdAcople.filter(existing => 
      !acoples.some(acople => 
        acople.idAlias === existing.idAlias && existing.fechaBaja === null
      )
    );
    
    const aliasAcopleUpdated = acoples.filter(acople => 
      aliasAcopleByIdAcople.some(existing => 
        existing.idAlias === acople.idAlias && 
        (existing.fechaBaja !== null || existing.ratioAcople !== acople.ratioAcople)
      )
    );
    
    console.log(`Para alias acople ${idAliasAcople} - añadidos: ${aliasAcopleAdded.length}, eliminados: ${aliasAcopleRemoved.length}, actualizados: ${aliasAcopleUpdated.length}`);
    
    // 3. Procesamos los cambios
    
    // Añadir nuevos acoples o restaurar los que tenían fecha de baja
    if (aliasAcopleAdded.length > 0) {
      for (const aliasAcople of aliasAcopleAdded) {
        // Verificar si existe con fecha de baja
        const checkExistingQuery = `
          SELECT 1 FROM AJENOS.ALIAS_ACOPLE 
          WHERE ID_ALIAS = :idAlias 
            AND ID_ALIAS_ACOPLE = :idAliasAcople
        `;
        
        const existingResult = await sequelizeAjenos.query(checkExistingQuery, {
          replacements: { 
            idAlias: aliasAcople.idAlias, 
            idAliasAcople 
          },
          type: sequelizeAjenos.QueryTypes.SELECT
        });
        
        if (existingResult.length > 0) {
          // Actualizar registro existente (restaurar)
          const updateQuery = `
            UPDATE AJENOS.ALIAS_ACOPLE 
            SET FECHA_BAJA = NULL, 
                USUARIO_BAJA = NULL,
                FECHA_MODIFICACION = :fechaModificacion,
                USUARIO_MODIFICACION = :usuarioModificacion
            WHERE ID_ALIAS = :idAlias 
              AND ID_ALIAS_ACOPLE = :idAliasAcople
          `;
          
          await sequelizeAjenos.query(updateQuery, {
            replacements: {
              idAlias: aliasAcople.idAlias,
              idAliasAcople,
              usuarioModificacion,
              fechaModificacion
            },
            type: sequelizeAjenos.QueryTypes.UPDATE
          });
        } else {
          // Insertar nuevo acople
          const insertQuery = `
            INSERT INTO AJENOS.ALIAS_ACOPLE (
              ID_ALIAS, 
              ID_ALIAS_ACOPLE, 
              RATIO_ACOPLE, 
              USUARIO_ALTA, 
              FECHA_ALTA
            ) VALUES (
              :idAlias, 
              :idAliasAcople, 
              :ratioAcople, 
              :usuarioAlta, 
              :fechaAlta
            )
          `;
          
          await sequelizeAjenos.query(insertQuery, {
            replacements: {
              idAlias: aliasAcople.idAlias,
              idAliasAcople,
              ratioAcople: aliasAcople.ratioAcople,
              usuarioAlta: usuarioModificacion,
              fechaAlta: fechaModificacion
            },
            type: sequelizeAjenos.QueryTypes.INSERT
          });
        }
      }
      
      aliasUntrained = true;
    }
    
    // Eliminar acoples (marcar como dados de baja)
    if (aliasAcopleRemoved.length > 0) {
      const idsAlias = aliasAcopleRemoved.map(acople => acople.idAlias);
      
      const deleteQuery = `
        UPDATE AJENOS.ALIAS_ACOPLE 
        SET USUARIO_BAJA = :usuarioBaja, 
            FECHA_BAJA = :fechaBaja
        WHERE ID_ALIAS_ACOPLE = :idAliasAcople 
          AND ID_ALIAS IN (:idsAlias)
      `;
      
      await sequelizeAjenos.query(deleteQuery, {
        replacements: {
          idAliasAcople,
          idsAlias,
          usuarioBaja: usuarioModificacion,
          fechaBaja: fechaModificacion
        },
        type: sequelizeAjenos.QueryTypes.UPDATE
      });
      
      aliasUntrained = true;
    }
    
    // Actualizar acoples existentes
    if (aliasAcopleUpdated.length > 0) {
      for (const acople of aliasAcopleUpdated) {
        const updateQuery = `
          UPDATE AJENOS.ALIAS_ACOPLE 
          SET RATIO_ACOPLE = :ratioAcople, 
              USUARIO_BAJA = NULL, 
              FECHA_BAJA = NULL, 
              USUARIO_MODIFICACION = :usuarioModificacion,
              FECHA_MODIFICACION = :fechaModificacion 
          WHERE ID_ALIAS_ACOPLE = :idAliasAcople 
            AND ID_ALIAS = :idAlias
        `;
        
        await sequelizeAjenos.query(updateQuery, {
          replacements: {
            idAliasAcople,
            idAlias: acople.idAlias,
            ratioAcople: acople.ratioAcople,
            usuarioModificacion,
            fechaModificacion
          },
          type: sequelizeAjenos.QueryTypes.UPDATE
        });
      }
      
      aliasUntrained = true;
    }
    
    return aliasUntrained;
  } catch (error) {
    console.error(`Error al actualizar acoples para el alias ${idAliasAcople}:`, error);
    throw error;
  }
};

/**
 * Encuentra alias acople tarea por alias acople
 * @param {number} idAliasAcople - ID del alias acople
 * @returns {Promise<Array>} - Lista de alias acople tarea
 */
exports.findAliasAcopleTareaByIdAliasAcople = async (idAliasAcople) => {
  try {
    const query = `
      SELECT 
        ID_ALIAS as idAlias,
        ID_ALIAS_ACOPLE as idAliasAcople,
        ID_TAREA_RAM as idTarea,
        ID_TIPO_ORIGEN_DATO_ALIAS as idTipoOrigenDatoAlias,
        USUARIO_ALTA as usuarioAlta,
        FECHA_ALTA as fechaAlta,
        USUARIO_MODIFICACION as usuarioModificacion,
        FECHA_MODIFICACION as fechaModificacion,
        USUARIO_BAJA as usuarioBaja,
        FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_ACOPLE_TAREA
      WHERE ID_ALIAS_ACOPLE = :idAliasAcople
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAliasAcople },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar alias acople tarea para el alias acople ${idAliasAcople}:`, error);
    throw error;
  }
};

/**
 * Actualiza alias acople tarea
 * @param {number} idAliasAcople - ID del alias acople
 * @param {Array} acoples - Lista de acoples
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<void>}
 */
exports.updateAliasAcopleTarea = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    // Obtener los registros de alias_acople_tarea para el alias acople
    const aliasAcopleTareaByIdAcople = await exports.findAliasAcopleTareaByIdAliasAcople(idAliasAcople);
    
    // Agrupar por idTarea
    const aliasAcopleTareaByTarea = {};
    for (const aliasAcopleTarea of aliasAcopleTareaByIdAcople) {
      if (!aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea]) {
        aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea] = [];
      }
      aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea].push(aliasAcopleTarea);
    }
    
    // Lista para almacenar todos los cambios
    const aliasAcopleTareaUpdated = [];
    
    for (const [idTarea, aliasAcopleTareas] of Object.entries(aliasAcopleTareaByTarea)) {
      // Acoples añadidos: los que están en la lista de acoples pero no en aliasAcopleTareas
      const acoplesAdded = acoples.filter(acople => 
        !aliasAcopleTareas.some(existing => existing.idAlias === acople.idAlias)
      );
      
      // Acoples eliminados: los que están en aliasAcopleTareas pero no en la lista de acoples y no tienen fecha de baja
      const aliasAcopleTareasRemoved = aliasAcopleTareas.filter(existing => 
        !acoples.some(acople => acople.idAlias === existing.idAlias && existing.fechaBaja === null)
      );
      
      // Acoples a restaurar: los que están en ambas listas pero tienen fecha de baja
      const acoplesRestored = aliasAcopleTareas.filter(existing => 
        acoples.some(acople => acople.idAlias === existing.idAlias && existing.fechaBaja !== null)
      );
      
      // Procesar cada tipo de cambio
      if (acoplesAdded.length > 0) {
        for (const acople of acoplesAdded) {
          // Crear objeto para inserción
          aliasAcopleTareaUpdated.push({
            idAlias: acople.idAlias,
            idAliasAcople,
            idTarea,
            idTipoOrigenDatoAlias: 1, 
            usuarioAlta: usuarioModificacion,
            fechaAlta: fechaModificacion,
            fechaBaja: null,
            usuarioBaja: null
          });
        }
      }
      
      if (aliasAcopleTareasRemoved.length > 0) {
        for (const aliasAcopleDeleted of aliasAcopleTareasRemoved) {
          // Marcar para eliminación (fecha de baja)
          aliasAcopleDeleted.fechaBaja = fechaModificacion;
          aliasAcopleDeleted.usuarioBaja = usuarioModificacion;
          aliasAcopleTareaUpdated.push(aliasAcopleDeleted);
        }
      }
      
      if (acoplesRestored.length > 0) {
        for (const restored of acoplesRestored) {
          // Restaurar eliminando fecha de baja
          restored.fechaBaja = null;
          restored.usuarioBaja = null;
          restored.fechaModificacion = fechaModificacion;
          restored.usuarioModificacion = usuarioModificacion;
          aliasAcopleTareaUpdated.push(restored);
        }
      }
    }
    
    // Realizar las actualizaciones e inserciones
    if (aliasAcopleTareaUpdated.length > 0) {
      for (const item of aliasAcopleTareaUpdated) {
        if (!item.id) {
          // Inserción de un nuevo registro
          const insertQuery = `
            INSERT INTO AJENOS.ALIAS_ACOPLE_TAREA (
              ID_ALIAS, 
              ID_ALIAS_ACOPLE, 
              ID_TAREA_RAM, 
              ID_TIPO_ORIGEN_DATO_ALIAS, 
              USUARIO_ALTA, 
              FECHA_ALTA
            ) VALUES (
              :idAlias, 
              :idAliasAcople, 
              :idTarea, 
              :idTipoOrigenDatoAlias, 
              :usuarioAlta, 
              :fechaAlta
            )
          `;
          
          await sequelizeAjenos.query(insertQuery, {
            replacements: {
              idAlias: item.idAlias,
              idAliasAcople: item.idAliasAcople,
              idTarea: item.idTarea,
              idTipoOrigenDatoAlias: item.idTipoOrigenDatoAlias,
              usuarioAlta: item.usuarioAlta,
              fechaAlta: item.fechaAlta
            },
            type: sequelizeAjenos.QueryTypes.INSERT
          });
        } else if (item.fechaBaja !== null) {
          // Marcar como eliminado
          const deleteQuery = `
            UPDATE AJENOS.ALIAS_ACOPLE_TAREA 
            SET FECHA_BAJA = :fechaBaja, 
                USUARIO_BAJA = :usuarioBaja
            WHERE ID_ALIAS = :idAlias 
              AND ID_ALIAS_ACOPLE = :idAliasAcople 
              AND ID_TAREA_RAM = :idTarea
          `;
          
          await sequelizeAjenos.query(deleteQuery, {
            replacements: {
              idAlias: item.idAlias,
              idAliasAcople: item.idAliasAcople,
              idTarea: item.idTarea,
              fechaBaja: item.fechaBaja,
              usuarioBaja: item.usuarioBaja
            },
            type: sequelizeAjenos.QueryTypes.UPDATE
          });
        } else {
          // Actualizar o restaurar
          const updateQuery = `
            UPDATE AJENOS.ALIAS_ACOPLE_TAREA 
            SET FECHA_BAJA = NULL, 
                USUARIO_BAJA = NULL, 
                FECHA_MODIFICACION = :fechaModificacion, 
                USUARIO_MODIFICACION = :usuarioModificacion
            WHERE ID_ALIAS = :idAlias 
              AND ID_ALIAS_ACOPLE = :idAliasAcople 
              AND ID_TAREA_RAM = :idTarea
          `;
          
          await sequelizeAjenos.query(updateQuery, {
            replacements: {
              idAlias: item.idAlias,
              idAliasAcople: item.idAliasAcople,
              idTarea: item.idTarea,
              fechaModificacion: item.fechaModificacion,
              usuarioModificacion: item.usuarioModificacion
            },
            type: sequelizeAjenos.QueryTypes.UPDATE
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error al actualizar alias acople tarea para el alias acople ${idAliasAcople}:`, error);
    throw error;
  }
};

/**
 * Encuentra IDs de tarea por IDs de alias principal
 * @param {Array<number>} idsMainAlias - Lista de IDs de alias principales
 * @returns {Promise<Array<number>>} - Lista de IDs de tarea
 */
exports.findIdsTareaByIdsMainAlias = async (idsMainAlias) => {
  try {
    const query = `
      SELECT DISTINCT at.ID_TAREA_RAM as idTarea
      FROM AJENOS.ALIAS_TAREA at
      WHERE at.ID_ALIAS IN (:idsMainAlias)
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idsMainAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => item.idTarea);
  } catch (error) {
    console.error(`Error al buscar IDs de tarea por IDs de alias principal:`, error);
    throw error;
  }
};

/**
 * Encuentra alias tarea por ID de tarea
 * @param {number} idTarea - ID de tarea
 * @returns {Promise<Array>} - Lista de alias tarea
 */
exports.findAliasTareaByIdTarea = async (idTarea) => {
  try {
    const query = `
      SELECT *
      FROM AJENOS.ALIAS_TAREA at
      WHERE at.ID_TAREA_RAM = :idTarea
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idTarea },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar alias tarea para la tarea ${idTarea}:`, error);
    throw error;
  }
};

/**
 * Actualiza alias tarea
 * @param {number} idAliasAcople - ID del alias acople
 * @param {Array} acoples - Lista de acoples
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @param {Date} fechaModificacion - Fecha de modificación
 * @returns {Promise<void>}
 */
exports.updateAliasTarea = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    if (!acoples || acoples.length === 0) {
      console.log('No hay acoples para actualizar en alias tarea');
      return;
    }
    
    // Obtener IDs de tareas relacionadas con los alias principales
    const idsMainAlias = acoples.map(acople => acople.idAlias);
    const idsTarea = await exports.findIdsTareaByIdsMainAlias(idsMainAlias);
    
    if (idsTarea.length === 0) {
      console.log('No se encontraron tareas relacionadas con los alias principales');
      return;
    }
    
    // Para cada tarea, procesamos los cambios
    for (const idTarea of idsTarea) {
      const aliasTareaByIdTarea = await exports.findAliasTareaByIdTarea(idTarea);
      
      // Acoples a añadir
      const acoplesAdded = acoples.filter(acople => 
        !aliasTareaByIdTarea.some(existing => existing.ID_ALIAS === acople.idAlias)
      );
      
      // Acoples a eliminar
      const aliasTareaRemoved = aliasTareaByIdTarea.filter(existing => 
        !acoples.some(acople => acople.idAlias === existing.ID_ALIAS)
      );
      
      // Acoples a restaurar
      const acoplesRestored = aliasTareaByIdTarea.filter(existing => 
        acoples.some(acople => acople.idAlias === existing.ID_ALIAS && existing.FECHA_BAJA !== null)
      );
      
      // Procesamos las inserciones
      if (acoplesAdded.length > 0) {
        for (const acople of acoplesAdded) {
          // Determinamos el ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS basado en el tipo de alias
          const idTipoConexionOrigenDatoAlias = acople.idTipoAlias === 2 ? 1 : null; // 2 = TIPO_II, 1 = PRINCIPAL
          
          const insertQuery = `
            INSERT INTO AJENOS.ALIAS_TAREA (
              ID_ALIAS, 
              ID_TAREA_RAM, 
              ID_TIPO_ALIAS, 
              ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
              USUARIO_ALTA, 
              FECHA_ALTA
            ) VALUES (
              :idAlias, 
              :idTarea, 
              :idTipoAlias, 
              :idTipoConexionOrigenDatoAlias, 
              :usuarioAlta, 
              :fechaAlta
            )
          `;
          
          await sequelizeAjenos.query(insertQuery, {
            replacements: {
              idAlias: acople.idAlias,
              idTarea,
              idTipoAlias: acople.idTipoAlias,
              idTipoConexionOrigenDatoAlias,
              usuarioAlta: usuarioModificacion,
              fechaAlta: fechaModificacion
            },
            type: sequelizeAjenos.QueryTypes.INSERT
          });
        }
      }
      
      // Procesamos las eliminaciones
      if (aliasTareaRemoved.length > 0) {
        for (const removed of aliasTareaRemoved) {
          const deleteQuery = `
            UPDATE AJENOS.ALIAS_TAREA
            SET FECHA_BAJA = :fechaBaja, 
                USUARIO_BAJA = :usuarioBaja
            WHERE ID_ALIAS = :idAlias 
              AND ID_TAREA_RAM = :idTarea
          `;
          
          await sequelizeAjenos.query(deleteQuery, {
            replacements: {
              idAlias: removed.ID_ALIAS,
              idTarea,
              fechaBaja: fechaModificacion,
              usuarioBaja: usuarioModificacion
            },
            type: sequelizeAjenos.QueryTypes.UPDATE
          });
        }
      }
      
      // Procesamos las restauraciones
      if (acoplesRestored.length > 0) {
        for (const restored of acoplesRestored) {
          const restoreQuery = `
            UPDATE AJENOS.ALIAS_TAREA
            SET FECHA_BAJA = NULL, 
                USUARIO_BAJA = NULL, 
                FECHA_MODIFICACION = :fechaModificacion, 
                USUARIO_MODIFICACION = :usuarioModificacion
            WHERE ID_ALIAS = :idAlias 
              AND ID_TAREA_RAM = :idTarea
          `;
          
          await sequelizeAjenos.query(restoreQuery, {
            replacements: {
              idAlias: restored.ID_ALIAS,
              idTarea,
              fechaModificacion,
              usuarioModificacion
            },
            type: sequelizeAjenos.QueryTypes.UPDATE
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error al actualizar alias tarea para el alias acople ${idAliasAcople}:`, error);
    throw error;
  }
};

// Agregar estos métodos al aliasRepository.js

/**
 * Obtiene el ID de ámbito de alias para un alias específico
 * @param {number} idAlias - ID del alias
 * @returns {Promise<number|null>} - ID del ámbito o null si no existe
 */
exports.getIdAliasAmbito = async (idAlias) => {
  try {
    const query = `
      SELECT aa.ID_ALIAS_AMBITO as idAliasAmbito
      FROM AJENOS.ALIAS_AMBITO aa
      WHERE aa.ID_ALIAS = :idAlias
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.length > 0 ? result[0].idAliasAmbito : null;
  } catch (error) {
    console.error(`Error al obtener ID de ámbito para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Encuentra localizaciones de compra por cadena y mercado
 * @param {Array<number>} idsCadena - IDs de cadena
 * @param {Array<number>} idsMercado - IDs de mercado
 * @returns {Promise<Array>} - Lista de localizaciones
 */
exports.findLocalizacionCompraByCadenaMercado = async (idsCadena, idsMercado) => {
  try {
    // IDs de estado de tienda válidos (ABIERTA, ENREFORMA, PROVISIONAL)
    const idsEstadoTienda = [1, 3, 4]; // Valores constantes según el código Java
    
    const query = `
      SELECT 
        lc.ID_LOCALIZACION_COMPRA as idLocalizacion,
        lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam
      FROM AJENOS.LOCALIZACION_COMPRA lc
      INNER JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lcr.ID_LOCALIZACION_COMPRA = lc.ID_LOCALIZACION_COMPRA
      INNER JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION_COMPRA
      INNER JOIN MAESTROS.TIENDA_HISTORICO th ON th.ID_TIENDA = t.ID_TIENDA 
        AND th.ID_ESTADO_TIENDA IN (:idsEstadoTienda)
        AND th.ESTADO_VIGENTE = 1
      WHERE lc.ID_PAIS IN (:idsMercado) 
        AND lc.ID_CADENA IN (:idsCadena) 
        AND t.ID_CADENA IN (:idsCadena)
        AND lc.ID_TIPO_LOCALIZACION_COMPRA = 1 
        AND t.ID_TIPO_TIENDA IN (1, 2, 5, 10)
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idsCadena, 
        idsMercado, 
        idsEstadoTienda 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => ({
      idLocalizacionCompra: item.idLocalizacion,
      idTipoEstadoLocalizacionRam: item.idTipoEstadoLocalizacionRam
    }));
  } catch (error) {
    console.error('Error al buscar localizaciones por cadena y mercado:', error);
    throw error;
  }
};

/**
 * Crea un nuevo ámbito de alias
 * @param {number} idAlias - ID del alias
 * @param {Date} fechaAlta - Fecha de alta
 * @param {string} usuarioAlta - Usuario que crea el registro
 * @returns {Promise<number>} - ID del nuevo ámbito creado
 */
exports.createAliasAmbito = async (idAlias, fechaAlta, usuarioAlta) => {
  try {
    // ID_TIPO_REGLA_AMBITO = 1 (CADENA_Y_MERCADO)
    const idTipoReglaAmbito = 1;
    
    const query = `
      INSERT INTO AJENOS.ALIAS_AMBITO (
        ID_ALIAS, 
        ID_TIPO_REGLA_AMBITO, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        :idAlias, 
        :idTipoReglaAmbito, 
        :usuarioAlta, 
        :fechaAlta
      )
    `;
    
    const [result, metadata] = await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias, 
        idTipoReglaAmbito, 
        usuarioAlta, 
        fechaAlta 
      },
      type: sequelizeAjenos.QueryTypes.INSERT
    });
    
    // Obtener el ID generado
    const newIdQuery = `
      SELECT ID_ALIAS_AMBITO as idAliasAmbito
      FROM AJENOS.ALIAS_AMBITO
      WHERE ID_ALIAS = :idAlias
      ORDER BY ID_ALIAS_AMBITO DESC
      LIMIT 1
    `;
    
    const newIdResult = await sequelizeAjenos.query(newIdQuery, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    if (newIdResult.length === 0) {
      throw new Error(`No se pudo obtener el ID de ámbito recién creado para el alias ${idAlias}`);
    }
    
    return newIdResult[0].idAliasAmbito;
  } catch (error) {
    console.error(`Error al crear ámbito para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Crea registros de ámbito aplanado para un ámbito de alias
 * @param {number} idAliasAmbito - ID del ámbito de alias
 * @param {Date} fechaAlta - Fecha de alta
 * @param {string} usuarioAlta - Usuario que crea el registro
 * @param {Array} localizaciones - Lista de localizaciones
 * @returns {Promise<void>}
 */
exports.createAliasAmbitoAplanado = async (idAliasAmbito, fechaAlta, usuarioAlta, localizaciones) => {
  try {
    if (!localizaciones || localizaciones.length === 0) {
      console.log('No hay localizaciones para crear ámbito aplanado');
      return;
    }
    
    // Obtener el máximo ID actual
    const maxIdQuery = `
      SELECT MAX(ID_ALIAS_AMBITO_APLANADO) as maxId
      FROM AJENOS.ALIAS_AMBITO_APLANADO
    `;
    
    const maxIdResult = await sequelizeAjenos.query(maxIdQuery, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    let nextId = 1; // Valor por defecto si no hay registros
    if (maxIdResult && maxIdResult.length > 0 && maxIdResult[0].maxId) {
      nextId = maxIdResult[0].maxId + 1;
    }
    
    // Preparar los valores para inserción
    const insertValues = localizaciones.map((localizacion, index) => {
      const currentId = nextId + index;
      return `(
        ${currentId}, 
        ${idAliasAmbito}, 
        ${localizacion.idLocalizacionCompra}, 
        ${localizacion.idTipoEstadoLocalizacionRam}, 
        '${usuarioAlta}', 
        '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}', 
        1
      )`;
    }).join(', ');
    
    const query = `
      INSERT INTO AJENOS.ALIAS_AMBITO_APLANADO (
        ID_ALIAS_AMBITO_APLANADO,
        ID_ALIAS_AMBITO, 
        ID_LOCALIZACION_COMPRA, 
        ID_TIPO_ESTADO_LOCALIZACION_RAM,
        USUARIO_ALTA, 
        FECHA_ALTA, 
        ES_SOLICITABLE
      ) VALUES ${insertValues}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error(`Error al crear ámbito aplanado para el ámbito ${idAliasAmbito}:`, error);
    throw error;
  }
};

/**
 * Crea stock de localización para un alias
 * @param {number} idAlias - ID del alias
 * @param {Array<number>} idsLocalizacion - IDs de localización
 * @param {number|null} stockMaximo - Stock máximo
 * @param {Date} fechaAlta - Fecha de alta
 * @param {string} usuarioAlta - Usuario que crea el registro
 * @returns {Promise<void>}
 */
exports.createStockLocalizacion = async (idAlias, idsLocalizacion, stockMaximo, fechaAlta, usuarioAlta) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      console.log('No hay localizaciones para crear stock');
      return;
    }
    
    // Preparar los valores para inserción
    const insertValues = idsLocalizacion.map(idLocalizacion => `(
      ${idAlias}, 
      ${idLocalizacion}, 
      ${stockMaximo === null ? 'NULL' : stockMaximo}, 
      '${usuarioAlta}', 
      '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
    )`).join(', ');
    
    const query = `
      INSERT INTO AJENOS.STOCK_LOCALIZACION_RAM (
        ID_ALIAS, 
        ID_LOCALIZACION_COMPRA, 
        STOCK_MAXIMO, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${insertValues}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error(`Error al crear stock de localización para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Encuentra registros de ámbito aplanado por ID de ámbito
 * @param {number} idAliasAmbito - ID del ámbito de alias
 * @returns {Promise<Array>} - Lista de registros
 */
exports.findAliasAmbitoAplanadoByIdAliasAmbito = async (idAliasAmbito) => {
  try {
    const query = `
      SELECT 
        ID_ALIAS_AMBITO_APLANADO as idAliasAmbitoAplanado, 
        ID_LOCALIZACION_COMPRA as idLocalizacionCompra, 
        FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_AMBITO_APLANADO
      WHERE ID_ALIAS_AMBITO = :idAliasAmbito
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAliasAmbito },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar ámbito aplanado para el ámbito ${idAliasAmbito}:`, error);
    throw error;
  }
};

/**
 * Encuentra registros de stock localización
 * @param {number} idAlias - ID del alias
 * @param {Array<number>} idsLocalizacion - IDs de localización
 * @returns {Promise<Array>} - Lista de registros
 */
exports.findStockLocalizacion = async (idAlias, idsLocalizacion) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      return [];
    }
    
    const query = `
      SELECT *
      FROM AJENOS.STOCK_LOCALIZACION_RAM
      WHERE ID_ALIAS = :idAlias
      AND ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias, 
        idsLocalizacion 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar stock de localización para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Obtiene el tipo de alias para un alias específico
 * @param {number} idAlias - ID del alias
 * @returns {Promise<number>} - ID del tipo de alias
 */
exports.findTypeAliasIdByIdAlias = async (idAlias) => {
  try {
    const query = `
      SELECT DISTINCT a.ID_TIPO_ALIAS as idTipoAlias
      FROM AJENOS.ALIAS a
      WHERE a.ID_ALIAS = :idAlias
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.length > 0 ? result[0].idTipoAlias : null;
  } catch (error) {
    console.error(`Error al obtener tipo de alias para ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Restaura registros de ámbito aplanado
 * @param {Array<number>} idsAliasAmbitoAplanado - IDs de registro a restaurar
 * @param {string} usuario - Usuario que realiza la modificación
 * @param {Date} fecha - Fecha de modificación
 * @returns {Promise<void>}
 */
exports.restoreAliasAmbitoAplanado = async (idsAliasAmbitoAplanado, usuario, fecha) => {
  try {
    if (!idsAliasAmbitoAplanado || idsAliasAmbitoAplanado.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO
      SET FECHA_BAJA = NULL, 
          USUARIO_BAJA = NULL, 
          USUARIO_MODIFICACION = :usuario, 
          FECHA_MODIFICACION = :fecha
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:idsAliasAmbitoAplanado)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsAliasAmbitoAplanado, 
        usuario, 
        fecha 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al restaurar ámbito aplanado:`, error);
    throw error;
  }
};

/**
 * Restaura registros de stock localización
 * @param {number} idAlias - ID del alias
 * @param {Array<number>} idsLocalizacion - IDs de localización
 * @param {Date} fechaModificacion - Fecha de modificación
 * @param {string} usuarioModificacion - Usuario que realiza la modificación
 * @returns {Promise<void>}
 */
exports.restoreStockLocalizacionByIdAlias = async (idAlias, idsLocalizacion, fechaModificacion, usuarioModificacion) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.STOCK_LOCALIZACION_RAM 
      SET USUARIO_BAJA = NULL, 
          FECHA_BAJA = NULL, 
          FECHA_MODIFICACION = :fechaModificacion, 
          USUARIO_MODIFICACION = :usuarioModificacion
      WHERE ID_ALIAS = :idAlias 
        AND ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias, 
        idsLocalizacion, 
        fechaModificacion, 
        usuarioModificacion 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al restaurar stock localización para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Elimina (marca como baja) registros de ámbito aplanado
 * @param {Array<number>} idsAliasAmbitoAplanado - IDs de registro a eliminar
 * @param {Date} fechaBaja - Fecha de baja
 * @param {string} usuarioBaja - Usuario que realiza la baja
 * @returns {Promise<void>}
 */
exports.deleteAliasAmbitoAplanado = async (idsAliasAmbitoAplanado, fechaBaja, usuarioBaja) => {
  try {
    if (!idsAliasAmbitoAplanado || idsAliasAmbitoAplanado.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO 
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:idsAliasAmbitoAplanado)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsAliasAmbitoAplanado, 
        fechaBaja, 
        usuarioBaja 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al eliminar ámbito aplanado:`, error);
    throw error;
  }
};

/**
 * Elimina (marca como baja) registros de stock localización
 * @param {number} idAlias - ID del alias
 * @param {Array<number>} idsLocalizacion - IDs de localización
 * @param {Date} fechaBaja - Fecha de baja
 * @param {string} usuarioBaja - Usuario que realiza la baja
 * @returns {Promise<void>}
 */
exports.deleteStockLocalizacionByIdAlias = async (idAlias, idsLocalizacion, fechaBaja, usuarioBaja) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.STOCK_LOCALIZACION_RAM 
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias 
        AND ID_LOCALIZACION_COMPRA IN (:idsLocalizacion)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idAlias, 
        idsLocalizacion, 
        fechaBaja, 
        usuarioBaja 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al eliminar stock localización para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Actualiza ámbito aplanado de un alias
 * @param {number} idAlias - ID del alias
 * @param {number} idAliasAmbito - ID del ámbito de alias
 * @param {Array} localizacionesCalculadas - Lista de localizaciones calculadas
 * @param {string} usuario - Usuario que realiza la modificación
 * @param {Date} fecha - Fecha de modificación
 * @returns {Promise<boolean>} - Indica si se realizaron cambios que requieren marcar el alias como no entrenado
 */
exports.updateAliasAmbitoAplanado = async (idAlias, idAliasAmbito, localizacionesCalculadas, usuario, fecha) => {
  try {
    let aliasUntrained = false;
    
    // 1. Obtener registros existentes de ámbito aplanado
    const existingAliasAmbitoAplanado = await exports.findAliasAmbitoAplanadoByIdAliasAmbito(idAliasAmbito);
    
    // 2. Identificar registros a añadir, eliminar y restaurar
    const newAliasAmbitoAplanado = localizacionesCalculadas.filter(localizacion => 
      !existingAliasAmbitoAplanado.some(existing => 
        existing.idLocalizacionCompra === localizacion.idLocalizacionCompra && 
        existing.fechaBaja === null
      )
    );
    
    const removedAliasAmbitoAplanado = existingAliasAmbitoAplanado.filter(existing => 
      !localizacionesCalculadas.some(localizacion => 
        localizacion.idLocalizacionCompra === existing.idLocalizacionCompra
      )
    );
    
    const existingRestoredAliasAmbitoAplanado = existingAliasAmbitoAplanado.filter(existing => 
      localizacionesCalculadas.some(localizacion => 
        localizacion.idLocalizacionCompra === existing.idLocalizacionCompra && 
        existing.fechaBaja !== null
      )
    );
    
    // 3. Obtener registros de stock localización para las nuevas localizaciones
    const idsLocalizacionCompra = newAliasAmbitoAplanado.map(localizacion => 
      localizacion.idLocalizacionCompra
    );
    
    const stockLocalizaciones = await exports.findStockLocalizacion(idAlias, idsLocalizacionCompra);
    
    // 4. Obtener el tipo de alias
    const idTipoAlias = await exports.findTypeAliasIdByIdAlias(idAlias);
    
    // 5. Filtrar localizaciones que no tienen fecha de baja
    const localizacionesSinFechaBaja = newAliasAmbitoAplanado.filter(localizacion => {
      const stock = stockLocalizaciones.find(s => 
        s.ID_LOCALIZACION_COMPRA === localizacion.idLocalizacionCompra
      );
      return !stock || stock.FECHA_BAJA === null;
    });
    
    // 6. Crear nuevos registros de ámbito aplanado
    if (localizacionesSinFechaBaja.length > 0) {
      await exports.createAliasAmbitoAplanado(idAliasAmbito, fecha, usuario, localizacionesSinFechaBaja);
      
      // 7. Crear registros de stock localización para las nuevas localizaciones
      const stockMaximo = idTipoAlias === 4 ? null : 100; // 4 = TIPO_IV
      await exports.createStockLocalizacion(
        idAlias,
        localizacionesSinFechaBaja.map(localizacion => localizacion.idLocalizacionCompra),
        stockMaximo,
        fecha,
        usuario
      );
      
      aliasUntrained = true;
    }
    
    // 8. Restaurar registros existentes
    if (existingRestoredAliasAmbitoAplanado.length > 0) {
      await exports.restoreAliasAmbitoAplanado(
        existingRestoredAliasAmbitoAplanado.map(item => item.idAliasAmbitoAplanado),
        usuario,
        fecha
      );
      
      await exports.restoreStockLocalizacionByIdAlias(
        idAlias,
        existingRestoredAliasAmbitoAplanado.map(item => item.idLocalizacionCompra),
        fecha,
        usuario
      );
      
      aliasUntrained = true;
    }
    
    // 9. Eliminar registros (marcar como baja)
    if (removedAliasAmbitoAplanado.length > 0) {
      await exports.deleteAliasAmbitoAplanado(
        removedAliasAmbitoAplanado.map(item => item.idAliasAmbitoAplanado),
        fecha,
        usuario
      );
      
      await exports.deleteStockLocalizacionByIdAlias(
        idAlias,
        removedAliasAmbitoAplanado.map(item => item.idLocalizacionCompra),
        fecha,
        usuario
      );
      
      aliasUntrained = true;
    }
    
    return aliasUntrained;
  } catch (error) {
    console.error(`Error al actualizar ámbito aplanado para el alias ${idAlias}:`, error);
    throw error;
  }
};

// New methods to add to aliasRepository.js

/**
 * Busca acoples por ID de alias principal
 * @param {number} idAlias - ID del alias principal
 * @returns {Promise<Array>} - Lista de acoples
 */
exports.findAcoplesByMainAlias = async (idAlias) => {
  try {
    const query = `
      SELECT 
        AA.ID_ALIAS as idAlias, 
        AA.ID_ALIAS_ACOPLE as idAliasAcople, 
        AA.RATIO_ACOPLE as ratioAcople, 
        AA.FECHA_BAJA as fechaBaja
      FROM AJENOS.ALIAS_ACOPLE AA
      WHERE AA.ID_ALIAS = :idAlias
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar acoples para el alias principal ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Encuentra tareas básicas por ID de alias
 * @param {number} idAlias - ID del alias
 * @returns {Promise<Array>} - Lista de tareas básicas
 */
exports.findBaseTareaTipoByIdAlias = async (idAlias) => {
  try {
    const query = `
      SELECT DISTINCT 
        T.ID_TAREA_RAM AS idTarea,
        T.ID_TIPO_TAREA AS idTipoTarea,
        TA.ID_TAREA_AMBITO AS idTareaAmbito
      FROM AJENOS.TAREA_RAM T
      INNER JOIN AJENOS.ALIAS_TAREA AT ON AT.ID_TAREA_RAM = T.ID_TAREA_RAM
        AND AT.ID_ALIAS = :idAlias 
        AND AT.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.TAREA_AMBITO TA ON TA.ID_TAREA_RAM = T.ID_TAREA_RAM
      WHERE T.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al buscar tareas básicas para el alias ${idAlias}:`, error);
    throw error;
  }
};

/**
 * Encuentra IDs de tarea ámbito aplanado por ID de tarea e ID de alias
 * @param {number} idTarea - ID de la tarea
 * @param {number} idAlias - ID del alias
 * @returns {Promise<Array<number>>} - Lista de IDs de tarea ámbito aplanado
 */
exports.findIdTareaAmbitoAplanadoByIdTareaIdAlias = async (idTarea, idAlias) => {
  try {
    const query = `
      SELECT TAA.ID_TAREA_AMBITO_APLANADO as idTareaAmbitoAplanado 
      FROM AJENOS.TAREA_AMBITO_APLANADO TAA 
      INNER JOIN AJENOS.TAREA_AMBITO TA on TAA.ID_TAREA_AMBITO = TA.ID_TAREA_AMBITO
      WHERE TA.ID_TAREA_RAM = :idTarea 
        AND TAA.ID_ALIAS = :idAlias 
        AND TAA.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea, 
        idAlias 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => item.idTareaAmbitoAplanado);
  } catch (error) {
    console.error(`Error al buscar IDs de tarea ámbito aplanado:`, error);
    throw error;
  }
};

/**
 * Encuentra IDs de tarea ámbito aplanado por ID de tarea e ID de alias acople
 * @param {number} idTarea - ID de la tarea
 * @param {number} idAliasAcople - ID del alias acople
 * @returns {Promise<Array<number>>} - Lista de IDs de tarea ámbito aplanado
 */
exports.findIdTareaAmbitoAplanadoByIdTareaIdAliasAcople = async (idTarea, idAliasAcople) => {
  try {
    const query = `
      SELECT TAA.ID_TAREA_AMBITO_APLANADO as idTareaAmbitoAplanado 
      FROM AJENOS.TAREA_AMBITO_APLANADO TAA 
      INNER JOIN AJENOS.TAREA_AMBITO TA on TAA.ID_TAREA_AMBITO = TA.ID_TAREA_AMBITO
      WHERE TA.ID_TAREA = :idTarea 
        AND TAA.ID_ALIAS_ACOPLE = :idAliasAcople 
        AND TAA.FECHA_BAJA IS NULL
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idTarea, 
        idAliasAcople 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => item.idTareaAmbitoAplanado);
  } catch (error) {
    console.error(`Error al buscar IDs de tarea ámbito aplanado por alias acople:`, error);
    throw error;
  }
};

/**
 * Elimina (marca como baja) registros de tarea ámbito aplanado
 * @param {Array<number>} idsTareaAmbitoAplanado - IDs de tarea ámbito aplanado
 * @param {string} usuario - Usuario que realiza la baja
 * @param {Date} fechaBaja - Fecha de baja
 * @returns {Promise<void>}
 */
exports.deleteByIdTareaAmbitoAplanadoIn = async (idsTareaAmbitoAplanado, usuario, fechaBaja) => {
  try {
    if (!idsTareaAmbitoAplanado || idsTareaAmbitoAplanado.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.TAREA_AMBITO_APLANADO 
      SET FECHA_BAJA = :fechaBaja, 
          USUARIO_BAJA = :usuario
      WHERE ID_TAREA_AMBITO_APLANADO IN (:idsTareaAmbitoAplanado)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { 
        idsTareaAmbitoAplanado, 
        usuario, 
        fechaBaja 
      },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al eliminar tarea ámbito aplanado:`, error);
    throw error;
  }
};

/**
 * Calcula los registros básicos de tarea ámbito aplanado por ID de alias
 * @param {Array<number>} idsAlias - IDs de alias
 * @param {Array<number>} idsPais - IDs de país (mercado)
 * @param {Array<number>} idsGrupoCadena - IDs de grupo cadena
 * @param {Array<number>} idsCadena - IDs de cadena
 * @param {number} idTipoEstadoLocalizacionTarea - ID del tipo de estado de localización tarea
 * @returns {Promise<Array>} - Lista de registros calculados
 */
exports.calculateBasicTareaAmbitoAplanadoByIdAlias = async (idsAlias, idsPais, idsGrupoCadena, idsCadena, idTipoEstadoLocalizacionTarea) => {
  try {
    const query = `
      SELECT 
        A.ID_ALIAS as idAlias, 
        A.ID_TIPO_ALIAS as idTipoAlias, 
        A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        AAA.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam,
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA as idTipoEstadoLocalizacionTarea
      FROM AJENOS.ALIAS_AMBITO as AA
      INNER JOIN AJENOS.ALIAS A ON A.ID_ALIAS = AA.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO AAA ON AA.ID_ALIAS_AMBITO = AAA.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA LC ON AAA.ID_LOCALIZACION_COMPRA = LC.ID_LOCALIZACION AND LC.ID_PAIS IN (:idsPais)
      INNER JOIN AJENOS.GRUPO_CADENA_CADENA GCC ON LC.ID_CADENA = GCC.ID_CADENA
      INNER JOIN AJENOS.GRUPO_CADENA GC ON GCC.ID_GRUPO_CADENA = GC.ID_GRUPO_CADENA
      INNER JOIN AJENOS.CADENA C ON C.ID_CADENA = GCC.ID_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA TELTC ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = :idTipoEstadoLocalizacionTarea
      WHERE AA.ID_ALIAS IN (:idsAlias) 
        AND GC.ID_GRUPO_CADENA IN (:idsGrupoCadena) 
        AND C.ID_CADENA IN (:idsCadena) 
        AND LC.ID_PAIS IN (:idsPais)
        AND AA.FECHA_BAJA IS NULL 
        AND AAA.FECHA_BAJA IS NULL 
        AND LC.FECHA_BAJA IS NULL
      GROUP BY A.ID_ALIAS, A.ID_TIPO_ALIAS, A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS,
        AAA.ID_LOCALIZACION_COMPRA, AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM,
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idsAlias, 
        idsPais, 
        idsGrupoCadena, 
        idsCadena, 
        idTipoEstadoLocalizacionTarea 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al calcular tarea ámbito aplanado básico por ID de alias:`, error);
    throw error;
  }
};

/**
 * Calcula los registros básicos de tarea ámbito aplanado por ID de alias acople
 * @param {Array<number>} idsAlias - IDs de alias
 * @param {number} idAliasAcople - ID del alias acople
 * @param {Array<number>} idsPais - IDs de país (mercado)
 * @param {Array<number>} idsGrupoCadena - IDs de grupo cadena
 * @param {Array<number>} idsCadena - IDs de cadena
 * @param {number} idTipoEstadoLocalizacionTarea - ID del tipo de estado de localización tarea
 * @returns {Promise<Array>} - Lista de registros calculados
 */
exports.calculateBasicTareaAmbitoAplanadoByIdAliasAcople = async (idsAlias, idAliasAcople, idsPais, idsGrupoCadena, idsCadena, idTipoEstadoLocalizacionTarea) => {
  try {
    const query = `
      SELECT 
        A.ID_ALIAS as idAlias, 
        AC.ID_ALIAS_ACOPLE as idAliasAcople,  
        A.ID_TIPO_ALIAS as idTipoAlias,
        A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        AAA.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam, 
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA as idTipoEstadoLocalizacionTarea
      FROM AJENOS.ALIAS_AMBITO as AA
      INNER JOIN AJENOS.ALIAS A ON A.ID_ALIAS = AA.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_ACOPLE AC ON A.ID_ALIAS = AC.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO AAA ON AA.ID_ALIAS_AMBITO = AAA.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA LC ON AAA.ID_LOCALIZACION_COMPRA = LC.ID_LOCALIZACION AND LC.ID_PAIS IN (:idsPais)
      INNER JOIN AJENOS.PAIS P ON LC.ID_PAIS = P.ID_PAIS
      INNER JOIN AJENOS.GRUPO_CADENA_CADENA GCC ON LC.ID_CADENA = GCC.ID_CADENA
      INNER JOIN AJENOS.GRUPO_CADENA GC ON GCC.ID_GRUPO_CADENA = GC.ID_GRUPO_CADENA
      INNER JOIN AJENOS.CADENA C ON C.ID_CADENA = GCC.ID_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM TELR ON AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELR.ID_TIPO_ESTADO_LOCALIZACION
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA TELTC ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = :idTipoEstadoLocalizacionTarea
      WHERE AA.ID_ALIAS IN (:idsAlias) 
        AND AC.ID_ALIAS_ACOPLE = :idAliasAcople 
        AND AAA.ID_LOCALIZACION_COMPRA IN (
          SELECT ACOPLE.ID_LOCALIZACION_COMPRA
          FROM AJENOS.ALIAS_AMBITO as AAC
          INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO ACOPLE ON (AAC.ID_ALIAS_AMBITO = ACOPLE.ID_ALIAS_AMBITO)
          WHERE GC.ID_GRUPO_CADENA IN (:idsGrupoCadena) 
            AND C.ID_CADENA IN (:idsCadena) 
            AND P.ID_PAIS IN (:idsPais) 
            AND AA.FECHA_BAJA IS NULL
            AND AAA.FECHA_BAJA IS NULL 
            AND LC.FECHA_BAJA IS NULL 
            AND AC.FECHA_BAJA IS NULL 
            AND AAC.ID_ALIAS = :idAliasAcople
        )
      GROUP BY A.ID_ALIAS, AC.ID_ALIAS_ACOPLE, A.ID_TIPO_ALIAS, A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        AAA.ID_LOCALIZACION_COMPRA, AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM, 
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idsAlias, 
        idAliasAcople, 
        idsPais, 
        idsGrupoCadena, 
        idsCadena, 
        idTipoEstadoLocalizacionTarea 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al calcular tarea ámbito aplanado básico por ID de alias acople:`, error);
    throw error;
  }
};

/**
 * Calcula los registros básicos de tarea ámbito aplanado por ID de alias con acople
 * @param {Array<number>} idsAlias - IDs de alias
 * @param {Array<number>} idsPais - IDs de país (mercado)
 * @param {Array<number>} idsGrupoCadena - IDs de grupo cadena
 * @param {Array<number>} idsCadena - IDs de cadena
 * @param {number} idTipoEstadoLocalizacionTarea - ID del tipo de estado de localización tarea
 * @returns {Promise<Array>} - Lista de registros calculados
 */
exports.calculateBasicTareaAmbitoAplanadoByIdAliasConAcople = async (idsAlias, idsPais, idsGrupoCadena, idsCadena, idTipoEstadoLocalizacionTarea) => {
  try {
    const query = `
      SELECT 
        A.ID_ALIAS as idAlias, 
        AC.ID_ALIAS_ACOPLE as idAliasAcople,  
        A.ID_TIPO_ALIAS as idTipoAlias,
        A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as idTipoConexionOrigenDatoAlias,
        AAA.ID_LOCALIZACION_COMPRA as idLocalizacionCompra,
        AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM as idTipoEstadoLocalizacionRam, 
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA as idTipoEstadoLocalizacionTarea
      FROM AJENOS.ALIAS_AMBITO as AA
      INNER JOIN AJENOS.ALIAS A ON A.ID_ALIAS = AA.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_ACOPLE AC ON A.ID_ALIAS = AC.ID_ALIAS
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO AAA ON AA.ID_ALIAS_AMBITO = AAA.ID_ALIAS_AMBITO
      INNER JOIN AJENOS.LOCALIZACION_COMPRA LC ON AAA.ID_LOCALIZACION_COMPRA = LC.ID_LOCALIZACION AND LC.ID_PAIS IN (:idsPais)
      INNER JOIN AJENOS.PAIS P ON LC.ID_PAIS = P.ID_PAIS
      INNER JOIN AJENOS.GRUPO_CADENA_CADENA GCC ON LC.ID_CADENA = GCC.ID_CADENA
      INNER JOIN AJENOS.GRUPO_CADENA GC ON GCC.ID_GRUPO_CADENA = GC.ID_GRUPO_CADENA
      INNER JOIN AJENOS.CADENA C ON C.ID_CADENA = GCC.ID_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM TELR ON AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM = TELR.ID_TIPO_ESTADO_LOCALIZACION
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_TAREA TELTC ON TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA = :idTipoEstadoLocalizacionTarea
      WHERE AA.ID_ALIAS IN (:idsAlias) 
        AND AAA.ID_LOCALIZACION_COMPRA IN (
          SELECT ACOPLE.ID_LOCALIZACION_COMPRA
          FROM AJENOS.ALIAS_AMBITO as AAC
          INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO ACOPLE ON (AAC.ID_ALIAS_AMBITO = ACOPLE.ID_ALIAS_AMBITO)
          WHERE GC.ID_GRUPO_CADENA IN (:idsGrupoCadena) 
            AND C.ID_CADENA IN (:idsCadena) 
            AND P.ID_PAIS IN (:idsPais) 
            AND AA.FECHA_BAJA IS NULL
            AND AAA.FECHA_BAJA IS NULL 
            AND LC.FECHA_BAJA IS NULL 
            AND AC.FECHA_BAJA IS NULL
        )
      GROUP BY A.ID_ALIAS, AC.ID_ALIAS_ACOPLE, A.ID_TIPO_ALIAS, A.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        AAA.ID_LOCALIZACION_COMPRA, AAA.ID_TIPO_ESTADO_LOCALIZACION_RAM, 
        TELTC.ID_TIPO_ESTADO_LOCALIZACION_TAREA
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { 
        idsAlias, 
        idsPais, 
        idsGrupoCadena, 
        idsCadena, 
        idTipoEstadoLocalizacionTarea 
      },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result;
  } catch (error) {
    console.error(`Error al calcular tarea ámbito aplanado básico por ID de alias con acople:`, error);
    throw error;
  }
};

/**
 * Crea registros de tarea ámbito aplanado
 * @param {number} idTareaAmbito - ID de la tarea ámbito
 * @param {Date} fechaAlta - Fecha de alta
 * @param {string} usuarioAlta - Usuario que crea el registro
 * @param {Array} tareaAmbitoAplanados - Lista de tarea ámbito aplanado
 * @returns {Promise<void>}
 */
exports.createTareaAmbitoAplanado = async (idTareaAmbito, fechaAlta, usuarioAlta, tareaAmbitoAplanados) => {
  try {
    if (!tareaAmbitoAplanados || tareaAmbitoAplanados.length === 0) {
      return;
    }
    
    // Preparar los valores para inserción
    const insertValues = tareaAmbitoAplanados.map(item => `(
      ${idTareaAmbito}, 
      ${item.idLocalizacionCompra}, 
      ${item.idTipoEstadoLocalizacionRam}, 
      ${item.idTipoEstadoLocalizacionTarea || 'NULL'}, 
      ${item.idTipoAlias}, 
      ${item.idTipoConexionOrigenDatoAlias || 'NULL'}, 
      ${item.idAlias}, 
      ${item.idAliasAcople || 'NULL'}, 
      '${usuarioAlta}', 
      '${fechaAlta.toISOString().slice(0, 19).replace('T', ' ')}'
    )`).join(', ');
    
    const query = `
      INSERT INTO AJENOS.TAREA_AMBITO_APLANADO (
        ID_TAREA_AMBITO, 
        ID_LOCALIZACION_COMPRA, 
        ID_TIPO_ESTADO_LOCALIZACION_RAM, 
        ID_TIPO_ESTADO_LOCALIZACION_TAREA, 
        ID_TIPO_ALIAS, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        ID_ALIAS, 
        ID_ALIAS_ACOPLE, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES ${insertValues}
    `;
    
    await sequelizeAjenos.query(query, {
      type: sequelizeAjenos.QueryTypes.INSERT
    });
  } catch (error) {
    console.error(`Error al crear tarea ámbito aplanado:`, error);
    throw error;
  }
};

/**
 * Marca los alias como no entrenados
 * @param {Array<number>} idsAlias - IDs de alias
 * @returns {Promise<void>}
 */
exports.updateAliasUntrained = async (idsAlias) => {
  try {
    if (!idsAlias || idsAlias.length === 0) {
      return;
    }
    
    const query = `
      UPDATE AJENOS.ALIAS 
      SET ENTRENADO = 0
      WHERE ID_ALIAS IN (:idsAlias)
    `;
    
    await sequelizeAjenos.query(query, {
      replacements: { idsAlias },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
  } catch (error) {
    console.error(`Error al marcar alias como no entrenados:`, error);
    throw error;
  }
};

/**
 * Propaga cambios en tarea ámbito aplanado por actualizaciones en alias acople
 * @param {number} idAliasAcople - ID del alias acople
 * @param {Array<number>} idsMainAlias - IDs de alias principal
 * @param {Object} aliasAmbito - Información del ámbito
 * @param {string} usuario - Usuario que realiza la modificación
 * @param {Date} fecha - Fecha de modificación
 * @returns {Promise<void>}
 */
exports.propagateTareaAmbitoAplanadoByUpdatedAliasAcople = async (idAliasAcople, idsMainAlias, aliasAmbito, usuario, fecha) => {
  try {
    // Constantes
    const TIPO_TAREA_COUNT = 2; // ID para tipo de tarea COUNT
    const TIPO_TAREA_DISTRIBUTION = 1; // ID para tipo de tarea DISTRIBUTION
    const TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA = 1; // ID para tipo estado localización tarea ACTIVA
    
    // 1. Obtener las tareas relacionadas con el alias acople
    const tareas = await exports.findBaseTareaTipoByIdAlias(idAliasAcople);
    
    if (!tareas || tareas.length === 0) {
      console.log(`No hay tareas asociadas al alias acople ${idAliasAcople}`);
      return;
    }
    
    // 2. Procesar cada tarea
    for (const tarea of tareas) {
      const calculatedTareaAmbitoAplanados = [];
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_COUNT) {
        // Si es recuento, eliminamos los registros con idAliasAcople como principal
        const idsTareaAmbitoAplanadoToRemove = await exports.findIdTareaAmbitoAplanadoByIdTareaIdAlias(
          tarea.idTarea, 
          idAliasAcople
        );
        
        if (idsTareaAmbitoAplanadoToRemove && idsTareaAmbitoAplanadoToRemove.length > 0) {
          await exports.deleteByIdTareaAmbitoAplanadoIn(
            idsTareaAmbitoAplanadoToRemove, 
            usuario, 
            fecha
          );
        }
        
        // Calculamos los nuevos registros
        const calculatedRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAlias(
          [idAliasAcople], 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
        calculatedTareaAmbitoAplanados.push(...calculatedRecords);
      }
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_DISTRIBUTION) {
        // Si es distribución, eliminamos los registros que tengan idAliasAcople como acoplado
        const idsTareaAmbitoAplanadoToRemove = await exports.findIdTareaAmbitoAplanadoByIdTareaIdAliasAcople(
          tarea.idTarea, 
          idAliasAcople
        );
        
        if (idsTareaAmbitoAplanadoToRemove && idsTareaAmbitoAplanadoToRemove.length > 0) {
          await exports.deleteByIdTareaAmbitoAplanadoIn(
            idsTareaAmbitoAplanadoToRemove, 
            usuario, 
            fecha
          );
        }
        
        // Calculamos los registros con idAliasAcople actuando como acople de los principales
        const calculatedRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAliasAcople(
          idsMainAlias, 
          idAliasAcople, 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
        calculatedTareaAmbitoAplanados.push(...calculatedRecords);
      }
      
      // Crear los nuevos registros
      if (calculatedTareaAmbitoAplanados.length > 0) {
        await exports.createTareaAmbitoAplanado(
          tarea.idTareaAmbito, 
          fecha, 
          usuario, 
          calculatedTareaAmbitoAplanados
        );
      }
    }
  } catch (error) {
    console.error(`Error al propagar tarea ámbito aplanado por alias acople:`, error);
    throw error;
  }
};

/**
 * Propaga cambios en tarea ámbito aplanado por actualizaciones en alias
 * @param {number} idAlias - ID del alias
 * @param {Array<number>} idsAliasAcople - IDs de alias acople
 * @param {Object} aliasAmbito - Información del ámbito
 * @param {string} usuario - Usuario que realiza la modificación
 * @param {Date} fecha - Fecha de modificación
 * @returns {Promise<void>}
 */
exports.propagateTareaAmbitoAplanadoByUpdatedAlias = async (idAlias, idsAliasAcople, aliasAmbito, usuario, fecha) => {
  try {
    // Constantes
    const TIPO_TAREA_COUNT = 2; // ID para tipo de tarea COUNT
    const TIPO_TAREA_DISTRIBUTION = 1; // ID para tipo de tarea DISTRIBUTION
    const TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA = 1; // ID para tipo estado localización tarea ACTIVA
    
    // 1. Obtener las tareas relacionadas con el alias
    const tareas = await exports.findBaseTareaTipoByIdAlias(idAlias);
    
    if (!tareas || tareas.length === 0) {
      console.log(`No hay tareas asociadas al alias ${idAlias}`);
      return;
    }
    
    // 2. Procesar cada tarea
    for (const tarea of tareas) {
      const calculatedTareaAmbitoAplanados = [];
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_COUNT) {
        // Si es recuento, procesamos el alias principal y los acoples
        const aliasTotales = [...idsAliasAcople, idAlias];
        
        const calculatedRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAlias(
          aliasTotales, 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
        calculatedTareaAmbitoAplanados.push(...calculatedRecords);
      }
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_DISTRIBUTION) {
        // Si es distribución, calculamos dos tipos de registros en paralelo
        
        // 1. Registros con el alias principal solo
        const aliasMainRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAlias(
          [idAlias], 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
        // 2. Registros del alias con acoples
        const aliasConAcopleRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAliasConAcople(
          [idAlias], 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
        calculatedTareaAmbitoAplanados.push(...aliasMainRecords);
        calculatedTareaAmbitoAplanados.push(...aliasConAcopleRecords);
      }
      
      if (calculatedTareaAmbitoAplanados.length > 0) {
        // Eliminar registros existentes
        const idsTareaAmbitoAplanadoToRemove = await exports.findIdTareaAmbitoAplanadoByIdTareaIdAlias(
          tarea.idTarea, 
          idAlias
        );
        
        if (idsTareaAmbitoAplanadoToRemove && idsTareaAmbitoAplanadoToRemove.length > 0) {
          await exports.deleteByIdTareaAmbitoAplanadoIn(
            idsTareaAmbitoAplanadoToRemove, 
            usuario, 
            fecha
          );
        }
        
        // Crear los nuevos registros
        await exports.createTareaAmbitoAplanado(
          tarea.idTareaAmbito, 
          fecha, 
          usuario, 
          calculatedTareaAmbitoAplanados
        );
      }
    }
  } catch (error) {
    console.error(`Error al propagar tarea ámbito aplanado por alias:`, error);
    throw error;
  }
};

exports.findAliasInfoById = async (idIdioma) => {
  try {
    const query = `
      SELECT a.ID_ALIAS as idAlias, 
             ai.NOMBRE as nombre, 
             a.ID_TIPO_ALIAS as idTipoAlias,
             a.ID_TIPO_ESTADO_ALIAS as idTipoEstadoAlias, 
             teai.DESCRIPCION as descripcion
      FROM AJENOS.ALIAS a
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON a.ID_ALIAS = ai.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.TIPO_ESTADO_ALIAS_IDIOMA teai ON teai.ID_TIPO_ESTADO_ALIAS = a.ID_TIPO_ESTADO_ALIAS AND teai.ID_IDIOMA = :idIdioma
      WHERE (a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS = 1 OR a.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS IS NULL)
            AND a.FECHA_BAJA IS NULL
      ORDER BY a.ID_ALIAS
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    return result.map(item => ({
      idAlias: item.idAlias,
      nombre: fixEncoding(item.nombre),
      idTipoAlias: item.idTipoAlias,
      idTipoEstadoAlias: item.idTipoEstadoAlias,
      descripcion: fixEncoding(item.descripcion)
    }));
  } catch (error) {
    console.error('Error en findAliasInfoById:', error);
    return [];
  }
};

exports.createAlias = async (aliasData) => {
  const t = await sequelizeAjenos.transaction();
  
  try {
    // 1. Insertar el alias principal
    const aliasInsertQuery = `
      INSERT INTO AJENOS.ALIAS (
        ID_TIPO_ALIAS, 
        ID_TIPO_ESTACIONALIDAD, 
        ID_TIPO_ESTADO_ALIAS, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS,
        ID_TIPO_ORIGEN_DATO_ALIAS,
        FECHA_ALTA, 
        USUARIO_ALTA, 
        FECHA_MODIFICACION
      ) VALUES (
        :idTipoAlias, 
        :idTipoEstacionalidad, 
        :idTipoEstadoAlias, 
        :idTipoConexionOrigenDatoAlias,
        :idTipoOrigenDatoAlias,
        CURRENT_TIMESTAMP, 
        'WEBAPP', 
        CURRENT_TIMESTAMP
      ) RETURNING ID_ALIAS
    `;
    
    const [aliasResult] = await sequelizeAjenos.query(aliasInsertQuery, {
      replacements: {
        idTipoAlias: aliasData.idTipoAlias,
        idTipoEstacionalidad: aliasData.idTipoEstacionalidad,
        idTipoEstadoAlias: aliasData.idTipoEstadoAlias,
        idTipoConexionOrigenDatoAlias: aliasData.idTipoConexionOrigenDatoAlias,
        idTipoOrigenDatoAlias: aliasData.idTipoOrigenDatoAlias
      },
      type: sequelizeAjenos.QueryTypes.INSERT,
      transaction: t
    });
    
    const idAlias = aliasResult[0].ID_ALIAS;
    console.log(`Alias creado con ID: ${idAlias}`);
    
    // 2. Insertar idiomas del alias
    for (const idioma of aliasData.idiomas) {
      const insertIdiomaQuery = `
        INSERT INTO AJENOS.ALIAS_IDIOMA (
          ID_ALIAS, 
          ID_IDIOMA, 
          NOMBRE, 
          DESCRIPCION
        ) VALUES (
          :idAlias, 
          :idIdioma, 
          :nombre, 
          :descripcion
        )
      `;
      
      await sequelizeAjenos.query(insertIdiomaQuery, {
        replacements: {
          idAlias,
          idIdioma: idioma.idIdioma,
          nombre: idioma.nombre,
          descripcion: idioma.descripcion
        },
        type: sequelizeAjenos.QueryTypes.INSERT,
        transaction: t
      });
    }
    
    // 3. Insertar relaciones alias-ajeno (artículos)
    for (const ajeno of aliasData.aliasAjeno) {
      const insertAjenoQuery = `
        INSERT INTO AJENOS.ALIAS_AJENO (
          ID_ALIAS, 
          ID_AJENO, 
          ID_TIPO_ESTADO_AJENO_RAM,
          ID_SINT,
          FECHA_ALTA, 
          USUARIO_ALTA
        ) VALUES (
          :idAlias, 
          :idAjeno, 
          :idTipoEstadoAjenoRam,
          :idSint,
          CURRENT_TIMESTAMP, 
          'WEBAPP'
        )
      `;
      
      await sequelizeAjenos.query(insertAjenoQuery, {
        replacements: {
          idAlias,
          idAjeno: ajeno.idAjeno,
          idTipoEstadoAjenoRam: ajeno.idTipoEstadoAjenoRam || 1,
          idSint: ajeno.idSint || null
        },
        type: sequelizeAjenos.QueryTypes.INSERT,
        transaction: t
      });
    }
    
    // 4. Insertar ámbitos del alias
    // Primero creamos el registro de ambito
    const insertAmbitoQuery = `
      INSERT INTO AJENOS.ALIAS_AMBITO (
        ID_ALIAS, 
        FECHA_ALTA, 
        USUARIO_ALTA
      ) VALUES (
        :idAlias, 
        CURRENT_TIMESTAMP, 
        'WEBAPP'
      ) RETURNING ID_ALIAS_AMBITO
    `;
    
    const [ambitoResult] = await sequelizeAjenos.query(insertAmbitoQuery, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.INSERT,
      transaction: t
    });
    
    const idAliasAmbito = ambitoResult[0].ID_ALIAS_AMBITO;
    
    // Crear combinaciones de grupos, cadenas y mercados
    for (const idGrupoCadena of aliasData.aliasAmbito.idsGrupoCadena) {
      for (const idCadena of aliasData.aliasAmbito.idsCadena) {
        // Verificar que la cadena pertenece al grupo
        const checkCadenaGrupoQuery = `
          SELECT 1 FROM MAESTROS.GRUPO_CADENA_CADENA 
          WHERE ID_GRUPO_CADENA = :idGrupoCadena AND ID_CADENA = :idCadena
        `;
        
        const cadenaGrupoResult = await sequelizeMaestros.query(checkCadenaGrupoQuery, {
          replacements: { idGrupoCadena, idCadena },
          type: sequelizeMaestros.QueryTypes.SELECT,
          transaction: t
        });
        
        if (cadenaGrupoResult.length === 0) {
          continue; // Esta cadena no pertenece a este grupo, saltamos
        }
        
        for (const idMercado of aliasData.aliasAmbito.idsMercado) {
          // Buscar o crear la localización de compra
          const findLocalizacionQuery = `
            SELECT ID_LOCALIZACION 
            FROM AJENOS.LOCALIZACION_COMPRA 
            WHERE ID_CADENA = :idCadena AND ID_PAIS = :idMercado
          `;
          
          const localizacionResult = await sequelizeAjenos.query(findLocalizacionQuery, {
            replacements: { idCadena, idMercado },
            type: sequelizeAjenos.QueryTypes.SELECT,
            transaction: t
          });
          
          let idLocalizacion;
          
          if (localizacionResult.length > 0) {
            idLocalizacion = localizacionResult[0].ID_LOCALIZACION;
          } else {
            // Crear localización si no existe
            const insertLocalizacionQuery = `
              INSERT INTO AJENOS.LOCALIZACION_COMPRA (
                ID_CADENA, 
                ID_PAIS, 
                FECHA_ALTA, 
                USUARIO_ALTA
              ) VALUES (
                :idCadena, 
                :idMercado, 
                CURRENT_TIMESTAMP, 
                'WEBAPP'
              ) RETURNING ID_LOCALIZACION
            `;
            
            const [newLocalizacionResult] = await sequelizeAjenos.query(insertLocalizacionQuery, {
              replacements: { idCadena, idMercado },
              type: sequelizeAjenos.QueryTypes.INSERT,
              transaction: t
            });
            
            idLocalizacion = newLocalizacionResult[0].ID_LOCALIZACION;
          }
          
          // Insertar en ALIAS_AMBITO_APLANADO
          const insertAmbitoAplanadoQuery = `
            INSERT INTO AJENOS.ALIAS_AMBITO_APLANADO (
              ID_ALIAS_AMBITO,
              ID_LOCALIZACION_COMPRA,
              FECHA_ALTA,
              USUARIO_ALTA
            ) VALUES (
              :idAliasAmbito,
              :idLocalizacion,
              CURRENT_TIMESTAMP,
              'WEBAPP'
            )
          `;
          
          await sequelizeAjenos.query(insertAmbitoAplanadoQuery, {
            replacements: { idAliasAmbito, idLocalizacion },
            type: sequelizeAjenos.QueryTypes.INSERT,
            transaction: t
          });
        }
      }
    }
    
    // Commit de la transacción
    await t.commit();
    
    return { success: true, idAlias };
  } catch (error) {
    console.error('Error en createAlias:', error);
    // Rollback de la transacción en caso de error
    await t.rollback();
    throw error;
  }
};