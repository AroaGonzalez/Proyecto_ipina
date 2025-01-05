import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:8000';

const TiendaList = () => {
  const [tiendas, setTiendas] = useState([]);
  const [filteredTiendas, setFilteredTiendas] = useState([]);
  const [filters, setFilters] = useState({
    tiendaId: '',
    nombre: '',
    direccion: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/tiendas`)
      .then((response) => {
        setTiendas(response.data);
        setFilteredTiendas(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener las tiendas:', error);
        setError('No se pudieron cargar las tiendas. Inténtalo más tarde.');
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  useEffect(() => {
    let filtered = tiendas;

    if (filters.tiendaId) {
      filtered = filtered.filter((tienda) =>
        tienda.tiendaId.toString().includes(filters.tiendaId)
      );
    }

    if (filters.nombre) {
      filtered = filtered.filter((tienda) =>
        tienda.nombre.toLowerCase().includes(filters.nombre.toLowerCase())
      );
    }

    if (filters.direccion) {
      filtered = filtered.filter((tienda) =>
        tienda.direccion.toLowerCase().includes(filters.direccion.toLowerCase())
      );
    }

    setFilteredTiendas(filtered);
  }, [filters, tiendas]);

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

  return (
    <div className="inventario-list">
      <h2>Lista de Tiendas</h2>

      {/* Filtros */}
      <div className="filters-container">
        <input
          type="text"
          placeholder="Filtrar por ID"
          name="tiendaId"
          value={filters.tiendaId}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Nombre"
          name="nombre"
          value={filters.nombre}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Filtrar por Dirección"
          name="direccion"
          value={filters.direccion}
          onChange={handleFilterChange}
        />
      </div>

      {/* Tabla de Tiendas */}
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
          {filteredTiendas.length > 0 ? (
            filteredTiendas.map((tienda) => (
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
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: 'center', padding: '10px' }}>
                No se encontraron tiendas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TiendaList;