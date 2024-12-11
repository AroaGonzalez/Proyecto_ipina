import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PedidosPage from './components/pedidosPage';
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

function Layout({ children }) {
  const location = useLocation();
  const hideMenu = location.pathname === '/'; // Oculta el menú en la pantalla de login

  return (
    <div className="app">
      {!hideMenu && <Menu />} {/* Muestra el menú solo si no estamos en la pantalla de login */}
      <div className={hideMenu ? 'full-content' : 'content'}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} /> {/* Pantalla principal es login */}
          <Route path="/home" element={<Home />} />
          <Route path="/pedidos" element={<PedidosPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;