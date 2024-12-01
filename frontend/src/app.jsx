import React from 'react';
import PedidoList from './components/pedidoList';
import PedidoForm from './components/pedidoForm';


function App() {
  return (
    <div className="app">
      <h1>Pedidos Tienda</h1>
      <PedidoForm />
      <PedidoList />
    </div>
  );
}

export default App;
