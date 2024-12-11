import React, { useState } from 'react';
import PedidoList from './components/pedidoList';
import PedidoForm from './components/pedidoForm';

function App() {
  const [pedidos, setPedidos] = useState([]);

  return (
    <div className="app">
      <h1>Pedidos Tienda</h1>
      {/* Pasa setPedidos como prop al formulario */}
      <PedidoForm setPedidos={setPedidos} />
      {/* Pasa pedidos como prop a la lista */}
      <PedidoList pedidos={pedidos} setPedidos={setPedidos} />
    </div>
  );
}

export default App;
