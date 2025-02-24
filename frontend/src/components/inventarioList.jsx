import React, { useEffect, useState } from 'react';
import { FaFilter, FaPlay, FaPause } from 'react-icons/fa';
import axios from 'axios';
import Menu from '../components/menu';
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
      const filtered = inventarios.filter((item) => {
        const idMatch = item.idArticulo.toString() === filter.trim();
        if (isNaN(filter)) {
          return item.articulo.toLowerCase().includes(filter.toLowerCase());
        }
        return idMatch;
      });
      setFilteredInventarios(filtered);
    }
  };

  const handleClearFilter = () => {
    setFilter('');
    setFilteredInventarios(inventarios);
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

  const getStatusTagClass = (estado) => {
    return `status-tag ${estado.toLowerCase()}`;
  };

  if (loading) return <div className="loading">Cargando inventario...</div>;
  if (error) return <div className="error">{error}</div>;

  const currentTime = new Date().toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="app-container">
      <Menu />
      <div className="content">
        <div className="header-section">
          <h1 className="main-title">CONSULTA DE ARTÍCULOS</h1>
          <div className="header-actions">
            <button className="filter-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
              <FaFilter /> {mostrarFiltros ? 'OCULTAR FILTROS' : 'MOSTRAR FILTROS'}
            </button>
            <button className="new-button">NUEVO ARTÍCULO</button>
          </div>
        </div>

        {mostrarFiltros && (
          <div className="filter-section">
            <div className="filter-group">
              <input
                type="text"
                placeholder="Id Artículo"
                value={filter}
                onChange={handleFilterChange}
                className="filter-input"
              />
              <button 
                className="clear-button" 
                onClick={handleClearFilter}
                style={{ visibility: filter ? 'visible' : 'hidden' }}
              >
                <span>×</span>
              </button>
            </div>
            <button className="search-button" onClick={handleSearch}>
              BUSCAR
            </button>
          </div>
        )}

        <div className="info-section">
          <div className="results-info">
            <span className="results-count">
              Cargados {filteredInventarios.length} resultados de {inventarios.length} encontrados
            </span>
            {' · '}
            <span className="update-time">
              Última actualización: {currentTime}
            </span>
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="header-select-display">
            <span>Seleccionados {selectedItems.length} resultados de {inventarios.length}</span>
            <div className="action-buttons">
              <button className="action-button activate" onClick={() => handleToggleEstado('Activo')}>
                <FaPlay /> Activar
              </button>
              <button className="action-button pause" onClick={() => handleToggleEstado('Pausado')}>
                <FaPause /> Pausar
              </button>
            </div>
          </div>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                <th>ID ARTÍCULO</th>
                <th>ARTÍCULO</th>
                <th>ESTADO RAM</th>
                <th>UNIDADES BOX</th>
                <th>UNIDAD DE EMPAQUETADO</th>
                <th>MÚLTIPLO MÍNIMO</th>
                <th>ESTADO SFI</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventarios.map((item) => (
                <tr key={item.idArticulo}>
                  <td><input type="checkbox" checked={selectedItems.includes(item.idArticulo)} onChange={() => handleSelectItem(item.idArticulo)} /></td>
                  <td>{item.idArticulo}</td>
                  <td>{item.articulo}</td>
                  <td>
                    <span className={getStatusTagClass(item.estado)}>{item.estado.toUpperCase()}</span>
                  </td>
                  <td>
                    <select className="row-select" defaultValue="BULTO-PACKAGE">
                      <option value="BULTO-PACKAGE">BULTO-PACKAGE</option>
                      <option value="UNIDAD">UNIDAD</option>
                    </select>
                  </td>
                  <td>
                    <div className="quantity-input">
                      <input type="number" defaultValue="1" min="1" />
                      <button className="quantity-clear">×</button>
                    </div>
                  </td>
                  <td>
                    <div className="quantity-input">
                      <input type="number" defaultValue="1" min="1" />
                      <button className="quantity-clear">×</button>
                    </div>
                  </td>
                  <td>
                    <span className="status-tag active">ACTIVO</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventarioList;