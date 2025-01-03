import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import PedidosForm from './components/pedidoForm';
import PedidoList from './components/pedidoList';
import Login from './components/login';
import Menu from './components/menu';
import PrivateRoute from './components/privateRoute';
import Register from './components/register';
import InventarioList from './components/inventarioList';
import TiendaList from './components/tiendaList';
import PendientesList from './components/pendienteList';
import PedidosEliminadosList from './components/pedidosEliminadosList';
import Profile from './components/profile';
import UserOptions from './components/userOptions';
import Home from './components/home';
import ChangePassword from './components/changePassword'; // Importar el componente

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
                <Home />
              </PrivateRoute>
            }
          />
          <Route
            path="/pedidos"
            element={
              <PrivateRoute>
                <PedidosForm pedidos={pedidos} setPedidos={setPedidos} />
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
          <Route
            path="/pedidos-eliminados"
            element={
              <PrivateRoute>
                <PedidosEliminadosList />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password" // Nueva ruta para el cambio de contraseña
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