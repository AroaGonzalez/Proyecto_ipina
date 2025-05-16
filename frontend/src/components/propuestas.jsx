import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaTrash, FaTimes, FaFilter, FaCalendarAlt, FaUndo, FaRedo } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/propuestas.css';
import ViewPropuestaSFIModal from './viewPropuestaSFIModal';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Propuestas = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [showPropuestaSFIModal, setShowPropuestaSFIModal] = useState(false);
  const [selectedPropuestaDetails, setSelectedPropuestaDetails] = useState(null);

  const [paginaActual, setPaginaActual] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tamañoPagina] = useState(50);
  
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idEjecucion, setIdEjecucion] = useState('');
  const [idPropuesta, setIdPropuesta] = useState('');
  const [inicioFechaCreacion, setInicioFechaCreacion] = useState('');
  const [finFechaCreacion, setFinFechaCreacion] = useState('');
  
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [nombreEventoSearch, setNombreEventoSearch] = useState('');
  const [estadoPropuestaSearch, setEstadoPropuestaSearch] = useState('');
  const [unidadComprasSearch, setUnidadComprasSearch] = useState('');
  const [articulosSearch, setArticulosSearch] = useState('');
  
  const [openFilter, setOpenFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [totalElements, setTotalElements] = useState(0);

  const dropdownRef = useRef(null);
  const tableContainerRef = useRef();

  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estadosPropuesta, setEstadosPropuesta] = useState([]);
  const [unidadesCompras, setUnidadesCompras] = useState([]);
  const [articulos, setArticulos] = useState([]);
  
  const [selectedPropuestas, setSelectedPropuestas] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedEventos, setSelectedEventos] = useState([]);
  const [selectedEstadosPropuesta, setSelectedEstadosPropuesta] = useState([]);
  const [selectedUnidadesCompras, setSelectedUnidadesCompras] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          mercadosRes,
          gruposCadenaRes,
          eventosRes,
          tiposEstadoPropuestaRes,
          unidadesComprasRes,
          articulosRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/eventos/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/eventos?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/propuestas/tipos-estado-propuesta?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/propuestas/unidades-compras?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/ajenos?idIdioma=${languageId}`)
        ]);
        
        setMercados(mercadosRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setEventos(eventosRes.data || []);
        setEstadosPropuesta(tiposEstadoPropuestaRes.data || []);
        setUnidadesCompras(unidadesComprasRes.data || []);
        setArticulos(articulosRes.data || []);
        
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        setError('Error al cargar los datos. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [languageId]);

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
          loadMorePropuestas();
        }
      };
  
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, loadingMore, hasMore, propuestas]);

  const loadMorePropuestas = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const filter = {
        idsPropuesta: idPropuesta ? idPropuesta.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsUnidadComprasGestora: selectedUnidadesCompras.length > 0 ? selectedUnidadesCompras : [],
        idsAjeno: selectedArticulos.length > 0 ? selectedArticulos : [],
        idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
        idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
        idsLocalizacion: idLocalizacion ? idLocalizacion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
        idsEjecucion: idEjecucion ? idEjecucion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsTipoEstadoPropuesta: selectedEstadosPropuesta.length > 0 ? selectedEstadosPropuesta : [],
        fechaCreacionDesde: inicioFechaCreacion || null,
        fechaCreacionHasta: finFechaCreacion || null
      };
      
      const page = { number: nextPage, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/propuestas/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      const newPropuestas = response.data.propuestas || [];
      
      if (newPropuestas.length === 0 || newPropuestas.length < tamañoPagina) {
        setHasMore(false);
      }
      
      setPropuestas(prevPropuestas => [...prevPropuestas, ...newPropuestas]);
      setPaginaActual(nextPage);
      
    } catch (error) {
      console.error('Error al cargar más propuestas:', error);
      setError('Error al cargar más propuestas');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

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

  const handleDeletePropuestas = async () => {
    try {
      if (selectedPropuestas.length === 0) {
        return;
      }
      
      setLoading(true);
      
      await axios.put(`${BASE_URL}/propuestas/delete-propuestas`, {
        idsPropuesta: selectedPropuestas,
        usuarioBaja: 'frontend_user',
        fechaBaja: new Date().toISOString()
      });
      
      const updatedPropuestas = propuestas.filter(
        propuesta => !selectedPropuestas.includes(propuesta.idPropuesta)
      );
      
      alert(`Se han eliminado ${selectedPropuestas.length} propuesta(s) correctamente`);
      
      setPropuestas(updatedPropuestas);
      setTotalElements(prev => prev - selectedPropuestas.length);
      setSelectedPropuestas([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al eliminar propuestas:', error);
      setError(`Error al eliminar propuestas: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishInSFI = async () => {
    try {
      setLoading(true);
      
      if (selectedPropuestas.length > 0) {
        const propuestaDetails = propuestas.find(p => p.idPropuesta === selectedPropuestas[0]);
        if (propuestaDetails) {
          setSelectedPropuestaDetails(propuestaDetails);
          setShowPropuestaSFIModal(true);
        }
      }
        
    } catch (error) {
      console.error('Error al publicar en SFI:', error);
      setError('Error al publicar en SFI');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

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
        (item.nombreAlias || item.descripcion || item.nombre || '');
      const searchFieldStr = normalizeText(String(searchField || '').toLowerCase());
      const idString = item.id ? String(item.id) : '';
      
      return searchFieldStr.includes(normalizedSearchTerm) || 
        idString.includes(normalizedSearchTerm);
    });
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasMore(true);
      setPaginaActual(0);
      
      const filter = {
        idsPropuesta: idPropuesta ? idPropuesta.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsUnidadComprasGestora: selectedUnidadesCompras.length > 0 ? selectedUnidadesCompras : [],
        idsAjeno: selectedArticulos.length > 0 ? selectedArticulos : [],
        idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
        idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
        idsLocalizacion: idLocalizacion ? idLocalizacion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
        idsEjecucion: idEjecucion ? idEjecucion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsTipoEstadoPropuesta: selectedEstadosPropuesta.length > 0 ? selectedEstadosPropuesta : [],
        fechaCreacionDesde: inicioFechaCreacion || null,
        fechaCreacionHasta: finFechaCreacion || null
      };
      
      const page = { number: 0, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/propuestas/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      setPropuestas(response.data.propuestas || []);
      setTotalElements(response.data.page.total || 0);
      setUltimaActualizacion(new Date());
      setShowResults(true);

      if (
        response.data.propuestas.length === 0 || 
        response.data.propuestas.length < tamañoPagina || 
        response.data.propuestas.length === response.data.page.total
      ) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Error al buscar propuestas:', error);
      setError('Error al buscar propuestas');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
      setIdLocalizacion('');
      setSelectedMercados([]);
      setSelectedGruposCadena([]);
      setSelectedEventos([]);
      setIdEjecucion('');
      setIdPropuesta('');
      setSelectedEstadosPropuesta([]);
      setInicioFechaCreacion('');
      setFinFechaCreacion('');
      setSelectedUnidadesCompras([]);
      setSelectedArticulos([]);
      setShowResults(false);
      setPropuestas([]);
      setSelectedPropuestas([]);
      setSelectAll(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPropuestas(propuestas.map(propuesta => propuesta.idPropuesta));
    } else {
      setSelectedPropuestas([]);
    }
  };
  
  const handleSelectPropuesta = (idPropuesta) => {
    setSelectedPropuestas(prev => {
      if (prev.includes(idPropuesta)) {
        return prev.filter(id => id !== idPropuesta);
      } else {
        return [...prev, idPropuesta];
      }
    });
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'mercado':
        setSelectedMercados(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'grupoCadena':
        setSelectedGruposCadena(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'evento':
        setSelectedEventos(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'estadoPropuesta':
        setSelectedEstadosPropuesta(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'unidadCompras':
        setSelectedUnidadesCompras(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'articulos':
        setSelectedArticulos(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="propuestas-error">
        <span>{error}</span>
        <button onClick={clearFilters} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }

  const PropuestasTable = ({ propuestas, loading }) => {
    if (loading && propuestas.length === 0) {
      return <div className="loading-indicator">{t('Cargando...')}</div>;
    }
  
    if (!propuestas || propuestas.length === 0) {
      return null;
    }
  
    return (
      <div className="propuestas-table-container" ref={tableContainerRef}>
        <table className="propuestas-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <div className="checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectAll}
                    onChange={handleSelectAll}
                    id="select-all"
                  />
                </div>
              </th>
              <th className="id-column">{t('ID LÍNEA')}</th>
              <th className="id-column">{t('ID PROPUESTA')}</th>
              <th className="short-text-column">{t('COD EJECUCIÓN')}</th>
              <th className="short-text-column">{t('ESTADO DE LA LÍNEA')}</th>
              <th className="id-column">{t('ID UNIDAD COMPRAS')}</th>
              <th className="medium-text-column">{t('NOMBRE UNIDAD COMPRAS GESTORA')}</th>
              <th className="id-column">{t('ID EVENTO')}</th>
              <th className="medium-text-column">{t('EVENTO')}</th>
              <th className="short-text-column">{t('MERCADO')}</th>
              <th className="id-column">{t('ID LOCALIZACIÓN')}</th>
              <th className="medium-text-column">{t('LOCALIZACIÓN')}</th>
              <th className="id-column">{t('ID ARTÍCULO')}</th>
              <th className="medium-text-column">{t('ARTÍCULO')}</th>
              <th className="short-text-column">{t('CANTIDAD')}</th>
              <th className="id-column">{t('ID ALIAS')}</th>
              <th className="long-text-column">{t('DESCRIPCIÓN DEL ALIAS')}</th>
              <th className="medium-text-column">{t('FECHA DE CREACIÓN')}</th>
            </tr>
          </thead>
          <tbody>
            {propuestas.map((propuesta) => (
              <tr 
                key={propuesta.idPropuesta}
                className={selectedPropuestas.includes(propuesta.idPropuesta) ? 'selected-row' : ''}
              >
                <td className="checkbox-column">
                  <div className="checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedPropuestas.includes(propuesta.idPropuesta)}
                      onChange={() => handleSelectPropuesta(propuesta.idPropuesta)}
                      id={`propuesta-${propuesta.idPropuesta}`}
                    />
                  </div>
                </td>
                <td className="id-column">{propuesta.idEjecucion}</td>
                <td className="id-column">{propuesta.idPropuesta}</td>
                <td className="short-text-column">{propuesta.codEjecucion}</td>
                <td className="short-text-column">
                  <span className={`estado-propuesta estado-${propuesta.tipoEstadoPropuesta.id}`}>
                    {propuesta.tipoEstadoPropuesta.descripcion}
                  </span>
                </td>
                <td className="id-column">{propuesta.unidadComprasGestora ? propuesta.unidadComprasGestora.id : '-'}</td>
                <td className="medium-text-column">{normalizeText(propuesta.unidadComprasGestora ? propuesta.unidadComprasGestora.descripcion : '-')}</td>
                <td className="id-column">{propuesta.idEvento}</td>
                <td className="medium-text-column">{propuesta.nombreEvento}</td>
                <td className="short-text-column">
                  {propuesta.mercado.id} - {normalizeText(propuesta.mercado.descripcion)}
                </td>
                <td className="id-column">{propuesta.localizacionCompra.id}</td>
                <td className="medium-text-column">{normalizeText(propuesta.localizacionCompra.descripcion)}</td>
                <td className="id-column">{propuesta.idAjeno}</td>
                <td className="medium-text-column">{normalizeText(propuesta.descripcionAjeno)}</td>
                <td className="short-text-column">{propuesta.cantidad}</td>
                <td className="id-column">{propuesta.idAlias}</td>
                <td className="long-text-column">{propuesta.descripcionAlias}</td>
                <td className="medium-text-column">{propuesta.fechaCreacion}</td>
              </tr>
            ))}
            {loadingMore && (
              <tr>
                <td colSpan="18" className="loading-more-cell">
                  <div className="loading-more-indicator">{t('Cargando más resultados...')}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="propuestas-container">
      <div className="propuestas-header">
        <h1 className="propuestas-title">{t('PROPUESTAS')}</h1>
        <div className="filter-toggle">
          <button className="filter-button" onClick={toggleFilters}>
            <FaFilter /> {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section" ref={dropdownRef}>
          <div className="filters-row">
            <div className="filter-field">
              <label className="filter-label">{t('Id Localización')}</label>
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
                <label className="filter-label">{t('Id o Mercado')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedMercados.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedMercados.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'mercado' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar mercado...")} 
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
                            checked={selectedMercados.includes(mercado.id)}
                            readOnly
                          />
                          <span>{mercado.id} - {normalizeText(mercado.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedMercados.length === mercados.length) {
                          setSelectedMercados([]);
                        } else {
                          setSelectedMercados(mercados.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedMercados.length === mercados.length && mercados.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
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
                <label className="filter-label">{t('Id o Grupo Cadena (T6)')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGruposCadena.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedGruposCadena.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'grupoCadena' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar grupo cadena...")}
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
                            checked={selectedGruposCadena.includes(grupo.id)}
                            readOnly
                          />
                          <span>{grupo.id} - {normalizeText(grupo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedGruposCadena.length === gruposCadena.length) {
                          setSelectedGruposCadena([]);
                        } else {
                          setSelectedGruposCadena(gruposCadena.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedGruposCadena.length === gruposCadena.length && gruposCadena.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('nombreEvento')}
              >
                <label className="filter-label">{t('Id o Nombre Evento')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEventos.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedEventos.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'nombreEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar evento...")}
                        value={nombreEventoSearch}
                        onChange={(e) => setNombreEventoSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(eventos, nombreEventoSearch).map((evento) => (
                        <div 
                          key={evento.idEvento} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('evento', evento.idEvento);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedEventos.includes(evento.idEvento)}
                            readOnly
                          />
                          <span>{`${evento.idEvento} - ${normalizeText(evento.nombre || '')}`}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedEventos.length === eventos.length) {
                          setSelectedEventos([]);
                        } else {
                          setSelectedEventos(eventos.map(item => item.idEvento));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedEventos.length === eventos.length && eventos.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <label className="filter-label">{t('Id Ejecución')}</label>
              <input
                type="text"
                placeholder={t("Id Ejecución")}
                value={idEjecucion}
                onChange={(e) => setIdEjecucion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-field">
              <label className="filter-label">{t('Id Propuesta')}</label>
              <input
                type="text"
                placeholder={t("Id Propuesta")}
                value={idPropuesta}
                onChange={(e) => setIdPropuesta(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filters-row">
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estadoPropuesta')}
              >
                <label className="filter-label">{t('Estado de la Propuesta')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosPropuesta.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedEstadosPropuesta.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoPropuesta' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar estado...")}
                        value={estadoPropuestaSearch}
                        onChange={(e) => setEstadoPropuestaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                    {filterBySearch(estadosPropuesta, estadoPropuestaSearch).map((estado) => (
                        <div 
                          key={estado.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('estadoPropuesta', estado.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedEstadosPropuesta.includes(estado.id)}
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
                        if (selectedEstadosPropuesta.length === estadosPropuesta.length) {
                          setSelectedEstadosPropuesta([]);
                        } else {
                          setSelectedEstadosPropuesta(estadosPropuesta.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedEstadosPropuesta.length === estadosPropuesta.length && estadosPropuesta.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <label className="filter-label">{t('Inicio Fecha Creación')}</label>
              <div className="date-input-container">
                <input
                  type="text"
                  placeholder={t("Inicio Fecha Creación")}
                  value={inicioFechaCreacion}
                  onChange={(e) => setInicioFechaCreacion(e.target.value)}
                  className="filter-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
            
            <div className="filter-field">
              <label className="filter-label">{t('Fin Fecha Creación')}</label>
              <div className="date-input-container">
                <input
                  type="text"
                  placeholder={t("Fin Fecha Creación")}
                  value={finFechaCreacion}
                  onChange={(e) => setFinFechaCreacion(e.target.value)}
                  className="filter-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('unidadCompras')}
              >
                <label className="filter-label">{t('Id o Nombre de Unidad Compras Gestora')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedUnidadesCompras.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedUnidadesCompras.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'unidadCompras' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar unidad compras...")}
                        value={unidadComprasSearch}
                        onChange={(e) => setUnidadComprasSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(unidadesCompras, unidadComprasSearch).map((unidad) => (
                        <div 
                          key={unidad.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('unidadCompras', unidad.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedUnidadesCompras.includes(unidad.id)}
                            readOnly
                          />
                          <span>{unidad.id} - {normalizeText(unidad.descripcion || '')}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedUnidadesCompras.length === unidadesCompras.length) {
                          setSelectedUnidadesCompras([]);
                        } else {
                          setSelectedUnidadesCompras(unidadesCompras.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedUnidadesCompras.length === unidadesCompras.length && unidadesCompras.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('articulos')}
              >
                <label className="filter-label">{t('Id o Artículos')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedArticulos.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedArticulos.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'articulos' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar artículo...")}
                        value={articulosSearch}
                        onChange={(e) => setArticulosSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(articulos, articulosSearch).map((articulo) => (
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
                          <span>{articulo.id} - {normalizeText(articulo.nombre || articulo.descripcion || '')}</span>
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
                      <span>{t('Seleccionar todo')}</span>
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
                {t('BUSCAR')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showResults && (
        <div className="propuestas-results-info">
          <div className="results-count">
            {t('Cargados {{count}} resultados de {{total}} encontrados', {
              count: propuestas.length,
              total: totalElements
            })}
            <span className="last-update">
              <FaRedo className="update-icon" />
              {t('Última actualización')}: {formatTime(ultimaActualizacion)}
            </span>
          </div>
        </div>
      )}

      {selectedPropuestas.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            {t('Seleccionados {{count}} resultados de {{total}} encontrados', {
              count: selectedPropuestas.length,
              total: totalElements
            })}
          </div>
          <div className="selection-actions">
            <button 
              className="action-button trash-button" 
              onClick={handleDeletePropuestas}
              title="Eliminar propuestas seleccionadas"
            >
              <FaTrash />
            </button>
            <button 
              className="action-button publish-button"
              onClick={handlePublishInSFI}
              title="Publicar en SFI"
            >
              <span>{t('PUBLICAR EN SFI')}</span>
            </button>
          </div>
        </div>
      )}
      
      {showResults ? (
        loading ? (
          <div className="results-section">
            <div className="loading-indicator">{t('Cargando...')}</div>
          </div>
        ) : propuestas.length > 0 ? (
          <PropuestasTable propuestas={propuestas} loading={loading} />
        ) : (
          <div className="results-section">
            <div className="no-results">
              <div className="search-icon">
                <FaSearch />
              </div>
              <p className="no-results-text">
                {t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="results-section">
          <div className="no-search-yet">
            <div className="search-icon">
              <FaSearch />
            </div>
            <p className="no-results-text">
              {t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}
            </p>
          </div>
        </div>
      )}
      {showPropuestaSFIModal && selectedPropuestaDetails && (
        <ViewPropuestaSFIModal 
          propuesta={selectedPropuestaDetails}
          onClose={() => {
            setShowPropuestaSFIModal(false);
            setSelectedPropuestaDetails(null);
          }}
          onUpdate={handleSearch}
        />
      )}
    </div>
  );
};

export default Propuestas;