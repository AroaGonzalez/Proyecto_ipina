import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';

const TiendaList = () => {
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/tiendas`)
      .then((response) => {
        setTiendas(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener las tiendas:', error);
        setError('No se pudieron cargar las tiendas. Inténtalo más tarde.');
        setLoading(false);
      });
  }, []);

  const openGoogleMaps = (direccion) => {
    if (!direccion) {
      alert('Dirección no disponible.');
      return;
    }
    const encodedDireccion = encodeURIComponent(direccion);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDireccion}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (loading) return <p>Cargando tiendas...</p>;
  if (error) return <p>{error}</p>;
  if (tiendas.length === 0) return <p>No se encontraron tiendas.</p>;

  return (
    <div className="inventario-list">
      <h2>Lista de Tiendas</h2>
      <table className="tabla-inventario">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {tiendas.map((tienda) => (
            <tr key={tienda.tiendaId}>
              <td>{tienda.tiendaId}</td>
              <td>{tienda.nombre}</td>
              <td>{tienda.direccion}</td>
              <td>
                <button
                  onClick={() => openGoogleMaps(tienda.direccion)}
                  className="maps-button"
                >
                  Ver en Maps
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TiendaList;