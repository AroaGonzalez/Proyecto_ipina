const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
    tiendaId: { type: String, required: true },
    productoId: { type: String, required: true },
    cantidadSolicitada: { type: Number, required: true },
    estado: { type: String, enum: ['Pendiente', 'Completado'], required: true },
    fechaPedido: { type: Date, default: Date.now },
    fechaFinPendiente: { type: Date }, // Fecha límite para estado "Pendiente"
});

module.exports = mongoose.model('Pedido', PedidoSchema);
  