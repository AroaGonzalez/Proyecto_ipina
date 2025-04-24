import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaRedo, FaSearch, FaFilter, FaDownload, FaEdit, FaTrash, FaPause, FaPlay } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/tareas.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Tareas = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);
  const [tamañoPagina] = useState(50);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [hasMore, setHasMore] = useState(true);
  
  const tableContainerRef = useRef();
  const dropdownRef = useRef(null);
  const [openFilter, setOpenFilter] = useState(null);
  
  const [tiposTarea, setTiposTarea] = useState([]);
  const [tiposEstadoTarea, setTiposEstadoTarea] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [ajenos, setAjenos] = useState([]);
  const [gruposLocalizacion, setGruposLocalizacion] = useState([]);
  
  const [idTarea, setIdTarea] = useState('');
  const [idTipoTarea, setIdTipoTarea] = useState('');
  const [idTipoEstadoTarea, setIdTipoEstadoTarea] = useState('');
  const [idAlias, setIdAlias] = useState('');
  const [idMercado, setIdMercado] = useState('');
  const [idCadena, setIdCadena] = useState('');
  const [idGrupoCadena, setIdGrupoCadena] = useState('');
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idGrupoLocalizacion, setIdGrupoLocalizacion] = useState('');
  const [idAjeno, setIdAjeno] = useState('');

  const [tipoTareaSearch, setTipoTareaSearch] = useState('');
  const [estadoTareaSearch, setEstadoTareaSearch] = useState('');
  const [aliasSearch, setAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [cadenaSearch, setCadenaSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [grupoLocalizacionSearch, setGrupoLocalizacionSearch] = useState('');
  const [ajenoSearch, setAjenoSearch] = useState('');

  const [selectedTiposTarea, setSelectedTiposTarea] = useState([]);
  const [selectedEstadosTarea, setSelectedEstadosTarea] = useState([]);
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedCadenas, setSelectedCadenas] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
  const [selectedGruposLocalizacion, setSelectedGruposLocalizacion] = useState([]);
  const [selectedAjenos, setSelectedAjenos] = useState([]);
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedTareas, setSelectedTareas] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          tiposTareaRes,
          tiposEstadoTareaRes,
          aliasesRes,
          mercadosRes,
          cadenasRes,
          gruposCadenaRes,
          ajenosRes,
          gruposLocalizacionRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/api/tareas/tipos-tarea?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/tipos-estado-tarea?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/cadenas?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/ajenos?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/grupos-localizacion?idIdioma=${languageId}`)
        ]);
        
        setTiposTarea(tiposTareaRes.data || []);
        setTiposEstadoTarea(tiposEstadoTareaRes.data || []);
        setAliases(aliasesRes.data || []);
        setMercados(mercadosRes.data || []);
        setCadenas(cadenasRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setAjenos(ajenosRes.data || []);
        setGruposLocalizacion(gruposLocalizacionRes.data || []);
        
        await fetchTareas();
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
          loadMoreTareas();
        }
      };

      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, loadingMore, hasMore, tareas]);
  
  const loadMoreTareas = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const params = {
        page: nextPage,
        size: tamañoPagina,
        idIdioma: languageId,
      };
      
      if (idTarea) {
        const ids = idTarea.split(/\s+/).filter(id => id.trim() !== '');
        if (ids.length > 0) {
          params.idsTarea = ids;
        }
      }
      
      if (idTipoTarea) params.idsTipoTarea = idTipoTarea;
      if (idTipoEstadoTarea) params.idsTipoEstadoTarea = idTipoEstadoTarea;
      if (idAlias) params.idsAlias = idAlias;
      if (idMercado) params.idsMercado = idMercado;
      if (idCadena) params.idsCadena = idCadena;
      if (idGrupoCadena) params.idsGrupoCadena = idGrupoCadena;
      
      if (idLocalizacion) {
        const ids = idLocalizacion.split(/\s+/).filter(id => id.trim() !== '');
        if (ids.length > 0) {
          params.idsLocalizacion = ids;
        }
      }
      
      if (idGrupoLocalizacion) params.idsGrupoLocalizacion = idGrupoLocalizacion;
      if (idAjeno) params.idsAjeno = idAjeno;
      
      const response = await axios.get(`${BASE_URL}/api/tareas/filter`, { params });
      
      const newTareas = response.data.content || [];
      
      if (newTareas.length === 0 || newTareas.length < tamañoPagina) {
        setHasMore(false);
      }
      
      setTareas(prevTareas => [...prevTareas, ...newTareas]);
      setPaginaActual(nextPage);
      
    } catch (error) {
      console.error('Error al cargar más tareas:', error);
      setError('Error al cargar más tareas');
    } finally {
      setLoadingMore(false);
    }
  };
  
  const fetchTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaginaActual(0);
      setHasMore(true);
      
      const params = {
        page: 0,
        size: tamañoPagina,
        idIdioma: languageId,
      };
      
      if (idTarea) {
        const ids = idTarea.split(/\s+/).filter(id => id.trim() !== '');
        if (ids.length > 0) {
          params.idsTarea = ids;
        }
      }
      
      if (selectedTiposTarea.length > 0) {
        params.idsTipoTarea = selectedTiposTarea.join(',');
      }
      
      if (selectedEstadosTarea.length > 0) {
        params.idsTipoEstadoTarea = selectedEstadosTarea.join(',');
      }
      
      if (selectedAliases.length > 0) {
        params.idsAlias = selectedAliases.join(',');
      }
      
      if (selectedMercados.length > 0) {
        params.idsMercado = selectedMercados.join(',');
      }
      
      if (selectedCadenas.length > 0) {
        params.idsCadena = selectedCadenas.join(',');
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
      
      if (selectedAjenos.length > 0) {
        params.idsAjeno = selectedAjenos.join(',');
      }
      
      const response = await axios.get(`${BASE_URL}/api/tareas/filter`, { params });
      
      setTareas(response.data.content || []);
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
      console.error('Error al cargar tareas:', error);
      setError('Error al cargar las tareas');
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
      setSelectedTareas(tareas.map(tarea => tarea.idTarea));
    } else {
      setSelectedTareas([]);
    }
  };
  
  const handleSelectTarea = (idTarea) => {
    setSelectedTareas(prev => {
      if (prev.includes(idTarea)) {
        return prev.filter(id => id !== idTarea);
      } else {
        return [...prev, idTarea];
      }
    });
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'tipoTarea':
        setSelectedTiposTarea(prev => 
          prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
        );
        break;
      case 'estadoTarea':
        setSelectedEstadosTarea(prev => 
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
      case 'cadena':
        setSelectedCadenas(prev => 
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
      case 'ajeno':
        setSelectedAjenos(prev => 
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
    fetchTareas();
  };
  
  const handleClearFilters = () => {
    setIdTarea('');
    setSelectedTiposTarea([]);
    setSelectedEstadosTarea([]);
    setSelectedAliases([]);
    setSelectedMercados([]);
    setSelectedCadenas([]);
    setSelectedGruposCadena([]);
    setIdLocalizacion('');
    setSelectedGruposLocalizacion([]);
    setSelectedAjenos([]);
    setPaginaActual(0);
    fetchTareas();
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  const renderEstadoTarea = (estadoId, estadoDescripcion) => {
    let className = 'estado-tarea';
    
    switch (estadoId) {
      case 1:
        className += ' activa';
        break;
      case 2:
        className += ' pausada';
        break;
      case 3:
        className += ' eliminada';
        break;
      default:
        break;
    }
    
    return <span className={className}>{estadoDescripcion}</span>;
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
  
  const handleNuevaTarea = () => {
    navigate('/crear-tarea');
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleDeleteTareas = async () => {
    try {
      const updatedTareas = tareas.map(tarea => {
        if (selectedTareas.includes(tarea.idTarea)) {
          return {
            ...tarea,
            idTipoEstadoTarea: 3,
            descripcionTipoEstadoTarea: 'ELIMINADA'
          };
        }
        return tarea;
      });
      
      await Promise.all(
        selectedTareas.map(idTarea => 
          axios.put(`${BASE_URL}/api/tareas/${idTarea}/estado`, {
            idTipoEstadoTarea: 3,
            idIdioma: languageId
          })
        )
      );
      
      setTareas(updatedTareas);
      setSelectedTareas([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
    }
  };
  
  const handleActivateTareas = async () => {
    try {
      const updatedTareas = tareas.map(tarea => {
        if (selectedTareas.includes(tarea.idTarea)) {
          return {
            ...tarea,
            idTipoEstadoTarea: 1,
            descripcionTipoEstadoTarea: 'ACTIVA'
          };
        }
        return tarea;
      });
      
      await Promise.all(
        selectedTareas.map(idTarea => 
          axios.put(`${BASE_URL}/api/tareas/${idTarea}/estado`, {
            idTipoEstadoTarea: 1,
            idIdioma: languageId
          })
        )
      );
      
      setTareas(updatedTareas);
      setSelectedTareas([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al activar tareas:', error);
    }
  };
  
  const handlePauseTareas = async () => {
    try {
      const updatedTareas = tareas.map(tarea => {
        if (selectedTareas.includes(tarea.idTarea)) {
          return {
            ...tarea,
            idTipoEstadoTarea: 2,
            descripcionTipoEstadoTarea: 'PAUSADA'
          };
        }
        return tarea;
      });
      
      await Promise.all(
        selectedTareas.map(idTarea => 
          axios.put(`${BASE_URL}/api/tareas/${idTarea}/estado`, {
            idTipoEstadoTarea: 2,
            idIdioma: languageId
          })
        )
      );
      
      setTareas(updatedTareas);
      setSelectedTareas([]);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error al pausar tareas:', error);
    }
  };
  
  const handleEditTarea = () => {
    if (selectedTareas.length === 1) {
      const idTarea = selectedTareas[0];
      navigate(`/editar-tarea/${idTarea}`);
    } else {
      alert('Por favor, seleccione una única tarea para editar');
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
  
  if (error) {
    return (
      <div className="tareas-error">
        <span>{error}</span>
        <button onClick={fetchTareas} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="tareas-container">
    
      <div className="tareas-header">
        <h1 className="tareas-title">{t('TAREAS')}</h1>
        <div className="tareas-actions">
          <button 
            className="btn-ocultar-filtros"
            onClick={handleToggleFilters}
          >
            <FaFilter /> {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
          </button>
          <div className="dropdown">
            <button className="btn-nueva-tarea" onClick={handleNuevaTarea}>
              {t('NUEVA TAREA')} <FaChevronDown />
            </button>
          </div>
        </div>
      </div>
      
      {showFilters && (
  <div className="filters-section">
    <div className="filters-row">
      <div className="filter-item">
        <input
          type="text"
          placeholder="Id Tarea"
          value={idTarea}
          onChange={(e) => setIdTarea(e.target.value)}
          className="filter-input"
        />
      </div>
      
      <div className="filter-item">
        <div 
          className="filter-dropdown"
          onClick={() => toggleFilter('tipoTarea')}
        >
          <span className="filter-label">Tipo de Tarea</span>
          <div className="filter-value">
            <span className="filter-placeholder">
              {selectedTiposTarea.length > 0 
                ? `${selectedTiposTarea.length} seleccionados` 
                : 'Seleccionar'}
            </span>
            <FaChevronDown className="dropdown-arrow" />
          </div>
          {openFilter === 'tipoTarea' && (
            <div className="filter-dropdown-content">
              <div className="dropdown-search">
                <input 
                  type="text" 
                  placeholder="Buscar tipo de tarea..." 
                  value={tipoTareaSearch}
                  onChange={(e) => setTipoTareaSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-items-container">
                <div className="dropdown-items">
                  {filterBySearch(tiposTarea, tipoTareaSearch).map((tipo) => (
                    <div 
                      key={tipo.id} 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterSelect('tipoTarea', tipo.id);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedTiposTarea.includes(tipo.id)}
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
                    if (selectedTiposTarea.length === tiposTarea.length) {
                      setSelectedTiposTarea([]);
                    } else {
                      setSelectedTiposTarea(tiposTarea.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedTiposTarea.length === tiposTarea.length && tiposTarea.length > 0}
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
          onClick={() => toggleFilter('estadoTarea')}
        >
          <span className="filter-label">Estado de la tarea</span>
          <div className="filter-value">
            <span className="filter-placeholder">
              {selectedEstadosTarea.length > 0 
                ? `${selectedEstadosTarea.length} seleccionados` 
                : 'Seleccionar'}
            </span>
            <FaChevronDown className="dropdown-arrow" />
          </div>
          {openFilter === 'estadoTarea' && (
            <div className="filter-dropdown-content">
              <div className="dropdown-search">
                <input 
                  type="text" 
                  placeholder="Buscar estado de tarea..." 
                  value={estadoTareaSearch}
                  onChange={(e) => setEstadoTareaSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-items-container">
                <div className="dropdown-items">
                  {filterBySearch(tiposEstadoTarea, estadoTareaSearch).map((estado) => (
                    <div 
                      key={estado.id} 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterSelect('estadoTarea', estado.id);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedEstadosTarea.includes(estado.id)}
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
                    if (selectedEstadosTarea.length === tiposEstadoTarea.length) {
                      setSelectedEstadosTarea([]);
                    } else {
                      setSelectedEstadosTarea(tiposEstadoTarea.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedEstadosTarea.length === tiposEstadoTarea.length && tiposEstadoTarea.length > 0}
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
                        checked={selectedAliases.includes(alias.id)}
                        readOnly
                      />
                      <span>{alias.id} - {alias.descripcion || alias.nombre || ''}</span>
                    </div>
                  ))}
                </div>
                <div 
                  className="dropdown-item select-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedAliases.length === aliases.length) {
                      setSelectedAliases([]);
                    } else {
                      setSelectedAliases(aliases.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedAliases.length === aliases.length && aliases.length > 0}
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
                      <span>{mercado.id} - {mercado.descripcion}</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
    
    <div className="filters-row">
      <div className="filter-item">
        <div 
          className="filter-dropdown"
          onClick={() => toggleFilter('cadena')}
        >
          <span className="filter-label">Id o Cadena</span>
          <div className="filter-value">
            <span className="filter-placeholder">
              {selectedCadenas.length > 0 
                ? `${selectedCadenas.length} seleccionados` 
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
              <div className="dropdown-items-container">
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
                        checked={selectedCadenas.includes(cadena.id)}
                        readOnly
                      />
                      <span>{cadena.id} - {cadena.descripcion}</span>
                    </div>
                  ))}
                </div>
                <div 
                  className="dropdown-item select-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedCadenas.length === cadenas.length) {
                      setSelectedCadenas([]);
                    } else {
                      setSelectedCadenas(cadenas.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedCadenas.length === cadenas.length && cadenas.length > 0}
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
                  {filterBySearch(gruposLocalizacion, grupoLocalizacionSearch).map((grupo) => (
                    <div 
                      key={grupo.id} 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterSelect('grupoLocalizacion', grupo.id);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedGruposLocalizacion.includes(grupo.id)}
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
                    if (selectedGruposLocalizacion.length === gruposLocalizacion.length) {
                      setSelectedGruposLocalizacion([]);
                    } else {
                      setSelectedGruposLocalizacion(gruposLocalizacion.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedGruposLocalizacion.length === gruposLocalizacion.length && gruposLocalizacion.length > 0}
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
          onClick={() => toggleFilter('ajeno')}
        >
          <span className="filter-label">Id o Artículos</span>
          <div className="filter-value">
            <span className="filter-placeholder">
              {selectedAjenos.length > 0 
                ? `${selectedAjenos.length} seleccionados` 
                : 'Seleccionar'}
            </span>
            <FaChevronDown className="dropdown-arrow" />
          </div>
          {openFilter === 'ajeno' && (
            <div className="filter-dropdown-content">
              <div className="dropdown-search">
                <input 
                  type="text" 
                  placeholder="Buscar artículo..." 
                  value={ajenoSearch}
                  onChange={(e) => setAjenoSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-items-container">
                <div className="dropdown-items">
                  {filterBySearch(ajenos, ajenoSearch).map((ajeno) => (
                    <div 
                      key={ajeno.id} 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilterSelect('ajeno', ajeno.id);
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedAjenos.includes(ajeno.id)}
                        readOnly
                      />
                      <span>{ajeno.id} - {ajeno.nombre || ajeno.descripcion || ''}</span>
                    </div>
                  ))}
                </div>
                <div 
                  className="dropdown-item select-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedAjenos.length === ajenos.length) {
                      setSelectedAjenos([]);
                    } else {
                      setSelectedAjenos(ajenos.map(item => item.id));
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedAjenos.length === ajenos.length && ajenos.length > 0}
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
          <span>{t('BUSCAR')}</span>
        </button>
      </div>
    </div>
  </div>
)}
      
      <div className="tareas-results-info">
        <div className="results-count">
          {t('Cargados')} {tareas.length} {t('resultados de')} {totalElements} {t('encontrados')}
          <span className="last-update">
            <FaRedo className="update-icon" />
            {t('Última actualización')}: {formatTime(ultimaActualizacion)}
          </span>
        </div>
      </div>
      
      {selectedTareas.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            {t('Seleccionados')} {selectedTareas.length} {t('resultados de')} {totalElements} {t('encontrados')}
          </div>
          <div className="selection-actions">
            <button 
              className={`action-button edit-button ${selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3) ? 'disabled' : ''}`} 
              onClick={handleEditTarea}
              disabled={selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3)}
            >
              <FaEdit />
            </button>
            <button 
              className={`action-button delete-button ${selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3) ? 'disabled' : ''}`} 
              onClick={handleDeleteTareas}
              disabled={selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3)}
            >
              <FaTrash />
            </button>
            <button 
              className={`action-button activate-button ${selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 1 || 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3) ? 'disabled' : ''}`} 
              onClick={handleActivateTareas}
              disabled={selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 1 || 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3)}
            >
              <FaPlay className="action-icon" /> {t('ACTIVAR')}
            </button>
            <button 
              className={`action-button pause-button ${selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 2 || 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3) ? 'disabled' : ''}`} 
              onClick={handlePauseTareas}
              disabled={selectedTareas.some(id => 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 2 || 
                tareas.find(tarea => tarea.idTarea === id)?.idTipoEstadoTarea === 3)}
            >
              <FaPause className="action-icon" /> {t('PAUSAR')}
            </button>
          </div>
        </div>
      )}
      
      <div className="tareas-table-container" ref={tableContainerRef}>
        <table className="tareas-table">
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
              <th className="id-column">{t('ID TAREA')}</th>
              <th className="nombre-column">{t('TAREA')}</th>
              <th className="tipo-column">{t('TIPO DE TAREA')}</th>
              <th className="estado-column">{t('ESTADO DE LA TAREA')}</th>
              <th className="alias-column">{t('ALIAS')}</th>
              <th className="fecha-column">{t('FECHA DE ALTA')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && tareas.length === 0 ? (
              <tr>
                <td colSpan="7" className="loading-cell">
                  {t('Cargando tareas...')}
                </td>
              </tr>
            ) : tareas.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">
                  {t('No se encontraron tareas con los filtros aplicados')}
                </td>
              </tr>
            ) : (
              tareas.map((tarea, index) => (
                <tr 
                  key={tarea.idTarea}
                  className={selectedTareas.includes(tarea.idTarea) ? 'selected-row' : ''}
                >
                  <td className="checkbox-column">
                    <div className="checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedTareas.includes(tarea.idTarea)}
                        onChange={() => handleSelectTarea(tarea.idTarea)}
                        id={`tarea-${tarea.idTarea}`}
                      />
                    </div>
                  </td>
                  <td>{tarea.idTarea}</td>
                  <td>{tarea.nombreTarea}</td>
                  <td>{renderTipoTarea(tarea.idTipoTarea, tarea.descripcionTipoTarea)}</td>
                  <td>{renderEstadoTarea(tarea.idTipoEstadoTarea, tarea.descripcionTipoEstadoTarea)}</td>
                  <td>{tarea.alias && tarea.alias.length > 0 ? tarea.alias.join(', ') : t('Sin estado')}</td>
                  <td>{tarea.fechaAlta}</td>
                </tr>
              ))
            )}
            {loadingMore && (
              <tr>
                <td colSpan="7" className="loading-cell">
                  {t('Cargando más tareas...')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tareas;