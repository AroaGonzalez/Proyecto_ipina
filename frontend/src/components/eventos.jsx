import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaRedo, FaSearch, FaFilter, FaDownload, FaEdit, FaTrash, FaPause, FaPlay } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/eventos.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Eventos = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);
  const [tamañoPagina] = useState(50);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [hasMore, setHasMore] = useState(true);
  const [showNewEventMenu, setShowNewEventMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('eventos'); // 'eventos' or 'ejecuciones'

  const tableContainerRef = useRef();
  const [openFilter, setOpenFilter] = useState(null);
  
  // Filter source data
  const [tiposEvento, setTiposEvento] = useState([]);
  const [estadosEvento, setEstadosEvento] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [gruposLocalizacion, setGruposLocalizacion] = useState([]);
  const [articulos, setArticulos] = useState([]);
  
  // Filter input values
  const [idEvento, setIdEvento] = useState('');
  const [nombreEvento, setNombreEvento] = useState('');
  const [idTipoEvento, setIdTipoEvento] = useState('');
  const [idEstadoEvento, setIdEstadoEvento] = useState('');
  const [idEjecucion, setIdEjecucion] = useState('');
  const [idAlias, setIdAlias] = useState('');
  const [idMercado, setIdMercado] = useState('');
  const [idGrupoCadena, setIdGrupoCadena] = useState('');
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idGrupoLocalizacion, setIdGrupoLocalizacion] = useState('');
  const [idArticulo, setIdArticulo] = useState('');

  // Search terms for dropdowns
  const [eventoSearch, setEventoSearch] = useState('');
  const [tipoEventoSearch, setTipoEventoSearch] = useState('');
  const [estadoEventoSearch, setEstadoEventoSearch] = useState('');
  const [aliasSearch, setAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [grupoLocalizacionSearch, setGrupoLocalizacionSearch] = useState('');
  const [articuloSearch, setArticuloSearch] = useState('');

  // Selected filters
  const [selectedTiposEvento, setSelectedTiposEvento] = useState([]);
  const [selectedEstadosEvento, setSelectedEstadosEvento] = useState([]);
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedGruposLocalizacion, setSelectedGruposLocalizacion] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);
  
  // UI state
  const [selectedEventos, setSelectedEventos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
       
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
    if (!loading && !loadingMore && hasMore) {
      const container = tableContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
        if (
          container.scrollHeight - container.scrollTop <= container.clientHeight * 1.2 &&
          hasMore && 
          !loadingMore
        ) {
          loadMoreEventos();
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, loadingMore, hasMore, eventos]);
  
  const loadMoreEventos = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const params = buildQueryParams(nextPage);
      
      let endpoint = `${BASE_URL}/api/eventos/filter`;
      if (activeTab === 'ejecuciones') {
        endpoint = `${BASE_URL}/api/eventos/ejecuciones/filter`;
      }
      
      const response = await axios.get(endpoint, { params });
      
      const newEventos = response.data.content || [];
      
      if (newEventos.length === 0 || newEventos.length < tamañoPagina) {
        setHasMore(false);
      }
      
      setEventos(prevEventos => [...prevEventos, ...newEventos]);
      setPaginaActual(nextPage);
      
    } catch (error) {
      console.error('Error al cargar más eventos:', error);
      setError('Error al cargar más eventos');
    } finally {
      setLoadingMore(false);
    }
  };
  
  const buildQueryParams = (page = 0) => {
    const params = {
      page: page,
      size: tamañoPagina,
      idIdioma: languageId,
    };
    
    if (idEvento) {
      const ids = idEvento.split(/\s+/).filter(id => id.trim() !== '');
      if (ids.length > 0) {
        params.idsEvento = ids;
      }
    }
    
    if (nombreEvento) {
      params.nombreEvento = nombreEvento;
    }
    
    if (selectedTiposEvento.length > 0) {
      params.idsTipoEvento = selectedTiposEvento.join(',');
    }
    
    if (selectedEstadosEvento.length > 0) {
      params.idsEstadoEvento = selectedEstadosEvento.join(',');
    }
    
    if (idEjecucion) {
      params.idEjecucion = idEjecucion;
    }
    
    if (selectedAliases.length > 0) {
      params.idsAlias = selectedAliases.join(',');
    }
    
    if (selectedMercados.length > 0) {
      params.idsMercado = selectedMercados.join(',');
    }
    
    if (selectedGruposCadena.length > 0) {
      params.idsGrupoCadena = selectedGruposCadena.join(',');
    }
    
    if (idLocalizacion) {
      const ids = idLocalizacion.split(/\s+/).filter(id => id.trim() !== '');
      if (ids.length > 0) {
        params.idsLocalizacion = ids;
      }
    }
    
    if (selectedGruposLocalizacion.length > 0) {
      params.idsGrupoLocalizacion = selectedGruposLocalizacion.join(',');
    }
    
    if (selectedArticulos.length > 0) {
      params.idsArticulo = selectedArticulos.join(',');
    }
    
    return params;
  };
  
  const fetchEventos = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaginaActual(0);
      setHasMore(true);
      
      const params = buildQueryParams();
      
      let endpoint = `${BASE_URL}/api/eventos/filter`;
      if (activeTab === 'ejecuciones') {
        endpoint = `${BASE_URL}/api/eventos/ejecuciones/filter`;
      }
      
      const response = await axios.get(endpoint, { params });
      
      setEventos(response.data.content || []);
      setTotalElements(response.data.totalElements || 0);
      setUltimaActualizacion(new Date());
      
      if (
        response.data.content.length === 0 || 
        response.data.content.length < tamañoPagina || 
        response.data.content.length === response.data.totalElements
      ) {
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setError('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedEventos(eventos.map(evento => evento.idEvento));
    } else {
      setSelectedEventos([]);
    }
  };
  
  const handleSelectEvento = (idEvento) => {
    setSelectedEventos(prev => {
      if (prev.includes(idEvento)) {
        return prev.filter(id => id !== idEvento);
      } else {
        return [...prev, idEvento];
      }
    });
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'tipoEvento':
        setSelectedTiposEvento(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'estadoEvento':
        setSelectedEstadosEvento(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'alias':
        setSelectedAliases(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
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
      case 'grupoLocalizacion':
        setSelectedGruposLocalizacion(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'articulo':
        setSelectedArticulos(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };
  
  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };
  
  const handleSearch = () => {
    setPaginaActual(0);
    fetchEventos();
  };
  
  const handleClearFilters = () => {
    setIdEvento('');
    setNombreEvento('');
    setSelectedTiposEvento([]);
    setSelectedEstadosEvento([]);
    setIdEjecucion('');
    setSelectedAliases([]);
    setSelectedMercados([]);
    setSelectedGruposCadena([]);
    setIdLocalizacion('');
    setSelectedGruposLocalizacion([]);
    setSelectedArticulos([]);
    setPaginaActual(0);
    fetchEventos();
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderEstadoEvento = (estadoId, estadoDescripcion) => {
    let className = 'estado-evento';
    
    switch (estadoId) {
      case 1:
        className += ' activo';
        break;
      case 2:
        className += ' pausado';
        break;
      case 3:
        className += ' eliminado';
        break;
      default:
        break;
    }
    
    return <span className={className}>{estadoDescripcion}</span>;
  };

  const renderTipoEvento = (tipoId, tipoDescripcion) => {
    let className = 'tipo-evento';
    
    switch (tipoId) {
      case 1:
        className += ' manual';
        break;
      case 2:
        className += ' automatico';
        break;
      default:
        break;
    }
    
    return <span className={className}>{tipoDescripcion}</span>;
  };
  
  const renderTipoTarea = (tipoId, tipoDescripcion) => {
    let className = 'tipo-tarea';
    
    switch (tipoId) {
      case 1:
        className += ' distribucion';
        break;
      case 2:
        className += ' recuento';
        break;
      default:
        break;
    }
    
    return <span className={className}>{tipoDescripcion}</span>;
  };
  
  const filterBySearch = (items, searchTerm, field = null) => {
    if (!searchTerm || searchTerm.trim() === '') return items;
    
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    
    return items.filter(item => {
      const searchField = field ? item[field] : (item.descripcion || item.nombre);
      const searchFieldStr = String(searchField || '').toLowerCase();
      const idString = String(item.id);
      
      return searchFieldStr.includes(normalizedSearchTerm) || 
        idString.includes(normalizedSearchTerm);
    });
  };
  
  const handleNuevoEvento = () => {
    setShowNewEventMenu(!showNewEventMenu);
  };

  const handleNuevoEventoManual = () => {
    setShowNewEventMenu(false);
    navigate('/crear-evento/manual');
  };
  
  const handleNuevoEventoAutomatico = () => {
    setShowNewEventMenu(false);
    navigate('/crear-evento/automatico');
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleDeleteEventos = async () => {
    try {
      const updatedEventos = eventos.map(evento => {
        if (selectedEventos.includes(evento.idEvento)) {
          return {
            ...evento,
            idEstadoEvento: 3,
            descripcionEstadoEvento: 'ELIMINADO'
          };
        }
        return evento;
      });
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.put(`${BASE_URL}/api/eventos/${idEvento}/estado`, {
            idEstadoEvento: 3,
            idIdioma: languageId
          })
        )
      );
      
      setEventos(updatedEventos);
      setSelectedEventos([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al eliminar eventos:', error);
    }
  };
  
  const handleActivateEventos = async () => {
    try {
      const updatedEventos = eventos.map(evento => {
        if (selectedEventos.includes(evento.idEvento)) {
          return {
            ...evento,
            idEstadoEvento: 1,
            descripcionEstadoEvento: 'ACTIVO'
          };
        }
        return evento;
      });
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.put(`${BASE_URL}/api/eventos/${idEvento}/estado`, {
            idEstadoEvento: 1,
            idIdioma: languageId
          })
        )
      );
      
      setEventos(updatedEventos);
      setSelectedEventos([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al activar eventos:', error);
    }
  };
  
  const handlePauseEventos = async () => {
    try {
      const updatedEventos = eventos.map(evento => {
        if (selectedEventos.includes(evento.idEvento)) {
          return {
            ...evento,
            idEstadoEvento: 2,
            descripcionEstadoEvento: 'PAUSADO'
          };
        }
        return evento;
      });
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.put(`${BASE_URL}/api/eventos/${idEvento}/estado`, {
            idEstadoEvento: 2,
            idIdioma: languageId
          })
        )
      );
      
      setEventos(updatedEventos);
      setSelectedEventos([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al pausar eventos:', error);
    }
  };
  
  const handleEditEvento = () => {
    if (selectedEventos.length === 1) {
      const idEvento = selectedEventos[0];
      navigate(`/editar-evento/${idEvento}`);
    } else {
      alert('Por favor, seleccione un único evento para editar');
    }
  };
  
  const renderDropdownItems = (items, selectedItems, filterType, searchTerm) => {
    const filteredItems = filterBySearch(items, searchTerm);
    
    if (filteredItems.length === 0) {
      return (
        <div className="dropdown-item no-results">
          No se encontraron resultados
        </div>
      );
    }
    
    return (
      <>
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className="dropdown-item"
            onClick={(e) => {
              e.stopPropagation();
              handleFilterSelect(filterType, item.id);
            }}
          >
            <input 
              type="checkbox" 
              checked={selectedItems.includes(item.id)}
              readOnly
            />
            <span>{`${item.id} - ${item.descripcion || ''}`}</span>
          </div>
        ))}
      </>
    );
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPaginaActual(0);
    setSelectedEventos([]);
    setSelectAll(false);
    fetchEventos();
  };
  
  if (error) {
    return (
      <div className="eventos-error">
        <span>{error}</span>
        <button onClick={fetchEventos} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="eventos-container">
      <div className="eventos-header">
        <h1 className="eventos-title">{t('EVENTOS')}</h1>
        <div className="eventos-actions">
          <button 
            className="btn-ocultar-filtros"
            onClick={handleToggleFilters}
          >
            <FaFilter /> {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
          </button>
          <button className="btn-nuevo-evento" onClick={handleNuevoEvento}>
            {t('NUEVO EVENTO')}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('idEvento')}
              >
                <span className="filter-label">Id o Nombre Evento</span>
                <div className="filter-value">
                  <input
                    type="text"
                    placeholder="Id o Nombre Evento"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    className="filter-input"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <FaChevronDown className="dropdown-arrow" />
                </div>
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoEvento')}
              >
                <span className="filter-label">Id o Tipo de Evento</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedTiposEvento.length > 0 
                      ? `${selectedTiposEvento.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'tipoEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar tipo de evento..." 
                        value={tipoEventoSearch}
                        onChange={(e) => setTipoEventoSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(tiposEvento, selectedTiposEvento, 'tipoEvento', tipoEventoSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('estadoEvento')}
              >
                <span className="filter-label">Id o Estado de Evento</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosEvento.length > 0 
                      ? `${selectedEstadosEvento.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estado de evento..." 
                        value={estadoEventoSearch}
                        onChange={(e) => setEstadoEventoSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(estadosEvento, selectedEstadosEvento, 'estadoEvento', estadoEventoSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <input
                type="text"
                placeholder="Id Ejecución"
                value={idEjecucion}
                onChange={(e) => setIdEjecucion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('alias')}
              >
                <span className="filter-label">Id o Nombre de Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedAliases.length > 0 
                      ? `${selectedAliases.length} seleccionados` 
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
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(aliases, selectedAliases, 'alias', aliasSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('mercado')}
              >
                <span className="filter-label">Id o Mercado</span>
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
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(mercados, selectedMercados, 'mercado', mercadoSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="filters-row">
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('grupoCadena')}
              >
                <span className="filter-label">Id o Grupo Cadena (T6)</span>
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
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                      {renderDropdownItems(gruposCadena, selectedGruposCadena, 'grupoCadena', grupoCadenaSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <input 
                type="text" 
                placeholder="Id Localización"
                value={idLocalizacion}
                onChange={(e) => setIdLocalizacion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('grupoLocalizacion')}
              >
                <span className="filter-label">Id o Grupo de Localizaciones</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGruposLocalizacion.length > 0 
                      ? `${selectedGruposLocalizacion.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'grupoLocalizacion' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar grupo localización..." 
                        value={grupoLocalizacionSearch}
                        onChange={(e) => setGrupoLocalizacionSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(gruposLocalizacion, selectedGruposLocalizacion, 'grupoLocalizacion', grupoLocalizacionSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('articulo')}
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
                {openFilter === 'articulo' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar artículo..." 
                        value={articuloSearch}
                        onChange={(e) => setArticuloSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderDropdownItems(articulos, selectedArticulos, 'articulo', articuloSearch)}
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
                <span>{t('BUSCAR')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="eventos-results-info">
        <div className="results-count">
          {t('Cargados')} {eventos.length} {t('resultados de')} {totalElements} {t('encontrados')}
          <span className="last-update">
            <FaRedo className="update-icon" />
            {t('Última actualización')}: {formatTime(ultimaActualizacion)}
          </span>
        </div>
      </div>
      
      {selectedEventos.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            {t('Seleccionados')} {selectedEventos.length} {t('resultados de')} {totalElements} {t('encontrados')}
          </div>
          <div className="selection-actions">
            <button 
              className={`action-button edit-button ${selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
              onClick={handleEditEvento}
              disabled={selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
            >
              <FaEdit />
            </button>
            <button 
              className={`action-button delete-button ${selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
              onClick={handleDeleteEventos}
              disabled={selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
            >
              <FaTrash />
            </button>
            <button 
              className={`action-button activate-button ${selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 1 || 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
              onClick={handleActivateEventos}
              disabled={selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 1 || 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
            >
              <FaPlay className="action-icon" /> {t('ACTIVAR')}
            </button>
            <button 
              className={`action-button pause-button ${selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 2 || 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
              onClick={handlePauseEventos}
              disabled={selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 2 || 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
            >
              <FaPause className="action-icon" /> {t('PAUSAR')}
            </button>
          </div>
        </div>
      )}
      
      <div className="eventos-table-container" ref={tableContainerRef}>
        <table className="eventos-table">
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
              <th className="id-column">{t('ID EVENTO')}</th>
              <th className="nombre-column">{t('EVENTO')}</th>
              <th className="tipo-column">{t('TIPO DE EVENTO')}</th>
              <th className="estado-column">{t('ESTADO DEL EVENTO')}</th>
              <th className="tipo-tarea-column">{t('TIPO DE TAREA')}</th>
              <th className="tareas-column">{t('TAREAS ASOCIADAS')}</th>
              <th className="mercados-column">{t('MERCADOS')}</th>
              <th className="cadenas-column">{t('CADENAS')}</th>
              <th className="fecha-alta-column">{t('FECHA DE ALTA')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && eventos.length === 0 ? (
              <tr>
                <td colSpan="14" className="loading-cell">
                  {t('Cargando eventos...')}
                </td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan="14" className="empty-cell">
                  {t('No se encontraron eventos con los filtros aplicados')}
                </td>
              </tr>
            ) : (
              eventos.map((evento) => (
                <tr 
                  key={evento.idEvento}
                  className={selectedEventos.includes(evento.idEvento) ? 'selected-row' : ''}
                >
                  <td className="checkbox-column">
                    <div className="checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedEventos.includes(evento.idEvento)}
                        onChange={() => handleSelectEvento(evento.idEvento)}
                        id={`evento-${evento.idEvento}`}
                      />
                    </div>
                  </td>
                  <td>{evento.idEvento}</td>
                  <td>{evento.nombreEvento}</td>
                  <td>{renderTipoEvento(evento.idTipoEvento, evento.descripcionTipoEvento)}</td>
                  <td>{renderEstadoEvento(evento.idEstadoEvento, evento.descripcionEstadoEvento)}</td>
                  <td>{renderTipoTarea(evento.idTipoTarea, evento.descripcionTipoTarea)}</td>
                  <td>
                    {evento.tareasAsociadas ? (
                      <div className="tareas-icon">
                        <span className="count">{evento.tareasAsociadas}</span>
                      </div>
                    ) : '-'}
                  </td>                 
                  <td>{evento.mercados ? (
                    Array.isArray(evento.mercados) ? evento.mercados.join(', ') : evento.mercados
                  ) : '-'}</td>
                  <td>{evento.cadenas ? (
                    Array.isArray(evento.cadenas) ? evento.cadenas.join(', ') : evento.cadenas
                  ) : '-'}</td>
                  <td>{evento.fechaAlta}</td>
                </tr>
              ))
            )}
            {loadingMore && (
              <tr>
                <td colSpan="14" className="loading-cell">
                  {t('Cargando más eventos...')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Eventos;