import React from 'react';
import { Link } from 'react-router-dom';
import '../menu.css';

function Menu() {
  return (
    <nav className="menu">
      <ul>
        <li>
          <Link to="/home">Inicio</Link>
        </li>
        <li>
          <Link to="/pedidos">Gestión de Pedidos</Link>
        </li>
        <li>
          <Link to="/pedidos-pendientes">Pedidos Pendientes</Link>
        </li>
        <li>
          <Link to="/lista-pedidos">Pedidos Completados</Link>
        </li>
        <li>
          <Link to="/inventario">Inventario</Link>
        </li>
        <li>
          <Link to="/consultar-tiendas">Consultar Tiendas</Link>
        </li>
        <li>
          <Link to="/pedidos-eliminados">Pedidos Eliminados</Link>
        </li>
      </ul>
      <div className="footer-options">
        <Link to="/profile" className="footer-link">
          Mi Perfil
        </Link>
        <button onClick={() => alert('Sesión cerrada')} className="footer-button">
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}

export default Menu;