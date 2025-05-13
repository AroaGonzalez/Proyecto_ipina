const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');
const { QueryTypes } = require('sequelize');

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
    
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    
    let processedResult = [];
    if (totalElements > 0) {
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
      WHERE teai.ID_IDIOMA = :idIdioma AND tea.ID_TIPO_ESTADO_ALIAS <> 0
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

exports.getAlias = async (idIdioma = 1) => {
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
    
    const countResult = await sequelizeAjenos.query(finalCountQuery, {
      replacements,
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const totalElements = parseInt(countResult[0]?.total || 0);
    
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

exports.findGruposCadenaByIdAlias = async (idAlias) => {
  try {
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
    const query = `
      SELECT DISTINCT c.ID_CADENA as ID, c.NOMBRE as DESCRIPCION, gc.ID_GRUPO_CADENA
      FROM MAESTROS.CADENA c
      INNER JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      INNER JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA AND gc.ID_TIPO_GRUPO_CADENA = 6
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = :idAlias
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = aaa.ID_LOCALIZACION_COMPRA 
      AND lc.ID_CADENA = c.ID_CADENA
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });

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
    const query = `
      SELECT DISTINCT p.ID_PAIS as ID, p.DESCRIPCION, p.PAIS_ISO as CODIGO_ISO_PAIS
      FROM MAESTROS.PAIS p
      INNER JOIN MAESTROS.PAIS_IDIOMA pi ON pi.ID_PAIS = p.ID_PAIS AND pi.ID_IDIOMA = :idIdioma
      INNER JOIN AJENOS.ALIAS_AMBITO aa ON aa.ID_ALIAS = :idAlias
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO AND aaa.FECHA_BAJA IS NULL
      INNER JOIN AJENOS.LOCALIZACION_COMPRA lc ON lc.ID_LOCALIZACION_COMPRA = aaa.ID_LOCALIZACION_COMPRA AND lc.ID_PAIS = p.ID_PAIS
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idAlias, idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT,
      logging: console.log
    });

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
      ORDER BY i.ID_IDIOMA ASC
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
      ORDER BY gc.ID_GRUPO_CADENA ASC
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
      ORDER BY c.ID_CADENA ASC
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

exports.getTipoConexionOrigenDato = async (idIdioma = 1) => {
  try {
    const query = `
      SELECT tco.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS as id, tco.DESCRIPCION as descripcion
      FROM AJENOS.TIPO_CONEXION_ORIGEN_DATO_ALIAS_IDIOMA tco WHERE tco.ID_IDIOMA = :idIdioma
      ORDER BY tco.ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS ASC
    `;

    const result = await sequelizeAjenos.query(query, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });

    return result.map(item => ({
      id: item.id,
      descripcion: fixEncoding(item.descripcion)
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
      ORDER BY p.ID_PAIS ASC
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

exports.updateAliasIdioma = async (idAlias, idiomas, usuarioModificacion, fechaModificacion) => {
  try {
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
    
    const existingIdiomasMap = new Map(existingIdiomas.map(idioma => [idioma.idIdioma, idioma]));
    const incomingIdiomasMap = new Map(idiomas.map(idioma => [idioma.idIdioma, idioma]));
    
    const newIdiomas = idiomas.filter(idioma => !existingIdiomasMap.has(idioma.idIdioma));
    
    const removedIdiomas = existingIdiomas.filter(idioma => !incomingIdiomasMap.has(idioma.idIdioma));
    
    const updatedIdiomas = idiomas.filter(idioma => {
      const existing = existingIdiomasMap.get(idioma.idIdioma);
      return existing && (
        existing.nombre !== idioma.nombre ||
        existing.descripcion !== idioma.descripcion
      );
    });
    
    console.log(`Nuevos idiomas: ${newIdiomas.length}, Eliminados: ${removedIdiomas.length}, Actualizados: ${updatedIdiomas.length}`);
    
    const operations = [];
    
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
    
    await Promise.all(operations);
    
    return newIdiomas.length > 0 || removedIdiomas.length > 0 || updatedIdiomas.length > 0;
  } catch (error) {
    console.error(`Error al actualizar idiomas de alias ${idAlias}:`, error);
    throw error;
  }
};

exports.updateAliasAjeno = async (idAlias, aliasAjeno, usuarioModificacion, fechaModificacion) => {
  try {
    
    let aliasUntrained = false;
    
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
    
    const newAliasAjeno = aliasAjeno.filter(ajeno => 
      !existingAliasAjeno.some(existing => 
        existing.idAjeno === ajeno.idAjeno &&
        existing.idAlias === idAlias
      )
    );
    
    const removedAliasAjeno = existingAliasAjeno.filter(existing => 
      !aliasAjeno.some(ajeno => 
        ajeno.idAjeno === existing.idAjeno && 
        idAlias === existing.idAlias
      ) && existing.fechaBaja === null
    );
    
    const restoreAliasAjeno = aliasAjeno.filter(ajeno => 
      existingAliasAjeno.some(existing => 
        existing.idAjeno === ajeno.idAjeno && 
        existing.idAlias === idAlias && 
        existing.fechaBaja !== null
      )
    );
    
    const existingUpdatedAliasAjeno = aliasAjeno.filter(ajeno => {
      const existing = existingAliasAjeno.find(e => 
        e.idAjeno === ajeno.idAjeno && 
        e.idAlias === idAlias &&
        e.fechaBaja === null
      );

      if (!existing) return false;
      
      const needsUpdate = 
        existing.idTipoEstadoAjenoRam !== ajeno.idTipoEstadoAjenoRam ||
        (existing.idSint && existing.idSint !== ajeno.idSint) ||
        (!existing.idSint && ajeno.idSint);
        
      return needsUpdate;
    });
    
    const operations = [];
    
    if (newAliasAjeno.length > 0) {
      const insertQuery = `
        INSERT INTO AJENOS.ALIAS_AJENO 
        (ID_ALIAS, ID_AJENO, ID_TIPO_ESTADO_AJENO_RAM, ID_SINT, USUARIO_ALTA, FECHA_ALTA)
        VALUES (:idAlias, :idAjeno, :idTipoEstadoAjenoRam, :idSint, :usuarioAlta, :fechaAlta)
      `;
      
      for (const ajeno of newAliasAjeno) {
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
    
    if (removedAliasAjeno.length > 0) {
      const deleteQuery = `
        UPDATE AJENOS.ALIAS_AJENO 
        SET FECHA_BAJA = :fechaBaja, 
          USUARIO_BAJA = :usuarioBaja
        WHERE ID_ALIAS = :idAlias AND ID_AJENO = :idAjeno AND FECHA_BAJA IS NULL
      `;
      
      for (const ajeno of removedAliasAjeno) {
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
      
      for (const ajeno of restoreAliasAjeno) {
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
    
    if (existingUpdatedAliasAjeno.length > 0) {
      const updateQuery = `
        UPDATE AJENOS.ALIAS_AJENO 
        SET ID_TIPO_ESTADO_AJENO_RAM = :idTipoEstadoAjenoRam, 
          ID_SINT = :idSint, 
          FECHA_MODIFICACION = :fechaModificacion, 
          USUARIO_MODIFICACION = :usuarioModificacion
        WHERE ID_ALIAS = :idAlias AND ID_AJENO = :idAjeno AND FECHA_BAJA IS NULL
      `;
      
      for (const ajeno of existingUpdatedAliasAjeno) {
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
    
    await Promise.all(operations);
    
    return aliasUntrained;
  } catch (error) {
    console.error(`ERROR en updateAliasAjeno para idAlias=${idAlias}:`, error);
    throw error;
  }
};

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

exports.updateAliasAcople = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    let aliasUntrained = false;
    
    const aliasAcopleByIdAcople = await exports.findAcoplesByIdAliasAcople(idAliasAcople);
    
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
    
    if (aliasAcopleAdded.length > 0) {
      for (const aliasAcople of aliasAcopleAdded) {
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

exports.updateAliasAcopleTarea = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    const aliasAcopleTareaByIdAcople = await exports.findAliasAcopleTareaByIdAliasAcople(idAliasAcople);
    
    const aliasAcopleTareaByTarea = {};
    for (const aliasAcopleTarea of aliasAcopleTareaByIdAcople) {
      if (!aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea]) {
        aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea] = [];
      }
      aliasAcopleTareaByTarea[aliasAcopleTarea.idTarea].push(aliasAcopleTarea);
    }
    
    const aliasAcopleTareaUpdated = [];
    
    for (const [idTarea, aliasAcopleTareas] of Object.entries(aliasAcopleTareaByTarea)) {
      const acoplesAdded = acoples.filter(acople => 
        !aliasAcopleTareas.some(existing => existing.idAlias === acople.idAlias)
      );
      
      const aliasAcopleTareasRemoved = aliasAcopleTareas.filter(existing => 
        !acoples.some(acople => acople.idAlias === existing.idAlias && existing.fechaBaja === null)
      );
      
      const acoplesRestored = aliasAcopleTareas.filter(existing => 
        acoples.some(acople => acople.idAlias === existing.idAlias && existing.fechaBaja !== null)
      );
      
      if (acoplesAdded.length > 0) {
        for (const acople of acoplesAdded) {
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
          aliasAcopleDeleted.fechaBaja = fechaModificacion;
          aliasAcopleDeleted.usuarioBaja = usuarioModificacion;
          aliasAcopleTareaUpdated.push(aliasAcopleDeleted);
        }
      }
      
      if (acoplesRestored.length > 0) {
        for (const restored of acoplesRestored) {
          restored.fechaBaja = null;
          restored.usuarioBaja = null;
          restored.fechaModificacion = fechaModificacion;
          restored.usuarioModificacion = usuarioModificacion;
          aliasAcopleTareaUpdated.push(restored);
        }
      }
    }
    
    if (aliasAcopleTareaUpdated.length > 0) {
      for (const item of aliasAcopleTareaUpdated) {
        if (!item.id) {
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

exports.updateAliasTarea = async (idAliasAcople, acoples, usuarioModificacion, fechaModificacion) => {
  try {
    if (!acoples || acoples.length === 0) {
      console.log('No hay acoples para actualizar en alias tarea');
      return;
    }
    
    const idsMainAlias = acoples.map(acople => acople.idAlias);
    const idsTarea = await exports.findIdsTareaByIdsMainAlias(idsMainAlias);
    
    if (idsTarea.length === 0) {
      console.log('No se encontraron tareas relacionadas con los alias principales');
      return;
    }
    
    for (const idTarea of idsTarea) {
      const aliasTareaByIdTarea = await exports.findAliasTareaByIdTarea(idTarea);
      
      const acoplesAdded = acoples.filter(acople => 
        !aliasTareaByIdTarea.some(existing => existing.ID_ALIAS === acople.idAlias)
      );
      
      const aliasTareaRemoved = aliasTareaByIdTarea.filter(existing => 
        !acoples.some(acople => acople.idAlias === existing.ID_ALIAS)
      );
      
      const acoplesRestored = aliasTareaByIdTarea.filter(existing => 
        acoples.some(acople => acople.idAlias === existing.ID_ALIAS && existing.FECHA_BAJA !== null)
      );
      
      if (acoplesAdded.length > 0) {
        for (const acople of acoplesAdded) {
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

exports.findLocalizacionCompraByCadenaMercado = async (idsCadena, idsMercado) => {
  try {
    const idsEstadoTienda = [1, 3, 4];
    
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

exports.createAliasAmbito = async (idAlias, fechaAlta, usuarioAlta) => {
  try {
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

exports.createAliasAmbitoAplanado = async (idAliasAmbito, fechaAlta, usuarioAlta, localizaciones) => {
  try {
    if (!localizaciones || localizaciones.length === 0) {
      console.log('No hay localizaciones para crear ámbito aplanado');
      return;
    }
    
    const maxIdQuery = `
      SELECT MAX(ID_ALIAS_AMBITO_APLANADO) as maxId
      FROM AJENOS.ALIAS_AMBITO_APLANADO
    `;
    
    const maxIdResult = await sequelizeAjenos.query(maxIdQuery, {
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    let nextId = 1;
    if (maxIdResult && maxIdResult.length > 0 && maxIdResult[0].maxId) {
      nextId = maxIdResult[0].maxId + 1;
    }
    
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

exports.createStockLocalizacion = async (idAlias, idsLocalizacion, stockMaximo, fechaAlta, usuarioAlta) => {
  try {
    if (!idsLocalizacion || idsLocalizacion.length === 0) {
      console.log('No hay localizaciones para crear stock');
      return;
    }
    
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

exports.updateAliasAmbitoAplanado = async (idAlias, idAliasAmbito, localizacionesCalculadas, usuario, fecha) => {
  try {
    let aliasUntrained = false;
    
    const existingAliasAmbitoAplanado = await exports.findAliasAmbitoAplanadoByIdAliasAmbito(idAliasAmbito);
    
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
    
    const idsLocalizacionCompra = newAliasAmbitoAplanado.map(localizacion => 
      localizacion.idLocalizacionCompra
    );
    
    const stockLocalizaciones = await exports.findStockLocalizacion(idAlias, idsLocalizacionCompra);
    
    const idTipoAlias = await exports.findTypeAliasIdByIdAlias(idAlias);
    
    const localizacionesSinFechaBaja = newAliasAmbitoAplanado.filter(localizacion => {
      const stock = stockLocalizaciones.find(s => 
        s.ID_LOCALIZACION_COMPRA === localizacion.idLocalizacionCompra
      );
      return !stock || stock.FECHA_BAJA === null;
    });
    
    if (localizacionesSinFechaBaja.length > 0) {
      await exports.createAliasAmbitoAplanado(idAliasAmbito, fecha, usuario, localizacionesSinFechaBaja);
      
      const stockMaximo = idTipoAlias === 4 ? null : 100;
      await exports.createStockLocalizacion(
        idAlias,
        localizacionesSinFechaBaja.map(localizacion => localizacion.idLocalizacionCompra),
        stockMaximo,
        fecha,
        usuario
      );
      
      aliasUntrained = true;
    }
    
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

exports.createTareaAmbitoAplanado = async (idTareaAmbito, fechaAlta, usuarioAlta, tareaAmbitoAplanados) => {
  try {
    if (!tareaAmbitoAplanados || tareaAmbitoAplanados.length === 0) {
      return;
    }
    
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

exports.propagateTareaAmbitoAplanadoByUpdatedAliasAcople = async (idAliasAcople, idsMainAlias, aliasAmbito, usuario, fecha) => {
  try {
    const TIPO_TAREA_COUNT = 2;
    const TIPO_TAREA_DISTRIBUTION = 1;
    const TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA = 1;
    
    const tareas = await exports.findBaseTareaTipoByIdAlias(idAliasAcople);
    
    if (!tareas || tareas.length === 0) {
      console.log(`No hay tareas asociadas al alias acople ${idAliasAcople}`);
      return;
    }
    
    for (const tarea of tareas) {
      const calculatedTareaAmbitoAplanados = [];
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_COUNT) {
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

exports.propagateTareaAmbitoAplanadoByUpdatedAlias = async (idAlias, idsAliasAcople, aliasAmbito, usuario, fecha) => {
  try {
    const TIPO_TAREA_COUNT = 2;
    const TIPO_TAREA_DISTRIBUTION = 1;
    const TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA = 1;
    
    const tareas = await exports.findBaseTareaTipoByIdAlias(idAlias);
    
    if (!tareas || tareas.length === 0) {
      console.log(`No hay tareas asociadas al alias ${idAlias}`);
      return;
    }
    
    for (const tarea of tareas) {
      const calculatedTareaAmbitoAplanados = [];
      
      if (parseInt(tarea.idTipoTarea) === TIPO_TAREA_COUNT) {
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
        
        const aliasMainRecords = await exports.calculateBasicTareaAmbitoAplanadoByIdAlias(
          [idAlias], 
          aliasAmbito.idsMercado, 
          aliasAmbito.idsGrupoCadena, 
          aliasAmbito.idsCadena,
          TIPO_ESTADO_LOCALIZACION_TAREA_ACTIVA
        );
        
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

exports.createAlias = async (alias, fechaAlta, usuarioAlta) => {
  try {
    const getLastIdQuery = `
      SELECT MAX(ID_ALIAS) as maxId FROM AJENOS.ALIAS
    `;
    
    const lastIdResult = await sequelizeAjenos.query(getLastIdQuery, {
      type: QueryTypes.SELECT
    });
    
    const newAliasId = (lastIdResult[0].maxId || 0) + 1;
    
    const query = `
      INSERT INTO AJENOS.ALIAS (
        ID_ALIAS,
        ID_TIPO_ALIAS, 
        ID_TIPO_ESTADO_ALIAS, 
        ID_TIPO_ESTACIONALIDAD, 
        ENTRENADO, 
        USUARIO_ALTA, 
        FECHA_ALTA, 
        ID_TIPO_CONEXION_ORIGEN_DATO_ALIAS, 
        INFORMACION_ORIGEN_DATO
      ) VALUES (
        :idAlias,
        :idTipoAlias, 
        :idTipoEstadoAlias, 
        :idTipoEstacionalidad, 
        0, 
        :usuarioAlta, 
        :fechaAlta, 
        :idTipoConexionOrigenDatoAlias, 
        :informacionOrigenDato
      )`;
    
    await sequelizeAjenos.query(query, {
      replacements: {
        idAlias: newAliasId,
        idTipoAlias: alias.idTipoAlias,
        idTipoEstadoAlias: alias.idTipoEstadoAlias,
        idTipoEstacionalidad: alias.idTipoEstacionalidad,
        usuarioAlta,
        fechaAlta,
        idTipoConexionOrigenDatoAlias: alias.idTipoConexionOrigenDatoAlias,
        informacionOrigenDato: alias.informacionOrigenDato
      },
      type: QueryTypes.INSERT
    });
    
    return newAliasId;
  } catch (error) {
    console.error('Error al crear alias:', error);
    throw error;
  }
};

exports.createAliasIdioma = async (idAlias, idiomas) => {
  try {
    const existingRecords = await sequelizeAjenos.query(`
      SELECT ID_ALIAS, ID_IDIOMA 
      FROM AJENOS.ALIAS_IDIOMA 
      WHERE ID_ALIAS = :idAlias
    `, {
      replacements: { idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const existingIdiomasMap = new Map(existingRecords.map(r => [`${r.ID_ALIAS}-${r.ID_IDIOMA}`, true]));
    const idiomasToInsert = idiomas.filter(idioma => 
      !existingIdiomasMap.has(`${idAlias}-${idioma.idIdioma}`)
    );
    
    if (idiomasToInsert.length === 0) {
      console.log(`Todos los idiomas ya existen para el alias ${idAlias}, no se requiere inserción`);
      return true;
    }
    
    const queries = idiomasToInsert.map(idioma => `
      INSERT INTO AJENOS.ALIAS_IDIOMA (
        ID_ALIAS, 
        ID_IDIOMA, 
        NOMBRE, 
        DESCRIPCION
      ) VALUES (
        ${idAlias}, 
        ${idioma.idIdioma}, 
        '${idioma.nombre.replace(/'/g, "''")}', 
        '${idioma.descripcion.replace(/'/g, "''")}'
      )
    `);
    
    await sequelizeAjenos.transaction(async (t) => {
      for (const query of queries) {
        await sequelizeAjenos.query(query, { transaction: t });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al crear alias_idioma:', error);
    throw error;
  }
};

exports.createAliasAjeno = async (idAlias, fechaAlta, usuarioAlta, aliasAjenos) => {
  try {
    const queries = aliasAjenos.map(ajeno => `
      INSERT INTO AJENOS.ALIAS_AJENO (
        ID_ALIAS, 
        ID_AJENO, 
        ID_TIPO_ESTADO_AJENO_RAM, 
        ID_SINT, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        ${idAlias}, 
        ${ajeno.idAjeno}, 
        ${ajeno.idTipoEstadoAjenoRam}, 
        ${ajeno.idSint ? `'${ajeno.idSint}'` : 'NULL'}, 
        '${usuarioAlta}', 
        '${fechaAlta.toISOString().split('T')[0]}'
      )
    `);
    
    await sequelizeAjenos.transaction(async (t) => {
      for (const query of queries) {
        await sequelizeAjenos.query(query, { transaction: t });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al crear alias_ajeno:', error);
    throw error;
  }
};

exports.createAliasAcople = async (idAlias, fechaAlta, usuarioAlta, aliasAcoples) => {
  try {
    const insertQueries = aliasAcoples.map(acople => `
      INSERT INTO AJENOS.ALIAS_ACOPLE (
        ID_ALIAS, 
        ID_ALIAS_ACOPLE, 
        ID_TIPO_ORIGEN_DATO_ALIAS, 
        RATIO_ACOPLE, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        ${acople.idAlias}, 
        ${idAlias}, 
        2, 
        ${acople.ratioAcople}, 
        '${usuarioAlta}', 
        '${fechaAlta.toISOString().split('T')[0]}'
      )
    `);
    
    const idsAlias = aliasAcoples.map(acople => acople.idAlias);
    const idsTareaQuery = `
      SELECT DISTINCT ID_TAREA_RAM FROM AJENOS.ALIAS_ACOPLE_TAREA 
      WHERE ID_ALIAS IN (${idsAlias.join(',')})
    `;
    
    const idsTareaResult = await sequelizeAjenos.query(idsTareaQuery, {
      type: QueryTypes.SELECT
    });
    const idsTarea = idsTareaResult.map(row => row.ID_TAREA);
    
    const tareaQueries = [];
    for (const idTarea of idsTarea) {
      for (const acople of aliasAcoples) {
        tareaQueries.push(`
          INSERT INTO AJENOS.ALIAS_ACOPLE_TAREA (
            ID_ALIAS_ACOPLE, 
            ID_ALIAS, 
            ID_TAREA_RAM, 
            ID_TIPO_ORIGEN_DATO_ALIAS, 
            USUARIO_ALTA, 
            FECHA_ALTA
          ) VALUES (
            ${idAlias}, 
            ${acople.idAlias}, 
            ${idTarea}, 
            1, 
            '${usuarioAlta}', 
            '${fechaAlta.toISOString().split('T')[0]}'
          )
        `);
      }
    }
    
    await sequelizeAjenos.transaction(async (t) => {
      for (const query of insertQueries) {
        await sequelizeAjenos.query(query, { transaction: t });
      }
      for (const query of tareaQueries) {
        await sequelizeAjenos.query(query, { transaction: t });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al crear alias_acople:', error);
    throw error;
  }
};

const TipoReglaAmbito = {
  CADENA_Y_MERCADO: 1,
  MERCADO: 2,
  LOCALIZACION: 3
};

exports.createAliasAmbito = async (idAlias, fechaAlta, usuarioAlta) => {
  try {
    const getLastIdQuery = `
      SELECT MAX(ID_ALIAS_AMBITO) as maxId FROM AJENOS.ALIAS_AMBITO
    `;
    
    const lastIdResult = await sequelizeAjenos.query(getLastIdQuery, {
      type: QueryTypes.SELECT
    });
    
    const newAliasAmbitoId = (lastIdResult[0].maxId || 0) + 1;
    
    const query = `
      INSERT INTO AJENOS.ALIAS_AMBITO (
        ID_ALIAS_AMBITO,
        ID_ALIAS, 
        ID_TIPO_REGLA_AMBITO, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        :idAliasAmbito,
        :idAlias, 
        :idTipoReglaAmbito, 
        :usuarioAlta, 
        :fechaAlta
      )`;
    
    await sequelizeAjenos.query(query, {
      replacements: {
        idAliasAmbito: newAliasAmbitoId,
        idAlias,
        idTipoReglaAmbito: TipoReglaAmbito.CADENA_Y_MERCADO,
        usuarioAlta,
        fechaAlta: fechaAlta.toISOString().split('T')[0]
      },
      type: QueryTypes.INSERT
    });
    
    return newAliasAmbitoId;
  } catch (error) {
    console.error('Error al crear alias_ambito:', error);
    throw error;
  }
};

exports.createStockLocalizacion = async (idAlias, idsLocalizacion, stockMaximo, fechaAlta, usuarioAlta) => {
  try {
    const queries = idsLocalizacion.map(idLocalizacion => `
      INSERT INTO AJENOS.STOCK_LOCALIZACION_RAM (
        ID_ALIAS, 
        ID_LOCALIZACION_COMPRA, 
        STOCK_MAXIMO, 
        USUARIO_ALTA, 
        FECHA_ALTA
      ) VALUES (
        ${idAlias}, 
        ${idLocalizacion}, 
        ${stockMaximo !== null ? stockMaximo : 'NULL'}, 
        '${usuarioAlta}', 
        '${fechaAlta.toISOString().split('T')[0]}'
      )
    `);
    
    await sequelizeAjenos.transaction(async (t) => {
      for (const query of queries) {
        await sequelizeAjenos.query(query, { transaction: t });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error al crear stock_localizacion_ram:', error);
    throw error;
  }
};

exports.deleteAliasArticulo = async (idAjeno, idAlias, usuarioBaja, fechaBaja) => {
  try {
    const query = `
      UPDATE AJENOS.ALIAS_AJENO 
      SET USUARIO_BAJA = :usuarioBaja, 
          FECHA_BAJA = :fechaBaja
      WHERE ID_ALIAS = :idAlias 
      AND ID_AJENO = :idAjeno
    `;
    
    const result = await sequelizeAjenos.query(query, {
      replacements: { idAjeno, idAlias, usuarioBaja, fechaBaja },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return result[1] > 0;
  } catch (error) {
    console.error(`Error en deleteAliasArticulo: ${error.message}`);
    throw error;
  }
};

exports.updateAliasAmbitoAplanado = async (idAjeno, idAlias, usuarioModificacion, fechaModificacion) => {
  try {
    const findIdsQuery = `
      SELECT aaa.ID_ALIAS_AMBITO_APLANADO
      FROM AJENOS.ALIAS_AMBITO aa
      INNER JOIN AJENOS.ALIAS_AMBITO_APLANADO aaa ON aaa.ID_ALIAS_AMBITO = aa.ID_ALIAS_AMBITO
      WHERE aa.ID_ALIAS = :idAlias 
      AND aaa.ID_AJENO_SECCION_GLOBAL = :idAjeno
    `;
    
    const idsResult = await sequelizeAjenos.query(findIdsQuery, {
      replacements: { idAjeno, idAlias },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    const ids = idsResult.map(r => r.ID_ALIAS_AMBITO_APLANADO);
    
    if (ids.length === 0) {
      return false;
    }
    
    const updateQuery = `
      UPDATE AJENOS.ALIAS_AMBITO_APLANADO 
      SET USUARIO_MODIFICACION = :usuarioModificacion, 
          FECHA_MODIFICACION = :fechaModificacion,
          ID_AJENO_SECCION_GLOBAL = NULL
      WHERE ID_ALIAS_AMBITO_APLANADO IN (:ids)
    `;
    
    const result = await sequelizeAjenos.query(updateQuery, {
      replacements: { ids, usuarioModificacion, fechaModificacion },
      type: sequelizeAjenos.QueryTypes.UPDATE
    });
    
    return result[1] > 0;
  } catch (error) {
    console.error(`Error en updateAliasAmbitoAplanado: ${error.message}`);
    throw error;
  }
};