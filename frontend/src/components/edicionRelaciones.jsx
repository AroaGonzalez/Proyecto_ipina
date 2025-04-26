import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSyncAlt, FaSearch, FaChevronDown, FaPencilAlt, FaTrash, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/parametrizacionAlias.css';
import '../styles/edicionRelaciones.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const EdicionRelaciones = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const idsAliasSelected = location.state?.selectedItems || [];
  const originalFilters = location.state?.filters || {};
  
  const [relaciones, setRelaciones] = useState([]);
  const [filteredRelaciones, setFilteredRelaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [openFilter, setOpenFilter] = useState(null);
  const tableContainerRef = useRef(null);
  const tableEndRef = useRef(null);

  // Filtros
  const [mercados, setMercados] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [alias, setAlias] = useState([]);
  const [unidadesCompra, setUnidadesCompra] = useState([]);
  
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedCadenas, setSelectedCadenas] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState(idsAliasSelected || []);
  const [selectedUnidadesCompra, setSelectedUnidadesCompra] = useState([]);
  const [selectedLocalizaciones, setSelectedLocalizaciones] = useState([]);
  
  // Estados para los textos de búsqueda en cada filtro
  const [mercadoSearchText, setMercadoSearchText] = useState('');
  const [cadenaSearchText, setCadenaSearchText] = useState('');
  const [aliasSearchText, setAliasSearchText] = useState('');
  const [unidadCompraSearchText, setUnidadCompraSearchText] = useState('');
  const [localizacionSearchText, setLocalizacionSearchText] = useState('');

  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
    fetchRelaciones();
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

  const fetchFilterOptions = async () => {
    try {
      const [mercadosRes, cadenasRes, aliasRes, unidadesCompraRes, relacionesUnidadesRes] = await Promise.all([
        axios.get(`${BASE_URL}/relaciones/mercados?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/cadenas`),
        axios.get(`${BASE_URL}/relaciones/lista-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/maestros/unidades-compra`),
        axios.get(`${BASE_URL}/relaciones/unidades-compra`)
      ]);
      
      setMercados(mercadosRes.data);
      setCadenas(cadenasRes.data);
      setAlias(aliasRes.data);
      setUnidadesCompra(unidadesCompraRes.data);
        setRelacionesUnidades(relacionesUnidadesRes.data);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      setError(t('Error al cargar opciones de filtro'));
    }
  };
    const handleEditRelations = () => {
        if (selectedItems.length === 0) {
        alert(t('Por favor, seleccione al menos un alias para editar relaciones'));
        return;
        }
        
        // Navegar a la página de edición de relaciones con los IDs de alias seleccionados y filtros actuales
        const currentFilters = {
        tipoAlias: selectedTiposAlias,
        estadoAlias: selectedEstadosAlias,
        estacionalidad: selectedEstacionalidades,
        articulos: selectedArticulos
        };
        
        navigate('/edicion-relaciones', { 
        state: { 
            selectedItems: selectedItems,
            filters: currentFilters
        } 
        });
    };

  const fetchRelaciones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filter = {
        idIdioma: languageId,
        idsMercado: selectedMercados.length > 0 ? selectedMercados : undefined,
        idsCadena: selectedCadenas.length > 0 ? selectedCadenas : undefined,
        idsAlias: selectedAlias.length > 0 ? selectedAlias : undefined,
        idsUnidadComprasGestora: selectedUnidadesCompra.length > 0 ? selectedUnidadesCompra : undefined,
        idsLocalizacion: selectedLocalizaciones.length > 0 ? selectedLocalizaciones : undefined
      };
      
      const payload = {
        filter,
        idsAliasSelected: selectedAlias.length > 0 ? selectedAlias : idsAliasSelected,
        processAllAlias: false,
        aliasTableOriginalFilter: originalFilters,
        page: {
          number: currentPage,
          size: pageSize
        }
      };
      
      console.log('Consultando relaciones con payload:', payload);
      
      const response = await axios.post(`${BASE_URL}/relaciones/filter`, payload);
      
      if (response.data) {
        setRelaciones(response.data.relaciones || []);
        setFilteredRelaciones(response.data.relaciones || []);
        setTotalElements(response.data.page?.total || 0);
      } else {
        setRelaciones([]);
        setFilteredRelaciones([]);
        setTotalElements(0);
      }
    } catch (error) {
      console.error('Error al cargar relaciones:', error);
      setError(t('Error al cargar relaciones'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchRelaciones();
  };

  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'mercado':
        setSelectedMercados(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'cadena':
        setSelectedCadenas(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'alias':
        setSelectedAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'unidadCompra':
        setSelectedUnidadesCompra(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'localizacion':
        setSelectedLocalizaciones(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      default:
        break;
    }
  };

  const handleSearchTextChange = (e, setterFunction) => {
    setterFunction(e.target.value);
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prevSelected => {
      return prevSelected.includes(id)
        ? prevSelected.filter(item => item !== id)
        : [...prevSelected, id];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredRelaciones.map(item => item.idAliasAmbitoAplanado));
    }
    setSelectAll(!selectAll);
  };

  const filteredMercados = mercadoSearchText
    ? mercados.filter(mercado => 
        mercado.id.toString().includes(mercadoSearchText) || 
        mercado.descripcion.toLowerCase().includes(mercadoSearchText.toLowerCase())
      )
    : mercados;

  const filteredCadenas = cadenaSearchText
    ? cadenas.filter(cadena => 
        cadena.id.toString().includes(cadenaSearchText) || 
        cadena.descripcion.toLowerCase().includes(cadenaSearchText.toLowerCase())
      )
    : cadenas;

  const filteredAlias = aliasSearchText
    ? alias.filter(a => 
        a.id.toString().includes(aliasSearchText) || 
        a.descripcion.toLowerCase().includes(aliasSearchText.toLowerCase())
      )
    : alias;

  const filteredUnidadesCompra = unidadCompraSearchText
    ? unidadesCompra.filter(unidad => 
        unidad.id.toString().includes(unidadCompraSearchText) || 
        unidad.descripcion.toLowerCase().includes(unidadCompraSearchText.toLowerCase())
      )
    : unidadesCompra;

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleActivateRelations = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      const selectedRelations = relaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      
      const response = await axios.put(`${BASE_URL}/relaciones/activate`, {
        relaciones: selectedRelations,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        // Actualizar las relaciones localmente
        const updatedRelaciones = relaciones.map(rel => {
          if (selectedItems.includes(rel.idAliasAmbitoAplanado)) {
            return {
              ...rel,
              idTipoEstadoLocalizacionRam: 1,
              descripcionTipoEstadoLocalizacionRam: 'Active',
              fechaHoraFinPausa: null
            };
          }
          return rel;
        });
        
        setRelaciones(updatedRelaciones);
        setFilteredRelaciones(updatedRelaciones);
        setSelectedItems([]);
        setSelectAll(false);
        
        alert(t(`${response.data.updatedCount} relaciones activadas correctamente`));
      }
    } catch (error) {
      console.error('Error al activar relaciones:', error);
      setError(t('Error al activar relaciones'));
    }
  };

  const handlePauseRelations = async () => {
    if (selectedItems.length === 0) return;
    
    // Puedes implementar un modal para seleccionar la fecha de fin de pausa
    const fechaHoraFinPausa = new Date();
    fechaHoraFinPausa.setDate(fechaHoraFinPausa.getDate() + 30); // 30 días por defecto
    
    try {
      const selectedRelations = relaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      
      const response = await axios.put(`${BASE_URL}/relaciones/pause`, {
        relaciones: selectedRelations,
        fechaHoraFinPausa: fechaHoraFinPausa.toISOString(),
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        // Actualizar las relaciones localmente
        const updatedRelaciones = relaciones.map(rel => {
          if (selectedItems.includes(rel.idAliasAmbitoAplanado)) {
            return {
              ...rel,
              idTipoEstadoLocalizacionRam: 2,
              descripcionTipoEstadoLocalizacionRam: 'Pausado',
              fechaHoraFinPausa: fechaHoraFinPausa.toISOString()
            };
          }
          return rel;
        });
        
        setRelaciones(updatedRelaciones);
        setFilteredRelaciones(updatedRelaciones);
        setSelectedItems([]);
        setSelectAll(false);
        
        alert(t(`${response.data.updatedCount} relaciones pausadas correctamente`));
      }
    } catch (error) {
      console.error('Error al pausar relaciones:', error);
      setError(t('Error al pausar relaciones'));
    }
  };

  const handleSave = async () => {
    try {
      // Aquí implementarías la lógica para guardar los cambios en las relaciones
      // Por ejemplo, actualizar las unidades de compra asignadas
      
      const response = await axios.put(`${BASE_URL}/relaciones/update`, {
        relaciones: relaciones,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        setIsModified(false);
        alert(t('Relaciones actualizadas correctamente'));
      }
    } catch (error) {
      console.error('Error al guardar relaciones:', error);
      setError(t('Error al guardar relaciones'));
    }
  };

  const handleCancel = () => {
    if (isModified && !window.confirm(t('¿Está seguro que desea salir sin guardar los cambios?'))) {
      return;
    }
    navigate(-1);
  };

  const updateUnidadCompra = (idAliasAmbitoAplanado, idUnidadComprasGestora) => {
    const updatedRelaciones = relaciones.map(rel => {
      if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
        return {
          ...rel,
          idUnidadComprasGestora,
          nombreUnidadComprasGestora: unidadesCompra.find(u => u.id === idUnidadComprasGestora)?.descripcion || null
        };
      }
      return rel;
    });
    
    setRelaciones(updatedRelaciones);
    setFilteredRelaciones(updatedRelaciones);
    setIsModified(true);
  };

  const estadoClassName = (estado) => {
    if (estado === 'Active' || estado === 'ACTIVO') return 'estado-tag ACTIVO';
    if (estado === 'Pausado' || estado === 'PAUSADO') return 'estado-tag PAUSADO';
    return 'estado-tag';
  };

  const shouldDisableActivarButton = () => {
    if (selectedItems.length === 0) return true;
    
    return selectedItems.every(id => {
      const relacion = relaciones.find(r => r.idAliasAmbitoAplanado === id);
      return relacion && relacion.idTipoEstadoLocalizacionRam === 1;
    });
  };
  
  const shouldDisablePausarButton = () => {
    if (selectedItems.length === 0) return true;
    
    return selectedItems.every(id => {
      const relacion = relaciones.find(r => r.idAliasAmbitoAplanado === id);
      return relacion && relacion.idTipoEstadoLocalizacionRam === 2;
    });
  };

  return (
    <div className="edicion-relaciones-container">
      <div className="header">
        <div className="header-title">
          <button 
            className="back-button"
            onClick={handleCancel}
          >
            <FaArrowLeft />
          </button>
          <h1 className="main-title">{t('EDICIÓN DE RELACIONES')}</h1>
        </div>
        <div className="header-buttons">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>{showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('alias')}
              >
                <span className="filter-label">Id o Nombre de Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedAlias.length > 0 
                      ? `${selectedAlias.length} seleccionados` 
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
                        value={aliasSearchText}
                        onChange={(e) => handleSearchTextChange(e, setAliasSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredAlias.map((item) => (
                          <div 
                            key={item.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('alias', item.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedAlias.includes(item.id)}
                              readOnly
                            />
                            <span>{item.id} - {item.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedAlias.length === alias.length) {
                            setSelectedAlias([]);
                          } else {
                            setSelectedAlias(alias.map(a => a.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedAlias.length === alias.length && alias.length > 0}
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
                        value={mercadoSearchText}
                        onChange={(e) => handleSearchTextChange(e, setMercadoSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredMercados.map((mercado) => (
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
                            setSelectedMercados(mercados.map(m => m.id));
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
                        value={cadenaSearchText}
                        onChange={(e) => handleSearchTextChange(e, setCadenaSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredCadenas.map((cadena) => (
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
                            setSelectedCadenas(cadenas.map(c => c.id));
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
              <div className="filter-input">
                <span className="filter-label">Id Localización</span>
                <input 
                  type="text" 
                  placeholder="Escribe ID localización"
                  value={localizacionSearchText}
                  onChange={(e) => setLocalizacionSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (localizacionSearchText.trim()) {
                        handleFilterSelect('localizacion', parseInt(localizacionSearchText));
                        setLocalizacionSearchText('');
                      }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('unidadCompra')}
              >
                <span className="filter-label">Id o Nombre de Unidad Compras Gestora</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedUnidadesCompra.length > 0 
                      ? `${selectedUnidadesCompra.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'unidadCompra' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar unidad de compra..." 
                        value={unidadCompraSearchText}
                        onChange={(e) => handleSearchTextChange(e, setUnidadCompraSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        <div 
                          className="dropdown-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFilterSelect('unidadCompra', 0);
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedUnidadesCompra.includes(0)}
                            readOnly
                          />
                          <span>0 - Sin unidad de compra</span>
                        </div>
                        {filteredUnidadesCompra.map((unidad) => (
                          <div 
                            key={unidad.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('unidadCompra', unidad.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedUnidadesCompra.includes(unidad.id)}
                              readOnly
                            />
                            <span>{unidad.id} - {unidad.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedUnidadesCompra.length === unidadesCompra.length + 1) {
                            setSelectedUnidadesCompra([]);
                          } else {
                            setSelectedUnidadesCompra([0, ...unidadesCompra.map(u => u.id)]);
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedUnidadesCompra.length === unidadesCompra.length + 1 && unidadesCompra.length > 0}
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

      <div className="results-info">
        <span className="results-count">
          {loading ? t('Cargando...') : 
            t('Cargados {{count}} resultados de {{total}} encontrados', {
              count: relaciones.length,
              total: totalElements
            })}
          {' '}
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </span>
      </div>
      
      {selectedItems.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            <span>
              {`Seleccionados ${selectedItems.length} resultados de ${totalElements} encontrados`}
            </span>
          </div>
          <div className="selection-actions">
            <button 
              className="action-button activate-button" 
              onClick={handleActivateRelations}
              disabled={shouldDisableActivarButton()}
            >
              <span className="action-icon">⚡</span> {t('ACTIVAR')}
            </button>
            <button 
              className="action-button pause-button" 
              onClick={handlePauseRelations}
              disabled={shouldDisablePausarButton()}
            >
              <span className="action-icon">⏸️</span> {t('PAUSAR')}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-container" ref={tableContainerRef}>
        <table className="alias-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  checked={selectAll} 
                  onChange={handleSelectAll} 
                  disabled={relaciones.length === 0}
                />
              </th>
              <th>{t('ID ALIAS')}</th>
              <th>{t('ID LOCALIZ')}</th>
              <th>{t('LOCALIZACIÓN')}</th>
              <th>{t('CADENA')}</th>
              <th>{t('MERCADO')}</th>
              <th>{t('ESTADO RELACIÓN')}</th>
              <th>{t('PAUSADO HASTA')}</th>
              <th>{t('ID/NOMBRE UNIDAD COMPRAS GESTORA')}</th>
              <th>{t('TIENDA PUEDE PEDIR')}</th>
              <th>{t('GLOBAL')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="14" className="loading-cell">
                  {t('Cargando datos...')}
                </td>
              </tr>
            ) : relaciones.length > 0 ? (
              <>
                {relaciones.map((relacion) => (
                  <tr key={relacion.idAliasAmbitoAplanado} className={selectedItems.includes(relacion.idAliasAmbitoAplanado) ? 'selected-row' : ''}>
                    <td className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(relacion.idAliasAmbitoAplanado)} 
                        onChange={() => handleSelectItem(relacion.idAliasAmbitoAplanado)} 
                      />
                    </td>
                    <td>{relacion.idAlias}</td>
                    <td>{relacion.idLocalizacionCompra}</td>
                    <td>{relacion.descripcionLocalizacionCompra}</td>
                    <td>{relacion.descripcionCortaCadena}</td>
                    <td>
                      <div className="mercado-cell">
                        <img 
                          src={`/images/flags/${relacion.codigoIsoMercado?.toLowerCase()}.png`} 
                          alt={relacion.descripcionMercado}
                          className="flag-icon"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <span>{relacion.descripcionMercado}</span>
                      </div>
                    </td>
                    <td>
                      <span className={estadoClassName(relacion.descripcionTipoEstadoLocalizacionRam)}>
                        {relacion.descripcionTipoEstadoLocalizacionRam}
                      </span>
                    </td>
                    <td>
                      {relacion.fechaHoraFinPausa ? 
                        new Date(relacion.fechaHoraFinPausa).toLocaleDateString() : 
                        '-'
                      }
                    </td>
                    <td>
                      <select 
                        value={relacion.idUnidadComprasGestora}
                        onChange={(e) => updateUnidadCompra(
                          relacion.idAliasAmbitoAplanado, 
                          parseInt(e.target.value)
                        )}
                        className="unidad-compra-select"
                      >
                        <option value={0}>Ninguna unidad de compra gestora</option>
                        {unidadesCompra.map(unidad => (
                          <option key={unidad.id} value={unidad.id}>
                            {unidad.descripcion}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={relacion.esSolicitable} 
                        onChange={() => {
                          const updatedRelaciones = relaciones.map(rel => {
                            if (rel.idAliasAmbitoAplanado === relacion.idAliasAmbitoAplanado) {
                              return { ...rel, esSolicitable: !rel.esSolicitable };
                            }
                            return rel;
                          });
                          setRelaciones(updatedRelaciones);
                          setFilteredRelaciones(updatedRelaciones);
                          setIsModified(true);
                        }}
                      />
                    </td>
                    <td className="checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={relacion.idAjenoSeccionGlobal && relacion.idAjenoSeccionGlobal > 0}
                        disabled={true}
                      />
                    </td>
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan="14" className="empty-table-message">
                  {t('No hay datos disponibles')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="footer-buttons">
        <button 
          className="cancel-button"
          onClick={handleCancel}
        >
          {t('CANCELAR')}
        </button>
        <button 
          className="save-button"
          onClick={handleSave}
          disabled={!isModified}
        >
          {t('GUARDAR')}
        </button>
      </div>
    </div>
  );
};

export default EdicionRelaciones;