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
    console.log(`[DEBUG] Obteniendo alias para filtro con idIdioma=${idIdioma}`);
    
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
    
    finalSearchQuery += ` ORDER BY aa.ID_ALIAS, aa.ID_AJENO`;
    
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

// En aliasRepository.js

// Obtener un alias por ID
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

// Obtener los idiomas de un alias
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

// Obtener los artículos de un alias
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

// Actualización de findAcoplesInfoByIdAlias
exports.findAcoplesInfoByIdAlias = async (idAlias, idIdioma = 1) => {
  try {
    console.log(`Ejecutando consulta de acoples para ID: ${idAlias}, idIdioma: ${idIdioma}`);
    const query = `
      SELECT aa.ID_ALIAS, aa.ID_ALIAS_ACOPLE, aa.RATIO_ACOPLE, aa.FECHA_BAJA, ai.NOMBRE as NOMBRE_ALIAS_PRINCIPAL
      FROM AJENOS.ALIAS_ACOPLE aa
      INNER JOIN AJENOS.ALIAS_IDIOMA ai ON aa.ID_ALIAS = ai.ID_ALIAS AND ai.ID_IDIOMA = :idIdioma
      WHERE aa.ID_ALIAS = :idAlias AND aa.FECHA_BAJA IS NULL
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

exports.invalidateCache = (pattern = null) => {
  cache.clear(pattern);
};