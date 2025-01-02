const mongoose = require('mongoose');

const PedidoEliminadoSchema = new mongoose.Schema({
  tiendaId: { type: String, required: true },
  productoId: { type: String, required: true },
  cantidadSolicitada: { type: Number, required: true },
  estado: { type: String, required: true },
  fechaPedido: { type: Date, required: true },
  fechaEliminacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PedidoEliminado', PedidoEliminadoSchema);