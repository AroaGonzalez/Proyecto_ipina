import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PedidosPage from './components/pedidosPage';
import Login from './components/login';
import Menu from './components/menu';
import PrivateRoute from './components/privateRoute'; // Importa el componente
import Register from './components/register';

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
  const hideMenu = location.pathname === '/' || location.pathname === '/register'; // Oculta el menú en login y registro

  return (
    <div className="app">
      {!hideMenu && <Menu />} {/* Muestra el menú solo si no estamos en login o registro */}
      <div className={hideMenu ? 'full-content' : 'content'}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Login />} /> {/* Pantalla principal es login */}
          <Route path="/register" element={<Register />} /> {/* Pantalla de registro */}

          {/* Rutas privadas */}
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute>
                <PedidosPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;