import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaFilter, FaCalendarAlt, FaUndo, FaRedo, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/consultaStocks.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ConsultaStocks = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);

  // Estados para los filtros
  const [idAlias, setIdAlias] = useState('');
  const [tipoAlias, setTipoAlias] = useState('');
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idMercado, setIdMercado] = useState('');
  const [idGrupoCadena, setIdGrupoCadena] = useState('');
  const [idCadena, setIdCadena] = useState('');
  
  // Estados para búsquedas en dropdowns
  const [aliasSearch, setAliasSearch] = useState('');
  const [tipoAliasSearch, setTipoAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [cadenaSearch, setCadenaSearch] = useState('');
  
  // Estado para controlar qué dropdown está abierto
  const [openFilter, setOpenFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [showExpandedInfo, setShowExpandedInfo] = useState(false);

  // Estados para datos y carga
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [totalElements, setTotalElements] = useState(0);

  // Referencias y paginación
  const dropdownRef = useRef(null);
  const tableContainerRef = useRef();
  const [paginaActual, setPaginaActual] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tamañoPagina] = useState(50);

  // Datos para los dropdowns
  const [aliases, setAliases] = useState([]);
  const [tiposAlias, setTiposAlias] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  
  // Estados para los valores seleccionados en los dropdowns
  const [selectedAlias, setSelectedAlias] = useState('');
  const [selectedTipoAlias, setSelectedTipoAlias] = useState('');
  const [selectedMercado, setSelectedMercado] = useState('');
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState('');
  const [selectedCadena, setSelectedCadena] = useState('');
  
  // Estado para el stock seleccionado para expandir
  const [selectedStock, setSelectedStock] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          aliasesRes,
          tiposAliasRes,
          mercadosRes,
          gruposCadenaRes,
          cadenasRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/stock/alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/tipos-alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/cadenas?idIdioma=${languageId}`)
        ]);
        
        setAliases(aliasesRes.data || []);
        setTiposAlias(tiposAliasRes.data || []);
        setMercados(mercadosRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setCadenas(cadenasRes.data || []);
        
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setError('Error al cargar los datos. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [languageId]);

  // Detectar clics fuera de los dropdowns para cerrarlos
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

  // Manejar el scroll infinito
  useEffect(() => {
    if (!loading && !loadingMore && hasMore) {
      const container = tableContainerRef.current;
      if (!container) return;
  
      const handleScroll = () => {
        if (
          container.scrollHeight - container.scrollTop <= container.clientHeight * 1.2 &&
          hasMore && 
          !loadingMore
        ) {
          loadMoreStocks();
        }
      };
  
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, loadingMore, hasMore, stocks]);

  // Cargar más stocks al hacer scroll
  const loadMoreStocks = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const filter = {
        idAlias: selectedAlias || null,
        idTipoAlias: selectedTipoAlias || null,
        idLocalizacion: idLocalizacion || null,
        idMercado: selectedMercado || null,
        idGrupoCadena: selectedGrupoCadena || null,
        idCadena: selectedCadena || null
      };
      
      const page = { number: nextPage, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/stock/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      const newStocks = response.data.stocks || [];
      
      if (newStocks.length === 0 || newStocks.length < tamañoPagina) {
        setHasMore(false);
      }
      
      setStocks(prevStocks => [...prevStocks, ...newStocks]);
      setPaginaActual(nextPage);
      
    } catch (error) {
      console.error('Error al cargar más stocks:', error);
      setError('Error al cargar más stocks');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Normalizar el texto para evitar problemas con caracteres especiales
  const normalizeText = (text) => {
    if (!text) return '';
    
    let normalizedText = String(text);
    
    normalizedText = normalizedText
      .replace(/ESPA.?.'A/g, 'ESPAÑA')
      .replace(/ESPA.?.A/g, 'ESPAÑA')
      .replace(/PEQUE.?.AS/g, 'PEQUEÑAS')
      .replace(/PEQUE.?.A/g, 'PEQUEÑA')
      .replace(/CAMPA.?.A/g, 'CAMPAÑA')
      .replace(/PEQUE.?.OS/g, 'PEQUEÑOS');
  
    const replacements = {
      'Ã\u0081': 'Á', 'Ã\u0089': 'É', 'Ã\u008D': 'Í', 'Ã\u0093': 'Ó', 'Ã\u009A': 'Ú',
      'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
      'Ã\u0091': 'Ñ', 'Ã±': 'ñ',
      'Ã¼': 'ü', 'Ã\u009C': 'Ü',
      'Âº': 'º', 'Âª': 'ª',
      'Ã\u0084': 'Ä', 'Ã\u008B': 'Ë', 'Ã\u008F': 'Ï', 'Ã\u0096': 'Ö', 'Ã\u009C': 'Ü',
      'Ã¤': 'ä', 'Ã«': 'ë', 'Ã¯': 'ï', 'Ã¶': 'ö', 'Ã¼': 'ü',
      'â‚¬': '€',
      'â€"': '–', 'â€"': '—',
      'â€œ': '"', 'â€': '"',
      'â€¢': '•',
      'â€¦': '…',
      'Â¡': '¡', 'Â¿': '¿'
    };
  
    Object.entries(replacements).forEach(([badChar, goodChar]) => {
      normalizedText = normalizedText.replace(new RegExp(badChar, 'g'), goodChar);
    });
  
    return normalizedText;
  };

  // Abrir/cerrar un dropdown específico
  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  // Filtrar elementos según término de búsqueda
  const filterBySearch = (items, searchTerm, field = null) => {
    if (!items) return [];
    
    const itemsArray = Array.isArray(items) ? items : 
      (items && items.content && Array.isArray(items.content)) ? 
      items.content : [];
  
    if (!searchTerm || searchTerm.trim() === '') return itemsArray;
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return itemsArray.filter(item => {
      if (!item) return false;
      
      const searchField = field ? item[field] : 
        (item.nombre || item.descripcion || '');
      
      const searchFieldStr = normalizeText(String(searchField || '').toLowerCase());
      const idString = item.id ? String(item.id) : '';
      
      return searchFieldStr.includes(normalizedSearchTerm) || 
        idString.includes(normalizedSearchTerm);
    });
  };

  // Buscar stocks
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasMore(true);
      setPaginaActual(0);
    
      const filter = {
        idAlias: selectedAlias || null,
        idTipoAlias: selectedTipoAlias || null,
        idLocalizacion: idLocalizacion || null,
        idMercado: selectedMercado || null,
        idGrupoCadena: selectedGrupoCadena || null,
        idCadena: selectedCadena || null
      };
      
      const page = { number: 0, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/stock/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      setStocks(response.data.stocks || []);
      setTotalElements(response.data.page.total || 0);
      setUltimaActualizacion(new Date());
      setShowResults(true);

      if (
        response.data.stocks.length === 0 || 
        response.data.stocks.length < tamañoPagina || 
        response.data.stocks.length === response.data.page.total
      ) {
        setHasMore(false);
      }
    
    } catch (error) {
      console.error('Error al buscar stocks:', error);
      setError('Error al buscar stocks');
    } finally {
      setLoading(false);
    }
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setIdAlias('');
    setSelectedAlias('');
    setTipoAlias('');
    setSelectedTipoAlias('');
    setIdLocalizacion('');
    setIdMercado('');
    setSelectedMercado('');
    setIdGrupoCadena('');
    setSelectedGrupoCadena('');
    setIdCadena('');
    setSelectedCadena('');
    setShowResults(false);
    setStocks([]);
  };

  // Mostrar/ocultar filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Formatear la hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Manejar selección de dropdown
  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'alias':
        setSelectedAlias(value === selectedAlias ? '' : value);
        break;
      case 'tipoAlias':
        setSelectedTipoAlias(value === selectedTipoAlias ? '' : value);
        break;
      case 'mercado':
        setSelectedMercado(value === selectedMercado ? '' : value);
        break;
      case 'grupoCadena':
        setSelectedGrupoCadena(value === selectedGrupoCadena ? '' : value);
        break;
      case 'cadena':
        setSelectedCadena(value === selectedCadena ? '' : value);
        break;
      default:
        break;
    }
  };

  // Mostrar información expandida
  const handleExpandInfo = (stock) => {
    setSelectedStock(stock);
    setShowExpandedInfo(true);
  };

  // Cerrar información expandida
  const handleCloseExpandedInfo = () => {
    setShowExpandedInfo(false);
    setSelectedStock(null);
  };

  // Mensaje de error
  if (error) {
    return (
      <div className="consulta-stocks-error">
        <span>{error}</span>
        <button onClick={clearFilters} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }

  // Componente para mostrar estados con etiquetas de colores
  const StatusTag = ({ status, type }) => {
    let className = 'status-tag';
    
    if (status === 'ACTIVO' || status === 'ACTIVA' || status === 'ABIERTA') {
      className += ' status-active';
    } else if (status === 'PROVISIONAL') {
      className += ' status-provisional';
    } else if (status === 'CERRADA DEFINITIVAMENTE' || status === 'PAUSADA') {
      className += ' status-closed';
    } else if (status === 'PRODUCCIÓN') {
      className += ' status-production';
    }
    
    return <div className={className}>{status}</div>;
  };

  // Componente de detalles expandidos
  const ExpandedInfo = ({ stock }) => {
    if (!stock) return null;
    
    return (
      <div className="expanded-info-overlay">
        <div className="expanded-info-container">
          <div className="expanded-info-header">
            <h2>Información detallada</h2>
            <button className="close-button" onClick={handleCloseExpandedInfo}>
              <FaTimes />
            </button>
          </div>
          
          <div className="expanded-info-content">
            <div className="expanded-info-section">
              <h3>Información general</h3>
              <div className="expanded-info-grid">
                <div className="info-row">
                  <span className="info-label">ID Alias:</span>
                  <span className="info-value">{stock.idAlias}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nombre Alias:</span>
                  <span className="info-value">{normalizeText(stock.nombreAlias)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tipo Alias:</span>
                  <span className="info-value">{stock.tipoAlias}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">ID Localización:</span>
                  <span className="info-value">{stock.idLocalizacion}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Localización:</span>
                  <span className="info-value">{normalizeText(stock.nombreLocalizacion)}</span>
                </div>
              </div>
            </div>
            
            <div className="expanded-info-section">
              <h3>Datos de stock</h3>
              <div className="expanded-info-grid">
                <div className="info-row">
                  <span className="info-label">Stock:</span>
                  <span className="info-value">{stock.stock || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Capacidad Máxima:</span>
                  <span className="info-value">{stock.capacidadMaxima || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Stock Teórico:</span>
                  <span className="info-value">{stock.stockTeorico || '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="expanded-info-section">
              <h3>Fechas</h3>
              <div className="expanded-info-grid">
                <div className="info-row">
                  <span className="info-label">Fecha de Recuento:</span>
                  <span className="info-value">{stock.fechaRecuento || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha Stock Teórico:</span>
                  <span className="info-value">{stock.fechaStockTeorico || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha Edición:</span>
                  <span className="info-value">{stock.fechaEdicion || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Usuario:</span>
                  <span className="info-value">{stock.usuario || '-'}</span>
                </div>
              </div>
            </div>
            
            <div className="expanded-info-section">
              <h3>Estados</h3>
              <div className="expanded-info-states">
                <div className="info-state-row">
                  <span className="info-state-label">Estado Alias:</span>
                  <StatusTag status={stock.estadoAlias || 'PRODUCCIÓN'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado Artículo SFI:</span>
                  <StatusTag status={stock.estadoArticuloSFI || '-'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado Artículo RAM:</span>
                  <StatusTag status={stock.estadoArticuloRAM || '-'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado Artículo en el Alias:</span>
                  <StatusTag status={stock.estadoArticuloAlias || '-'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado Relación:</span>
                  <StatusTag status={stock.estadoRelacion || 'ACTIVA'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado de Tienda MTU:</span>
                  <StatusTag status={stock.estadoTiendaMTU || 'PROVISIONAL'} />
                </div>
                <div className="info-state-row">
                  <span className="info-state-label">Estado de Tienda RAM:</span>
                  <StatusTag status={stock.estadoTiendaRAM || 'ACTIVA'} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tabla de resultados
  const StocksTable = ({ stocks, loading }) => {
    if (loading && stocks.length === 0) {
      return <div className="loading-indicator">Cargando...</div>;
    }
  
    if (!stocks || stocks.length === 0) {
      return null;
    }
  
    return (
      <div className="stocks-table-container" ref={tableContainerRef}>
        <table className="stocks-table">
          <thead>
            <tr>
              <th className="id-column">ID ALIAS</th>
              <th className="medium-text-column">ALIAS</th>
              <th className="short-text-column">ALIAS TIPO</th>
              <th className="short-text-column">RELACIONADO CON</th>
              <th className="short-text-column">STOCK TEÓRICO</th>
              <th className="short-text-column">STOCK RECUENTO</th>
              <th className="short-text-column">CAPACIDAD MÁXIMA</th>
              <th className="short-text-column">PROPUESTA MIN</th>
              <th className="short-text-column">STOCK LIMITE (%)</th>
              <th className="id-column">ID LOCALIZACIÓN</th>
              <th className="short-text-column">TIENDA</th>
              <th className="short-text-column">MERCADO</th>
              <th className="short-text-column">CADENA</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr 
                key={`${stock.idAlias}-${stock.idLocalizacion}`} 
                onClick={() => handleExpandInfo(stock)}
                className="stock-row"
              >
                <td className="id-column">{stock.idAlias}</td>
                <td className="medium-text-column">{normalizeText(stock.nombreAlias)}</td>
                <td className="short-text-column">{stock.tipoAlias || 'Z BOLSAS GRANDES'}</td>
                <td className="short-text-column">{stock.relacionadoCon || '1'}</td>
                <td className="short-text-column">{stock.stockTeorico || '982'}</td>
                <td className="short-text-column">{stock.stockRecuentos || '-'}</td>
                <td className="short-text-column">{stock.capacidadMaxima || '-'}</td>
                <td className="short-text-column">{stock.propuestaMin || '-'}</td>
                <td className="short-text-column">{stock.stockLimite || '100'}</td>
                <td className="id-column">{stock.idLocalizacion}</td>
                <td className="short-text-column">{normalizeText(stock.nombreLocalizacion) || 'SHAN-INPOINT'}</td>
                <td className="short-text-column">
                  {stock.idMercado} - {normalizeText(stock.nombreMercado)}
                </td>
                <td className="short-text-column">{normalizeText(stock.nombreCadena) || 'Zara'}</td>
              </tr>
            ))}
            {loadingMore && (
              <tr>
                <td colSpan="13" className="loading-more-cell">
                  <div className="loading-more-indicator">Cargando más resultados...</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="consulta-stocks-container">
      <div className="consulta-stocks-header">
        <h1 className="consulta-stocks-title">CONSULTA STOCKS</h1>
        <div className="filter-toggle">
          <button className="filter-button" onClick={toggleFilters}>
            <FaFilter /> {showFilters ? 'OCULTAR FILTROS' : 'MOSTRAR FILTROS'}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section" ref={dropdownRef}>
          <div className="filters-row">
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('alias')}
              >
                <label className="filter-label">Id o Nombre de Alias</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedAlias 
                      ? aliases.find(a => a.id === selectedAlias)?.nombre || selectedAlias 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'alias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar alias..." 
                        value={aliasSearch}
                        onChange={(e) => setAliasSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(aliases, aliasSearch).map((alias) => (
                        <div 
                          key={alias.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('alias', alias.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedAlias === alias.id}
                            readOnly
                          />
                          <span>{alias.id} - {normalizeText(alias.nombre)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoAlias')}
              >
                <label className="filter-label">Tipo de Alias</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedTipoAlias 
                      ? tiposAlias.find(t => t.id === selectedTipoAlias)?.descripcion || selectedTipoAlias
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'tipoAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar tipo..." 
                        value={tipoAliasSearch}
                        onChange={(e) => setTipoAliasSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(tiposAlias, tipoAliasSearch).map((tipo) => (
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
                            checked={selectedTipoAlias === tipo.id}
                            readOnly
                          />
                          <span>{tipo.id} - {normalizeText(tipo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <label className="filter-label">Id Localización</label>
              <input
                type="text"
                placeholder="Id Localización"
                value={idLocalizacion}
                onChange={(e) => setIdLocalizacion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('mercado')}
              >
                <label className="filter-label">Id o Mercado</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedMercado 
                      ? mercados.find(m => m.id === selectedMercado)?.descripcion || selectedMercado
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'mercado' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar mercado..." 
                        value={mercadoSearch}
                        onChange={(e) => setMercadoSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(mercados, mercadoSearch).map((mercado) => (
                        <div 
                          key={mercado.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('mercado', mercado.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedMercado === mercado.id}
                            readOnly
                          />
                          <span>{mercado.id} - {normalizeText(mercado.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('grupoCadena')}
              >
                <label className="filter-label">Id o Grupo Cadena (T6)</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGrupoCadena 
                      ? gruposCadena.find(g => g.id === selectedGrupoCadena)?.descripcion || selectedGrupoCadena
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'grupoCadena' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar grupo cadena..." 
                        value={grupoCadenaSearch}
                        onChange={(e) => setGrupoCadenaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(gruposCadena, grupoCadenaSearch).map((grupo) => (
                        <div 
                          key={grupo.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('grupoCadena', grupo.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedGrupoCadena === grupo.id}
                            readOnly
                          />
                          <span>{grupo.id} - {normalizeText(grupo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('cadena')}
              >
                <label className="filter-label">Id o Cadena</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedCadena 
                      ? cadenas.find(c => c.id === selectedCadena)?.nombre || selectedCadena
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'cadena' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar cadena..." 
                        value={cadenaSearch}
                        onChange={(e) => setCadenaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(cadenas, cadenaSearch).map((cadena) => (
                        <div 
                          key={cadena.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('cadena', cadena.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedCadena === cadena.id}
                            readOnly
                          />
                          <span>{cadena.id} - {normalizeText(cadena.nombre)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="search-button-container">
              <button className="reset-button" onClick={clearFilters}>
                <FaUndo />
              </button>
              <button 
                className="search-button" 
                onClick={handleSearch}
                disabled={loading}
              >
                BUSCAR
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showResults && (
        <div className="stocks-results-info">
          <div className="results-count">
            {t('Cargados')} {stocks.length} {t('resultados de')} {totalElements} {t('encontrados')}
            <span className="last-update">
              <FaRedo className="update-icon" />
              {t('Última actualización')}: {formatTime(ultimaActualizacion)}
            </span>
          </div>
          <div className="results-actions">
            <button className="action-button">
              <span>{t('MOSTRAR LÍNEAS LISTAS PARA RECONTAR')}</span>
            </button>
            <button className="action-button">
              <span>{t('DESCARGAR')}</span>
            </button>
            <button className="action-button">
              <span>{t('GUARDAR CAMPOS')}</span>
            </button>
          </div>
        </div>
      )}
      
      {showResults ? (
        loading ? (
          <div className="loading-indicator">Cargando...</div>
        ) : stocks.length > 0 ? (
          <StocksTable stocks={stocks} loading={loading} />
        ) : (
          <div className="no-results">
            <div className="search-icon">
              <FaSearch />
            </div>
            <p className="no-results-text">UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA</p>
          </div>
        )
      ) : (
        <div className="no-search-yet">
          <div className="search-icon">
            <FaSearch />
          </div>
          <p className="no-results-text">UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA</p>
        </div>
      )}

      {showExpandedInfo && selectedStock && (
        <ExpandedInfo stock={selectedStock} />
      )}
    </div>
  );
};

export default ConsultaStocks;