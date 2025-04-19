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
  
  const observer = useRef();
  const tableContainerRef = useRef();
  
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
  
  const [aliasSearch, setAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [cadenaSearch, setCadenaSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [grupoLocalizacionSearch, setGrupoLocalizacionSearch] = useState('');
  const [ajenoSearch, setAjenoSearch] = useState('');
  
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
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
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
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
  
  const handleDropdownToggle = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  const handleSearch = () => {
    setPaginaActual(0);
    fetchTareas();
  };
  
  const handleClearFilters = () => {
    setIdTarea('');
    setIdTipoTarea('');
    setIdTipoEstadoTarea('');
    setIdAlias('');
    setIdMercado('');
    setIdCadena('');
    setIdGrupoCadena('');
    setIdLocalizacion('');
    setIdGrupoLocalizacion('');
    setIdAjeno('');
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
  
  const filterBySearch = (items, searchTerm, field) => {
    if (!searchTerm) return items;
    
    return items.filter(item => {
      const searchValue = field ? item[field] : item.descripcion || item.nombre;
      const idString = item.id.toString();
      return searchValue?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             idString.includes(searchTerm.toLowerCase());
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
      
      // Enviar cambios a la API
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
      
      // Enviar cambios a la API
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
      
      // Enviar cambios a la API
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
    // Placeholder for edit functionality
    // This will be implemented later
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
        <div className="tareas-filters">
          <div className="filter-row">
            <div className="filter-field">
              <input 
                type="text" 
                placeholder={t('Id Tarea')}
                value={idTarea}
                onChange={(e) => setIdTarea(e.target.value)}
              />
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('tipoTarea')}>
                <div className="selected-value">
                  {idTipoTarea 
                    ? `${idTipoTarea} - ${tiposTarea.find(tipo => tipo.id === parseInt(idTipoTarea))?.descripcion}`
                    : t('Tipo de Tarea')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'tipoTarea' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdTipoTarea('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {tiposTarea.map(tipo => (
                      <div 
                        key={tipo.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdTipoTarea(tipo.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${tipo.id} - ${tipo.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('estadoTarea')}>
                <div className="selected-value">
                  {idTipoEstadoTarea 
                    ? `${idTipoEstadoTarea} - ${tiposEstadoTarea.find(estado => estado.id === parseInt(idTipoEstadoTarea))?.descripcion}`
                    : t('Estado de la tarea')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'estadoTarea' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdTipoEstadoTarea('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {tiposEstadoTarea.map(estado => (
                      <div 
                        key={estado.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdTipoEstadoTarea(estado.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${estado.id} - ${estado.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('alias')}>
                <div className="selected-value">
                  {idAlias 
                    ? `${idAlias} - ${aliases.find(alias => alias.id === parseInt(idAlias))?.descripcion || ''}`
                    : t('Id o Nombre de Alias')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'alias' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar alias...')}
                      value={aliasSearch}
                      onChange={(e) => setAliasSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdAlias('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(aliases, aliasSearch, 'descripcion').map(alias => (
                      <div 
                        key={alias.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdAlias(alias.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${alias.id} - ${alias.descripcion || ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('mercado')}>
                <div className="selected-value">
                  {idMercado 
                    ? `${idMercado} - ${mercados.find(mercado => mercado.id === parseInt(idMercado))?.descripcion}`
                    : t('Id o Mercado')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'mercado' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar mercado...')}
                      value={mercadoSearch}
                      onChange={(e) => setMercadoSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdMercado('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(mercados, mercadoSearch, 'descripcion').map(mercado => (
                      <div 
                        key={mercado.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdMercado(mercado.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${mercado.id} - ${mercado.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('cadena')}>
                <div className="selected-value">
                  {idCadena 
                    ? `${idCadena} - ${cadenas.find(cadena => cadena.id === parseInt(idCadena))?.descripcion}`
                    : t('Id o Cadena')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'cadena' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar cadena...')}
                      value={cadenaSearch}
                      onChange={(e) => setCadenaSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdCadena('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(cadenas, cadenaSearch, 'descripcion').map(cadena => (
                      <div 
                        key={cadena.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdCadena(cadena.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${cadena.id} - ${cadena.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-row">
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('grupoCadena')}>
                <div className="selected-value">
                  {idGrupoCadena 
                    ? `${idGrupoCadena} - ${gruposCadena.find(grupo => grupo.id === parseInt(idGrupoCadena))?.descripcion}`
                    : t('Id o Grupo Cadena (T6)')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'grupoCadena' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar grupo cadena...')}
                      value={grupoCadenaSearch}
                      onChange={(e) => setGrupoCadenaSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdGrupoCadena('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(gruposCadena, grupoCadenaSearch, 'descripcion').map(grupo => (
                      <div 
                        key={grupo.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdGrupoCadena(grupo.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${grupo.id} - ${grupo.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <input 
                type="text" 
                placeholder={t('Id Localización')}
                value={idLocalizacion}
                onChange={(e) => setIdLocalizacion(e.target.value)}
              />
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('grupoLocalizacion')}>
                <div className="selected-value">
                  {idGrupoLocalizacion 
                    ? `${idGrupoLocalizacion} - ${gruposLocalizacion.find(grupo => grupo.id === parseInt(idGrupoLocalizacion))?.descripcion}`
                    : t('Id o Grupo de Localizaciones')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'grupoLocalizacion' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar grupo de localizaciones...')}
                      value={grupoLocalizacionSearch}
                      onChange={(e) => setGrupoLocalizacionSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdGrupoLocalizacion('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(gruposLocalizacion, grupoLocalizacionSearch, 'descripcion').map(grupo => (
                      <div 
                        key={grupo.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdGrupoLocalizacion(grupo.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${grupo.id} - ${grupo.descripcion}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-field">
              <div className="select-container" onClick={() => handleDropdownToggle('ajeno')}>
                <div className="selected-value">
                  {idAjeno 
                    ? `${idAjeno} - ${ajenos.find(ajeno => ajeno.id === parseInt(idAjeno))?.nombre || ''}`
                    : t('Id o Artículos')}
                </div>
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {openDropdown === 'ajeno' && (
                <div className="dropdown-menu" ref={dropdownRef}>
                  <div className="dropdown-search">
                    <FaSearch className="search-icon" />
                    <input 
                      type="text" 
                      placeholder={t('Buscar artículo...')}
                      value={ajenoSearch}
                      onChange={(e) => setAjenoSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="dropdown-items">
                    <div 
                      className="dropdown-item seleccionar-todo"
                      onClick={() => {
                        setIdAjeno('');
                        setOpenDropdown(null);
                      }}
                    >
                      {t('Seleccionar todo')}
                    </div>
                    {filterBySearch(ajenos, ajenoSearch, 'nombre').map(ajeno => (
                      <div 
                        key={ajeno.id} 
                        className="dropdown-item"
                        onClick={() => {
                          setIdAjeno(ajeno.id);
                          setOpenDropdown(null);
                        }}
                      >
                        {`${ajeno.id} - ${ajeno.nombre || ''}`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="filter-buttons">
              <button 
                className="btn-limpiar"
                onClick={handleClearFilters}
              >
                <FaTimes /> {t('LIMPIAR')}
              </button>
              <button 
                className="btn-buscar"
                onClick={handleSearch}
              >
                {t('BUSCAR')}
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