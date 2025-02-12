import React, { useEffect, useState } from 'react';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

function InventarioList() {
  const [inventarios, setInventarios] = useState([]);
  const [filteredInventarios, setFilteredInventarios] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BASE_URL}/inventario`)
      .then((response) => {
        setInventarios(response.data);
        setFilteredInventarios(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener inventario:', error);
        setError('No se pudo cargar el inventario. Inténtalo más tarde.');
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearch = () => {
    if (filter.trim() === '') {
      setFilteredInventarios(inventarios);
    } else {
      const filtered = inventarios.filter((item) =>
        item.productoId.toString() === filter
      );
      setFilteredInventarios(filtered);
    }
  };

  const handleClearFilter = () => {
    setFilter('');
    setFilteredInventarios(inventarios);
  };

  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="inventario-list">
      <div className="header-inventario">
        <h2 className="titulo-inventario">Consulta de Artículos</h2>
        <div className="botones-header">
          <button
            className="filtros-toggle"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <FaFilter /> {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button className="nuevo-articulo-btn">
            Nuevo Artículo
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="filtro-minimalista">
          <input
            type="text"
            placeholder="ID Artículo"
            value={filter}
            onChange={handleFilterChange}
          />
          <button className="buscar-btn" onClick={handleSearch}>
            <FaSearch />
          </button>
          <button className="borrar-btn" onClick={handleClearFilter}>
            <FaTimes />
          </button>
        </div>
      )}

      <table className="tabla-inventario">
        <thead>
          <tr>
            <th>ID ARTÍCULO</th>
            <th>ARTÍCULO</th>
            <th>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {filteredInventarios.map((item) => {
            let estado = '';
            if (item.cantidad > 50) {
              estado = 'Suficiente';
            } else if (item.cantidad > 20) {
              estado = 'Bajo';
            } else if (item.cantidad > 0) {
              estado = 'Crítico';
            } else {
              estado = 'Agotado';
            }

            return (
              <tr key={item.productoId}>
                <td>{item.productoId}</td>
                <td>{item.nombreProducto}</td>
                <td>{estado}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InventarioList;