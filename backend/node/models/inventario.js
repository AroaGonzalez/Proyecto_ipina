const mongoose = require('mongoose');

const InventarioSchema = new mongoose.Schema({
  productoId: { type: String, required: true },
  nombreProducto: { type: String, required: true },
  cantidad: { type: Number, required: true },
  umbralMinimo: { type: Number, required: true }, // Para definir bajo stock
  ultimaActualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Inventario', InventarioSchema);
