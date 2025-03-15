import React, { useEffect, useState } from 'react';
import { FaFilter, FaPlay, FaPause } from 'react-icons/fa';
import axios from 'axios';
import Menu from '../components/menu';
import '../styles/inventarioList.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';
// Define la ruta específica para el endpoint de inventario
const INVENTARIO_ENDPOINT = `${BASE_URL}/inventario`;

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
    console.log('Obteniendo datos del inventario desde:', `${BASE_URL}/inventario`);
    
    axios
      .get(INVENTARIO_ENDPOINT)
      .then((response) => {
        console.log('Respuesta API inventario:', response.data);
        
        // Extraer los datos según la estructura de la respuesta del controlador
        // response.data debería contener un objeto con la propiedad 'content'
        const inventarioData = response.data && response.data.content 
          ? response.data.content 
          : Array.isArray(response.data) 
            ? response.data 
            : [];
        
        console.log('Datos procesados:', inventarioData);
        
        if (inventarioData.length === 0) {
          console.warn('No se encontraron datos de inventario en la respuesta');
        }
        
        setInventarios(inventarioData);
        setFilteredInventarios(inventarioData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener inventario:', error);
        if (error.response) {
          console.error('Detalle de error:', error.response.data);
          console.error('Status:', error.response.status);
        }
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
    setSelectedItems([]);
    setSelectAll(false);
    
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
    setSelectedItems([]);
    setSelectAll(false);
  };

  const handleToggleEstado = (nuevoEstado) => {
    if (selectedItems.length === 0) return;

    console.log(`Cambiando estado a ${nuevoEstado} para IDs:`, selectedItems);

    // Llamada a la API con la estructura correcta según el controlador
    axios
      .put(`${BASE_URL}/inventario/estado`, { 
        ids: selectedItems, 
        estado: nuevoEstado 
      })
      .then((response) => {
        console.log('Respuesta cambio de estado:', response.data);
        alert(`Estado cambiado a ${nuevoEstado} correctamente para ${selectedItems.length} artículos`);
        setSelectedItems([]);
        setSelectAll(false);
        fetchInventario(); // Recargar los datos para reflejar el cambio
      })
      .catch((error) => {
        console.error('Error al cambiar el estado:', error);
        if (error.response) {
          console.error('Detalle:', error.response.data);
          alert(`Error al cambiar el estado: ${error.response.data.message || 'Error desconocido'}`);
        } else {
          alert('Error al cambiar el estado. Revisa la consola para más detalles.');
        }
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

        <div className={`filter-section ${mostrarFiltros ? 'show' : ''}`}>
          <div className="filter-group">
            <input
              type="text"
              placeholder="Id Artículo"
              value={filter}
              onChange={handleFilterChange}
              className="filter-input"
            />
            <div className="filter-actions">
              {filter && (
                <button 
                  className="clear-button" 
                  onClick={handleClearFilter}
                >
                  <span>×</span>
                </button>
              )}
              <button className="search-button-small" onClick={handleSearch}>
                BUSCAR
              </button>
            </div>
          </div>
        </div>

        <div className="info-section">
          {selectedItems.length === 0 ? (
            <div className="results-info">
              <span className="results-count">
                Cargados {filteredInventarios.length} resultados de {inventarios.length} encontrados
              </span>
              {' · '}
              <span className="update-time">
                Última actualización: {currentTime}
              </span>
            </div>
          ) : (
            <div className="selection-info">
              <span>Seleccionados {selectedItems.length} resultados de {inventarios.length}</span>
              <div className="action-buttons">
                <button className="action-button-fixed activate" onClick={() => handleToggleEstado('Activo')}>
                  <FaPlay />
                  <span>ACTIVAR</span>
                </button>
                <button className="action-button-fixed pause" onClick={() => handleToggleEstado('Pausado')}>
                  <FaPause />
                  <span>PAUSAR</span>
                </button>
              </div>
            </div>
          )}
        </div>

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
              {filteredInventarios && filteredInventarios.length > 0 ? (
                filteredInventarios.map((item) => (
                  <tr key={item.idArticulo}>
                    <td><input type="checkbox" checked={selectedItems.includes(item.idArticulo)} onChange={() => handleSelectItem(item.idArticulo)} /></td>
                    <td>{item.idArticulo}</td>
                    <td>{item.articulo}</td>
                    <td>
                      <span className={getStatusTagClass(item.estado || "ACTIVO")}>
                        {(item.estado || "ACTIVO").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select className="row-select" defaultValue={item.unidadesBox || "BULTO-PACKAGE"}>
                        <option value="BULTO-PACKAGE">BULTO-PACKAGE</option>
                        <option value="UNIDAD">UNIDAD</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="quantity-input">
                          <input 
                            type="number" 
                            defaultValue={item.unidadEmpaquetado || 1} 
                            min="1" 
                          />
                        </div>
                        <span>×</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="quantity-input">
                          <input 
                            type="number" 
                            defaultValue={item.multiploMinimo || 1} 
                            min="1" 
                          />
                        </div>
                        <span>×</span>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusTagClass(item.estadoSFI || "ACTIVO")}>
                        {(item.estadoSFI || "ACTIVO").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                    No se encontraron datos de inventario en la base de datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default InventarioList;