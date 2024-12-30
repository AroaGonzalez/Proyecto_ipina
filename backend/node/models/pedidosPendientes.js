const mongoose = require("mongoose");

// Esquema para el modelo de Pedidos Pendientes
const PedidoSchema = new mongoose.Schema({
  tiendaId: {
    type: String,
    required: true,
  },
  productoId: {
    type: String,
    required: true,
  },
  cantidadSolicitada: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    enum: ["Pendiente", "Completado"],
    default: "Pendiente",
  },
  fechaFin: {
    type: Date,
    required: function () {
      return this.estado === "Pendiente";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Pedido", PedidoSchema);
