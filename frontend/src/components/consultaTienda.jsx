import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/consultaTienda.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const CustomSelect = ({ id, options, value, onChange, disabled = false }) => {
  const { t } = useTranslation();  
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const processedOptions = options.map(option => {
    let descripcion = option.descripcion;
    const idPattern = new RegExp(`^${option.id}\\s*-\\s*`);
    if (idPattern.test(descripcion)) {
      descripcion = descripcion.replace(idPattern, '');
    }
   
    return {
      ...option,
      descripcion: descripcion
    };
  });

  const uniqueOptions = processedOptions.reduce((acc, current) => {
    const isDuplicate = acc.find(item => item.id === current.id);
    if (!isDuplicate) {
      acc.push(current);
    }
    return acc;
  }, []);

  const filteredOptions = searchTerm 
    ? uniqueOptions.filter(item => 
      item.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : uniqueOptions;

    const getDisplayValue = () => {
      const { t } = useTranslation();
      
      if (!value || (Array.isArray(value) && value.length === 0)) return t('Seleccionar');

      if (Array.isArray(value)) {
        if (value.length === uniqueOptions.length) return t('Seleccionar todo');
        if (value.length === 1) {
          const selectedOption = uniqueOptions.find(option => option.id.toString() === value[0]);
          return selectedOption ? selectedOption.descripcion : t('Seleccionar');
        }
        return t('{{count}} seleccionados', { count: value.length });
      }

      const selectedOption = uniqueOptions.find(option => option.id.toString() === value);
      return selectedOption ? selectedOption.descripcion : t('Seleccionar');
    };

    const toggleDropdown = () => {
      if (!disabled) {
        setShowDropdown(!showDropdown);
        setSearchTerm('');
      }
    };

    return (
      <div className="select-container-tienda" ref={selectRef}>
        <div 
          className="select-header-tienda"
          onClick={toggleDropdown}
        >
          {getDisplayValue()}
          <span className="select-arrow-tienda">▼</span>
        </div>

        {showDropdown && (
          <div className="select-dropdown-tienda">
            <div className="select-search-tienda">
              <input 
                type="text" 
                placeholder={`Buscar ${id === 'localizacion' ? 'localización' : id}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <FaSearch className="search-icon-tienda" />
            </div>
            <div className="select-options-tienda">
              {filteredOptions.map(option => (
                <div 
                  key={option.id}
                  className="select-option-tienda select-option-multiple-tienda"
                  onClick={(e) => {
                    e.stopPropagation();
            
                    const currentSelections = Array.isArray(value) ? [...value] : (value ? [value] : []);
            
                    const optionId = option.id.toString();
                    const index = currentSelections.indexOf(optionId);
            
                    if (index === -1) {
                      onChange([...currentSelections, optionId]);
                    } else {
                      const newSelections = [...currentSelections];
                      newSelections.splice(index, 1);
                      onChange(newSelections);
                    }
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={Array.isArray(value) ? value.includes(option.id.toString()) : value === option.id.toString()}
                    onChange={(e) => {
                      e.stopPropagation();
                
                      const currentSelections = Array.isArray(value) ? [...value] : 
                      (value ? [value] : []);
                
                      const optionId = option.id.toString();
                      const index = currentSelections.indexOf(optionId);
                
                      if (index === -1) {
                        onChange([...currentSelections, optionId]);
                      } else {
                        const newSelections = [...currentSelections];
                        newSelections.splice(index, 1);
                        onChange(newSelections);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>{option.id} - {option.descripcion}</span>
                </div>
              ))}
              <div className="select-option-tienda select-option-todo-tienda sticky-bottom"
                onClick={() => {
                  if (Array.isArray(value) && value.length === uniqueOptions.length) {
                    onChange([]);
                  } else {
                    const allIds = uniqueOptions.map(opt => opt.id.toString());
                    onChange(allIds);
                  }
                }}
              >
                <input 
                  type="checkbox"
                  checked={Array.isArray(value) && value.length === uniqueOptions.length && uniqueOptions.length > 0}
                  onChange={() => {
                    if (Array.isArray(value) && value.length === uniqueOptions.length) {
                    onChange([]);
                    } else {
                      const allIds = uniqueOptions.map(opt => opt.id.toString());
                      onChange(allIds);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span>{t('Seleccionar todo')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ConsultaTienda = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [gruposLocalizacion, setGruposLocalizacion] = useState([]);

  const [selectedMercado, setSelectedMercado] = useState([]);
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState([]);
  const [selectedCadena, setSelectedCadena] = useState([]);
  const [selectedGrupoLocalizacion, setSelectedGrupoLocalizacion] = useState([]);

  const [filtroLocalizacion, setFiltroLocalizacion] = useState('');
  const tableEndRef = useRef(null);
  const tableContainerRef = useRef(null);
  const [loadingAllItems, setLoadingAllItems] = useState(false);

  const shouldDisableActivarButton = () => {
    if (selectedItems.length === 0) return true;
   
    const hasActive = selectedItems.some(id => {
      const tienda = tiendas.find(t => t.idLocalizacionRam === id);
      return tienda && 
        tienda.descripcionTipoEstadoLocalizacionRam && 
        tienda.descripcionTipoEstadoLocalizacionRam.toLowerCase().includes('activ');
    });
   
    const hasPaused = selectedItems.some(id => {
      const tienda = tiendas.find(t => t.idLocalizacionRam === id);
      return tienda && 
        tienda.descripcionTipoEstadoLocalizacionRam && 
        tienda.descripcionTipoEstadoLocalizacionRam.toLowerCase().includes('pausad');
    });
   
    return (hasActive && hasPaused) || (hasActive && !hasPaused);
  };

  const shouldDisablePausarButton = () => {
    if (selectedItems.length === 0) return true;
   
    const hasActive = selectedItems.some(id => {
      const tienda = tiendas.find(t => t.idLocalizacionRam === id);
      return tienda && 
        tienda.descripcionTipoEstadoLocalizacionRam && 
        tienda.descripcionTipoEstadoLocalizacionRam.toLowerCase().includes('activ');
    });
   
    const hasPaused = selectedItems.some(id => {
      const tienda = tiendas.find(t => t.idLocalizacionRam === id);
      return tienda && 
        tienda.descripcionTipoEstadoLocalizacionRam && 
        tienda.descripcionTipoEstadoLocalizacionRam.toLowerCase().includes('pausad');
    });
   
    return (hasActive && hasPaused) || (!hasActive && hasPaused);
  };

  useEffect(() => {
    fetchFilterOptions();
    fetchTiendas();
  }, [languageId]);

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
        if (!loadingMore && hasMore && scrollTop + clientHeight >= scrollHeight - 100) {
          loadMoreData();
        }
      }
    };

    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (tableContainer) {
        tableContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [loadingMore, hasMore]);

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
   
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      await fetchTiendas(undefined, nextPage, true);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error cargando más datos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const [mercadosRes, gruposCadenaRes, cadenasRes, gruposLocalizacionRes] = await Promise.all([
        axios.get(`${BASE_URL}/tiendas/mercados?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/grupos-cadena?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/cadenas?idIdioma=${languageId}&formatoSelector=true`),
        axios.get(`${BASE_URL}/tiendas/grupos-localizacion?idIdioma=${languageId}&formatoSelector=true`)
      ]);

      const processMercados = [...new Map(
        (mercadosRes.data || [])
          .filter(item => item && item.id !== 'all')
          .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
      ).values()];

      const processGruposCadena = [...new Map(
        (gruposCadenaRes.data || [])
          .filter(item => item && item.id !== 'all')
          .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
      ).values()];

      const processCadenas = [...new Map(
        (cadenasRes.data || [])
          .filter(item => item && item.id !== 'all')
          .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
      ).values()];

      const processgruposLocalizacion = [...new Map(
        (gruposLocalizacionRes.data || [])
          .filter(item => item && item.id !== 'all')
          .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
      ).values()];
     
      setMercados(processMercados);
      setGruposCadena(processGruposCadena);
      setCadenas(processCadenas);
      setGruposLocalizacion(processgruposLocalizacion);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    const fetchCadenas = async () => {
      try {
        if (selectedGrupoCadena && selectedGrupoCadena.length > 0) {
          const grupoCadenaParam = selectedGrupoCadena[0];
          const response = await axios.get(
            `${BASE_URL}/tiendas/cadenas?idGrupoCadena=${grupoCadenaParam}&idIdioma=${languageId}&formatoSelector=true`
          );
         
          const processCadenas = [...new Map(
            (response.data || [])
              .filter(item => item && item.id !== 'all')
              .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
          ).values()];
         
          setCadenas(processCadenas);
        } else {
          const response = await axios.get(
            `${BASE_URL}/tiendas/cadenas?idIdioma=${languageId}&formatoSelector=true`
          );
         
          const processCadenas = [...new Map(
            (response.data || [])
              .filter(item => item && item.id !== 'all')
              .map(item => [item.id, { id: item.id, descripcion: item.descripcion }])
          ).values()];
          
          setCadenas(processCadenas);
        }
      } catch (error) {
        console.error('Error al cargar cadenas:', error);
      }
    };
   
    fetchCadenas();
  }, [selectedGrupoCadena, languageId]);

  const buildSearchParams = (page = 0, size = 50) => {
    const params = new URLSearchParams();
    params.append('idIdioma', languageId);
    params.append('page', page);
    params.append('size', size);
    
    if (selectedMercado && selectedMercado.length > 0) {
      selectedMercado.forEach(id => {
        params.append('idsMercado', id);
      });
    }
    
    if (selectedGrupoCadena && selectedGrupoCadena.length > 0) {
      selectedGrupoCadena.forEach(id => {
        params.append('idsGrupoCadena', id);
      });
    }
    
    if (selectedCadena && selectedCadena.length > 0) {
      selectedCadena.forEach(id => {
        params.append('idsCadena', id);
      });
    }
    
    if (selectedGrupoLocalizacion && selectedGrupoLocalizacion.length > 0) {
      selectedGrupoLocalizacion.forEach(id => {
        params.append('idsGrupoLocalizacion', id);
      });
    }
    
    if (filtroLocalizacion) {
        const idsLocalizacion = filtroLocalizacion
          .trim()
          .split(/\s+/)
          .filter(id => id.length > 0 && !isNaN(id));
        
        idsLocalizacion.forEach(id => {
          params.append('idsLocalizacion', id);
        });
      }
    
    return params;
  };

  const fetchTiendas = async (filters = {}, page = 0, append = false) => {
    if (page === 0) {
      setLoading(true);
      setHasMore(true);
    }
    setError(null);
    
    try {
      const params = buildSearchParams(page);
      const response = await axios.get(`${BASE_URL}/tiendas?${params.toString()}`);
        
      if (response.data && response.data.content) {
        const processedData = response.data.content.map(item => ({
          ...item,
          estadoTiendaMtu: item.estadoTiendaMtu || 'Sin estado'
        }));
        
        if (append) {
          setTiendas(prev => [...prev, ...processedData]);
        } else {
          setTiendas(processedData);
          setCurrentPage(0);
        }
       
        setTotalElements(response.data.totalElements || 0);
        
        if (processedData.length === 0 || (response.data.totalPages && page >= response.data.totalPages - 1)) {
          setHasMore(false);
        }
      } else {
        if (!append) {
          setTiendas([]);
        }
        setTotalElements(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
      setError(t('No se pudieron cargar las tiendas'));
    } finally {
      if (page === 0) {
        setLoading(false);
      }
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const handleActivarLocalizacion = async () => {
    if (!selectedItems.length) return;
    
    try {
      setLoading(true);
      const response = await axios.put(`${BASE_URL}/tiendas/activar-localizacion`, {
        ids: selectedItems
      });
      
      if (response.data.success) {
        alert(t('Las localizaciones han sido activadas correctamente'));
        setSelectedItems([]);
        setSelectAll(false);
        await fetchTiendas();
      }
    } catch (error) {
      console.error('Error al activar localizaciones:', error);
      setError(t('Error al activar localizaciones'));
    } finally {
      setLoading(false);
    }
  };

  const handlePausarLocalizacion = async () => {
    if (!selectedItems.length) return;
    
    try {
      setLoading(true);
      const response = await axios.put(`${BASE_URL}/tiendas/pausar-localizacion`, {
        ids: selectedItems
      });
      
      if (response.data.success) {
        alert(t('Las localizaciones han sido pausadas correctamente'));
        setSelectedItems([]);
        setSelectAll(false);
        await fetchTiendas();
      }
    } catch (error) {
      console.error('Error al pausar localizaciones:', error);
      setError(t('Error al pausar localizaciones'));
    } finally {
      setLoading(false);
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado || estado === 'Sin estado') return 'estado-desconocido';
    
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower.includes('activ')) return 'estado-activa';
    if (estadoLower.includes('reform')) return 'estado-reforma';
    if (estadoLower.includes('abiert')) return 'estado-abierta';
    if (estadoLower.includes('cerrad')) return 'estado-cerrada';
    if (estadoLower.includes('pausad')) return 'estado-pausada';
    
    if (estadoLower.includes('active')) return 'estado-activa';
    if (estadoLower.includes('reform')) return 'estado-reforma';
    if (estadoLower.includes('open')) return 'estado-abierta';
    if (estadoLower.includes('closed')) return 'estado-cerrada';
    if (estadoLower.includes('permanently closed')) return 'estado-cerrada';
    if (estadoLower.includes('paused')) return 'estado-pausada';
    if (estadoLower.includes('in reform')) return 'estado-reforma';
    
    return 'estado-otro';
  };

  const formatCountryName = (name) => {
    if (!name) return name;
    
    if (name.includes('ESPA')) {
      return 'ESPAÑA';
    }
    
    return name;
  };

  const handleSearch = () => {
    setCurrentPage(0);
    setSelectedItems([]);
    setSelectAll(false);
    fetchTiendas();
  };

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleLoadAllAndSelectAll = async () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
      return;
    }

    try {
      setLoadingAllItems(true);
      
      const allItemIds = await fetchAllTiendaIds();
      
      if (allItemIds.length > 0) {
        setSelectedItems(allItemIds);
        setSelectAll(true);
      } else {
        const visibleIds = tiendas.map(item => item.idLocalizacionRam);
        setSelectedItems(visibleIds);
        setSelectAll(visibleIds.length > 0);
      }
    } catch (error) {
      console.error('Error al seleccionar todas las tiendas:', error);
      
      const visibleIds = tiendas.map(item => item.idLocalizacionRam);
      setSelectedItems(visibleIds);
      setSelectAll(visibleIds.length > 0);
      
      alert(t('No se pudieron seleccionar todas las tiendas. Se han seleccionado solo las visibles.'));
    } finally {
      setLoadingAllItems(false);
    }
  };
  
  const fetchAllTiendaIds = async () => {
    
    try {
      const initialParams = buildSearchParams(0, 1);
      const initialResponse = await axios.get(`${BASE_URL}/tiendas?${initialParams.toString()}`);
      
      const totalElements = initialResponse.data.totalElements || 0;
      if (totalElements === 0) return [];
      
      const pageSize = 500;
      const totalPages = Math.ceil(totalElements / pageSize);
      
      const pagePromises = [];
      for (let page = 0; page < totalPages; page++) {
        const pageParams = buildSearchParams(page, pageSize);
        pagePromises.push(axios.get(`${BASE_URL}/tiendas?${pageParams.toString()}`));
      }
      
      const responses = await Promise.all(pagePromises);
      
      const allIds = responses.flatMap(response => {
        if (response.data && response.data.content) {
          return response.data.content.map(item => item.idLocalizacionRam);
        }
        return [];
      });
      
      return allIds;
    } catch (error) {
      console.error('Error al obtener todos los IDs de tiendas:', error);
      throw error;
    }
  };

  return (
    <div className="app-container-tienda">
      <div className="content-tienda">
        <div className="header-tienda">
          <h1 className="main-title-tienda">{t('CONSULTA TIENDA')}</h1>
          <button 
            className="filter-toggle-button-tienda"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
          </button>
        </div>

        {showFilters && (
          <div className="filtros-tienda">
            <div className="filtro-row-tienda">
              <div className="filtro-column-tienda">
                <label className="filtro-label-tienda">{t('Id o Mercado')}</label>
                <CustomSelect
                  id="mercados"
                  options={mercados}
                  value={selectedMercado}
                  onChange={setSelectedMercado}
                  disabled={loadingFilters}
                />
              </div>

              <div className="filtro-column-tienda">
                <label className="filtro-label-tienda">{t('Id Localización')}</label>
                <input 
                  type="text" 
                  className="filtro-input-tienda"
                  value={filtroLocalizacion}
                  onChange={(e) => setFiltroLocalizacion(e.target.value)}
                />
              </div>

              <div className="filtro-column-tienda">
                <label className="filtro-label-tienda">{t('Id o Grupo de Localizaciones')}</label>
                <CustomSelect
                  id="gruposLocalizacion"
                  options={gruposLocalizacion}
                  value={selectedGrupoLocalizacion}
                  onChange={setSelectedGrupoLocalizacion}
                  disabled={loadingFilters}
                />
              </div>

              <div className="filtro-column-tienda">
                <label className="filtro-label-tienda">{t('Id o Grupo Cadena (T6)')}</label>
                <CustomSelect
                  id="gruposCadena"
                  options={gruposCadena}
                  value={selectedGrupoCadena}
                  onChange={setSelectedGrupoCadena}
                  disabled={loadingFilters}
                />
              </div>

              <div className="filtro-column-tienda">
                <label className="filtro-label-tienda">{t('Id o Cadena')}</label>
                <CustomSelect
                  id="cadenas"
                  options={cadenas}
                  value={selectedCadena}
                  onChange={setSelectedCadena}
                  disabled={loadingFilters}
                />
              </div>

              <div className="filtro-column-tienda buscar-column-tienda">
                <button 
                  className="buscar-button-tienda"
                  onClick={handleSearch}
                  disabled={loading}
                >
                  <FaSearch /> {t('BUSCAR')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="info-section-tienda">
          <span className="results-count-tienda">
            {loading ? t('Cargando...') : 
              t('Cargados {{count}} resultados de {{total}} encontrados', {
                count: tiendas.length,
                total: totalElements
              })
            }
            <FaSyncAlt className="sync-icon-tienda" />
            <span className="update-time-tienda">
              {t('Última actualización')}: {currentTime}
            </span>
          </span>
        </div>

        {selectedItems.length > 0 && (
          <div className="selected-actions-tienda">
            <span className="selected-count-tienda">
              {t('{{count}} elementos seleccionados', { count: selectedItems.length })}
            </span>
            <div className="action-buttons-tienda">
              <button 
                className="activar-button-tienda"
                onClick={handleActivarLocalizacion}
                disabled={shouldDisableActivarButton()}
              >
                <span className="action-icon">⚡</span> {t('ACTIVAR LOCALIZACIÓN')}
              </button>
              <button 
                className="pausar-button-tienda"
                onClick={handlePausarLocalizacion}
                disabled={shouldDisablePausarButton()}
              >
                <span className="action-icon">⏸️</span> {t('PAUSAR LOCALIZACIÓN')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message-tienda">
            {error}
          </div>
        )}

        <div className="table-container-tienda" ref={tableContainerRef}>
          <table className="data-table-tienda">
            <thead>
              <tr>
                <th className="checkbox-column-tienda">
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={handleLoadAllAndSelectAll} 
                    disabled={tiendas.length === 0 || loading || loadingAllItems}
                  />
                </th>
                <th>{t('CÓDIGO DE TIENDA')}</th>
                <th>{t('TIENDA')}</th>
                <th>{t('MERCADO')}</th>
                <th>{t('GRUPO CADENA')}</th>
                <th>{t('CADENA')}</th>
                <th>{t('ESTADO DE TIENDA MTU')}</th>
                <th>{t('ESTADO DE TIENDA RAM')}</th>
              </tr>
            </thead>
            <tbody>
              {loading || loadingAllItems ? (
                <tr>
                  <td colSpan="8" className="loading-cell-tienda">
                    {loadingAllItems ? t('Seleccionando todas las tiendas...') : t('Cargando datos...')}
                  </td>
                </tr>
              ) : tiendas.length > 0 ? (
                <>
                  {tiendas.map((tienda) => (
                    <tr key={tienda.idLocalizacionRam || tienda.codigoTienda} className={selectedItems.includes(tienda.idLocalizacionRam) ? 'selected-tienda' : ''}>
                      <td className="checkbox-cell-tienda">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(tienda.idLocalizacionRam)} 
                          onChange={() => handleSelectItem(tienda.idLocalizacionRam)} 
                        />
                      </td>
                      <td>{tienda.codigoTienda}</td>
                      <td>{tienda.nombreTienda}</td>
                      <td>
                        <div className="mercado-cell-tienda">
                          <span>{formatCountryName(tienda.nombreMercado)}</span>
                        </div>
                      </td>
                      <td>{tienda.nombreGrupoCadena}</td>
                      <td>{tienda.nombreCadena}</td>
                      <td className="status-cell-tienda">
                        <span className={`status-tag-tienda ${getEstadoClass(tienda.estadoTiendaMtu)}`}>
                          {tienda.estadoTiendaMtu}
                        </span>
                      </td>
                      <td className="status-cell-tienda">
                        <span className={`status-tag-tienda ${getEstadoClass(tienda.descripcionTipoEstadoLocalizacionRam)}`}>
                          {tienda.descripcionTipoEstadoLocalizacionRam || ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {loadingMore && (
                    <tr>
                      <td colSpan="8" className="loading-cell-tienda">
                        {t('Cargando más datos...')}
                      </td>
                    </tr>
                  )}
                  <tr ref={tableEndRef}></tr>
                </>
              ) : (
                <tr>
                  <td colSpan="8" className="empty-table-message-tienda">
                    {t('No hay datos disponibles')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default ConsultaTienda;