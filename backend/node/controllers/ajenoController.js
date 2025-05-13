const ajenoRamRepository = require('../repositories/ajenoRamRepository');

exports.searchAjenos = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    const idAjeno = req.query.idAjeno ? parseInt(req.query.idAjeno) : null;
    const nombre = req.query.nombre || null;
     
    const results = await ajenoRamRepository.findAjenosRam(idIdioma, idAjeno, nombre);
     
    res.json(results);
  } catch (error) {
    console.error('Error buscando ajenos:', error);
    res.status(500).json({ message: 'Error al buscar ajenos', error: error.message });
  }
};

exports.createAjenos = async (req, res) => {
  try {
    const { ajenos } = req.body;
     
    if (!ajenos || !Array.isArray(ajenos)) {
      return res.status(400).json({ message: 'Se requiere un array de ajenos' });
    }
   
    const ajenosConEstado = ajenos.map(ajeno => ({
      ...ajeno,
      estadoRam: 1
    }));
     
    const results = await ajenoRamRepository.addAjenosToRam(ajenosConEstado);
     
    res.json({
      message: 'Ajenos añadidos correctamente',
      count: ajenos.length,
      results
    });
  } catch (error) {
    console.error('Error al añadir ajenos:', error);
    res.status(500).json({ message: 'Error al añadir ajenos', error: error.message });
  }
};

exports.getAllAjenos = async (req, res) => {
  try {
    const idIdioma = parseInt(req.query.idIdioma) || 1;
    const results = await ajenoRamRepository.findAllAjenos(idIdioma);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener todos los ajenos:', error);
    res.status(500).json({ message: 'Error al obtener ajenos', error: error.message });
  }
};

exports.updateAjenos = async (req, res) => {
  try {
    const { ajenos } = req.body;
    
    if (!ajenos || !Array.isArray(ajenos)) {
      return res.status(400).json({ message: 'Se requiere un array de ajenos' });
    }
    
    console.log('Actualizando ajenos:', ajenos);
    
    const results = await ajenoRamRepository.updateAjenosRam(ajenos);
    
    res.json({
      message: 'Ajenos actualizados correctamente',
      count: ajenos.length,
      results
    });
  } catch (error) {
    console.error('Error al actualizar ajenos:', error);
    res.status(500).json({ message: 'Error al actualizar ajenos', error: error.message });
  }
};