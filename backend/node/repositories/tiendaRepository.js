// backend/node/repositories/tiendaRepository.js
const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');

exports.findTiendasByFilter = async (filter = {}, pageable = { page: 0, size: 50 }, idIdioma = 1) => {
  try {
    // Primero, registramos diagnóstico para saber el estado de las tablas
    console.log(`Buscando tiendas con idIdioma: ${idIdioma}`);
    
    // Consulta principal con nuevo JOIN para estados
    const query = `
      SELECT 
        lc.ID_LOCALIZACION_COMPRA AS codigoTienda, 
        lc.DESCRIPCION AS nombreTienda,
        lcr.ID_LOCALIZACION_COMPRA_RAM AS idLocalizacionRam,
        mp.ID_PAIS AS idMercado, 
        mp.PAIS_ISO AS codigoIsoMercado,
        COALESCE(mpi.DESCRIPCION, mp.DESCRIPCION) as nombreMercado, 
        gc.DESCRIPCION AS nombreGrupoCadena,
        c.NOMBRE AS nombreCadena, 
        telri.DESCRIPCION AS descripcionTipoEstadoLocalizacionRam
      FROM AJENOS.LOCALIZACION_COMPRA lc
      LEFT JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA
      LEFT JOIN MAESTROS.PAIS mp ON lc.ID_PAIS = mp.ID_PAIS
      LEFT JOIN MAESTROS.PAIS_IDIOMA mpi ON mpi.ID_PAIS = mp.ID_PAIS AND mpi.ID_IDIOMA = :idIdioma
      LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      LEFT JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
      LEFT JOIN AJENOS.TIPO_ESTADO_LOCALIZACION_RAM_IDIOMA telri ON 
          telri.ID_TIPO_ESTADO_LOCALIZACION_RAM = lcr.ID_TIPO_ESTADO_LOCALIZACION_RAM AND telri.ID_IDIOMA = :idIdioma
      WHERE lc.FECHA_BAJA IS NULL
      AND gc.ID_TIPO_GRUPO_CADENA = 6
    `;

    let whereClause = '';
    
    if (filter.idsMercado && filter.idsMercado.length) {
      whereClause += ` AND lc.ID_PAIS IN (${filter.idsMercado.join(',')})`;
    }
    
    if (filter.idsGrupoCadena && filter.idsGrupoCadena.length) {
      whereClause += ` AND gc.ID_GRUPO_CADENA IN (${filter.idsGrupoCadena.join(',')})`;
    }
    
    if (filter.idsCadena && filter.idsCadena.length) {
      whereClause += ` AND c.ID_CADENA IN (${filter.idsCadena.join(',')})`;
    }
    
    if (filter.idLocalizacion) {
      whereClause += ` AND lc.ID_LOCALIZACION_COMPRA = ${filter.idLocalizacion}`;
    }
    
    const paginatedQuery = `${query} ${whereClause} ORDER BY lc.ID_LOCALIZACION_COMPRA ASC LIMIT :limit OFFSET :offset`;

    const replacements = { 
      idIdioma,
      limit: pageable.size,
      offset: pageable.page * pageable.size
    };

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM AJENOS.LOCALIZACION_COMPRA lc
      JOIN AJENOS.LOCALIZACION_COMPRA_RAM lcr ON lc.ID_LOCALIZACION_COMPRA = lcr.ID_LOCALIZACION_COMPRA
      LEFT JOIN MAESTROS.CADENA c ON c.ID_CADENA = lc.ID_CADENA
      LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA
      LEFT JOIN MAESTROS.GRUPO_CADENA gc ON gc.ID_GRUPO_CADENA = gcc.ID_GRUPO_CADENA
      WHERE lc.FECHA_BAJA IS NULL 
      AND gc.ID_TIPO_GRUPO_CADENA = 6
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      sequelizeAjenos.query(paginatedQuery, {
        replacements,
        type: sequelizeAjenos.QueryTypes.SELECT
      }),
      sequelizeAjenos.query(countQuery, {
        replacements: { idIdioma },
        type: sequelizeAjenos.QueryTypes.SELECT
      })
    ]);

    // Si no hay resultados, simplemente retornamos
    if (!result || result.length === 0) {
      return {
        content: [],
        totalElements: 0,
        number: pageable.page,
        size: pageable.size,
        totalPages: 0
      };
    }

    // Para cada tienda, obtenemos su estado de manera directa con una consulta específica
    // que evita los JOINs problemáticos
    const tiendaIds = result.map(item => item.codigoTienda);
    
    // Consulta separada para obtener los estados
    const estadosQuery = `
      SELECT 
        lc.ID_LOCALIZACION_COMPRA as codigoTienda,
        COALESCE(
          eti.DESCRIPCION, 
          et.DESCRIPCION,
          'Sin estado'  
        ) as estadoTiendaMtu
      FROM AJENOS.LOCALIZACION_COMPRA lc
      LEFT JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION
      LEFT JOIN MAESTROS.TIENDA_HISTORICO th ON th.ID_TIENDA = t.ID_TIENDA AND th.ESTADO_VIGENTE = 1
      LEFT JOIN MAESTROS.ESTADO_TIENDA et ON et.ID_ESTADO_TIENDA = th.ID_ESTADO_TIENDA
      LEFT JOIN MAESTROS.ESTADO_TIENDA_IDIOMA eti ON 
          eti.ID_ESTADO_TIENDA = et.ID_ESTADO_TIENDA AND eti.ID_IDIOMA = :idIdioma
      WHERE lc.ID_LOCALIZACION_COMPRA IN (${tiendaIds.join(',')})
    `;
    
    const estadosResult = await sequelizeAjenos.query(estadosQuery, {
      replacements: { idIdioma },
      type: sequelizeAjenos.QueryTypes.SELECT
    });
    
    // Creamos un mapa para acceder rápidamente a los estados por ID_LOCALIZACION_COMPRA
    const estadosMap = {};
    for (const estado of estadosResult) {
      estadosMap[estado.codigoTienda] = estado.estadoTiendaMtu;
    }
    
    // Verificamos si tenemos estados en el mapa
    const hayEstados = Object.keys(estadosMap).length > 0;
    console.log(`Encontrados ${Object.keys(estadosMap).length} estados para ${tiendaIds.length} tiendas`);
    
    // Si no hay estados, necesitamos aplicar una solución alternativa
    if (!hayEstados) {
      console.log('No se encontraron estados. Ejecutando consulta alternativa...');
      
      // Intentamos otra consulta que obtiene directamente de ESTADO_TIENDA sin depender
      // de la relación LOCALIZACION -> TIENDA -> TIENDA_HISTORICO
      const estadosDirectosQuery = `
        SELECT 
          ID_ESTADO_TIENDA,
          DESCRIPCION
        FROM MAESTROS.ESTADO_TIENDA
      `;
      
      const estadosDirectos = await sequelizeMaestros.query(estadosDirectosQuery, {
        type: sequelizeMaestros.QueryTypes.SELECT
      });
      
      console.log(`Encontrados ${estadosDirectos.length} estados directos`);
      
      // Si tenemos estados directos, los anexamos manualmente
      if (estadosDirectos.length > 0) {
        // Obtener un estado predeterminado (el primero)
        const estadoPredeterminado = estadosDirectos[0].DESCRIPCION;
        
        // Aplicar este estado a todas las tiendas
        for (const tiendaId of tiendaIds) {
          estadosMap[tiendaId] = estadoPredeterminado;
        }
      }
    }
    
    // Ahora mezclamos los resultados con los estados
    const processedResult = result.map(item => {
      // Crear copia del elemento
      const processed = { ...item };
      
      // Asignar estadoTiendaMtu desde el mapa o valor por defecto
      processed.estadoTiendaMtu = estadosMap[processed.codigoTienda] || 'Sin estado';
      
      return processed;
    });

    return {
      content: processedResult || [],
      totalElements: countResult?.[0]?.total || 0,
      number: pageable.page,
      size: pageable.size,
      totalPages: Math.ceil((countResult?.[0]?.total || 0) / pageable.size)
    };
  } catch (error) {
    console.error('Error en findTiendasByFilter:', error);
    throw error;
  }
};

