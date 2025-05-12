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

exports.updateStocks = async (req, res) => {
  try {
    const { stocks } = req.body;
    const usuarioModificacion = req.headers['user'] || 'SYSTEM';
    const fechaModificacion = new Date();
    
    const result = await stockRepository.updateStocks(stocks, usuarioModificacion, fechaModificacion);
    
    res.json({
      success: true,
      updatedCount: result.updatedCount,
      message: 'Stocks actualizados correctamente'
    });
  } catch (error) {
    console.error('Error en updateStocks:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar stocks',
      error: error.message
    });
  }
};