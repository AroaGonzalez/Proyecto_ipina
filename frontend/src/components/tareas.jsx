import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaRedo, FaSearch, FaFilter, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/tareas.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Tareas = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);
  const [tamañoPagina, setTamañoPagina] = useState(50);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  
  // Datos para los filtros
  const [tiposTarea, setTiposTarea] = useState([]);
  const [tiposEstadoTarea, setTiposEstadoTarea] = useState([]);
  const [aliases, setAliases] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [ajenos, setAjenos] = useState([]);
  
  // Estados para los filtros
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
  
  // Estados para los dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  
  // Estados para las selecciones en tabla
  const [selectedTareas, setSelectedTareas] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Obtener datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          tiposTareaRes,
          tiposEstadoTareaRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/api/tareas/tipos-tarea?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/api/tareas/tipos-estado-tarea?idIdioma=${languageId}`),
        ]);
        
        setTiposTarea(tiposTareaRes.data || []);
        setTiposEstadoTarea(tiposEstadoTareaRes.data || []);
        
        // Cargar las tareas iniciales
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
  
  // Función para cargar las tareas según los filtros
  const fetchTareas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: paginaActual,
        size: tamañoPagina,
        idIdioma: languageId,
      };
      
      // Añadir filtros si están definidos
      if (idTarea) params.idsTarea = idTarea;
      if (idTipoTarea) params.idsTipoTarea = idTipoTarea;
      if (idTipoEstadoTarea) params.idsTipoEstadoTarea = idTipoEstadoTarea;
      if (idAlias) params.idsAlias = idAlias;
      if (idMercado) params.idsMercado = idMercado;
      if (idCadena) params.idsCadena = idCadena;
      if (idGrupoCadena) params.idsGrupoCadena = idGrupoCadena;
      if (idLocalizacion) params.idsLocalizacion = idLocalizacion;
      if (idGrupoLocalizacion) params.idsGrupoLocalizacion = idGrupoLocalizacion;
      if (idAjeno) params.idsAjeno = idAjeno;
      
      const response = await axios.get(`${BASE_URL}/api/tareas/filter`, { params });
      
      setTareas(response.data.content || []);
      setTotalElements(response.data.totalElements || 0);
      setUltimaActualizacion(new Date());
      
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar el cierre de dropdowns al hacer clic fuera
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
  
  // Manejar selección de todas las tareas
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedTareas(tareas.map(tarea => tarea.idTarea));
    } else {
      setSelectedTareas([]);
    }
  };
  
  // Manejar selección individual de tarea
  const handleSelectTarea = (idTarea) => {
    setSelectedTareas(prev => {
      if (prev.includes(idTarea)) {
        return prev.filter(id => id !== idTarea);
      } else {
        return [...prev, idTarea];
      }
    });
  };
  
  // Manejar apertura de dropdown
  const handleDropdownToggle = (dropdown) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };
  
  // Manejar búsqueda
  const handleSearch = () => {
    setPaginaActual(0);
    fetchTareas();
  };
  
  // Limpiar filtros
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
  
  // Formatear tiempo para última actualización
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  // Renderizar etiqueta de estado con color
  const renderEstadoTarea = (estadoId, estadoDescripcion) => {
    let className = 'estado-tarea';
    
    switch (estadoId) {
      case 1: // ACTIVA
        className += ' activa';
        break;
      case 2: // PAUSADA
        className += ' pausada';
        break;
      case 3: // ELIMINADA
        className += ' eliminada';
        break;
      default:
        break;
    }
    
    return <span className={className}>{estadoDescripcion}</span>;
  };

  // Renderizar etiqueta de tipo tarea con color
  const renderTipoTarea = (tipoId, tipoDescripcion) => {
    let className = 'tipo-tarea';
    
    switch (tipoId) {
      case 1: // RECUENTO
        className += ' recuento';
        break;
      case 2: // DISTRIBUCIÓN
        className += ' distribucion';
        break;
      default:
        break;
    }
    
    return <span className={className}>{tipoDescripcion}</span>;
  };
  
  // Crear nueva tarea
  const handleNuevaTarea = () => {
    // Implementar navegación a la página de creación de tareas
    navigate('/crear-tarea');
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
            onClick={() => console.log('Ocultar/Mostrar filtros')}
          >
            <FaFilter /> {t('OCULTAR FILTROS')}
          </button>
          <div className="dropdown">
            <button className="btn-nueva-tarea" onClick={handleNuevaTarea}>
              {t('NUEVA TAREA')} <FaChevronDown />
            </button>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
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
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('tipoTarea')}>
              <div className="selected-value">
                {idTipoTarea 
                  ? tiposTarea.find(tipo => tipo.id === parseInt(idTipoTarea))?.descripcion 
                  : t('Tipo de Tarea')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'tipoTarea' && (
              <div className="dropdown-menu">
                {tiposTarea.map(tipo => (
                  <div 
                    key={tipo.id} 
                    className="dropdown-item"
                    onClick={() => {
                      setIdTipoTarea(tipo.id);
                      setOpenDropdown(null);
                    }}
                  >
                    {tipo.descripcion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('estadoTarea')}>
              <div className="selected-value">
                {idTipoEstadoTarea 
                  ? tiposEstadoTarea.find(estado => estado.id === parseInt(idTipoEstadoTarea))?.descripcion 
                  : t('Estado de la tarea')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'estadoTarea' && (
              <div className="dropdown-menu">
                {tiposEstadoTarea.map(estado => (
                  <div 
                    key={estado.id} 
                    className="dropdown-item"
                    onClick={() => {
                      setIdTipoEstadoTarea(estado.id);
                      setOpenDropdown(null);
                    }}
                  >
                    {estado.descripcion}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('alias')}>
              <div className="selected-value">
                {idAlias 
                  ? aliases.find(alias => alias.id === parseInt(idAlias))?.descripcion 
                  : t('Id o Nombre de Alias')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'alias' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar alias...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {aliases.map(alias => (
                    <div 
                      key={alias.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIdAlias(alias.id);
                        setOpenDropdown(null);
                      }}
                    >
                      {alias.descripcion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('mercado')}>
              <div className="selected-value">
                {idMercado 
                  ? mercados.find(mercado => mercado.id === parseInt(idMercado))?.descripcion 
                  : t('Id o Mercado')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'mercado' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar mercado...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {mercados.map(mercado => (
                    <div 
                      key={mercado.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIdMercado(mercado.id);
                        setOpenDropdown(null);
                      }}
                    >
                      {mercado.descripcion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('cadena')}>
              <div className="selected-value">
                {idCadena 
                  ? cadenas.find(cadena => cadena.id === parseInt(idCadena))?.descripcion 
                  : t('Id o Cadena')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'cadena' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar cadena...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {cadenas.map(cadena => (
                    <div 
                      key={cadena.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIdCadena(cadena.id);
                        setOpenDropdown(null);
                      }}
                    >
                      {cadena.descripcion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('grupoCadena')}>
              <div className="selected-value">
                {idGrupoCadena 
                  ? gruposCadena.find(grupo => grupo.id === parseInt(idGrupoCadena))?.descripcion 
                  : t('Id o Grupo Cadena (T6)')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'grupoCadena' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar grupo cadena...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {gruposCadena.map(grupo => (
                    <div 
                      key={grupo.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIdGrupoCadena(grupo.id);
                        setOpenDropdown(null);
                      }}
                    >
                      {grupo.descripcion}
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
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('grupoLocalizacion')}>
              <div className="selected-value">
                {t('Id o Grupo de Localizaciones')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'grupoLocalizacion' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar grupo de localizaciones...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {/* Lista de grupos de localizaciones */}
                </div>
              </div>
            )}
          </div>
          
          <div className="filter-field" ref={dropdownRef}>
            <div className="select-container" onClick={() => handleDropdownToggle('ajeno')}>
              <div className="selected-value">
                {idAjeno 
                  ? ajenos.find(ajeno => ajeno.id === parseInt(idAjeno))?.nombre 
                  : t('Id o Artículos')}
              </div>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {openDropdown === 'ajeno' && (
              <div className="dropdown-menu">
                <div className="dropdown-search">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder={t('Buscar artículo...')}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="dropdown-items">
                  {ajenos.map(ajeno => (
                    <div 
                      key={ajeno.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setIdAjeno(ajeno.id);
                        setOpenDropdown(null);
                      }}
                    >
                      {ajeno.nombre}
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
      
      <div className="tareas-results-info">
        <div className="results-count">
          {t('Cargados')} {tareas.length} {t('resultados de')} {totalElements} {t('encontrados')}
          <span className="last-update">
            <FaRedo className="update-icon" />
            {t('Última actualización')}: {formatTime(ultimaActualizacion)}
          </span>
        </div>
      </div>
      
      <div className="tareas-table-container">
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
                  <label htmlFor="select-all"></label>
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
            {loading ? (
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
              tareas.map(tarea => (
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
                      <label htmlFor={`tarea-${tarea.idTarea}`}></label>
                    </div>
                  </td>
                  <td>{tarea.idTarea}</td>
                  <td>{tarea.nombreTarea}</td>
                  <td>{renderTipoTarea(tarea.idTipoTarea, tarea.descripcionTipoTarea)}</td>
                  <td>{renderEstadoTarea(tarea.idTipoEstadoTarea, tarea.descripcionTipoEstadoTarea)}</td>
                  <td>{tarea.alias.join(', ')}</td>
                  <td>{tarea.fechaAlta}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tareas;