import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../home.css';

const Home = () => {
  const [stats, setStats] = useState({
    pedidosPendientes: 0,
    productosInventario: 0,
    tiendasRegistradas: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/stats');
        console.log('Estadísticas recibidas:', response.data);
        setStats(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al obtener las estadísticas:', error);
        setLoading(false);
      }
    };
  
    fetchStats();
  }, []);  

  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Bienvenido a la Gestión de Inventarios</h1>
        <p>Optimiza tus recursos, administra tus pedidos y mantén tus operaciones al día.</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Pedidos Pendientes</h3>
          <p>{stats.pedidosPendientes}</p>
        </div>
        <div className="stat-card">
          <h3>Productos en Inventario</h3>
          <p>{stats.productosInventario}</p>
        </div>
        <div className="stat-card">
          <h3>Tiendas Registradas</h3>
          <p>{stats.tiendasRegistradas}</p>
        </div>
      </div>

      <div className="actions-container">
        <button className="action-button" onClick={() => window.location.href = '/pedidos'}>
          Gestionar Pedidos
        </button>
        <button className="action-button" onClick={() => window.location.href = '/inventario'}>
          Ver Inventario
        </button>
        <button className="action-button" onClick={() => window.location.href = '/consultar-tiendas'}>
          Consultar Tiendas
        </button>
      </div>
    </div>
  );
};

export default Home;