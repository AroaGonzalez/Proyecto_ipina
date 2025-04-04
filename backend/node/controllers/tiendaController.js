// backend/node/controllers/tiendaController.js
const tiendaRepository = require('../repositories/tiendaRepository');

exports.getTiendas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 50;
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    
    console.log('Solicitud de tiendas con parámetros:', { page, size, idIdioma, query: req.query });
    
    const filter = {};
    
    if (req.query.idsMercado) {
      filter.idsMercado = req.query.idsMercado.split(',').map(id => parseInt(id));
    }
    
    if (req.query.idsGrupoCadena) {
      filter.idsGrupoCadena = req.query.idsGrupoCadena.split(',').map(id => parseInt(id));
    }
    
    if (req.query.idsCadena) {
      filter.idsCadena = req.query.idsCadena.split(',').map(id => parseInt(id));
    }
    
    if (req.query.idsLocalizacion) {
      filter.idsLocalizacion = req.query.idsLocalizacion.split(',').map(id => parseInt(id));
    }
    
    if (req.query.idLocalizacion) {
      filter.idLocalizacion = parseInt(req.query.idLocalizacion);
    }
    
    console.log('Filtros aplicados:', filter);
    
    const pageable = { page, size };
    const result = await tiendaRepository.findTiendasByFilter(filter, pageable, idIdioma);
    
    console.log('Resultado de tiendas:', {
      encontrados: result.content.length,
      total: result.totalElements,
      primerElemento: result.content.length > 0 ? result.content[0] : null
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error detallado al obtener tiendas:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener tiendas', 
      error: error.message 
    });
  }
};

exports.getMercados = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    console.log('Obteniendo mercados para idioma:', idIdioma);
    
    const mercados = await tiendaRepository.getMercados(idIdioma);
    console.log('Mercados encontrados:', mercados.length);
    
    res.json(mercados);
  } catch (error) {
    console.error('Error detallado al obtener mercados:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener mercados', 
      error: error.message 
    });
  }
};

exports.getGruposCadena = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    console.log('Obteniendo grupos cadena para idioma:', idIdioma);
    
    const gruposCadena = await tiendaRepository.getGruposCadena(idIdioma);
    console.log('Grupos cadena encontrados:', gruposCadena.length);
    
    res.json(gruposCadena);
  } catch (error) {
    console.error('Error detallado al obtener grupos de cadena:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener grupos de cadena', 
      error: error.message 
    });
  }
};

exports.getCadenas = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    const idGrupoCadena = req.query.idGrupoCadena ? parseInt(req.query.idGrupoCadena) : null;
    
    console.log('Obteniendo cadenas para grupo cadena:', idGrupoCadena, 'e idioma:', idIdioma);
    
    const cadenas = await tiendaRepository.getCadenas(idGrupoCadena, idIdioma);
    console.log('Cadenas encontradas:', cadenas.length);
    
    res.json(cadenas);
  } catch (error) {
    console.error('Error detallado al obtener cadenas:', error.stack);
    res.status(500).json({ 
      message: 'Error al obtener cadenas', 
      error: error.message 
    });
  }
};