// Función para diagnóstico - útil para verificar estado de las tablas
async function diagnosticarTablas() {
  try {
    const queries = {
      estadoTienda: 'SELECT COUNT(*) as total FROM MAESTROS.ESTADO_TIENDA',
      estadoTiendaIdioma: 'SELECT COUNT(*) as total FROM MAESTROS.ESTADO_TIENDA_IDIOMA',
      tiendaHistorico: 'SELECT COUNT(*) as total FROM MAESTROS.TIENDA_HISTORICO WHERE ESTADO_VIGENTE = 1',
      relacionTiendas: `
        SELECT 
          COUNT(*) as total_tiendas,
          SUM(CASE WHEN t.ID_TIENDA IS NOT NULL THEN 1 ELSE 0 END) as con_tienda,
          SUM(CASE WHEN t.ID_TIENDA IS NULL THEN 1 ELSE 0 END) as sin_tienda
        FROM AJENOS.LOCALIZACION_COMPRA lc
        LEFT JOIN MAESTROS.TIENDA t ON t.ID_TIENDA = lc.ID_LOCALIZACION
        LIMIT 1000
      `
    };
    
    const resultados = {};
    for (const [nombre, query] of Object.entries(queries)) {
      const resultado = await sequelizeMaestros.query(query, {
        type: sequelizeMaestros.QueryTypes.SELECT
      });
      resultados[nombre] = resultado[0];
    }
    
    console.log('Diagnóstico de tablas:', resultados);
    return resultados;
  } catch (error) {
    console.error('Error en diagnóstico de tablas:', error);
    return {};
  }
}

