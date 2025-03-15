import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PedidosForm from './components/pedidoForm'; // Nuevo Alias → Pedidos
import PedidoList from './components/pedidoList';
import Login from './components/login';
import Menu from './components/menu';
import PrivateRoute from './components/privateRoute';
import Register from './components/register';
import InventarioList from './components/inventarioList'; // Parametrización de Artículos → Inventario
import TiendaList from './components/tiendaList'; // Consulta de Tienda → Consultar Tiendas
import PendientesList from './components/pendienteList';
import Profile from './components/profile';
import UserOptions from './components/userOptions';
import Home from './components/home';
import ChangePassword from './components/changePassword';

function Layout({ children }) {
  const location = useLocation();
  const hideMenu = location.pathname === '/' || location.pathname === '/register';

  return (
    <div className="app">
      {!hideMenu && <Menu />}
      {!hideMenu && <UserOptions />}
      <div className={hideMenu ? 'full-content' : 'content'}>{children}</div>
    </div>
  );
}

function App() {
  const [pedidos, setPedidos] = useState([]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/home"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />

          {/* 🔹 Sección Pedidos */}
          <Route
            path="/pedidos-pendientes"
            element={
              <PrivateRoute>
                <PendientesList />
              </PrivateRoute>
            }
          />
          <Route
            path="/lista-pedidos"
            element={
              <PrivateRoute>
                <PedidoList pedidos={pedidos} setPedidos={setPedidos} />
              </PrivateRoute>
            }
          />

          {/* 🔹 Sección Parametrización */}
          <Route
            path="/parametrizacion-articulos"
            element={
              <PrivateRoute>
                <InventarioList /> {/* Parametrización de Artículos → Inventario */}
              </PrivateRoute>
            }
          />
          <Route
            path="/consulta-tienda"
            element={
              <PrivateRoute>
                <TiendaList /> {/* Consulta de Tienda → Consultar Tiendas */}
              </PrivateRoute>
            }
          />
          <Route
            path="/nuevo-alias"
            element={
              <PrivateRoute>
                <PedidosForm pedidos={pedidos} setPedidos={setPedidos} /> {/* Nuevo Alias → Pedidos */}
              </PrivateRoute>
            }
          />

          {/* 🔹 Perfil y Seguridad */}
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;