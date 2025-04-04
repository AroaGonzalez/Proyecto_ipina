import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './components/login';
import Menu from './components/menu';
import PrivateRoute from './components/privateRoute';
import Register from './components/register';
import InventarioList from './components/inventarioList';
import UserOptions from './components/userOptions';
import Home from './components/home';
import ChangePassword from './components/changePassword';
import { LanguageProvider } from './context/LanguageContext';
import Profile from './components/profile';
import EditProfile from './components/editProfile';
import NuevoArticulo from './components/nuevoArticulo';
import ConsultaTienda from './components/consultaTienda';

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
  return (
    <LanguageProvider>
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
              path="/parametrizacion-articulos"
              element={
                <PrivateRoute>
                  <InventarioList />
                </PrivateRoute>
              }
            />
            <Route
              path="/consulta-tienda"
              element={
                <PrivateRoute>
                  <ConsultaTienda />
                </PrivateRoute>
              }
            />
            <Route
              path="/nuevo-articulo"
              element={
                <PrivateRoute>
                  <NuevoArticulo />
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
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/edit-profile" element={
              <PrivateRoute>
                <EditProfile />
              </PrivateRoute>
            } />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
}

export default App;