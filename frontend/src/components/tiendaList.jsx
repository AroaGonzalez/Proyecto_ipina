import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const TiendaList = () => {
  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/tiendas`)
      .then((response) => setTiendas(response.data))
      .catch((error) => console.error('Error al obtener las tiendas:', error));
  }, []);

  const openGoogleMaps = (direccion) => {
    const encodedDireccion = encodeURIComponent(direccion);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDireccion}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="inventario-container">
      <h2>Lista de Tiendas</h2>
      <table className="inventario-table">
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