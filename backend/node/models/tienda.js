const mongoose = require('mongoose');

const TiendaSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  direccion: { type: String, required: true },
});

module.exports = mongoose.model('Tienda', TiendaSchema);