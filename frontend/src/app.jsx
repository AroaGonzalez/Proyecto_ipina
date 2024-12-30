import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PedidosPage from './components/pedidosPage';
import PedidoList from './components/pedidoList';
import Login from './components/login';
import Menu from './components/menu';
import PrivateRoute from './components/privateRoute';
import Register from './components/register';
import InventarioList from './components/inventarioList';
import TiendaList from './components/tiendaList';
import PendientesList from './components/pendienteList';

function Layout({ children }) {
  const location = useLocation();
  const hideMenu = location.pathname === '/' || location.pathname === '/register';

  return (
    <div className="app">
      {!hideMenu && <Menu />}
      <div className={hideMenu ? 'full-content' : 'content'}>{children}</div>
    </div>
  );
}

function App() {
  // Define el estado compartido para los pedidos
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
                <h1>Bienvenido a la Gestión de Inventarios</h1>
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute>
                <PedidosPage pedidos={pedidos} setPedidos={setPedidos} />
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
          <Route
            path="/inventario"
            element={
              <PrivateRoute>
                <InventarioList />
              </PrivateRoute>
            }
          />
          <Route
            path="/consultar-tiendas"
            element={
              <PrivateRoute>
                <TiendaList />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos-pendientes"
            element={
              <PrivateRoute>
                <PendientesList />
              </PrivateRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;