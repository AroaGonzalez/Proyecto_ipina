import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt, FaSearch, FaDownload, FaUpload, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/parametrizacionAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ParametrizacionAlias = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [aliases, setAliases] = useState([]);
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
  const [activeTab, setActiveTab] = useState('ALIAS');
  const [openFilter, setOpenFilter] = useState(null);
  const tableContainerRef = useRef(null);
  const tableEndRef = useRef(null);

  const [tiposAlias, setTiposAlias] = useState([]);
  const [estadosAlias, setEstadosAlias] = useState([]);
  const [estacionalidades, setEstacionalidades] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [aliasOptions, setAliasOptions] = useState([]);

  const [selectedTiposAlias, setSelectedTiposAlias] = useState([]);
  const [selectedNombresAlias, setSelectedNombresAlias] = useState([]);
  const [selectedEstadosAlias, setSelectedEstadosAlias] = useState([]);
  const [selectedEstacionalidades, setSelectedEstacionalidades] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchFilterOptions();
    fetchAliases();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openFilter && !event.target.closest('.filter-dropdown')) {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openFilter]);

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      await fetchAliases(undefined, nextPage, true);
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
      const [tiposAliasRes, estadosAliasRes, estacionalidadesRes, articulosRes, aliasOptionsRes] = await Promise.all([
        axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/tipos-estado?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/tipos-estacionalidad?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/ajeno?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/alias?idIdioma=${languageId}`)
      ]);
      
      const processTiposAlias = tiposAliasRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processEstadosAlias = estadosAliasRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processEstacionalidades = estacionalidadesRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processArticulos = articulosRes.data?.map(item => ({
        id: item.id,
        descripcion: item.nombre || item.descripcion || `Artículo ${item.id}`
      })) || [];
      
      const processAliasOptions = aliasOptionsRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      setTiposAlias(processTiposAlias);
      setEstadosAlias(processEstadosAlias);
      setEstacionalidades(processEstacionalidades);
      setArticulos(processArticulos);
      setAliasOptions(processAliasOptions);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchAliases = async (filters = {}, page = 0, append = false) => {
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
      
      const tiposAliasToFilter = selectedTiposAlias.filter(id => id !== 'selectAll');
      const estadosAliasToFilter = selectedEstadosAlias.filter(id => id !== 'selectAll');
      const estacionalidadesToFilter = selectedEstacionalidades.filter(id => id !== 'selectAll');
      const articulosToFilter = selectedArticulos.filter(id => id !== 'selectAll');
      const nombresAliasToFilter = selectedNombresAlias.filter(id => id !== 'selectAll');
      
      if (tiposAliasToFilter.length > 0) {
        tiposAliasToFilter.forEach(id => params.append('tipoAlias', id));
      }
      
      if (nombresAliasToFilter.length > 0) {
        nombresAliasToFilter.forEach(id => {
          params.append('idAlias', id);
        });
      }
      
      if (estadosAliasToFilter.length > 0) {
        estadosAliasToFilter.forEach(id => params.append('estadoAlias', id));
      }
      
      if (estacionalidadesToFilter.length > 0) {
        estacionalidadesToFilter.forEach(id => params.append('estacionalidad', id));
      }
      
      if (articulosToFilter.length > 0) {
        articulosToFilter.forEach(id => params.append('articulos', id));
      }
      
      console.log('Sent parameters:', params.toString());
      
      const response = await axios.get(`${BASE_URL}/filter?${params.toString()}`);
      
      if (response.data && response.data.content) {
        if (append) {
          setAliases(prev => [...prev, ...response.data.content]);
        } else {
          setAliases(response.data.content);
          setCurrentPage(0);
        }
        
        setTotalElements(response.data.totalElements || 0);
        
        if (response.data.content.length === 0 || 
            (response.data.totalPages && page >= response.data.totalPages - 1)) {
          setHasMore(false);
        }
      } else {
        if (!append) {
          setAliases([]);
        }
        setTotalElements(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading aliases:', error);
      setError(t('No se pudieron cargar los alias'));
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
      setSelectedItems(aliases.map((item) => item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchAliases();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'tipoAlias':
        setSelectedTiposAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'nombreAlias':
        setSelectedNombresAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'estadoAlias':
        setSelectedEstadosAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'estacionalidad':
        setSelectedEstacionalidades(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'articulos':
        setSelectedArticulos(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  const handleSearchTextChange = (e) => {
    setSearchText(e.target.value);
  };
  
  const filteredAliasOptions = searchText 
    ? aliasOptions.filter(alias => 
        alias.id.toString().includes(searchText) || 
        alias.descripcion.toLowerCase().includes(searchText.toLowerCase())
      )
    : aliasOptions;

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="parametrizacion-alias-container">
      <div className="header">
        <h1 className="main-title">{t('PARAMETRIZACIÓN DE ALIAS')}</h1>
        <div className="header-buttons">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>{showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}</span>
          </button>
          <button className="new-alias-button">
            {t('NUEVO ALIAS')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoAlias')}
              >
                <span className="filter-label">Tipo de Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedTiposAlias.length > 0 
                      ? `${selectedTiposAlias.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'tipoAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar tipo de alias..." 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {tiposAlias.map((tipo) => (
                          <div 
                            key={tipo.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('tipoAlias', tipo.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedTiposAlias.includes(tipo.id)}
                              readOnly
                            />
                            <span>{tipo.id} - {tipo.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTiposAlias.length === tiposAlias.length) {
                            setSelectedTiposAlias([]);
                          } else {
                            setSelectedTiposAlias(tiposAlias.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedTiposAlias.length === tiposAlias.length && tiposAlias.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('nombreAlias')}
              >
                <span className="filter-label">Id o Nombre de Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedNombresAlias.length > 0 
                      ? `${selectedNombresAlias.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'nombreAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar alias..." 
                        value={searchText}
                        onChange={handleSearchTextChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredAliasOptions.map((alias) => (
                          <div 
                            key={alias.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('nombreAlias', alias.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedNombresAlias.includes(alias.id)}
                              readOnly
                            />
                            <span>{alias.id} - {alias.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedNombresAlias.length === aliasOptions.length) {
                            setSelectedNombresAlias([]);
                          } else {
                            setSelectedNombresAlias(aliasOptions.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedNombresAlias.length === aliasOptions.length && aliasOptions.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estadoAlias')}
              >
                <span className="filter-label">Estado del Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosAlias.length > 0 
                      ? `${selectedEstadosAlias.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estado..." 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {estadosAlias.map((estado) => (
                          <div 
                            key={estado.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('estadoAlias', estado.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedEstadosAlias.includes(estado.id)}
                              readOnly
                            />
                            <span>{estado.id} - {estado.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedEstadosAlias.length === estadosAlias.length) {
                            setSelectedEstadosAlias([]);
                          } else {
                            setSelectedEstadosAlias(estadosAlias.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedEstadosAlias.length === estadosAlias.length && estadosAlias.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estacionalidad')}
              >
                <span className="filter-label">Estacionalidad</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstacionalidades.length > 0 
                      ? `${selectedEstacionalidades.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estacionalidad' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estacionalidad..." 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {estacionalidades.map((estacionalidad) => (
                          <div 
                            key={estacionalidad.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('estacionalidad', estacionalidad.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedEstacionalidades.includes(estacionalidad.id)}
                              readOnly
                            />
                            <span>{estacionalidad.id} - {estacionalidad.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedEstacionalidades.length === estacionalidades.length) {
                            setSelectedEstacionalidades([]);
                          } else {
                            setSelectedEstacionalidades(estacionalidades.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedEstacionalidades.length === estacionalidades.length && estacionalidades.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('articulos')}
              >
                <span className="filter-label">Id o Artículos</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedArticulos.length > 0 
                      ? `${selectedArticulos.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'articulos' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar artículos..." 
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {articulos.map((articulo) => (
                          <div 
                            key={articulo.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('articulos', articulo.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedArticulos.includes(articulo.id)}
                              readOnly
                            />
                            <span>{articulo.id} - {articulo.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedArticulos.length === articulos.length) {
                            setSelectedArticulos([]);
                          } else {
                            setSelectedArticulos(articulos.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedArticulos.length === articulos.length && articulos.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="search-button-container">
              <button 
                className="search-button"
                onClick={handleSearch}
                disabled={loading}
              >
                <FaSearch className="search-icon" />
                <span>{t('BUSCAR')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'ALIAS' ? 'active' : ''}`}
            onClick={() => handleTabChange('ALIAS')}
          >
            {t('ALIAS')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'ARTICULOS' ? 'active' : ''}`}
            onClick={() => handleTabChange('ARTICULOS')}
          >
            {t('ARTÍCULOS')}
          </button>
        </div>
      </div>

      <div className="results-info">
        <span className="results-count">
          {loading ? t('Cargando...') : 
            t('Cargados {{count}} resultados de {{total}} encontrados', {
              count: aliases.length,
              total: totalElements
            })
          }
          {' '}
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </span>        
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-container" ref={tableContainerRef}>
        {activeTab === 'ALIAS' ? (
          <table className="alias-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={handleSelectAll} 
                    disabled={aliases.length === 0}
                  />
                </th>
                <th>{t('ID ALIAS')}</th>
                <th>{t('ALIAS')}</th>
                <th>{t('DESCRIPCIÓN DEL ALIAS')}</th>
                <th>{t('ALIAS TIPO')}</th>
                <th>{t('ESTADO ALIAS')}</th>
                <th>{t('Nº DE ARTÍCULOS')}</th>
                <th>{t('ESTACIONALIDAD')}</th>
                <th>{t('ÚLTIMA MODIFICACIÓN')}</th>
                <th>{t('FECHA DE ALTA')}</th>
                <th>{t('USUARIO')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="loading-cell">
                    {t('Cargando datos...')}
                  </td>
                </tr>
              ) : aliases.length > 0 ? (
                <>
                  {aliases.map((alias) => (
                    <tr key={alias.id}>
                      <td className="checkbox-column">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(alias.id)} 
                          onChange={() => handleSelectItem(alias.id)} 
                        />
                      </td>
                      <td>{alias.id}</td>
                      <td>{alias.nombreAlias}</td>
                      <td>{alias.descripcion}</td>
                      <td>
                        <span className="tipo-tag produccion">
                          {alias.tipo || "PRODUCCIÓN"}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag">
                          {alias.estado || "PRODUCCIÓN"}
                        </span>
                      </td>
                      <td>{alias.numArticulos || 3}</td>
                      <td>
                        <span className="estacionalidad-tag">
                          {alias.estacionalidad || "SIEMPRE"}
                        </span>
                      </td>
                      <td>{alias.ultimaModificacion || "2025-04-02"}</td>
                      <td>{alias.fechaAlta || "2025-04-02"}</td>
                      <td>{alias.usuario || "antoniommpu"}</td>
                    </tr>
                  ))}
                  {loadingMore && (
                    <tr>
                      <td colSpan="11" className="loading-cell">
                        {t('Cargando más datos...')}
                      </td>
                    </tr>
                  )}
                  <tr ref={tableEndRef}></tr>
                </>
              ) : (
                <tr>
                  <td colSpan="11" className="empty-table-message">
                    {t('No hay datos disponibles')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <div className="articulos-content">
            <p>{t('Contenido de artículos')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametrizacionAlias;