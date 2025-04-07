import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/consultaTienda.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const CustomDropdown = ({ label, options, selectedItems, onChange, disabled = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (id) => {
    if (id === 'all') {
      if (selectedItems.includes('all')) {
        onChange([]);
      } else {
        onChange(['all', ...options
          .filter(item => item.id !== 'all')
          .map(item => item.id)]);
      }
    } else {
      const isSelected = selectedItems.includes(id);
      
      if (isSelected) {
        onChange(selectedItems.filter(item => item !== id && item !== 'all'));
      } else {
        const newSelected = [...selectedItems, id];
        
        const allItemsSelected = options
          .filter(item => item.id !== 'all')
          .every(item => newSelected.includes(item.id));
        
        onChange(allItemsSelected ? [...newSelected, 'all'] : newSelected);
      }
    }
  };

  const filteredOptions = options.filter(item => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const id = item.id.toString().toLowerCase();
    const desc = item.descripcion.toLowerCase();
    
    return id.includes(search) || desc.includes(search);
  });

  return (
    <div className="dropdown-container">
      <label className="dropdown-label">{label}</label>
      <div className="custom-dropdown" ref={dropdownRef}>
        <div 
          className={`dropdown-header ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
        >
          {selectedItems.length > 0 
            ? `${selectedItems.length} seleccionados` 
            : "Seleccionar"}
          <span className="dropdown-arrow">▼</span>
        </div>
        
        {showDropdown && !disabled && (
          <div className="dropdown-options">
            <div className="dropdown-search">
              <input 
                type="text" 
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {filteredOptions.map(item => (
              <div 
                key={item.id} 
                className={`dropdown-option ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                onClick={() => handleSelect(item.id)}
              >
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  readOnly
                />
                <span>{item.descripcion}</span>
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="no-results">No se encontraron resultados</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ConsultaTienda = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [gruposLocalizacion, setGruposLocalizacion] = useState([]);

  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedCadenas, setSelectedCadenas] = useState([]);
  const [selectedGruposLocalizacion, setSelectedGruposLocalizacion] = useState([]);
  
  const [filtroLocalizacion, setFiltroLocalizacion] = useState('');
  const tableEndRef = useRef(null);
  const tableContainerRef = useRef(null);
  
  useEffect(() => {
    fetchFilterOptions();
    fetchTiendas();
  }, [languageId]);

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
        if (!loadingMore && hasMore && scrollTop + clientHeight >= scrollHeight - 100) {
          loadMoreData();
        }
      }
    };

    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadingMore, hasMore]);

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      await fetchTiendas(undefined, nextPage, true);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error cargando más datos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const [mercadosRes, gruposCadenaRes, cadenasRes, gruposLocalizacionRes] = await Promise.all([
        axios.get(`${BASE_URL}/tiendas/mercados?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/grupos-cadena?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/cadenas?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/grupos-localizacion?idIdioma=${languageId}&formatoSelector=true`)
      ]);
      
      setMercados(mercadosRes.data || []);
      setGruposCadena(gruposCadenaRes.data || []);
      setCadenas(cadenasRes.data || []);
      setGruposLocalizacion(gruposLocalizacionRes.data || []);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    const fetchCadenas = async () => {
      try {
        const gruposCadenaToFilter = selectedGruposCadena.filter(id => id !== 'all');
        
        if (gruposCadenaToFilter.length > 0) {
          const idGrupoCadena = gruposCadenaToFilter[0];
          const response = await axios.get(
            `${BASE_URL}/tiendas/cadenas?idGrupoCadena=${idGrupoCadena}&idIdioma=${languageId}&formatoSelector=true`
          );
          setCadenas(response.data || []);
        } else {
          const response = await axios.get(
            `${BASE_URL}/tiendas/cadenas?idIdioma=${languageId}&formatoSelector=true`
          );
          setCadenas(response.data || []);
        }
      } catch (error) {
        console.error('Error al cargar cadenas:', error);
      }
    };
    
    fetchCadenas();
  }, [selectedGruposCadena, languageId]);

  const fetchTiendas = async (filters = {}, page = 0, append = false) => {
    if (page === 0) {
      setLoading(true);
      setHasMore(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('idIdioma', languageId);
      params.append('page', page);
      params.append('size', 50);
      
      const mercadosToFilter = selectedMercados.filter(id => id !== 'all');
      const gruposCadenaToFilter = selectedGruposCadena.filter(id => id !== 'all');
      const cadenasToFilter = selectedCadenas.filter(id => id !== 'all');
      const gruposLocalizacionToFilter = selectedGruposLocalizacion.filter(id => id !== 'all');
      
      mercadosToFilter.forEach(id => params.append('idsMercado', id));
      gruposCadenaToFilter.forEach(id => params.append('idsGrupoCadena', id));
      cadenasToFilter.forEach(id => params.append('idsCadena', id));
      gruposLocalizacionToFilter.forEach(id => params.append('idsGrupoLocalizacion', id));
      
      if (filtroLocalizacion) {
        params.append('idLocalizacion', filtroLocalizacion);
      }
      
      const response = await axios.get(`${BASE_URL}/tiendas?${params.toString()}`);
      
      if (response.data && response.data.content) {
        const processedData = response.data.content.map(item => ({
          ...item,
          estadoTiendaMtu: item.estadoTiendaMtu || 'Sin estado'
        }));
        
        if (append) {
          setTiendas(prev => [...prev, ...processedData]);
        } else {
          setTiendas(processedData);
          setCurrentPage(0);
        }
        
        setTotalElements(response.data.totalElements || 0);
        
        if (processedData.length === 0 || (response.data.totalPages && page >= response.data.totalPages - 1)) {
          setHasMore(false);
        }
      } else {
        if (!append) {
          setTiendas([]);
        }
        setTotalElements(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setError(t('No se pudieron cargar las tiendas'));
    } finally {
      if (page === 0) {
        setLoading(false);
      }
    }
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
      setSelectedItems(tiendas.map((item) => item.idLocalizacionRam));
    }
    setSelectAll(!selectAll);
  };

  const getEstadoClass = (estado) => {
    if (!estado || estado === 'Sin estado') return 'estado-desconocido';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('activ')) return 'estado-activa';
    if (estadoLower.includes('reform')) return 'estado-reforma';
    if (estadoLower.includes('abiert')) return 'estado-abierta';
    if (estadoLower.includes('cerrad')) return 'estado-cerrada';
    return 'estado-otro';
  };

  const formatCountryName = (name) => {
    if (!name) return name;
    
    if (name.includes('ESPA')) {
      return 'ESPAÑA';
    }
    
    return name;
  };

  const handleSearch = () => {
    fetchTiendas();
  };

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="consulta-tienda-container">
      <div className="header">
        <h1 className="main-title">{t('CONSULTA TIENDA')}</h1>
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
        </button>
      </div>

      {showFilters && (
        <div className="filters-container">
          <CustomDropdown 
            label="Id o Mercado"
            options={mercados}
            selectedItems={selectedMercados}
            onChange={setSelectedMercados}
            disabled={loadingFilters}
          />

          <div className="localizacion-filter">
            <label className="filter-label">Id Localización</label>
            <input 
              className="filter-input"
              type="text" 
              value={filtroLocalizacion}
              onChange={(e) => setFiltroLocalizacion(e.target.value)}
              placeholder=""
            />
          </div>

          <CustomDropdown 
            label="Id o Grupo de Localizaciones"
            options={gruposLocalizacion}
            selectedItems={selectedGruposLocalizacion}
            onChange={setSelectedGruposLocalizacion}
            disabled={loadingFilters}
          />

          <CustomDropdown 
            label="Id o Grupo Cadena (T6)"
            options={gruposCadena}
            selectedItems={selectedGruposCadena}
            onChange={setSelectedGruposCadena}
            disabled={loadingFilters}
          />

          <CustomDropdown 
            label="Id o Cadena"
            options={cadenas}
            selectedItems={selectedCadenas}
            onChange={setSelectedCadenas}
            disabled={loadingFilters}
          />
        </div>
      )}

      <div className="results-info">
        <span className="results-count">
          {loading ? t('Cargando...') : 
            t('Cargados {{count}} resultados de {{total}} encontrados', {
              count: tiendas.length,
              total: totalElements
            })
          }
          {' '}
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </span>
        <button 
          className="buscar-button"
          onClick={handleSearch}
          disabled={loading}
        >
          <FaSearch className="search-icon" />
          <span>{t('BUSCAR')}</span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      
      <div className="table-container" ref={tableContainerRef}>
        <table className="tiendas-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  checked={selectAll} 
                  onChange={handleSelectAll} 
                  disabled={tiendas.length === 0}
                />
              </th>
              <th>{t('CÓDIGO DE TIENDA')}</th>
              <th>{t('TIENDA')}</th>
              <th>{t('MERCADO')}</th>
              <th>{t('GRUPO CADENA')}</th>
              <th>{t('CADENA')}</th>
              <th>{t('ESTADO DE TIENDA MTU')}</th>
              <th>{t('ESTADO DE TIENDA RAM')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="loading-cell">
                  {t('Cargando datos...')}
                </td>
              </tr>
            ) : tiendas.length > 0 ? (
              <>
                {tiendas.map((tienda) => (
                  <tr key={tienda.idLocalizacionRam || tienda.codigoTienda}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(tienda.idLocalizacionRam)} 
                        onChange={() => handleSelectItem(tienda.idLocalizacionRam)} 
                      />
                    </td>
                    <td>{tienda.codigoTienda}</td>
                    <td>{tienda.nombreTienda}</td>
                    <td>
                      <div className="mercado-cell">
                        <span>{formatCountryName(tienda.nombreMercado)}</span>
                      </div>
                    </td>
                    <td>{tienda.nombreGrupoCadena}</td>
                    <td>{tienda.nombreCadena}</td>
                    <td>
                      <span className={`estado-tag ${getEstadoClass(tienda.estadoTiendaMtu)}`}>
                        {tienda.estadoTiendaMtu}
                      </span>
                    </td>
                    <td>
                      <span className={`estado-tag ${getEstadoClass(tienda.descripcionTipoEstadoLocalizacionRam)}`}>
                        {tienda.descripcionTipoEstadoLocalizacionRam || ''}
                      </span>
                    </td>
                  </tr>
                ))}
                {loadingMore && (
                  <tr>
                    <td colSpan="8" className="loading-cell">
                      {t('Cargando más datos...')}
                    </td>
                  </tr>
                )}
                <tr ref={tableEndRef}></tr>
              </>
            ) : (
              <tr>
                <td colSpan="8" className="empty-table-message">
                  {t('No hay datos disponibles')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsultaTienda;