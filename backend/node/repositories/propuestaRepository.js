const { sequelizeAjenos, sequelizeMaestros } = require('../utils/database');

// Cache para optimizar consultas frecuentes
const CACHE_DURATION = 30 * 1000; // 30 segundos

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

// Función para corregir problemas de codificación de caracteres
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

exports.findPropuestasByFilter = async (propuestaFilter, tipoAlias = []) => {
 try {
   console.log('Ejecutando findPropuestasByFilter con filtros:', JSON.stringify(propuestaFilter));
   
   const cacheKey = `propuestas_${JSON.stringify(propuestaFilter)}_${JSON.stringify(tipoAlias)}`;
   const cachedResult = cache.get(cacheKey);
   
   if (cachedResult) {
     return cachedResult;
   }

   // Primero, comprobamos si hay registros con estado 3 en una consulta simple
   if (propuestaFilter.idsTipoEstadoPropuesta && 
       propuestaFilter.idsTipoEstadoPropuesta.includes(3) && 
       propuestaFilter.idsTipoEstadoPropuesta.length === 1) {
     
     const checkQuery = `
       SELECT COUNT(*) as total 
       FROM AJENOS.PROPUESTA_RAM 
       WHERE ID_TIPO_ESTADO_PROPUESTA_RAM = 3
     `;
     
     const checkResult = await sequelizeAjenos.query(checkQuery, {
       type: sequelizeAjenos.QueryTypes.SELECT,
       plain: true
     });
     
     console.log('Comprobación de propuestas con estado 3:', checkResult);
   }

   // Construcción de la consulta SQL principal
   let sqlQuery = `
     SELECT pj1_0.ID_PROPUESTA_RAM AS idPropuesta,
            pj1_0.ID_EVENTO_EJECUCION_RAM AS idEjecucion,
            pj1_0.ID_LOCALIZACION_COMPRA AS idLocalizacion,
            ej1_0.ID_EVENTO_RAM AS idEvento,
            ej1_0.NOMBRE AS nombreEvento,
            ej1_0.DESCRIPCION AS descripcionEvento,
            lcj1_0.DESCRIPCION AS descripcionLocalizacion,
            lcj1_0.ID_CADENA AS idCadena,
            cj1_0.NOMBRE AS descripcionCadena,
            lcj1_0.ID_PAIS AS idPais,
            COALESCE(pij1_0.DESCRIPCION, pj2_0.DESCRIPCION) AS descripcionPais,
            pj2_0.PAIS_ISO AS codigoIsoPais,
            pj1_0.ID_ALIAS AS idAlias,
            pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM AS idTipoEstadoPropuesta,
            tepij1_0.DESCRIPCION AS descripcionTipoEstadoPropuesta,
            ej1_0.ID_TIPO_ESTADO_LINEA_COMPRAS AS idTipoEstadoLineaSolicitud,
            COALESCE(telcij1_0.DESCRIPCION, telcj1_0.DESCRIPCION) AS descripcionTipoEstadoLineaSolicitud,
            eej1_0.ID_AJENO AS idAjeno,
            aij2_0.NOMBRE AS descripcionAjeno,
            eej1_0.COD_EJECUCION AS codEjecucion,
            aj0.ID_UNIDADES_MEDIDA AS idUnidadesMedida,
            pj1_0.STOCK_TEORICO_DATA_ANALYTICS AS stockTeoricoDataAnalytics,
            aj0.UNIDADES_EMPAQUETADO AS unidadesEmpaquetado,
            aij1_0.NOMBRE AS descripcionAlias,
            pj1_0.ID_SOLICITUD AS idSolicitud,
            aaaj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO AS idDepartamentoEmpresaGrupo,
            degj1_0.NOMBRE AS nombreUnidadComprasGestora,
            pj1_0.FECHA_ALTA AS fechaCreacion,
            pj1_0.CANTIDAD_DATA_ANALYTICS AS cantidad
     FROM AJENOS.PROPUESTA_RAM pj1_0
     LEFT JOIN AJENOS.EVENTO_EJECUCION_RAM eej1_0 ON pj1_0.ID_EVENTO_EJECUCION_RAM = eej1_0.ID_EVENTO_EJECUCION_RAM
     LEFT JOIN AJENOS.ALIAS aj1_0 ON pj1_0.ID_ALIAS = aj1_0.ID_ALIAS
     LEFT JOIN AJENOS.EVENTO_RAM ej1_0 ON eej1_0.ID_EVENTO_RAM = ej1_0.ID_EVENTO_RAM
     LEFT JOIN AJENOS.ALIAS_AMBITO aaj1_0 ON pj1_0.ID_ALIAS = aaj1_0.ID_ALIAS
     LEFT JOIN AJENOS.ALIAS_AMBITO_APLANADO aaaj1_0 ON pj1_0.ID_LOCALIZACION_COMPRA = aaaj1_0.ID_LOCALIZACION_COMPRA
       AND aaj1_0.ID_ALIAS_AMBITO = aaaj1_0.ID_ALIAS_AMBITO
     LEFT JOIN AJENOS.AJENO_RAM aj0 ON eej1_0.ID_AJENO = aj0.ID_AJENO
     LEFT JOIN AJENOS.LOCALIZACION_COMPRA lcj1_0 ON pj1_0.ID_LOCALIZACION_COMPRA = lcj1_0.ID_LOCALIZACION_COMPRA
     LEFT JOIN MAESTROS.CADENA cj1_0 ON lcj1_0.ID_CADENA = cj1_0.ID_CADENA
     LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gccj1_0 ON lcj1_0.ID_CADENA = gccj1_0.ID_CADENA
     LEFT JOIN MAESTROS.GRUPO_CADENA gcj1_0 ON gccj1_0.ID_GRUPO_CADENA = gcj1_0.ID_GRUPO_CADENA AND gcj1_0.ID_TIPO_GRUPO_CADENA = 6
     LEFT JOIN MAESTROS.PAIS pj2_0 ON lcj1_0.ID_PAIS = pj2_0.ID_PAIS
     LEFT JOIN MAESTROS.PAIS_IDIOMA pij1_0 ON pj2_0.ID_PAIS = pij1_0.ID_PAIS AND pij1_0.ID_IDIOMA = :idIdioma
     LEFT JOIN MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO degj1_0 ON aaaj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO = degj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO
     LEFT JOIN AJENOS.ALIAS_IDIOMA aij1_0 ON aj1_0.ID_ALIAS = aij1_0.ID_ALIAS AND aij1_0.ID_IDIOMA = :idIdioma
     LEFT JOIN AJENOS.AJENO_IDIOMA aij2_0 ON eej1_0.ID_AJENO = aij2_0.ID_AJENO AND aij2_0.ID_IDIOMA = :idIdioma
     LEFT JOIN AJENOS.TIPO_ESTADO_LINEA_COMPRAS telcj1_0 ON ej1_0.ID_TIPO_ESTADO_LINEA_COMPRAS = telcj1_0.ID_TIPO_ESTADO_LINEA_COMPRAS
     LEFT JOIN AJENOS.TIPO_ESTADO_LINEA_COMPRAS_IDIOMA telcij1_0 ON telcij1_0.ID_TIPO_ESTADO_LINEA_COMPRAS = telcij1_0.ID_TIPO_ESTADO_LINEA_COMPRAS AND telcij1_0.ID_IDIOMA = :idIdioma
     LEFT JOIN AJENOS.TIPO_ESTADO_PROPUESTA_RAM_IDIOMA tepij1_0 ON pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM = tepij1_0.ID_TIPO_ESTADO_PROPUESTA_RAM AND tepij1_0.ID_IDIOMA = :idIdioma
   `;

   let countQuery = `
     SELECT COUNT(pj1_0.ID_PROPUESTA_RAM)
     FROM AJENOS.PROPUESTA_RAM pj1_0
     LEFT JOIN AJENOS.EVENTO_EJECUCION_RAM eej1_0 ON pj1_0.ID_EVENTO_EJECUCION_RAM = eej1_0.ID_EVENTO_EJECUCION_RAM
     LEFT JOIN AJENOS.ALIAS aj1_0 ON pj1_0.ID_ALIAS = aj1_0.ID_ALIAS
     LEFT JOIN AJENOS.EVENTO_RAM ej1_0 ON eej1_0.ID_EVENTO_RAM = ej1_0.ID_EVENTO_RAM
     LEFT JOIN AJENOS.ALIAS_AMBITO aaj1_0 ON pj1_0.ID_ALIAS = aaj1_0.ID_ALIAS
     LEFT JOIN AJENOS.ALIAS_AMBITO_APLANADO aaaj1_0 ON pj1_0.ID_LOCALIZACION_COMPRA = aaaj1_0.ID_LOCALIZACION_COMPRA AND aaj1_0.ID_ALIAS_AMBITO = aaaj1_0.ID_ALIAS_AMBITO
     LEFT JOIN AJENOS.LOCALIZACION_COMPRA lcj1_0 ON pj1_0.ID_LOCALIZACION_COMPRA = lcj1_0.ID_LOCALIZACION_COMPRA
     LEFT JOIN MAESTROS.CADENA cj1_0 ON lcj1_0.ID_CADENA = cj1_0.ID_CADENA
     LEFT JOIN MAESTROS.GRUPO_CADENA_CADENA gccj1_0 ON lcj1_0.ID_CADENA = gccj1_0.ID_CADENA
     LEFT JOIN MAESTROS.GRUPO_CADENA gcj1_0 ON gccj1_0.ID_GRUPO_CADENA = gcj1_0.ID_GRUPO_CADENA AND gcj1_0.ID_TIPO_GRUPO_CADENA = 6
     LEFT JOIN MAESTROS.PAIS pj2_0 ON lcj1_0.ID_PAIS = pj2_0.ID_PAIS
     LEFT JOIN MAESTROS.PAIS_IDIOMA pij1_0 ON pj2_0.ID_PAIS = pij1_0.ID_PAIS AND pij1_0.ID_IDIOMA = :idIdioma
     LEFT JOIN AJENOS.TIPO_ESTADO_LINEA_COMPRAS telcj1_0 ON ej1_0.ID_TIPO_ESTADO_LINEA_COMPRAS = telcj1_0.ID_TIPO_ESTADO_LINEA_COMPRAS
   `;

   // Condiciones de filtrado para tipoAlias
   if (tipoAlias.length > 0) {
     let whereClause = " WHERE 1=1 AND aj1_0.ID_TIPO_ALIAS IN (";
     whereClause += tipoAlias.join(',');
     whereClause += ") ";
     
     sqlQuery += whereClause;
     countQuery += whereClause;
   } else {
     sqlQuery += " WHERE 1=1 ";
     countQuery += " WHERE 1=1 ";
   }

   // Aplicar filtros adicionales
   const replacements = { idIdioma: propuestaFilter.idIdioma };
   
   // Filtro por ID de propuesta
   if (propuestaFilter.idsPropuesta && propuestaFilter.idsPropuesta.length > 0) {
     sqlQuery += ` AND pj1_0.ID_PROPUESTA_RAM IN (${propuestaFilter.idsPropuesta.join(',')}) `;
     countQuery += ` AND pj1_0.ID_PROPUESTA_RAM IN (${propuestaFilter.idsPropuesta.join(',')}) `;
   }
   
   // Filtro por fechas
   if (propuestaFilter.fechaCreacionDesde && !propuestaFilter.fechaCreacionHasta) {
     sqlQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION >= :fechaDesde `;
     countQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION >= :fechaDesde `;
     replacements.fechaDesde = formatDate(propuestaFilter.fechaCreacionDesde);
   }
   
   if (propuestaFilter.fechaCreacionHasta && !propuestaFilter.fechaCreacionDesde) {
     sqlQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION <= :fechaHasta `;
     countQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION <= :fechaHasta `;
     replacements.fechaHasta = formatDate(propuestaFilter.fechaCreacionHasta);
   }
   
   if (propuestaFilter.fechaCreacionDesde && propuestaFilter.fechaCreacionHasta) {
     sqlQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION BETWEEN :fechaDesde AND :fechaHasta `;
     countQuery += ` AND eej1_0.FECHA_HORA_INICIO_EJECUCION BETWEEN :fechaDesde AND :fechaHasta `;
     replacements.fechaDesde = formatDate(propuestaFilter.fechaCreacionDesde);
     replacements.fechaHasta = formatDate(propuestaFilter.fechaCreacionHasta);
   }
   
   // Filtro por unidad de compras gestora
   if (propuestaFilter.idsUnidadComprasGestora && propuestaFilter.idsUnidadComprasGestora.length > 0) {
     if (propuestaFilter.idsUnidadComprasGestora.includes(0)) {
       sqlQuery += ` AND degj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO IS NULL `;
       countQuery += ` AND degj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO IS NULL `;
     } else {
       sqlQuery += ` AND degj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO IN (${propuestaFilter.idsUnidadComprasGestora.join(',')}) `;
       countQuery += ` AND degj1_0.ID_DEPARTAMENTO_EMPRESA_GRUPO IN (${propuestaFilter.idsUnidadComprasGestora.join(',')}) `;
     }
   }
   
   // Filtro por ajeno
   if (propuestaFilter.idsAjeno && propuestaFilter.idsAjeno.length > 0) {
     sqlQuery += ` AND eej1_0.ID_AJENO IN (${propuestaFilter.idsAjeno.join(',')}) `;
     countQuery += ` AND eej1_0.ID_AJENO IN (${propuestaFilter.idsAjeno.join(',')}) `;
   }
   
   // Filtro por mercado
   if (propuestaFilter.idsMercado && propuestaFilter.idsMercado.length > 0) {
     sqlQuery += ` AND lcj1_0.ID_PAIS IN (${propuestaFilter.idsMercado.join(',')}) `;
     countQuery += ` AND lcj1_0.ID_PAIS IN (${propuestaFilter.idsMercado.join(',')}) `;
   }
   
   // Filtro por grupo cadena
   if (propuestaFilter.idsGrupoCadena && propuestaFilter.idsGrupoCadena.length > 0) {
     sqlQuery += ` AND gcj1_0.ID_GRUPO_CADENA IN (${propuestaFilter.idsGrupoCadena.join(',')}) `;
     countQuery += ` AND gcj1_0.ID_GRUPO_CADENA IN (${propuestaFilter.idsGrupoCadena.join(',')}) `;
   }
   
   // Filtro por localización
   if (propuestaFilter.idsLocalizacion && propuestaFilter.idsLocalizacion.length > 0) {
     sqlQuery += ` AND pj1_0.ID_LOCALIZACION_COMPRA IN (${propuestaFilter.idsLocalizacion.join(',')}) `;
     countQuery += ` AND pj1_0.ID_LOCALIZACION_COMPRA IN (${propuestaFilter.idsLocalizacion.join(',')}) `;
   }
   
   // Filtro por evento
   if (propuestaFilter.idsEvento && propuestaFilter.idsEvento.length > 0) {
     sqlQuery += ` AND ej1_0.ID_EVENTO_RAM IN (${propuestaFilter.idsEvento.join(',')}) `;
     countQuery += ` AND ej1_0.ID_EVENTO_RAM IN (${propuestaFilter.idsEvento.join(',')}) `;
   }
   
   // Filtro por código de ejecución
   if (propuestaFilter.idsEjecucion && propuestaFilter.idsEjecucion.length > 0) {
     sqlQuery += ` AND eej1_0.COD_EJECUCION IN (${propuestaFilter.idsEjecucion.join(',')}) `;
     countQuery += ` AND eej1_0.COD_EJECUCION IN (${propuestaFilter.idsEjecucion.join(',')}) `;
   }
   
   // Filtro por estado de propuesta - solo una vez
   if (propuestaFilter.idsTipoEstadoPropuesta && propuestaFilter.idsTipoEstadoPropuesta.length > 0) {
     sqlQuery += ` AND pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM IN (${propuestaFilter.idsTipoEstadoPropuesta.join(',')}) `;
     countQuery += ` AND pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM IN (${propuestaFilter.idsTipoEstadoPropuesta.join(',')}) `;
   } else {
     // Filtro para excluir propuestas eliminadas hace más de dos meses
     const twoMonthsAgo = new Date();
     twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 3);
     replacements.twoMonthsAgoDate = formatDate(twoMonthsAgo);
     
     sqlQuery += ` AND (pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM != 3 OR pj1_0.FECHA_BAJA >= :twoMonthsAgoDate) `;
     countQuery += ` AND (pj1_0.ID_TIPO_ESTADO_PROPUESTA_RAM != 3 OR pj1_0.FECHA_BAJA >= :twoMonthsAgoDate) `;
   }
   
   // Ordenación y paginación usando la sintaxis de MySQL
   sqlQuery += ` ORDER BY pj1_0.FECHA_ALTA DESC`;
   sqlQuery += ` LIMIT ${propuestaFilter.limit} OFFSET ${propuestaFilter.offset * propuestaFilter.limit}`;
   
   console.log('Consulta SQL final:', sqlQuery.replace(/\s+/g, ' '));
   
   // Ejecución de las consultas
   const [countResult, propuestas] = await Promise.all([
     sequelizeAjenos.query(countQuery, {
       replacements,
       type: sequelizeAjenos.QueryTypes.SELECT,
       plain: true
     }),
     
     sequelizeAjenos.query(sqlQuery, {
       replacements,
       type: sequelizeAjenos.QueryTypes.SELECT
     })
   ]);
   
   // Obtener el total de elementos
   const totalElements = parseInt(countResult ? Object.values(countResult)[0] : 0);
   
   console.log('Total elementos contados:', totalElements);
   console.log('Propuestas encontradas:', propuestas.length);
   
   // Transformar los resultados al formato esperado
   const processedPropuestas = propuestas.map(propuesta => {
     return {
       localizacionCompra: {
         id: propuesta.idLocalizacion,
         descripcion: fixEncoding(propuesta.descripcionLocalizacion)
       },
       cadena: {
         id: propuesta.idCadena,
         idGrupoCadena: null, // No está disponible en la consulta
         descripcion: fixEncoding(propuesta.descripcionCadena) 
       },
       mercado: {
         id: propuesta.idPais,
         descripcion: fixEncoding(propuesta.descripcionPais),
         codigoIsoMercado: propuesta.codigoIsoPais
       },
       tipoEstadoLineaSolicitud: {
         id: propuesta.idTipoEstadoLineaSolicitud,
         descripcion: fixEncoding(propuesta.descripcionTipoEstadoLineaSolicitud)
       },
       tipoEstadoPropuesta: {
         id: propuesta.idTipoEstadoPropuesta,
         descripcion: fixEncoding(propuesta.descripcionTipoEstadoPropuesta)
       },
       unidadComprasGestora: {
         id: propuesta.idDepartamentoEmpresaGrupo,
         descripcion: fixEncoding(propuesta.nombreUnidadComprasGestora)
       },
       idPropuesta: propuesta.idPropuesta,
       cantidad: propuesta.cantidad,
       codEjecucion: propuesta.codEjecucion,
       fechaCreacion: propuesta.fechaCreacion ? formatDateOutput(propuesta.fechaCreacion) : null,
       idEvento: propuesta.idEvento,
       idEjecucion: propuesta.idEjecucion,
       idAjeno: propuesta.idAjeno,
       idAlias: propuesta.idAlias,
       idTarea: null, // No está disponible en la consulta
       idLineaSolicitud: propuesta.idSolicitud,
       descripcionEvento: fixEncoding(propuesta.descripcionEvento),
       nombreEvento: fixEncoding(propuesta.nombreEvento),
       descripcionAjeno: fixEncoding(propuesta.descripcionAjeno),
       descripcionAlias: fixEncoding(propuesta.descripcionAlias)
     };
   });
   
   const result = {
     content: processedPropuestas,
     totalElements,
     offset: propuestaFilter.offset,
     limit: propuestaFilter.limit
   };
   
   // Almacenar en caché
   cache.set(cacheKey, result);
   
   return result;
 } catch (error) {
   console.error('Error en findPropuestasByFilter:', error);
   throw error;
 }
};

exports.getUnidadesCompras = async (idIdioma = 1) => {
 try {
   const cacheKey = `unidades_compras_${idIdioma}`;
   const cachedResult = cache.get(cacheKey);
   
   if (cachedResult) {
     return cachedResult;
   }
   
   const query = `
     SELECT DISTINCT
       deg.ID_DEPARTAMENTO_EMPRESA_GRUPO as id,
       deg.NOMBRE as descripcion
     FROM MAESTROS.DEPARTAMENTO_EMPRESA_GRUPO deg
     ORDER BY deg.NOMBRE
   `;
   
   const result = await sequelizeMaestros.query(query, {
     type: sequelizeMaestros.QueryTypes.SELECT
   });
   
   const processedResult = result.map(item => ({
     id: item.id,
     descripcion: fixEncoding(item.descripcion)
   }));
   
   cache.set(cacheKey, processedResult);
   
   return processedResult;
 } catch (error) {
   console.error('Error al obtener unidades de compras:', error);
   return [];
 }
};

exports.getTiposEstadoPropuesta = async (idIdioma = 1) => {
 try {
   const cacheKey = `tipos_estado_propuesta_${idIdioma}`;
   const cachedResult = cache.get(cacheKey);
   
   if (cachedResult) {
     return cachedResult;
   }
   
   const query = `
     SELECT 
       tepr.ID_TIPO_ESTADO_PROPUESTA_RAM as id,
       tepri.DESCRIPCION as descripcion
     FROM AJENOS.TIPO_ESTADO_PROPUESTA_RAM tepr
     JOIN AJENOS.TIPO_ESTADO_PROPUESTA_RAM_IDIOMA tepri ON tepr.ID_TIPO_ESTADO_PROPUESTA_RAM = tepri.ID_TIPO_ESTADO_PROPUESTA_RAM
     WHERE tepri.ID_IDIOMA = :idIdioma
     ORDER BY tepr.ID_TIPO_ESTADO_PROPUESTA_RAM
   `;
   
   const result = await sequelizeAjenos.query(query, {
     replacements: { idIdioma },
     type: sequelizeAjenos.QueryTypes.SELECT
   });
   
   const processedResult = result.map(item => ({
     id: item.id,
     descripcion: fixEncoding(item.descripcion)
   }));
   
   cache.set(cacheKey, processedResult);
   
   return processedResult;
 } catch (error) {
   console.error('Error al obtener tipos de estado de propuesta:', error);
   return [];
 }
};

// Función auxiliar para formatear fechas para SQL
function formatDate(date) {
 if (!date) return null;
 return date.toISOString().split('T')[0];
}

// Función auxiliar para formatear fechas para la salida
function formatDateOutput(date) {
 if (!date) return null;
 return new Date(date).toISOString().split('T')[0];
}