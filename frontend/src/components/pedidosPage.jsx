import React, { useState } from 'react';
import PedidoForm from './pedidoForm';
import PedidoList from './pedidoList';

function PedidosPage() {
  const [pedidos, setPedidos] = useState([]); // Estado compartido

  return (
    <div className="pedidos-page">
      <PedidoForm setPedidos={setPedidos} /> {/* Pasa setPedidos */}
      <PedidoList pedidos={pedidos} setPedidos={setPedidos} /> {/* Pasa ambos */}
    </div>
  );
}

export default PedidosPage;
