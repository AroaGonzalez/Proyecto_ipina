const stockRepository = require('../repositories/stockRepository');

exports.getStocksByFilter = async (req, res) => {
  try {
    const filter = req.body.filter || {};
    const page = req.body.page || { number: 0, size: 50 };
    
    const stockFilter = {
      idIdioma: parseInt(req.query.idIdioma) || 1,
      allExecutionsAllowed: filter.allExecutionsAllowed || true,
      idAlias: filter.idAlias || null,
      idTipoAlias: filter.idTipoAlias || null,
      idLocalizacion: filter.idLocalizacion || null,
      idMercado: filter.idMercado || null,
      idGrupoCadena: filter.idGrupoCadena || null,
      idCadena: filter.idCadena || null,
      idsAlias: filter.idsAlias || [],
      idsTipoAlias: filter.idsTipoAlias || [],
      idsLocalizacion: filter.idsLocalizacion || [],
      idsMercado: filter.idsMercado || [],
      idsGrupoCadena: filter.idsGrupoCadena || [],
      idsCadena: filter.idsCadena || [],
      offset: page.number || 0,
      limit: page.size || 50
    };
    
    const result = await stockRepository.findStocksByFilter(stockFilter);
    
    const response = {
      stocks: result.content,
      page: {
        number: result.offset,
        size: result.limit,
        total: result.totalElements
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error en getStocksByFilter:', error);
    res.status(500).json({
      message: 'Error al obtener stocks',
      error: error.message
    });
  }
};