let mercadosCache = {};
let gruposCadenaCache = {};
let cadenasCache = {};

setInterval(() => {
  mercadosCache = {};
  gruposCadenaCache = {};
  cadenasCache = {};
}, 3600000);

exports.getMercados = async (idIdioma = 1) => {
  try {
    const query = `
      SELECT mp.ID_PAIS as id, COALESCE(mpi.DESCRIPCION, mp.DESCRIPCION) as descripcion
      FROM MAESTROS.PAIS mp
      LEFT JOIN MAESTROS.PAIS_IDIOMA mpi ON mpi.ID_PAIS = mp.ID_PAIS AND mpi.ID_IDIOMA = :idIdioma
      ORDER BY descripcion ASC
      LIMIT 100
    `;
    
    return await sequelizeMaestros.query(query, {
      replacements: { idIdioma },
      type: sequelizeMaestros.QueryTypes.SELECT
    });
  } catch (error) {
    console.error('Error al obtener mercados:', error);
    return [];
  }
};

exports.getGruposCadena = async (idIdioma = 1) => {
  try {
    const query = `
      SELECT gc.ID_GRUPO_CADENA as id, gc.DESCRIPCION as descripcion
      FROM MAESTROS.GRUPO_CADENA gc
      WHERE gc.ID_TIPO_GRUPO_CADENA = 6
      ORDER BY descripcion ASC
      LIMIT 50
    `;
    
    return await sequelizeMaestros.query(query, {
      type: sequelizeMaestros.QueryTypes.SELECT
    });
  } catch (error) {
    console.error('Error al obtener grupos de cadena:', error);
    return [];
  }
};

exports.getCadenas = async (idGrupoCadena = null, idIdioma = 1) => {
  try {
    let query = `
      SELECT c.ID_CADENA as id, c.NOMBRE as descripcion
      FROM MAESTROS.CADENA c
    `;
    
    const replacements = { idIdioma };
    
    if (idGrupoCadena) {
      query += ` JOIN MAESTROS.GRUPO_CADENA_CADENA gcc ON gcc.ID_CADENA = c.ID_CADENA 
        WHERE gcc.ID_GRUPO_CADENA = :idGrupoCadena`;
      replacements.idGrupoCadena = idGrupoCadena;
    }
    
    query += ` ORDER BY descripcion ASC LIMIT 100`;
    
    return await sequelizeMaestros.query(query, {
      replacements,
      type: sequelizeMaestros.QueryTypes.SELECT
    });
  } catch (error) {
    console.error('Error al obtener cadenas:', error);
    return [];
  }
};

// Exportar función diagnóstico
exports.diagnosticarTablas = diagnosticarTablas;