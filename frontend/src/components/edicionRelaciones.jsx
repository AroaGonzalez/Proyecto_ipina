import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSyncAlt, FaSearch, FaChevronDown, FaCalendarAlt, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/edicionRelaciones.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const FilterDropdown = React.memo(({ 
  label, 
  placeholder, 
  isOpen, 
  toggleFilter, 
  searchText, 
  setSearchText, 
  filteredItems, 
  selectedItems, 
  handleFilterSelect, 
  handleSelectAll, 
  allItems, 
  itemRenderer,
  isDisabled = () => false,
  filterName
}) => (
  <div className="filter-item">
    <div className="filter-dropdown" onClick={() => toggleFilter(filterName)}>
      <span className="filter-label">{label}</span>
      <div className="filter-value">
        <span className="filter-placeholder">
          {selectedItems.length > 0 ? `${selectedItems.length} seleccionados` : placeholder}
        </span>
        <FaChevronDown className="dropdown-arrow" />
      </div>
      {isOpen && (
        <div className="filter-dropdown-content">
          <div className="dropdown-search">
            <input 
              type="text" 
              placeholder={`Buscar ${label.toLowerCase()}...`} 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="dropdown-items-container">
            <div className="dropdown-items">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`dropdown-item ${isDisabled(item) ? 'disabled-item' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isDisabled(item)) {
                      handleFilterSelect(filterName, item.id);
                    }
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)}
                    readOnly
                    disabled={isDisabled(item)}
                  />
                  <span>{itemRenderer ? itemRenderer(item) : `${item.id} - ${item.descripcion}`}</span>
                </div>
              ))}
            </div>
            <div 
              className="dropdown-item select-all"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAll();
              }}
            >
              <input 
                type="checkbox" 
                checked={selectedItems.length === allItems.length && allItems.length > 0}
                readOnly
              />
              <span>Seleccionar todo</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
));

const SelectionCheckbox = React.memo(({ 
  id, 
  isSelected, 
  handleSelectItem 
}) => {
  return (
    <input 
      type="checkbox" 
      checked={isSelected} 
      onChange={() => handleSelectItem(id)}
    />
  );
});

const TableRow = React.memo(({ 
  relacion, 
  selectedItems, 
  handleSelectItem, 
  normalizeText, 
  unidadesCompra, 
  updateUnidadCompra, 
  globalAjenosSelected, 
  handleGlobalAjenoChange, 
  ajenos 
}) => (
  <tr 
    className={selectedItems.includes(relacion.idAliasAmbitoAplanado) ? 'selected-row' : ''}
  >
    <td className="checkbox-column">
      <SelectionCheckbox 
        id={relacion.idAliasAmbitoAplanado}
        isSelected={selectedItems.includes(relacion.idAliasAmbitoAplanado)}
        handleSelectItem={handleSelectItem}
      />
    </td>
    <td>{relacion.idAlias}</td>
    <td>{relacion.idLocalizacionCompra}</td>
    <td>{normalizeText(relacion.descripcionLocalizacionCompra)}</td>
    <td>{relacion.descripcionCortaCadena}</td>
    <td>
      <div className="mercado-cell">
        <img 
          src={`/images/flags/${relacion.codigoIsoMercado?.toLowerCase()}.png`} 
          alt={normalizeText(relacion.descripcionMercado)}
          className="flag-icon"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <span>{normalizeText(relacion.descripcionMercado)}</span>
      </div>
    </td>
    <td>
      <span className={`estado-tag ${relacion.idTipoEstadoLocalizacionRam === 1 ? 'ACTIVO' : 'PAUSADO'}`}>
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
        value={relacion.idUnidadComprasGestora || 0}
        onChange={(e) => updateUnidadCompra(
          relacion.idAliasAmbitoAplanado, 
          parseInt(e.target.value)
        )}
        className="unidad-compra-select"
      >
        <option value={0}>Ninguna unidad de compra gestora</option>
        {unidadesCompra.map(unidad => (
          <option key={unidad.id} value={unidad.id}>
            {unidad.id} - {normalizeText(unidad.descripcion)}
          </option>
        ))}
      </select>
    </td>                    
    <td className="global-column">
      <select 
        value={globalAjenosSelected[relacion.idAliasAmbitoAplanado] || 0}
        onChange={(e) => handleGlobalAjenoChange(relacion.idAliasAmbitoAplanado, parseInt(e.target.value))}
        className="global-ajeno-select"
      >
        <option value={0}>Ningún global asignado</option>
        {ajenos && ajenos.length > 0 && 
          ajenos
            .filter(ajeno => ajeno.idAlias === relacion.idAlias)
            .flatMap(ajeno => 
              ajeno.dataAjenos && ajeno.dataAjenos.length > 0 
                ? ajeno.dataAjenos.map(dataAjeno => (
                    <option key={dataAjeno.idAjeno} value={dataAjeno.idAjeno}>
                      {dataAjeno.idAjeno}
                    </option>
                  ))
                : []
            )
        }
      </select>
    </td>
  </tr>
));

const PauseModal = React.memo(({ isOpen, onClose, onConfirm, pauseDate, setPauseDate, loading }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="pause-modal">
        <h2>Pausar relaciones seleccionadas</h2>
        <p>Seleccione la fecha hasta la que estarán pausadas las relaciones:</p>
        
        <div className="date-picker-container">
          <label>Pausar hasta:</label>
          <div className="date-picker-wrapper">
            <DatePicker
              selected={pauseDate}
              onChange={date => setPauseDate(date)}
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              locale={es}
              className="date-picker-input"
            />
            <FaCalendarAlt className="calendar-icon" />
          </div>
        </div>
        
        <div className="modal-buttons">
          <button 
            className="cancel-button"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            className="confirm-button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
});

const useRelacionesStatusMap = (relaciones) => {
  return useMemo(() => {
    const statusMap = new Map();
    relaciones.forEach(relacion => {
      statusMap.set(relacion.idAliasAmbitoAplanado, relacion.idTipoEstadoLocalizacionRam);
    });
    return statusMap;
  }, [relaciones]);
};

const EdicionRelaciones = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const idsAliasSelected = location.state?.selectedItems || [];
  const originalFilters = location.state?.filters || {};
  
  const [data, setData] = useState({
    ajenos: [],
    relaciones: [],
    filteredRelaciones: [],
    relacionesUnidades: [],
    allRelaciones: [],
    mercados: [],
    cadenas: [],
    alias: [],
    unidadesCompra: [],
    globalAjenosSelected: {}
  });
  
  const [ui, setUi] = useState({
    loading: true,
    error: null,
    showFilters: true,
    totalElements: 0,
    currentPage: 0,
    pageSize: 50,
    selectAll: false,
    selectedItems: [],
    openFilter: null,
    loadingAllItems: false,
    hasMore: true,
    loadingMore: false,
    isModified: false,
    mercadoSearchText: '',
    cadenaSearchText: '',
    aliasSearchText: '',
    unidadCompraSearchText: '',
    localizacionSearchText: '',
  });
  
  const [filters, setFilters] = useState({
    selectedMercados: [],
    selectedCadenas: [],
    selectedAlias: idsAliasSelected || [],
    selectedUnidadesCompra: [],
    selectedLocalizaciones: [],
  });
  
  const [modal, setModal] = useState({
    pauseModalOpen: false,
    pauseUntilDate: (() => {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      return defaultDate;
    })(),
    pauseLoading: false,
    activateLoading: false,
  });

  const tableContainerRef = useRef(null);
  const tableEndRef = useRef(null);
  
  const relacionesStatusMap = useRelacionesStatusMap(data.relaciones);
  
  useEffect(() => {
    fetchFilterOptions();
    fetchRelaciones();
  }, [languageId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ui.openFilter && !event.target.closest('.filter-dropdown')) {
        setUi(prev => ({ ...prev, openFilter: null }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ui.openFilter]);

  useEffect(() => {
    if (data.relaciones.length === 0) return;
    
    const initialGlobalAjenos = {};
    data.relaciones.forEach(relacion => {
      initialGlobalAjenos[relacion.idAliasAmbitoAplanado] = relacion.idAjenoSeccionGlobal || 0;
    });
    
    setData(prev => ({
      ...prev,
      globalAjenosSelected: initialGlobalAjenos
    }));
  }, [data.relaciones.length]);

  useEffect(() => {
    if (data.relaciones.length === 0) return;
    
    const needsInitialization = !data.relaciones.some(rel => 
      rel.hasOwnProperty('originalAjenoSeccionGlobal') && 
      rel.hasOwnProperty('originalUnidadComprasGestora')
    );
    
    if (needsInitialization) {
      console.log('Inicializando valores originales...');
      
      const relationsWithOriginals = data.relaciones.map(rel => ({
        ...rel,
        originalAjenoSeccionGlobal: rel.idAjenoSeccionGlobal || 0,
        originalUnidadComprasGestora: rel.idUnidadComprasGestora || 0
      }));
      
      setData(prev => ({
        ...prev,
        relaciones: relationsWithOriginals,
        filteredRelaciones: relationsWithOriginals
      }));
    }
  }, [data.relaciones.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
        
        if (!ui.loadingMore && ui.hasMore && scrollTop + clientHeight >= scrollHeight - 100) {
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
  }, [ui.loadingMore, ui.hasMore, ui.totalElements, data.relaciones.length]);

  const getFilteredAlias = useCallback(() => {
    if (!Array.isArray(data.alias)) {
      return [];
    }
    
    try {
      if (ui.aliasSearchText) {
        return data.alias.filter(a => {
          if (a && typeof a === 'object') {
            const idStr = a.id?.toString() || '';
            const descStr = a.descripcion?.toLowerCase() || '';
            return idStr.includes(ui.aliasSearchText) || descStr.includes(ui.aliasSearchText.toLowerCase());
          }
          return false;
        });
      }
      
      return data.alias;
    } catch (error) {
      console.error('Error al filtrar alias:', error);
      return []; 
    }
  }, [data.alias, ui.aliasSearchText]);

  const filteredAlias = useMemo(() => getFilteredAlias(), [getFilteredAlias]);
  
  const filteredMercados = useMemo(() => {
    return ui.mercadoSearchText
      ? (Array.isArray(data.mercados) ? data.mercados.filter(mercado => 
          mercado.id?.toString().includes(ui.mercadoSearchText) || 
          (mercado.descripcion || '').toLowerCase().includes(ui.mercadoSearchText.toLowerCase())
        ) : [])
      : data.mercados || [];
  }, [data.mercados, ui.mercadoSearchText]);

  const filteredCadenas = useMemo(() => {
    return ui.cadenaSearchText
      ? data.cadenas.filter(cadena => 
          cadena.id.toString().includes(ui.cadenaSearchText) || 
          cadena.descripcion.toLowerCase().includes(ui.cadenaSearchText.toLowerCase())
        )
      : data.cadenas;
  }, [data.cadenas, ui.cadenaSearchText]);

  const filteredUnidadesCompra = useMemo(() => {
    return ui.unidadCompraSearchText
      ? data.relacionesUnidades.filter(unidad => 
          unidad.id.toString().includes(ui.unidadCompraSearchText) || 
          unidad.descripcion.toLowerCase().includes(ui.unidadCompraSearchText.toLowerCase())
        )
      : data.relacionesUnidades;
  }, [data.relacionesUnidades, ui.unidadCompraSearchText]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      setUi(prev => ({ ...prev, loading: true }));
      
      const [mercadosRes, cadenasRes, aliasRes, unidadesCompraRes, relacionesUnidadesRes] = await Promise.all([
        axios.get(`${BASE_URL}/relaciones/mercados?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/cadenas`),
        axios.get(`${BASE_URL}/relaciones/lista-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/maestros/unidades-compra`),
        axios.get(`${BASE_URL}/relaciones/unidades-compra`)
      ]);
      
      let processedAlias = [];
      if (aliasRes.data && aliasRes.data.content && Array.isArray(aliasRes.data.content)) {
        processedAlias = aliasRes.data.content.map(item => ({
          id: item.id,
          descripcion: item.descripcion || item.nombreAlias
        }));
      } else if (Array.isArray(aliasRes.data)) {
        processedAlias = aliasRes.data;
      }
      
      setData(prev => ({
        ...prev,
        mercados: Array.isArray(mercadosRes.data) ? mercadosRes.data : [],
        cadenas: Array.isArray(cadenasRes.data) ? cadenasRes.data : [],
        alias: processedAlias,
        unidadesCompra: Array.isArray(unidadesCompraRes.data) ? unidadesCompraRes.data : [],
        relacionesUnidades: Array.isArray(relacionesUnidadesRes.data) ? relacionesUnidadesRes.data : []
      }));
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      setUi(prev => ({ 
        ...prev, 
        error: t('Error al cargar opciones de filtro') 
      }));
      
      setData(prev => ({
        ...prev,
        mercados: [],
        cadenas: [],
        alias: [],
        unidadesCompra: [],
        relacionesUnidades: []
      }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  }, [languageId, t]);

  const prepareFilterPayload = useCallback((page = 0) => {
    let aliasToUse = [];      
    if (idsAliasSelected.length > 0) {
      if (filters.selectedAlias.length > 0) {
        aliasToUse = filters.selectedAlias.filter(id => idsAliasSelected.includes(id));
      } else {
        aliasToUse = [...idsAliasSelected];
      }
    } else {
      aliasToUse = filters.selectedAlias;
    }
    
    let localizacionIds = [];
    if (ui.localizacionSearchText.trim()) {
      localizacionIds = ui.localizacionSearchText
        .trim()
        .split(/\s+/)
        .filter(id => id.length > 0 && !isNaN(id))
        .map(id => parseInt(id));
    }
    
    const filter = {
      idIdioma: languageId,
      idsMercado: filters.selectedMercados.length > 0 ? filters.selectedMercados : undefined,
      idsCadena: filters.selectedCadenas.length > 0 ? filters.selectedCadenas : undefined,
      idsUnidadComprasGestora: filters.selectedUnidadesCompra.length > 0 ? filters.selectedUnidadesCompra : undefined,
      idsLocalizacion: localizacionIds.length > 0 ? localizacionIds : 
        (filters.selectedLocalizaciones.length > 0 ? filters.selectedLocalizaciones : undefined)
    };
    
    return {
      filter,
      idsAliasSelected: aliasToUse.length > 0 ? aliasToUse : [],
      processAllAlias: false,
      aliasTableOriginalFilter: originalFilters,
      page: {
        number: page,
        size: ui.pageSize
      }
    };
  }, [
    languageId, 
    idsAliasSelected, 
    filters.selectedAlias,
    filters.selectedMercados,
    filters.selectedCadenas, 
    filters.selectedUnidadesCompra,
    filters.selectedLocalizaciones,
    ui.localizacionSearchText,
    ui.pageSize,
    originalFilters
  ]);

  const fetchRelaciones = useCallback(async () => {
    setUi(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      hasMore: true, 
      currentPage: 0,
      selectedItems: [],
      selectAll: false
    }));
    
    try {
      const payload = prepareFilterPayload(0);
      const response = await axios.post(`${BASE_URL}/relaciones/filter`, payload);
      
      if (response.data) {
        const initialRelaciones = response.data.relaciones || [];
        const totalCount = response.data.page?.total || 0;
        
        setData(prev => ({
          ...prev,
          relaciones: initialRelaciones,
          filteredRelaciones: initialRelaciones,
          ajenos: response.data.ajenos || [],
          allRelaciones: response.data.allRelaciones || []
        }));
        
        setUi(prev => ({
          ...prev,
          totalElements: totalCount,
          hasMore: initialRelaciones.length < totalCount
        }));
      } else {
        setData(prev => ({
          ...prev,
          relaciones: [],
          filteredRelaciones: [],
          allRelaciones: [],
          ajenos: []
        }));
        
        setUi(prev => ({
          ...prev,
          totalElements: 0,
          hasMore: false
        }));
      }
    } catch (error) {
      console.error('Error al cargar relaciones:', error);
      setUi(prev => ({ 
        ...prev, 
        error: t('Error al cargar relaciones')
      }));
      
      setData(prev => ({
        ...prev,
        ajenos: []
      }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  }, [prepareFilterPayload, t]);

  const loadMoreData = useCallback(async () => {
    if (!ui.hasMore || ui.loadingMore) return;
    
    if (data.relaciones.length >= ui.totalElements) {
      setUi(prev => ({ ...prev, hasMore: false }));
      return;
    }
    
    setUi(prev => ({ ...prev, loadingMore: true }));
    
    try {
      const nextPage = ui.currentPage + 1;
      const payload = prepareFilterPayload(nextPage);
      
      const response = await axios.post(`${BASE_URL}/relaciones/filter`, payload);
      
      if (response.data) {
        const newRelaciones = response.data.relaciones || [];
        const newTotalElements = response.data.page?.total || 0;
        
        if (newTotalElements !== ui.totalElements) {
          setUi(prev => ({ ...prev, totalElements: newTotalElements }));
        }
        
        if (response.data.ajenos) {
          const newAjenos = response.data.ajenos || [];
          const combinedAjenos = [...data.ajenos];
          
          const ajenosMap = new Map();
          combinedAjenos.forEach((ajeno, index) => {
            ajenosMap.set(ajeno.idAlias, index);
          });
          
          newAjenos.forEach(newAjeno => {
            const existingIndex = ajenosMap.get(newAjeno.idAlias);
            
            if (existingIndex !== undefined) {
              const existingDataAjenos = combinedAjenos[existingIndex].dataAjenos || [];
              const newDataAjenos = newAjeno.dataAjenos || [];
              
              const existingIds = new Set(existingDataAjenos.map(da => da.idAjeno));
              
              const newItems = newDataAjenos.filter(da => !existingIds.has(da.idAjeno));
              
              if (newItems.length > 0) {
                combinedAjenos[existingIndex].dataAjenos = [...existingDataAjenos, ...newItems];
              }
            } else {
              combinedAjenos.push(newAjeno);
            }
          });
          
          setData(prev => ({ ...prev, ajenos: combinedAjenos }));
        }
        
        if (newRelaciones.length > 0) {
          const updatedRelaciones = [...data.relaciones, ...newRelaciones];
          
          setData(prev => ({
            ...prev,
            relaciones: updatedRelaciones,
            filteredRelaciones: updatedRelaciones
          }));
          
          setUi(prev => ({ 
            ...prev, 
            currentPage: nextPage,
            hasMore: updatedRelaciones.length < newTotalElements
          }));
        } else {
          setUi(prev => ({ ...prev, hasMore: false }));
        }
      } else {
        setUi(prev => ({ ...prev, hasMore: false }));
      }
    } catch (error) {
      console.error('Error al cargar más datos:', error);
      setUi(prev => ({ 
        ...prev, 
        error: t('Error al cargar más datos'),
        hasMore: false
      }));
    } finally {
      setUi(prev => ({ ...prev, loadingMore: false }));
    }
  }, [
    data.ajenos, 
    data.relaciones, 
    ui.currentPage, 
    ui.hasMore, 
    ui.loadingMore, 
    ui.totalElements, 
    prepareFilterPayload,
    t
  ]);

  const toggleFilter = useCallback((filterName) => {
    setUi(prev => ({
      ...prev,
      openFilter: prev.openFilter === filterName ? null : filterName
    }));
  }, []);

  const handleFilterSelect = useCallback((filterType, value) => {
    switch (filterType) {
      case 'mercado':
        setFilters(prev => ({
          ...prev,
          selectedMercados: prev.selectedMercados.includes(value) 
            ? prev.selectedMercados.filter(item => item !== value) 
            : [...prev.selectedMercados, value]
        }));
        break;
      case 'cadena':
        setFilters(prev => ({
          ...prev,
          selectedCadenas: prev.selectedCadenas.includes(value) 
            ? prev.selectedCadenas.filter(item => item !== value) 
            : [...prev.selectedCadenas, value]
        }));
        break;
      case 'alias':
        if (idsAliasSelected.length > 0) {
          if (idsAliasSelected.includes(value)) {
            setFilters(prev => ({
              ...prev,
              selectedAlias: prev.selectedAlias.includes(value) 
                ? prev.selectedAlias.filter(item => item !== value) 
                : [...prev.selectedAlias, value]
            }));
          }
        } else {
          setFilters(prev => ({
            ...prev,
            selectedAlias: prev.selectedAlias.includes(value) 
              ? prev.selectedAlias.filter(item => item !== value) 
              : [...prev.selectedAlias, value]
          }));
        }
        break;
      case 'unidadCompra':
        setFilters(prev => ({
          ...prev,
          selectedUnidadesCompra: prev.selectedUnidadesCompra.includes(value) 
            ? prev.selectedUnidadesCompra.filter(item => item !== value) 
            : [...prev.selectedUnidadesCompra, value]
        }));
        break;
      case 'localizacion':
        const localizacionId = parseInt(value);
        if (!isNaN(localizacionId)) {
          setFilters(prev => ({
            ...prev,
            selectedLocalizaciones: prev.selectedLocalizaciones.includes(localizacionId) 
              ? prev.selectedLocalizaciones.filter(item => item !== localizacionId) 
              : [...prev.selectedLocalizaciones, localizacionId]
          }));
        }
        break;
      default:
        break;
    }
  }, [idsAliasSelected]);

  const handleSearch = useCallback(() => {
    setUi(prev => ({ 
      ...prev, 
      currentPage: 0,
      selectedItems: [],
      selectAll: false
    }));
    fetchRelaciones();
  }, [fetchRelaciones]);

  const handleSelectItem = useCallback((id) => {
    setUi(prev => {
      const selectedItemsSet = new Set(prev.selectedItems);
      
      if (selectedItemsSet.has(id)) {
        selectedItemsSet.delete(id);
      } else {
        selectedItemsSet.add(id);
      }
      
      return {
        ...prev,
        selectedItems: Array.from(selectedItemsSet)
      };
    });
  }, []);

  const handleSelectAll = useCallback(async () => {
    setUi(prev => ({ ...prev, loadingAllItems: true }));
    
    try {
      if (ui.selectAll) {
        setUi(prev => ({
          ...prev,
          selectedItems: [],
          selectAll: false
        }));
      } else {
        if (data.allRelaciones && data.allRelaciones.length > 0) {
          const allIds = data.allRelaciones.map(item => item.idAliasAmbitoAplanado);
          setUi(prev => ({
            ...prev,
            selectedItems: allIds,
            selectAll: true
          }));
        } else {
          const visibleIds = data.filteredRelaciones.map(item => item.idAliasAmbitoAplanado);
          setUi(prev => ({
            ...prev,
            selectedItems: visibleIds,
            selectAll: true
          }));
        }
      }
    } catch (error) {
      console.error('Error en handleSelectAll:', error);
      const visibleIds = data.filteredRelaciones.map(item => item.idAliasAmbitoAplanado);
      setUi(prev => ({
        ...prev,
        selectedItems: visibleIds,
        selectAll: true
      }));
    } finally {
      setUi(prev => ({ ...prev, loadingAllItems: false }));
    }
  }, [ui.selectAll, data.allRelaciones, data.filteredRelaciones]);

  const handleActivateRelations = useCallback(async () => {
    if (ui.selectedItems.length === 0) return;
    
    setModal(prev => ({ ...prev, activateLoading: true }));
    
    try {
      const selectedRelations = data.relaciones.filter(r => 
        ui.selectedItems.includes(r.idAliasAmbitoAplanado)
      );
      
      const response = await axios.put(`${BASE_URL}/relaciones/activate`, {
        relaciones: selectedRelations,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        const updatedRelaciones = data.relaciones.map(rel => {
          if (ui.selectedItems.includes(rel.idAliasAmbitoAplanado)) {
            return {
              ...rel,
              idTipoEstadoLocalizacionRam: 1,
              descripcionTipoEstadoLocalizacionRam: 'ACTIVO',
              fechaHoraFinPausa: null
            };
          }
          return rel;
        });
        
        setData(prev => ({
          ...prev,
          relaciones: updatedRelaciones,
          filteredRelaciones: updatedRelaciones
        }));
        
        setUi(prev => ({
          ...prev,
          selectedItems: [],
          selectAll: false
        }));
        
        alert(t(`${response.data.updatedCount} relaciones activadas correctamente`));
      }
    } catch (error) {
      console.error('Error al activar relaciones:', error);
      setUi(prev => ({ ...prev, error: t('Error al activar relaciones') }));
    } finally {
      setModal(prev => ({ ...prev, activateLoading: false }));
    }
  }, [data.relaciones, ui.selectedItems, t]);

  const handlePauseRelations = useCallback(async () => {
    if (ui.selectedItems.length === 0) return;
    
    setModal(prev => ({ ...prev, pauseLoading: true }));
    
    try {
      const selectedRelations = data.relaciones.filter(r => 
        ui.selectedItems.includes(r.idAliasAmbitoAplanado)
      );
      
      const response = await axios.put(`${BASE_URL}/relaciones/pause`, {
        relaciones: selectedRelations,
        fechaHoraFinPausa: null,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        const updatedRelaciones = data.relaciones.map(rel => {
          if (ui.selectedItems.includes(rel.idAliasAmbitoAplanado)) {
            return {
              ...rel,
              idTipoEstadoLocalizacionRam: 2,
              descripcionTipoEstadoLocalizacionRam: 'PAUSADA',
              fechaHoraFinPausa: null
            };
          }
          return rel;
        });
        
        setData(prev => ({
          ...prev,
          relaciones: updatedRelaciones,
          filteredRelaciones: updatedRelaciones
        }));
        
        setUi(prev => ({
          ...prev,
          selectedItems: [],
          selectAll: false
        }));
        
        alert(t(`${response.data.updatedCount} relaciones pausadas correctamente`));
      }
    } catch (error) {
      console.error('Error al pausar relaciones:', error);
      setUi(prev => ({ ...prev, error: t('Error al pausar relaciones') }));
    } finally {
      setModal(prev => ({ ...prev, pauseLoading: false }));
    }
  }, [data.relaciones, ui.selectedItems, t]);

  const handleOpenPauseModal = useCallback(() => {
    if (ui.selectedItems.length === 0) return;
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 30);
    
    setModal(prev => ({
      ...prev,
      pauseUntilDate: defaultDate,
      pauseModalOpen: true
    }));
  }, [ui.selectedItems]);

  const handlePauseModalConfirm = useCallback(async () => {
    if (ui.selectedItems.length === 0) return;
    
    setModal(prev => ({ ...prev, pauseLoading: true }));
    
    try {
      const selectedRelations = data.relaciones.filter(r => 
        ui.selectedItems.includes(r.idAliasAmbitoAplanado)
      );
      
      const formattedDate = modal.pauseUntilDate.toISOString().slice(0, 19).replace('T', ' ');
      
      const response = await axios.put(`${BASE_URL}/relaciones/pause`, {
        relaciones: selectedRelations,
        fechaHoraFinPausa: formattedDate,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        const updatedRelaciones = data.relaciones.map(rel => {
          if (ui.selectedItems.includes(rel.idAliasAmbitoAplanado)) {
            return {
              ...rel,
              idTipoEstadoLocalizacionRam: 2,
              descripcionTipoEstadoLocalizacionRam: 'PAUSADA',
              fechaHoraFinPausa: modal.pauseUntilDate.toISOString()
            };
          }
          return rel;
        });
        
        setData(prev => ({
          ...prev,
          relaciones: updatedRelaciones,
          filteredRelaciones: updatedRelaciones
        }));
        
        setUi(prev => ({
          ...prev,
          selectedItems: [],
          selectAll: false
        }));
        
        setModal(prev => ({ ...prev, pauseModalOpen: false }));
        
        alert(t(`${response.data.updatedCount} relaciones pausadas correctamente`));
      }
    } catch (error) {
      console.error('Error al pausar relaciones:', error);
      setUi(prev => ({ ...prev, error: t('Error al pausar relaciones') }));
    } finally {
      setModal(prev => ({ ...prev, pauseLoading: false }));
    }
  }, [data.relaciones, ui.selectedItems, modal.pauseUntilDate, t]);

  const handleGlobalAjenoChange = useCallback((idAliasAmbitoAplanado, idAjenoSeccionGlobal) => {
    setData(prev => {
      const relation = prev.relaciones.find(rel => rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado);
      
      if (relation && !relation.hasOwnProperty('originalAjenoSeccionGlobal')) {
        relation.originalAjenoSeccionGlobal = relation.idAjenoSeccionGlobal || 0;
      }

      return {
        ...prev,
        globalAjenosSelected: {
          ...prev.globalAjenosSelected,
          [idAliasAmbitoAplanado]: idAjenoSeccionGlobal
        },
        relaciones: prev.relaciones.map(rel => {
          if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
            return {
              ...rel,
              originalAjenoSeccionGlobal: rel.hasOwnProperty('originalAjenoSeccionGlobal') 
                ? rel.originalAjenoSeccionGlobal 
                : (rel.idAjenoSeccionGlobal || 0)
            };
          }
          return rel;
        }),
        filteredRelaciones: prev.filteredRelaciones.map(rel => {
          if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
            return {
              ...rel,
              originalAjenoSeccionGlobal: rel.hasOwnProperty('originalAjenoSeccionGlobal') 
                ? rel.originalAjenoSeccionGlobal 
                : (rel.idAjenoSeccionGlobal || 0)
            };
          }
          return rel;
        })
      };
    });

    setUi(prev => {
      const relacionActual = data.relaciones.find(
        rel => rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado
      );
      
      const originalValue = relacionActual && relacionActual.hasOwnProperty('originalAjenoSeccionGlobal')
        ? relacionActual.originalAjenoSeccionGlobal
        : (relacionActual?.idAjenoSeccionGlobal || 0);
        
      if (originalValue !== idAjenoSeccionGlobal) {
        return { ...prev, isModified: true };
      }
      
      const hayOtrosCambios = data.relaciones.some(rel => {
        const original = rel.originalAjenoSeccionGlobal !== undefined 
          ? rel.originalAjenoSeccionGlobal 
          : (rel.idAjenoSeccionGlobal || 0);
        
        const actual = data.globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0;
        
        return original !== actual;
      });
      
      return { ...prev, isModified: hayOtrosCambios };
    });
  }, [data.relaciones, data.globalAjenosSelected]);

  const updateUnidadCompra = useCallback((idAliasAmbitoAplanado, idUnidadComprasGestora) => {
    setData(prev => {
      const unidadName = prev.unidadesCompra.find(u => u.id === idUnidadComprasGestora)?.descripcion || null;
      
      return {
        ...prev,
        relaciones: prev.relaciones.map(rel => {
          if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
            return {
              ...rel,
              idUnidadComprasGestora,
              nombreUnidadComprasGestora: unidadName
            };
          }
          return rel;
        }),
        filteredRelaciones: prev.filteredRelaciones.map(rel => {
          if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
            return {
              ...rel,
              idUnidadComprasGestora,
              nombreUnidadComprasGestora: unidadName
            };
          }
          return rel;
        })
      };
    });
    
    setUi(prev => ({ ...prev, isModified: true }));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (!data.relaciones.some(rel => rel.hasOwnProperty('originalAjenoSeccionGlobal'))) {
        const relationsWithOriginals = data.relaciones.map(rel => ({
          ...rel,
          originalAjenoSeccionGlobal: rel.idAjenoSeccionGlobal || 0,
          originalUnidadComprasGestora: rel.idUnidadComprasGestora || 0
        }));
        
        setData(prev => ({
          ...prev,
          relaciones: relationsWithOriginals,
          filteredRelaciones: relationsWithOriginals
        }));
        
        return;
      }
      
      const updatedRelaciones = data.relaciones
        .filter(rel => {
          const originalGlobalAjeno = rel.originalAjenoSeccionGlobal !== undefined 
            ? rel.originalAjenoSeccionGlobal 
            : (rel.idAjenoSeccionGlobal || 0);
          
          const currentGlobalAjeno = data.globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0;
          
          const originalUnidadCompra = rel.originalUnidadComprasGestora !== undefined
            ? rel.originalUnidadComprasGestora
            : (rel.idUnidadComprasGestora || 0);
            
          console.log(`Relación ${rel.idAliasAmbitoAplanado}:`, {
            original: originalGlobalAjeno,
            current: currentGlobalAjeno,
            changed: currentGlobalAjeno !== originalGlobalAjeno
          });
            
          return currentGlobalAjeno !== originalGlobalAjeno || 
            rel.idUnidadComprasGestora !== originalUnidadCompra;
        })
        .map(rel => {
          const updatedRel = {
            idAliasAmbitoAplanado: rel.idAliasAmbitoAplanado,
            esSolicitable: rel.esSolicitable
          };
          
          const originalGlobalAjeno = rel.originalAjenoSeccionGlobal !== undefined 
            ? rel.originalAjenoSeccionGlobal 
            : (rel.idAjenoSeccionGlobal || 0);
          
          const currentGlobalAjeno = data.globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0;
          
          if (currentGlobalAjeno !== originalGlobalAjeno) {
            updatedRel.idAjenoSeccionGlobal = currentGlobalAjeno;
          }
          
          const originalUnidadCompra = rel.originalUnidadComprasGestora !== undefined
            ? rel.originalUnidadComprasGestora
            : (rel.idUnidadComprasGestora || 0);
            
          if (rel.idUnidadComprasGestora !== originalUnidadCompra) {
            updatedRel.idUnidadComprasGestora = rel.idUnidadComprasGestora || 0;
          }
          
          return updatedRel;
        });
      
      console.log('Relaciones a actualizar:', updatedRelaciones);
      
      if (updatedRelaciones.length === 0) {
        alert(t('No hay cambios para guardar'));
        return;
      }
      
      const response = await axios.patch(`${BASE_URL}/relaciones/update`, {
        relaciones: updatedRelaciones,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
        const relationsWithOriginals = data.relaciones.map(rel => ({
          ...rel,
          originalAjenoSeccionGlobal: data.globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0,
          originalUnidadComprasGestora: rel.idUnidadComprasGestora || 0,
          idAjenoSeccionGlobal: data.globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0
        }));
        
        setData(prev => ({
          ...prev,
          relaciones: relationsWithOriginals,
          filteredRelaciones: relationsWithOriginals
        }));
        
        setUi(prev => ({ ...prev, isModified: false }));
        alert(t(`${response.data.updatedCount} relaciones actualizadas correctamente`));
      } else {
        throw new Error(response.data.message || 'Error desconocido al guardar');
      }
    } catch (error) {
      console.error('Error al guardar relaciones:', error);
      setUi(prev => ({ 
        ...prev, 
        error: t('Error al guardar relaciones: ') + (error.message || error) 
      }));
    }
  }, [data.relaciones, data.globalAjenosSelected, t]);

  const handleCancel = useCallback(() => {
    if (ui.isModified && !window.confirm(t('¿Está seguro que desea salir sin guardar los cambios?'))) {
      return;
    }
    navigate(-1);
  }, [ui.isModified, navigate, t]);

  const shouldDisableActivateButton = useCallback(() => {
    if (ui.selectedItems.length === 0) return true;
    
    return !ui.selectedItems.some(id => {
      const status = relacionesStatusMap.get(id);
      return status === 2; // PAUSADO
    });
  }, [ui.selectedItems, relacionesStatusMap]);

  const shouldDisablePauseButton = useCallback(() => {
    if (ui.selectedItems.length === 0) return true;
    
    return !ui.selectedItems.some(id => {
      const status = relacionesStatusMap.get(id);
      return status === 1; // ACTIVO
    });
  }, [ui.selectedItems, relacionesStatusMap]);

  const normalizeText = useCallback((text) => {
    if (!text) return '';

    let normalizedText = text;

    normalizedText = normalizedText
      .replace(/ESPA.?.'A/g, 'ESPAÑA')
      .replace(/ESPA.?.A/g, 'ESPAÑA')
      .replace(/ADMINISTRACI[Ã]["]N/g, 'ADMINISTRACIÓN')
      .replace(/ADMINISTRACI.?.N/g, 'ADMINISTRACIÓN')
      .replace(/ALMAC.?.N/g, 'ALMACÉN')
      .replace(/M.?.XICO/g, 'MÉXICO')
      .replace(/PREVENCI.?.N/g, 'PREVENCIÓN')
      .replace(/P.?.RDIDAS/g, 'PÉRDIDAS')
      .replace(/GESTI.?.N/g, 'GESTIÓN')
      .replace(/DECORACI.?.N/g, 'DECORACIÓN');

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

    for (const [badChar, goodChar] of Object.entries(replacements)) {
      normalizedText = normalizedText.replace(new RegExp(badChar, 'g'), goodChar);
    }

    return normalizedText;
  }, []);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleSelectAllMercados = useCallback(() => {
    if (filters.selectedMercados.length === data.mercados.length) {
      setFilters(prev => ({ ...prev, selectedMercados: [] }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        selectedMercados: data.mercados.map(m => m.id) 
      }));
    }
  }, [filters.selectedMercados.length, data.mercados]);

  const handleSelectAllCadenas = useCallback(() => {
    if (filters.selectedCadenas.length === data.cadenas.length) {
      setFilters(prev => ({ ...prev, selectedCadenas: [] }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        selectedCadenas: data.cadenas.map(c => c.id) 
      }));
    }
  }, [filters.selectedCadenas.length, data.cadenas]);

  const handleSelectAllAlias = useCallback(() => {
    if (idsAliasSelected.length > 0) {
      if (filters.selectedAlias.length === idsAliasSelected.length) {
        setFilters(prev => ({ ...prev, selectedAlias: [] }));
      } else {
        setFilters(prev => ({ ...prev, selectedAlias: [...idsAliasSelected] }));
      }
    } else {
      if (filters.selectedAlias.length === data.alias.length) {
        setFilters(prev => ({ ...prev, selectedAlias: [] }));
      } else {
        setFilters(prev => ({ ...prev, selectedAlias: data.alias.map(a => a.id) }));
      }
    }
  }, [filters.selectedAlias.length, data.alias, idsAliasSelected]);

  const handleSelectAllUnidadesCompra = useCallback(() => {
    if (filters.selectedUnidadesCompra.length === data.relacionesUnidades.length + 1) {
      setFilters(prev => ({ ...prev, selectedUnidadesCompra: [] }));
    } else {
      setFilters(prev => ({ 
        ...prev, 
        selectedUnidadesCompra: [0, ...data.relacionesUnidades.map(u => u.id)] 
      }));
    }
  }, [filters.selectedUnidadesCompra.length, data.relacionesUnidades]);

  const updateMercadoSearchText = useCallback((text) => {
    setUi(prev => ({ ...prev, mercadoSearchText: text }));
  }, []);

  const updateCadenaSearchText = useCallback((text) => {
    setUi(prev => ({ ...prev, cadenaSearchText: text }));
  }, []);

  const updateAliasSearchText = useCallback((text) => {
    setUi(prev => ({ ...prev, aliasSearchText: text }));
  }, []);

  const updateUnidadCompraSearchText = useCallback((text) => {
    setUi(prev => ({ ...prev, unidadCompraSearchText: text }));
  }, []);

  const updateLocalizacionSearchText = useCallback((text) => {
    setUi(prev => ({ ...prev, localizacionSearchText: text }));
  }, []);

  const toggleShowFilters = useCallback(() => {
    setUi(prev => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const isAliasDisabled = useCallback((item) => {
    return idsAliasSelected.length > 0 && !idsAliasSelected.includes(item.id);
  }, [idsAliasSelected]);

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
            onClick={toggleShowFilters}
          >
            <span>{ui.showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}</span>
          </button>
        </div>
      </div>

      {idsAliasSelected.length > 0 && (
        <div className="info-message">
          <FaInfoCircle className="info-icon" />
          <span>
            {idsAliasSelected.length === 1 
              ? t('Solo se muestran relaciones para el alias seleccionado en la pantalla anterior. No es posible cambiar el alias en esta vista.')
              : t('Solo se muestran relaciones para los alias seleccionados en la pantalla anterior. Puede filtrar entre estos alias, pero no es posible añadir alias adicionales.')}
          </span>
        </div>
      )}

      {ui.showFilters && (
        <div className="filters-section">
          <div className="filters-row">
            <FilterDropdown
              label="Id o Nombre de Alias"
              placeholder="Seleccionar"
              isOpen={ui.openFilter === 'alias'}
              toggleFilter={toggleFilter}
              searchText={ui.aliasSearchText}
              setSearchText={updateAliasSearchText}
              filteredItems={filteredAlias}
              selectedItems={filters.selectedAlias}
              handleFilterSelect={handleFilterSelect}
              handleSelectAll={handleSelectAllAlias}
              allItems={idsAliasSelected.length > 0 ? idsAliasSelected : data.alias}
              isDisabled={isAliasDisabled}
              filterName="alias"
            />
            
            <FilterDropdown
              label="Id o Mercado"
              placeholder="Seleccionar"
              isOpen={ui.openFilter === 'mercado'}
              toggleFilter={toggleFilter}
              searchText={ui.mercadoSearchText}
              setSearchText={updateMercadoSearchText}
              filteredItems={filteredMercados}
              selectedItems={filters.selectedMercados}
              handleFilterSelect={handleFilterSelect}
              handleSelectAll={handleSelectAllMercados}
              allItems={data.mercados}
              filterName="mercado"
            />
            
            <FilterDropdown
              label="Id o Cadena"
              placeholder="Seleccionar"
              isOpen={ui.openFilter === 'cadena'}
              toggleFilter={toggleFilter}
              searchText={ui.cadenaSearchText}
              setSearchText={updateCadenaSearchText}
              filteredItems={filteredCadenas}
              selectedItems={filters.selectedCadenas}
              handleFilterSelect={handleFilterSelect}
              handleSelectAll={handleSelectAllCadenas}
              allItems={data.cadenas}
              filterName="cadena"
            />
            
            <div className="filter-item">
              <div className="filter-input">
                <span className="filter-label">Id Localización</span>
                <input 
                  type="text" 
                  placeholder="Escribe ID localización"
                  value={ui.localizacionSearchText}
                  onChange={(e) => updateLocalizacionSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>
            
            <FilterDropdown
              label="Id o Nombre de Unidad Compras Gestora"
              placeholder="Seleccionar"
              isOpen={ui.openFilter === 'unidadCompra'}
              toggleFilter={toggleFilter}
              searchText={ui.unidadCompraSearchText}
              setSearchText={updateUnidadCompraSearchText}
              filteredItems={[{id: 0, descripcion: 'Sin unidad de compra'}, ...filteredUnidadesCompra]}
              selectedItems={filters.selectedUnidadesCompra}
              handleFilterSelect={handleFilterSelect}
              handleSelectAll={handleSelectAllUnidadesCompra}
              allItems={[{id: 0, descripcion: 'Sin unidad de compra'}, ...data.relacionesUnidades]}
              filterName="unidadCompra"
            />
            
            <div className="search-button-container">
              <button 
                className="search-button"
                onClick={handleSearch}
                disabled={ui.loading}
              >
                <span>{t('BUSCAR')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="results-info">
        <span className="results-count">
          {ui.loading ? t('Cargando...') : 
            t('Cargados {{count}} resultados de {{total}} encontrados', {
              count: data.relaciones.length,
              total: ui.totalElements
            })}
          {' '}
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </span>
      </div>

      <div className="refresh-actions">
        <button 
          className="refresh-button"
          onClick={async () => {
            try {
              const response = await axios.get(`${BASE_URL}/relaciones/checkPausedRelations`);
              if (response.data.success) {
                alert(`Relaciones actualizadas: ${response.data.updatedCount}`);
                fetchRelaciones();
              }
            } catch (error) {
              console.error('Error al verificar relaciones pausadas:', error);
            }
          }}
        >
          <FaSyncAlt className="sync-icon" />
          <span>Verificar Pausas Expiradas</span>
        </button>
      </div>
      
      {ui.selectedItems.length > 0 && (
        <div className="selection-toolbar">
          <div className="selection-info">
            <span>
              {`${t('Seleccionados')} ${ui.selectedItems.length} ${t('resultados de')} ${ui.totalElements} ${t('encontrados')}`}
            </span>
          </div>
          <div className="selection-actions">
            <button 
              className="action-button activate-button" 
              onClick={handleActivateRelations}
              disabled={shouldDisableActivateButton() || modal.activateLoading}
            >
              <span className="action-icon">⚡</span> {modal.activateLoading ? t('ACTIVANDO...') : t('ACTIVAR LÍNEA')}
            </button>
            <button 
              className="action-button pause-button" 
              onClick={handlePauseRelations}
              disabled={shouldDisablePauseButton() || modal.pauseLoading}
            >
              <span className="action-icon">⏸️</span> {t('PAUSAR LÍNEA')}
            </button>
            <button 
              className="action-button pause-until-button" 
              onClick={handleOpenPauseModal}
              disabled={shouldDisablePauseButton() || modal.pauseLoading}
            >
              <span className="action-icon">🗓️</span> {t('PAUSAR LÍNEA HASTA')}
            </button>
          </div>
        </div>
      )}
      
      {ui.error && (
        <div className="error-message">
          {ui.error}
        </div>
      )}

      <div className="table-container" ref={tableContainerRef}>
        <table className="alias-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  checked={ui.selectAll} 
                  onChange={handleSelectAll} 
                  disabled={data.relaciones.length === 0 || ui.loading || ui.loadingAllItems}
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
              <th>{t('GLOBAL')}</th>
            </tr>
          </thead>
          <tbody>
            {ui.loading || ui.loadingAllItems ? (
              <tr>
                <td colSpan="10" className="loading-cell">
                  {ui.loadingAllItems ? t('Seleccionando todas las relaciones...') : t('Cargando datos...')}
                </td>
              </tr>
            ) : data.relaciones.length > 0 ? (
              data.relaciones.map((relacion) => (
                <TableRow
                  key={relacion.idAliasAmbitoAplanado}
                  relacion={relacion}
                  selectedItems={ui.selectedItems}
                  handleSelectItem={handleSelectItem}
                  normalizeText={normalizeText}
                  unidadesCompra={data.unidadesCompra}
                  updateUnidadCompra={updateUnidadCompra}
                  globalAjenosSelected={data.globalAjenosSelected}
                  handleGlobalAjenoChange={handleGlobalAjenoChange}
                  ajenos={data.ajenos}
                />
              ))
            ) : (
              <tr>
                <td colSpan="10" className="empty-table-message">
                  {t('No hay datos disponibles')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {ui.loadingMore && (
          <div className="load-more-indicator">
            {t('Cargando más datos...')}
          </div>
        )}
        
        <div ref={tableEndRef}></div>
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
          disabled={!ui.isModified}
        >
          {t('GUARDAR')}
        </button>
      </div>
      
      <PauseModal 
        isOpen={modal.pauseModalOpen}
        onClose={() => setModal(prev => ({ ...prev, pauseModalOpen: false }))}
        onConfirm={handlePauseModalConfirm}
        pauseDate={modal.pauseUntilDate}
        setPauseDate={(date) => setModal(prev => ({ ...prev, pauseUntilDate: date }))}
        loading={modal.pauseLoading}
      />
    </div>
  );
};

export default EdicionRelaciones;