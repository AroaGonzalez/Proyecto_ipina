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
import ParametrizacionAlias from './components/parametrizacionAlias';
import EdicionAlias from './components/edicionAlias';
import Tareas from './components/tareas';
import NuevoAlias from './components/nuevoAlias';
import EdicionRelaciones from './components/edicionRelaciones';
import NuevaTareaDistribucion from './components/nuevaTareaDistribucion';
import NuevaTareaRecuento from './components/nuevaTareaRecuento';
import EditarTarea from './components/editarTarea';
import Eventos from './components/eventos';

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
              path="/nuevo-alias"
              element={
                <PrivateRoute>
                  <NuevoAlias />
                </PrivateRoute>
              }
            />
            <Route 
              path="/editar-tarea/:id"
              element={
                <PrivateRoute>
                  <EditarTarea />
                </PrivateRoute>
              }
            />
            <Route
              path="/consulta-nuevo-alias"
              element={
                <PrivateRoute>
                  <ParametrizacionAlias />
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
            <Route 
              path="/crear-tarea/distribucion"
              element={
                <PrivateRoute>
                  <NuevaTareaDistribucion />
                </PrivateRoute>
              }
            />
            <Route 
              path="/crear-tarea/recuento"
              element={
                <PrivateRoute>
                  <NuevaTareaRecuento />
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
            <Route path="/edicion-alias/:id"
              element={
                <PrivateRoute>
                  <EdicionAlias />
                </PrivateRoute>
              }
            />
            <Route path="/edicion-relaciones"
              element={
                <PrivateRoute>
                  <EdicionRelaciones />
                </PrivateRoute>
              }
            />
            <Route path="/tareas"
              element={
                <PrivateRoute>
                  <Tareas />
                </PrivateRoute>
              }
            />
            <Route path="/eventos"
              element={
                <PrivateRoute>
                  <Eventos />
                </PrivateRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </LanguageProvider>
  );
}
export default App;