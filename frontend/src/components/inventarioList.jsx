import React, { useEffect, useState } from 'react';
import { FaFilter, FaSearch, FaTimes, FaPlay, FaPause } from 'react-icons/fa';
import axios from 'axios';
import Menu from '../components/menu'; // Importar el menú
import '../inventarioList.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

function InventarioList() {
  const [inventarios, setInventarios] = useState([]);
  const [filteredInventarios, setFilteredInventarios] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = () => {
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
  };

  const handleToggleEstado = (nuevoEstado) => {
    if (selectedItems.length === 0) return;

    axios
      .put(`${BASE_URL}/inventario/estado`, { ids: selectedItems, estado: nuevoEstado })
      .then(() => {
        setSelectedItems([]);
        setSelectAll(false);
        fetchInventario();
      })
      .catch((error) => {
        console.error('Error al cambiar el estado:', error);
      });
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventarios.map((item) => item.idArticulo));
    }
    setSelectAll(!selectAll);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSearch = () => {
    if (filter.trim() === '') {
      setFilteredInventarios(inventarios);
    } else {
      const filtered = inventarios.filter((item) =>
        item.idArticulo.toString() === filter
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
    <div className="app-container">
      {/* Menú fijo a la izquierda */}
      <div className="menu">
        <Menu />
      </div>

      {/* Contenido principal alineado a la derecha */}
      <div className="content">
        <div className="inventario-list">
        <div className="header-inventario">
          <h2 className="titulo-inventario">Consulta de Artículos</h2>
        </div>

        {/* Botones alineados correctamente */}
        <div className="botones-header">
          <button className="filtros-toggle" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            <FaFilter /> {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          <button className="nuevo-articulo-btn">Nuevo Artículo</button>
        </div>


          {mostrarFiltros && (
            <div className="filtro-minimalista">
              <input type="text" placeholder="ID Artículo" value={filter} onChange={handleFilterChange} />
              <button className="buscar-btn" onClick={handleSearch}>
                <FaSearch />
              </button>
              <button className="borrar-btn" onClick={handleClearFilter}>
                <FaTimes />
              </button>
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="acciones-seleccion">
              <button className="accion-btn activar" onClick={() => handleToggleEstado('Activo')}>
                <FaPlay /> Activar
              </button>
              <button className="accion-btn pausar" onClick={() => handleToggleEstado('Pausado')}>
                <FaPause /> Pausar
              </button>
            </div>
          )}

          {/* Tabla con scroll interno */}
          <div className="tabla-contenedor">
            <table className="tabla-inventario">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                  <th>ID ARTÍCULO</th>
                  <th>ARTÍCULO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventarios.map((item) => (
                  <tr key={item.idArticulo}>
                    <td><input type="checkbox" checked={selectedItems.includes(item.idArticulo)} onChange={() => handleSelectItem(item.idArticulo)} /></td>
                    <td>{item.idArticulo}</td>
                    <td>{item.articulo}</td>
                    <td>{item.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventarioList;