import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaTimes, FaFilter, FaCalendarAlt, FaUndo, FaRedo, FaCheckSquare, FaSquare } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/propuestas.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Propuestas = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  // Estados para los filtros
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idMercado, setIdMercado] = useState('');
  const [idGrupoCadena, setIdGrupoCadena] = useState('');
  const [idNombreEvento, setIdNombreEvento] = useState('');
  const [idEjecucion, setIdEjecucion] = useState('');
  const [idPropuesta, setIdPropuesta] = useState('');
  const [estadoPropuesta, setEstadoPropuesta] = useState('');
  const [inicioFechaCreacion, setInicioFechaCreacion] = useState('');
  const [finFechaCreacion, setFinFechaCreacion] = useState('');
  const [idUnidadCompras, setIdUnidadCompras] = useState('');
  const [idArticulos, setIdArticulos] = useState('');
  
  // Estados para búsqueda
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [nombreEventoSearch, setNombreEventoSearch] = useState('');
  const [estadoPropuestaSearch, setEstadoPropuestaSearch] = useState('');
  const [unidadComprasSearch, setUnidadComprasSearch] = useState('');
  const [articulosSearch, setArticulosSearch] = useState('');
  
  // Estado para el menú desplegable activo
  const [openFilter, setOpenFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Estado para almacenar las propuestas
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [totalElements, setTotalElements] = useState(0);

  // Referencia para manejar clics fuera de los dropdowns
  const dropdownRef = useRef(null);
  const tableContainerRef = useRef();

  // Estados para datos de los dropdowns
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estadosPropuesta, setEstadosPropuesta] = useState([]);
  const [unidadesCompras, setUnidadesCompras] = useState([]);
  const [articulos, setArticulos] = useState([]);
  
  // Estado para selección múltiple
  const [selectedPropuestas, setSelectedPropuestas] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Estados para selección múltiple en filtros
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedEventos, setSelectedEventos] = useState([]);
  const [selectedEstadosPropuesta, setSelectedEstadosPropuesta] = useState([]);
  const [selectedUnidadesCompras, setSelectedUnidadesCompras] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);

  // Efecto para cargar datos iniciales
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

  // Efecto para manejar clics fuera de los dropdowns
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

  // Normalización de texto para caracteres especiales
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

  // Función para manejar la apertura/cierre de dropdowns
  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  // Función para filtrar datos en búsquedas
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

  // Función para buscar propuestas
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir filtros para la petición
      const filter = {
        idsPropuesta: idPropuesta ? [idPropuesta] : [],
        idsUnidadComprasGestora: selectedUnidadesCompras.length > 0 ? selectedUnidadesCompras : [],
        idsAjeno: selectedArticulos.length > 0 ? selectedArticulos : [],
        idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
        idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
        idsLocalizacion: idLocalizacion ? [idLocalizacion] : [],
        idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
        idsEjecucion: idEjecucion ? [idEjecucion] : [],
        idsTipoEstadoPropuesta: selectedEstadosPropuesta.length > 0 ? selectedEstadosPropuesta : [],
        fechaCreacionDesde: inicioFechaCreacion || null,
        fechaCreacionHasta: finFechaCreacion || null
      };
      
      const page = { number: 0, size: 50 };
      
      const response = await axios.post(`${BASE_URL}/propuestas/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      setPropuestas(response.data.propuestas || []);
      setTotalElements(response.data.page.total || 0);
      setUltimaActualizacion(new Date());
      setShowResults(true);
      
    } catch (error) {
      console.error('Error al buscar propuestas:', error);
      setError('Error al buscar propuestas');
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar filtros
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

  // Función para alternar la visibilidad de los filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Manejar selección de todas las propuestas
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedPropuestas(propuestas.map(propuesta => propuesta.idPropuesta));
    } else {
      setSelectedPropuestas([]);
    }
  };
  
  // Manejar selección individual de propuesta
  const handleSelectPropuesta = (idPropuesta) => {
    setSelectedPropuestas(prev => {
      if (prev.includes(idPropuesta)) {
        return prev.filter(id => id !== idPropuesta);
      } else {
        return [...prev, idPropuesta];
      }
    });
  };
  
  // Formato de hora para mostrar última actualización
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Manejar selección individual en filtros
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

  // Componente de tabla de propuestas
  const PropuestasTable = ({ propuestas, loading }) => {
    if (loading) {
      return <div className="loading-indicator">Cargando...</div>;
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
                <div className="checkbox" onClick={handleSelectAll}>
                  {selectAll ? 
                    <FaCheckSquare className="checkbox-icon checked" /> : 
                    <FaSquare className="checkbox-icon" />}
                </div>
              </th>
              <th>ID LÍNEA</th>
              <th>ID PROPUESTA</th>
              <th>COD EJECUCIÓN</th>
              <th>ESTADO DE LA LÍNEA</th>
              <th>ID UNIDAD COMPRAS</th>
              <th>NOMBRE UNIDAD COMPRAS GESTORA</th>
              <th>ID EVENTO</th>
              <th>EVENTO</th>
              <th>MERCADO</th>
              <th>ID LOCALIZ.</th>
              <th>LOCALIZACIÓN</th>
              <th>ESTADO LÍNEA SPI</th>
            </tr>
          </thead>
          <tbody>
            {propuestas.map((propuesta) => (
              <tr 
                key={propuesta.idPropuesta}
                className={selectedPropuestas.includes(propuesta.idPropuesta) ? 'selected-row' : ''}
              >
                <td className="checkbox-column">
                  <div className="checkbox" onClick={() => handleSelectPropuesta(propuesta.idPropuesta)}>
                    {selectedPropuestas.includes(propuesta.idPropuesta) ? 
                      <FaCheckSquare className="checkbox-icon checked" /> : 
                      <FaSquare className="checkbox-icon" />}
                  </div>
                </td>
                <td>{propuesta.idEjecucion}</td>
                <td>{propuesta.idPropuesta}</td>
                <td>{propuesta.codEjecucion}</td>
                <td>
                  <span className={`estado-propuesta estado-${propuesta.tipoEstadoPropuesta.id}`}>
                    {propuesta.tipoEstadoPropuesta.descripcion}
                  </span>
                </td>
                <td>{propuesta.unidadComprasGestora ? propuesta.unidadComprasGestora.id : '-'}</td>
                <td>{propuesta.unidadComprasGestora ? propuesta.unidadComprasGestora.descripcion : '-'}</td>
                <td>{propuesta.idEvento}</td>
                <td>{propuesta.nombreEvento}</td>
                <td>
                  <span className="mercado-flag">
                    {propuesta.mercado.id} - {propuesta.mercado.descripcion}
                  </span>
                </td>
                <td>{propuesta.localizacionCompra.id}</td>
                <td>{propuesta.localizacionCompra.descripcion} {propuesta.cadena.descripcion}</td>
                <td>
                  <span className={`estado-linea estado-${propuesta.tipoEstadoLineaSolicitud.id}`}>
                    {propuesta.tipoEstadoLineaSolicitud.descripcion}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizado del componente principal
  return (
    <div className="propuestas-container">
      <div className="propuestas-header">
        <h1 className="propuestas-title">PROPUESTAS</h1>
        <div className="filter-toggle">
          <button className="filter-button" onClick={toggleFilters}>
            <FaFilter /> {showFilters ? 'OCULTAR FILTROS' : 'MOSTRAR FILTROS'}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section" ref={dropdownRef}>
          <div className="filters-row">
            {/* Filtro de ID Localización */}
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
            
            {/* Filtro de ID Mercado */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('mercado')}
              >
                <label className="filter-label">Id o Mercado</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedMercados.length > 0 
                      ? `${selectedMercados.length} seleccionados` 
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
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de ID Grupo Cadena */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('grupoCadena')}
              >
                <label className="filter-label">Id o Grupo Cadena (T6)</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGruposCadena.length > 0 
                      ? `${selectedGruposCadena.length} seleccionados` 
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
                            checked={selectedGruposCadena.includes(grupo.id)}
                            readOnly
                          />
                          <span>{grupo.id} - {grupo.descripcion}</span>
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
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de Nombre Evento */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('nombreEvento')}
              >
                <label className="filter-label">Id o Nombre Evento</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEventos.length > 0 
                      ? `${selectedEventos.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'nombreEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar evento..." 
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
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de ID Ejecución */}
            <div className="filter-field">
              <label className="filter-label">Id Ejecución</label>
              <input
                type="text"
                placeholder="Id Ejecución"
                value={idEjecucion}
                onChange={(e) => setIdEjecucion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            {/* Filtro de ID Propuesta */}
            <div className="filter-field">
              <label className="filter-label">Id Propuesta</label>
              <input
                type="text"
                placeholder="Id Propuesta"
                value={idPropuesta}
                onChange={(e) => setIdPropuesta(e.target.value)}
                className="filter-input"
              />
            </div>
          </div>
          
          <div className="filters-row">
            {/* Filtro de Estado de la Propuesta */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estadoPropuesta')}
              >
                <label className="filter-label">Estado de la Propuesta</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosPropuesta.length > 0 
                      ? `${selectedEstadosPropuesta.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoPropuesta' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estado..." 
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
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de Inicio Fecha Creación */}
            <div className="filter-field">
              <label className="filter-label">Inicio Fecha Creación</label>
              <div className="date-input-container">
                <input
                  type="text"
                  placeholder="Inicio Fecha Creación"
                  value={inicioFechaCreacion}
                  onChange={(e) => setInicioFechaCreacion(e.target.value)}
                  className="filter-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
            
            {/* Filtro de Fin Fecha Creación */}
            <div className="filter-field">
              <label className="filter-label">Fin Fecha Creación</label>
              <div className="date-input-container">
                <input
                  type="text"
                  placeholder="Fin Fecha Creación"
                  value={finFechaCreacion}
                  onChange={(e) => setFinFechaCreacion(e.target.value)}
                  className="filter-input"
                />
                <FaCalendarAlt className="calendar-icon" />
              </div>
            </div>
            
            {/* Filtro de Unidad Compras */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('unidadCompras')}
              >
                <label className="filter-label">Id o Nombre de Unidad Compras Gestión</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedUnidadesCompras.length > 0 
                      ? `${selectedUnidadesCompras.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'unidadCompras' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar unidad compras..." 
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
                          <span>{unidad.id} - {unidad.descripcion || ''}</span>
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
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de Artículos */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('articulos')}
              >
                <label className="filter-label">Id o Artículos</label>
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
                        placeholder="Buscar artículo..." 
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
                          <span>{articulo.id} - {articulo.nombre || articulo.descripcion || ''}</span>
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
        <div className="propuestas-results-info">
          <div className="results-count">
            {t('Cargados')} {propuestas.length} {t('resultados de')} {totalElements} {t('encontrados')}
            <span className="last-update">
              <FaRedo className="update-icon" />
              {t('Última actualización')}: {formatTime(ultimaActualizacion)}
            </span>
          </div>
        </div>
      )}
      
      {/* Sección de resultados */}
      {showResults ? (
        loading ? (
          <div className="loading-indicator">Cargando...</div>
        ) : propuestas.length > 0 ? (
          <PropuestasTable propuestas={propuestas} loading={loading} />
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
    </div>
  );
};

export default Propuestas;