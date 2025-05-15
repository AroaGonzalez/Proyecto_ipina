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

  const tableContainerRef = useRef();
  const [openFilter, setOpenFilter] = useState(null);
  
  const [tiposEvento, setTiposEvento] = useState([]);
  const [estadosEvento, setEstadosEvento] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [gruposLocalizacion, setGruposLocalizacion] = useState([]);
  const [articulos, setArticulos] = useState([]);
  
  const [idEvento, setIdEvento] = useState([]);
  const [nombreEvento, setNombreEvento] = useState('');
  const [idEjecucion, setIdEjecucion] = useState('');
  const [idLocalizacion, setIdLocalizacion] = useState('');

  const [eventoSearch, setEventoSearch] = useState('');
  const [tipoEventoSearch, setTipoEventoSearch] = useState('');
  const [estadoEventoSearch, setEstadoEventoSearch] = useState('');
  const [aliasSearch, setAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [grupoLocalizacionSearch, setGrupoLocalizacionSearch] = useState('');
  const [articuloSearch, setArticuloSearch] = useState('');

  const [selectedTiposEvento, setSelectedTiposEvento] = useState([]);
  const [selectedEstadosEvento, setSelectedEstadosEvento] = useState([]);
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedGruposLocalizacion, setSelectedGruposLocalizacion] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);
  
  const [selectedEventos, setSelectedEventos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          tiposEventoRes,
          estadosEventoRes,
          aliasesRes,
          mercadosRes,
          gruposCadenaRes,
          gruposLocalizacionRes,
          articulosRes,
          eventosRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/eventos/tipos-evento?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/tipos-estado-evento?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/grupos-localizacion?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/ajenos?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/eventos/eventos?idIdioma=${languageId}`)
        ]);
        
        setTiposEvento(tiposEventoRes.data || []);
        setEstadosEvento(estadosEventoRes.data || []);
        setAliases(aliasesRes.data || []);
        setMercados(mercadosRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setGruposLocalizacion(gruposLocalizacionRes.data || []);
        setArticulos(articulosRes.data || []);
        setEventos(eventosRes.data.content || []);
        
        await fetchEventos();
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
    if (!hasMore || loadingMore || eventos.length >= totalElements) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const params = buildQueryParams(nextPage);
      
      let endpoint = `${BASE_URL}/eventos/filter`;
      
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

  const handleActivateEventos = async () => {
    try {
      const updatedEventos = eventos.map(evento => {
        if (selectedEventos.includes(evento.idEvento)) {
          return {
            ...evento,
            idEstadoEvento: 2, // (ACTIVO)
            descripcionEstadoEvento: 'ACTIVO'
          };
        }
        return evento;
      });
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.put(`${BASE_URL}/eventos/${idEvento}/estado`, {
            idEstadoEvento: 2, // (ACTIVO)
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

  const handleExecuteEventos = async () => {
    try {
      setLoading(true);
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.post(`${BASE_URL}/eventos/${idEvento}/ejecutar`, {
            idIdioma: languageId
          })
        )
      );
      
      await fetchEventos();
      
      setSelectedEventos([]);
      setSelectAll(false);
      
      console.log('Eventos ejecutados correctamente');
      
    } catch (error) {
      console.error('Error al ejecutar eventos:', error);
      setError('Error al ejecutar los eventos');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePauseEventos = async () => {
    try {
      const updatedEventos = eventos.map(evento => {
        if (selectedEventos.includes(evento.idEvento)) {
          return {
            ...evento,
            idEstadoEvento: 1,
            descripcionEstadoEvento: 'PAUSADO'
          };
        }
        return evento;
      });
      
      await Promise.all(
        selectedEventos.map(idEvento => 
          axios.put(`${BASE_URL}/eventos/${idEvento}/estado`, {
            idEstadoEvento: 1,
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
  
  const buildQueryParams = (page = 0) => {
    const params = {
      page: page,
      size: tamañoPagina,
      idIdioma: languageId,
    };
    
    if (idEvento.length > 0) {
        params.idsEvento = idEvento.join(',');
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
    if (selectedArticulos.length > 0) {
        console.log('Filtrando por artículos:', selectedArticulos);
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
        setEventos([]);
        localStorage.removeItem('eventos-cache');
        
        const params = buildQueryParams();
        let endpoint = `${BASE_URL}/eventos/filter`;
        
        console.log('Enviando parámetros de búsqueda:', params);
        
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

    const renderEventoDropdownItems = (items, selectedItems, searchTerm) => {
      const filteredItems = items.filter(item => {
        if (!item) return false;
        
        const nombreStr = normalizeText(String(item.nombreEvento || '')).toLowerCase();
        const idStr = String(item.idEvento || '');
        const search = searchTerm.toLowerCase().trim();
        
        return nombreStr.includes(search) || idStr.includes(search);
      });
        
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
              key={item.idEvento} 
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                handleFilterSelect('idEvento', item.idEvento);
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedItems.includes(item.idEvento)}
                readOnly
              />
              <span>{`${item.idEvento} - ${normalizeText(item.nombreEvento || '')}`}</span>
            </div>
          ))}
        </>
      );
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
        case 'idEvento':
          setIdEvento(prev => 
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
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderEstadoEvento = (estadoId, estadoDescripcion) => {
    let className = 'estado-evento';
    
    switch (estadoId) {
      case 1:
        className += ' pausado';
        break;
      case 2:
        className += ' activo';
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

  const handleNuevoEvento = () => {
    navigate('/nuevo-evento');
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
          axios.put(`${BASE_URL}/eventos/${idEvento}/estado`, {
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
          {t('No se encontraron resultados')}
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
            <span>{`${item.id} - ${normalizeText(item.nombreAlias || item.descripcion || item.nombre || '')}`}</span>
          </div>
        ))}
      </>
    );
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
                <span className="filter-label">{t('Id o Nombre Evento')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {idEvento.length > 0 
                      ? t('{{count}} seleccionados', { count: idEvento.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'idEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar evento...")}
                        value={eventoSearch}
                        onChange={(e) => setEventoSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      </div>
                      <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {renderEventoDropdownItems(eventos, idEvento, eventoSearch)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoEvento')}
              >
                <span className="filter-label">{t('Id o Tipo de Evento')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedTiposEvento.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedTiposEvento.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'tipoEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar tipo de evento...")}
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
                <span className="filter-label">{t('Id o Estado de Evento')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosEvento.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedEstadosEvento.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoEvento' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar estado de evento...")}
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
                placeholder={t("Id Ejecución")}
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
                <span className="filter-label">{t('Id o Nombre de Alias')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedAliases.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedAliases.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'alias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar alias...")}
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
                <span className="filter-label">{t('Id o Mercado')}</span>
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
                <span className="filter-label">{t('Id o Grupo Cadena (T6)')}</span>
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
                placeholder={t("Id Localización")}
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
                <span className="filter-label">{t('Id o Grupo de Localizaciones')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGruposLocalizacion.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedGruposLocalizacion.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'grupoLocalizacion' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar grupo localización...")}
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
                <span className="filter-label">{t('Id o Artículos')}</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedArticulos.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedArticulos.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'articulo' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar artículo...")}
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
          {t('Cargados {{count}} resultados de {{total}} encontrados', {
            count: eventos.length,
            total: totalElements
          })}
          <span className="last-update">
            <FaRedo className="update-icon" />
            {t('Última actualización')}: {formatTime(ultimaActualizacion)}
          </span>
        </div>
      </div>
      
      {selectedEventos.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            {t('Seleccionados {{count}} resultados de {{total}} encontrados', {
              count: selectedEventos.length,
              total: totalElements
            })}
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
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 2 || 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
                onClick={handleActivateEventos}
                disabled={selectedEventos.some(id => 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 2 || 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
                >
                <FaPlay className="action-icon" /> {t('ACTIVAR')}
                </button>

                <button 
                className={`action-button pause-button ${selectedEventos.some(id => 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 1 || 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3) ? 'disabled' : ''}`} 
                onClick={handlePauseEventos}
                disabled={selectedEventos.some(id => 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 1 || 
                    eventos.find(evento => evento.idEvento === id)?.idEstadoEvento === 3)}
                >
                <FaPause className="action-icon" /> {t('PAUSAR')}
            </button>
            <button 
              className={`action-button execute-button ${selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento !== 2) ? 'disabled' : ''}`} 
              onClick={handleExecuteEventos}
              disabled={selectedEventos.some(id => 
                eventos.find(evento => evento.idEvento === id)?.idEstadoEvento !== 2)}
            >
              <FaPlay className="action-icon" /> {t('EJECUTAR')}
            </button>
          </div>
        </div>
      )}
      
      <div className="eventos-table-container" ref={tableContainerRef} key={`eventos-table-${selectedMercados.join('-')}`}>
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
              <th className="fecha-alta-column">{t('FECHA ALTA')}</th>
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
                  <td>{normalizeText(evento.nombreEvento)}</td>
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
                  <td>{normalizeText(evento.mercados ? (
                    Array.isArray(evento.mercados) ? evento.mercados.join(', ') : evento.mercados
                  ) : '-')}</td>
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