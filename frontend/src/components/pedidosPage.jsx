import React, { useState } from 'react';
import PedidoForm from './pedidoForm';

function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);

  return (
    <div>
      <h1>Gestión de Pedidos</h1>
      <PedidoForm setPedidos={setPedidos} />
    </div>
  );
}

export default PedidosPage;
