import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PedidoList from './components/pedidoList';
import PedidoForm from './components/pedidoForm';
import Login from './components/login'; 
import Menu from './components/menu';

function Home() {
  return (
    <div className="home">
      <h1>Bienvenido a la Gestión de Inventarios</h1>
      <p>Selecciona una opción del menú para continuar.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <h1>Pedidos Tienda</h1>
        {/* Define las rutas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pedidos" element={<><PedidoForm /><PedidoList /></>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
