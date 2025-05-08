import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaFilter, FaCalendarAlt, FaUndo, FaRedo } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/recuentos.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Recuentos = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);

  // Estados para filtros
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idEjecucion, setIdEjecucion] = useState('');
  const [idAlias, setIdAlias] = useState('');
  const [inicioFechaCreacion, setInicioFechaCreacion] = useState('');
  const [finFechaCreacion, setFinFechaCreacion] = useState('');
  
  // Estados para búsquedas en filtros dropdown
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [nombreEventoSearch, setNombreEventoSearch] = useState('');
  const [estadoLineaSearch, setEstadoLineaSearch] = useState('');
  const [tipoAliasSearch, setTipoAliasSearch] = useState('');
  const [nombreAliasSearch, setNombreAliasSearch] = useState('');
  
  // Estado para controlar el dropdown abierto
  const [openFilter, setOpenFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  // Estado para los resultados y carga
  const [recuentos, setRecuentos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [totalElements, setTotalElements] = useState(0);

  // Refs
  const dropdownRef = useRef(null);
  const tableContainerRef = useRef();

  // Datos para filtros
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estadosLinea, setEstadosLinea] = useState([]);
  const [tiposAlias, setTiposAlias] = useState([]);
  const [nombreAlias, setNombreAlias] = useState([]);
  
  // Selecciones para filtros múltiples
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedEventos, setSelectedEventos] = useState([]);
  const [selectedEstadosLinea, setSelectedEstadosLinea] = useState([]);
  const [selectedTiposAlias, setSelectedTiposAlias] = useState([]);
  const [selectedNombreAlias, setSelectedNombreAlias] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          mercadosRes,
          gruposCadenaRes,
          eventosRes,
          estadosLineaRes,
          tiposAliasRes,
          nombreAliasRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/eventos/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/eventos?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/recuento/estados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/alias?idIdioma=${languageId}`)
        ]);
        
        setMercados(mercadosRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setEventos(eventosRes.data || []);
        setEstadosLinea(estadosLineaRes.data || []);
        setTiposAlias(tiposAliasRes.data || []);
        setNombreAlias(nombreAliasRes.data || []);
        
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
      
      const filter = {
        idAlias: idAlias ? idAlias.split(/\s+/).filter(id => id.trim() !== '') : [],
        idLocalizacion: idLocalizacion ? idLocalizacion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idEjecucion: idEjecucion ? idEjecucion.split(/\s+/).filter(id => id.trim() !== '') : [],
        idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
        idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
        idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
        idsEstadoLinea: selectedEstadosLinea.length > 0 ? selectedEstadosLinea : [],
        idsTipoAlias: selectedTiposAlias.length > 0 ? selectedTiposAlias : [],
        fechaCreacionDesde: inicioFechaCreacion || null,
        fechaCreacionHasta: finFechaCreacion || null
      };
      
      // Aquí se haría la llamada al endpoint de recuentos (a implementar)
      // const response = await axios.post(`${BASE_URL}/recuentos/filter?idIdioma=${languageId}`, { filter });
      
      // Simulamos datos para la demo
      const mockResponse = {
        data: {
          recuentos: [],
          page: {
            total: 0
          }
        }
      };
      
      setRecuentos(mockResponse.data.recuentos || []);
      setTotalElements(mockResponse.data.page.total || 0);
      setUltimaActualizacion(new Date());
      setShowResults(true);
      
    } catch (error) {
      console.error('Error al buscar recuentos:', error);
      setError('Error al buscar recuentos');
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
    setIdAlias('');
    setSelectedEstadosLinea([]);
    setSelectedTiposAlias([]);
    setInicioFechaCreacion('');
    setFinFechaCreacion('');
    setShowResults(false);
    setRecuentos([]);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
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
      case 'estadoLinea':
        setSelectedEstadosLinea(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'tipoAlias':
        setSelectedTiposAlias(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'nombreAlias':
        setSelectedNombreAlias(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="recuentos-error">
        <span>{error}</span>
        <button onClick={clearFilters} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }

  return (
    <div className="recuentos-container">
      <div className="recuentos-header">
        <h1 className="recuentos-title">RECUENTOS</h1>
        <div className="filter-toggle">
          <button className="filter-button" onClick={toggleFilters}>
            <FaFilter /> {showFilters ? 'OCULTAR FILTROS' : 'MOSTRAR FILTROS'}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section" ref={dropdownRef}>
          <div className="filters-row">
            {/* Filtro de Mercado */}
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
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de Grupo Cadena */}
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
                          <span>{grupo.id} - {normalizeText(grupo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro de Id Localización */}
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
            
            {/* Filtro de Id o Nombre de Alias */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('nombreAlias')}
              >
                <label className="filter-label">Id o Nombre de Alias</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedNombreAlias.length > 0 
                      ? `${selectedNombreAlias.length} seleccionados` 
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
                        value={nombreAliasSearch}
                        onChange={(e) => setNombreAliasSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                      {filterBySearch(nombreAlias, nombreAliasSearch).map((alias) => (
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
                            checked={selectedNombreAlias.includes(alias.id)}
                            readOnly
                          />
                          <span>{alias.id} - {normalizeText(alias.descripcion || alias.nombre)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="filters-row">
            {/* Filtro de Tipo de Alias */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoAlias')}
              >
                <label className="filter-label">Tipo de Alias</label>
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
                            checked={selectedTiposAlias.includes(tipo.id)}
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
            
            {/* Filtro de Estado de Línea */}
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estadoLinea')}
              >
                <label className="filter-label">Id o Estado de Línea</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosLinea.length > 0 
                      ? `${selectedEstadosLinea.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoLinea' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estado..." 
                        value={estadoLineaSearch}
                        onChange={(e) => setEstadoLineaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items">
                    {filterBySearch(estadosLinea, estadoLineaSearch).map((estado) => (
                        <div 
                          key={estado.id} 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('estadoLinea', estado.id);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedEstadosLinea.includes(estado.id)}
                            readOnly
                          />
                          <span>{estado.id} - {estado.descripcion}</span>
                        </div>
                      ))}
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
                  </div>
                )}
              </div>
            </div>
            
            {/* Filtro Id Ejecución */}
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
          </div>
          
          <div className="filters-row">
            {/* Fecha de Inicio */}
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
            
            {/* Fecha Fin */}
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
            
            {/* Botón de búsqueda */}
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
      
      {/* Resultados o placeholder de búsqueda */}
      {loading ? (
        <div className="loading-indicator">Cargando...</div>
      ) : showResults && recuentos.length > 0 ? (
        <div className="recuentos-results">
          {/* Aquí iría la tabla de resultados */}
        </div>
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

export default Recuentos;