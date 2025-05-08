const recuentoRepository = require('../repositories/recuentoRepository');

exports.getEstados = async (req, res) => {
  try {
    const { idIdioma = 1 } = req.query;
    
    const result = await recuentoRepository.getTiposEstadoRecuento(parseInt(idIdioma));
    
    res.json(result);
  } catch (error) {
    console.error('Error en getEstados:', error);
    res.status(500).json({
      message: 'Error al obtener tipos de estado de recuento',
      error: error.message
    });
  }
};