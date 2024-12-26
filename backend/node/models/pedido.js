const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true },
  productoId: { type: String, required: true },
  cantidadSolicitada: { type: Number, required: true }, // Usar "cantidadSolicitada"
  estado: { type: String, enum: ['Pendiente', 'Completado', 'Cancelado'], required: true },
  fechaPedido: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pedido', PedidoSchema);