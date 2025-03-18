import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import '../styles/home.css';

const Home = () => {
  const { t } = useTranslation();
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
    return <p>{t('loading_stats')}</p>;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>{t('welcome_title')}</h1>
        <p>{t('welcome_subtitle')}</p>
      </div>

      <div className="stats-container">
        <div className="stat-card">
          <h3>{t('pending_orders')}</h3>
          <p>{stats.pedidosPendientes}</p>
        </div>
        <div className="stat-card">
          <h3>{t('inventory_products')}</h3>
          <p>{stats.productosInventario}</p>
        </div>
        <div className="stat-card">
          <h3>{t('registered_stores')}</h3>
          <p>{stats.tiendasRegistradas}</p>
        </div>
      </div>

      <div className="actions-container">
        <button className="action-button" onClick={() => window.location.href = '/pedidos'}>
          {t('manage_orders')}
        </button>
        <button className="action-button" onClick={() => window.location.href = '/inventario'}>
          {t('view_inventory')}
        </button>
        <button className="action-button" onClick={() => window.location.href = '/consultar-tiendas'}>
          {t('query_stores')}
        </button>
      </div>
    </div>
  );
};

export default Home;