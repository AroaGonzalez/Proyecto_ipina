import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaFilter, FaCalendarAlt, FaUndo, FaRedo, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/consultaStocks.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ConsultaStocks = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);

  const [idAlias, setIdAlias] = useState('');
  const [tipoAlias, setTipoAlias] = useState('');
  const [idLocalizacion, setIdLocalizacion] = useState('');
  const [idMercado, setIdMercado] = useState('');
  const [idGrupoCadena, setIdGrupoCadena] = useState('');
  const [idCadena, setIdCadena] = useState('');
  
  const [aliasSearch, setAliasSearch] = useState('');
  const [tipoAliasSearch, setTipoAliasSearch] = useState('');
  const [mercadoSearch, setMercadoSearch] = useState('');
  const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
  const [cadenaSearch, setCadenaSearch] = useState('');
  
  const [openFilter, setOpenFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [totalElements, setTotalElements] = useState(0);

  const dropdownRef = useRef(null);
  const tableContainerRef = useRef();
  const [paginaActual, setPaginaActual] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tamañoPagina] = useState(50);

  const [aliases, setAliases] = useState([]);
  const [tiposAlias, setTiposAlias] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  
  const [selectedAlias, setSelectedAlias] = useState([]);
  const [selectedTipoAlias, setSelectedTipoAlias] = useState([]);
  const [selectedMercado, setSelectedMercado] = useState([]);
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState([]);
  const [selectedCadena, setSelectedCadena] = useState([]);
  
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [modifiedItems, setModifiedItems] = useState({});
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaveEnabled(Object.keys(modifiedItems).length > 0);
  }, [modifiedItems]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        const [
          aliasesRes,
          tiposAliasRes,
          mercadosRes,
          gruposCadenaRes,
          cadenasRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/stock/alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/tipos-alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/stock/cadenas?idIdioma=${languageId}`)
        ]);
        
        setAliases(aliasesRes.data || []);
        setTiposAlias(tiposAliasRes.data || []);
        setMercados(mercadosRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setCadenas(cadenasRes.data || []);
        
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
          loadMoreStocks();
        }
      };
  
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, loadingMore, hasMore, stocks]);

  const loadMoreStocks = async () => {
    if (!hasMore || loadingMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = paginaActual + 1;
      
      const filter = {
        idsAlias: selectedAlias.length > 0 ? selectedAlias : null,
        idsTipoAlias: selectedTipoAlias.length > 0 ? selectedTipoAlias : null,
        idLocalizacion: idLocalizacion || null,
        idsMercado: selectedMercado.length > 0 ? selectedMercado : null,
        idsGrupoCadena: selectedGrupoCadena.length > 0 ? selectedGrupoCadena : null,
        idsCadena: selectedCadena.length > 0 ? selectedCadena : null
      };
      
      const page = { number: nextPage, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/stock/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      const newStocks = response.data.stocks || [];
      
      if (newStocks.length === 0 || newStocks.length < tamañoPagina) {
        setHasMore(false);
      }
      
      setStocks(prevStocks => [...prevStocks, ...newStocks]);
      setPaginaActual(nextPage);
      
    } catch (error) {
      console.error('Error al cargar más stocks:', error);
      setError('Error al cargar más stocks');
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

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
  
  const handleStockRecuentoChange = (idAlias, idLocalizacionCompra, value) => {
    const stockKey = `${idAlias}-${idLocalizacionCompra}`;
    const originalItem = stocks.find(s => 
      s.idAlias === idAlias && s.idLocalizacionCompra === idLocalizacionCompra
    );
    const originalValue = originalItem?.stockRecuentos?.toString() || '';
    
    if (value !== originalValue) {
      setModifiedItems(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          stockRecuentos: value,
          idAlias,
          idLocalizacionCompra
        }
      }));
    } else {
      removeModification(stockKey, 'stockRecuentos');
    }
  };

  const handleCapacidadMaximaChange = (idAlias, idLocalizacionCompra, value) => {
    const stockKey = `${idAlias}-${idLocalizacionCompra}`;
    const originalItem = stocks.find(s => 
      s.idAlias === idAlias && s.idLocalizacionCompra === idLocalizacionCompra
    );
    const originalValue = originalItem?.capacidadMaxima?.toString() || '';
    
    if (value !== originalValue) {
      setModifiedItems(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          capacidadMaxima: value,
          idAlias,
          idLocalizacionCompra
        }
      }));
    } else {
      removeModification(stockKey, 'capacidadMaxima');
    }
  };

  const handlePropuestaMinChange = (idAlias, idLocalizacionCompra, value) => {
    const stockKey = `${idAlias}-${idLocalizacionCompra}`;
    const originalItem = stocks.find(s => 
      s.idAlias === idAlias && s.idLocalizacionCompra === idLocalizacionCompra
    );
    const originalValue = originalItem?.stockMinimo?.toString() || '';
    
    if (value !== originalValue) {
      setModifiedItems(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          stockMinimo: value,
          idAlias,
          idLocalizacionCompra
        }
      }));
    } else {
      removeModification(stockKey, 'stockMinimo');
    }
  };

  const handleStockLimiteChange = (idAlias, idLocalizacionCompra, value) => {
    const stockKey = `${idAlias}-${idLocalizacionCompra}`;
    const originalItem = stocks.find(s => 
      s.idAlias === idAlias && s.idLocalizacionCompra === idLocalizacionCompra
    );
    const originalValue = originalItem?.stockMaximo?.toString() || '';
    
    if (value !== originalValue) {
      setModifiedItems(prev => ({
        ...prev,
        [stockKey]: {
          ...prev[stockKey],
          stockMaximo: value,
          idAlias,
          idLocalizacionCompra
        }
      }));
    } else {
      removeModification(stockKey, 'stockMaximo');
    }
  };

  const removeModification = (stockKey, field) => {
    setModifiedItems(prev => {
      const newModifiedItems = { ...prev };
      if (newModifiedItems[stockKey]) {
        delete newModifiedItems[stockKey][field];
        
        if (Object.keys(newModifiedItems[stockKey]).filter(k => k !== 'idAlias' && k !== 'idLocalizacionCompra').length === 0) {
          delete newModifiedItems[stockKey];
        }
      }
      return newModifiedItems;
    });
  };

  const handleSaveChanges = () => {
    if (!saveEnabled || Object.keys(modifiedItems).length === 0) return;
    
    setSaving(true);
    
    const stocksToUpdate = Object.entries(modifiedItems).map(([key, changes]) => {
      const originalItem = stocks.find(s => 
        s.idAlias === changes.idAlias && 
        s.idLocalizacionCompra === changes.idLocalizacionCompra
      );
      
      return {
        idAlias: changes.idAlias,
        idLocalizacionCompra: changes.idLocalizacionCompra,
        stockRecuentos: changes.stockRecuentos !== undefined 
          ? parseInt(changes.stockRecuentos) 
          : originalItem.stockRecuentos,
        capacidadMaxima: changes.capacidadMaxima !== undefined 
          ? parseInt(changes.capacidadMaxima) 
          : originalItem.capacidadMaxima,
        stockMinimo: changes.stockMinimo !== undefined 
          ? parseInt(changes.stockMinimo) 
          : originalItem.stockMinimo,
        stockMaximo: changes.stockMaximo !== undefined 
          ? parseInt(changes.stockMaximo) 
          : originalItem.stockMaximo
      };
    });
    
    axios
      .put(`${BASE_URL}/stock/update?idIdioma=${languageId}`, { 
        stocks: stocksToUpdate 
      })
      .then(response => {
        console.log('Cambios guardados:', response.data);
        alert(t(`${response.data.updatedCount} stocks actualizados correctamente`));
        setModifiedItems({});
        handleSearch();
      })
      .catch(error => {
        console.error('Error al guardar cambios:', error);
        alert(t('Error al guardar los cambios'));
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const handleSelectAll = () => {
    if (!selectAll) {
      const allStockIds = stocks.map(stock => `${stock.idAlias}-${stock.idLocalizacionCompra}`);
      setSelectedStocks(allStockIds);
      setSelectAll(true);
    } else {
      setSelectedStocks([]);
      setSelectAll(false);
    }
  };

  const handleSelectStock = (idAlias, idLocalizacionCompra) => {
    const stockId = `${idAlias}-${idLocalizacionCompra}`;
    setSelectedStocks(prev => {
      if (prev.includes(stockId)) {
        return prev.filter(id => id !== stockId);
      } else {
        return [...prev, stockId];
      }
    });
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
        (item.nombre || item.descripcion || '');
      
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
      setHasMore(true);
      setPaginaActual(0);
    
      const filter = {
        idsAlias: selectedAlias.length > 0 ? selectedAlias : null,
        idsTipoAlias: selectedTipoAlias.length > 0 ? selectedTipoAlias : null,
        idLocalizacion: idLocalizacion || null,
        idsMercado: selectedMercado.length > 0 ? selectedMercado : null,
        idsGrupoCadena: selectedGrupoCadena.length > 0 ? selectedGrupoCadena : null,
        idsCadena: selectedCadena.length > 0 ? selectedCadena : null
      };
      
      const page = { number: 0, size: tamañoPagina };
      
      const response = await axios.post(`${BASE_URL}/stock/filter?idIdioma=${languageId}`, {
        filter,
        page
      });
      
      setStocks(response.data.stocks || []);
      setTotalElements(response.data.page.total || 0);
      setUltimaActualizacion(new Date());
      setShowResults(true);

      if (
        response.data.stocks.length === 0 || 
        response.data.stocks.length < tamañoPagina || 
        response.data.stocks.length === response.data.page.total
      ) {
        setHasMore(false);
      }
    
    } catch (error) {
      console.error('Error al buscar stocks:', error);
      setError('Error al buscar stocks');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setIdAlias('');
    setSelectedAlias([]);
    setTipoAlias('');
    setSelectedTipoAlias([]);
    setIdLocalizacion('');
    setIdMercado('');
    setSelectedMercado([]);
    setIdGrupoCadena('');
    setSelectedGrupoCadena([]);
    setIdCadena('');
    setSelectedCadena([]);
    setShowResults(false);
    setStocks([]);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'alias':
        if (selectedAlias.includes(value)) {
          setSelectedAlias(selectedAlias.filter(item => item !== value));
        } else {
          setSelectedAlias([...selectedAlias, value]);
        }
        break;
      case 'tipoAlias':
        if (selectedTipoAlias.includes(value)) {
          setSelectedTipoAlias(selectedTipoAlias.filter(item => item !== value));
        } else {
          setSelectedTipoAlias([...selectedTipoAlias, value]);
        }
        break;
      case 'mercado':
        if (selectedMercado.includes(value)) {
          setSelectedMercado(selectedMercado.filter(item => item !== value));
        } else {
          setSelectedMercado([...selectedMercado, value]);
        }
        break;
      case 'grupoCadena':
        if (selectedGrupoCadena.includes(value)) {
          setSelectedGrupoCadena(selectedGrupoCadena.filter(item => item !== value));
        } else {
          setSelectedGrupoCadena([...selectedGrupoCadena, value]);
        }
        break;
      case 'cadena':
        if (selectedCadena.includes(value)) {
          setSelectedCadena(selectedCadena.filter(item => item !== value));
        } else {
          setSelectedCadena([...selectedCadena, value]);
        }
        break;
      default:
        break;
    }
  };

  if (error) {
    return (
      <div className="consulta-stocks-error">
        <span>{error}</span>
        <button onClick={clearFilters} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }

  const StatusTag = ({ status, type }) => {
    let className = 'status-tag';
    
    const normalizedStatus = status ? status.toUpperCase().trim() : '';
    
    if (normalizedStatus === 'ACTIVO' || normalizedStatus === 'ACTIVA' || 
        normalizedStatus === 'ACTIVE' || normalizedStatus === '02.ACTIVO' ||
        normalizedStatus === 'ABIERTA' || normalizedStatus === '02.ACTIVE'
        || normalizedStatus === 'OPEN') {
      className += ' status-active';
    } else if (normalizedStatus === 'PROVISIONAL') {
      className += ' status-provisional';
    } else if (normalizedStatus === 'CERRADA DEFINITIVAMENTE' || normalizedStatus === 'DEFINITIVELY CLOSED') {
      className += ' status-closed';
    } else if (normalizedStatus === 'PAUSADA' || normalizedStatus === 'PAUSADO' || normalizedStatus === 'PAUSED') {
      className += ' status-paused';
    } else if (normalizedStatus === 'PRODUCCIÓN' || normalizedStatus === 'PRODUCCION' || normalizedStatus === 'PRODUCTION') {
      className += ' status-production';
    }
    
    return <div className={className}>{status || '-'}</div>;
  };

  const StocksTable = ({ stocks, loading }) => {
    if (loading && stocks.length === 0) {
      return <div className="loading-indicator">{t('Cargando...')}</div>;
    }

    if (!stocks || stocks.length === 0) {
      return null;
    }

    return (
      <div className="stocks-table-container" ref={tableContainerRef}>
        <table className="stocks-table">
          <thead>
            <tr>
              <th className="id-column">{t('ID ALIAS')}</th>
              <th className="medium-text-column">{t('ALIAS')}</th>
              <th className="short-text-column">{t('ALIAS TIPO')}</th>
              <th className="short-text-column">{t('RELACIONADO CON')}</th>
              <th className="short-text-column">{t('STOCK TEÓRICO')}</th>
              <th className="short-text-column">{t('STOCK RECUENTO')}</th>
              <th className="short-text-column">{t('CAPACIDAD MÁXIMA')}</th>
              <th className="short-text-column">{t('PROPUESTA MIN')}</th>
              <th className="short-text-column">{t('STOCK LIMITE (%)')}</th>
              <th className="id-column">{t('ID LOCALIZACIÓN')}</th>
              <th className="short-text-column">{t('TIENDA')}</th>
              <th className="short-text-column">{t('MERCADO')}</th>
              <th className="short-text-column">{t('CADENA')}</th>
              <th className="short-text-column">{t('FECHA DE RECUENTO')}</th>
              <th className="short-text-column">{t('FECHA STOCK TEÓRICO')}</th>
              <th className="short-text-column">{t('FECHA EDICIÓN')}</th>
              <th className="short-text-column">{t('USUARIO')}</th>
              <th className="short-text-column">{t('ESTADO ALIAS')}</th>
              <th className="short-text-column">{t('ESTADO ARTÍCULO SFI')}</th>
              <th className="short-text-column">{t('ESTADO ARTÍCULO RAM')}</th>
              <th className="short-text-column">{t('ESTADO ARTÍCULO EN EL ALIAS')}</th>
              <th className="short-text-column">{t('ESTADO RELACIÓN')}</th>
              <th className="short-text-column">{t('ESTADO DE TIENDA MTU')}</th>
              <th className="short-text-column">{t('ESTADO DE TIENDA RAM')}</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr 
                key={`${stock.idAlias}-${stock.idLocalizacionCompra}`} 
                className={selectedStocks.includes(`${stock.idAlias}-${stock.idLocalizacionCompra}`) ? 'selected-row' : ''}
              >
                <td className="id-column">{stock.idAlias}</td>
                <td className="medium-text-column">{normalizeText(stock.nombreAlias)}</td>
                <td className="short-text-column">{stock.idTipoAlias}</td>
                <td className="short-text-column">{stock.relacionAliasLocalizacion}</td>
                <td className="short-text-column">{stock.stockTeorico}</td>
                <td className="short-text-column">
                  <div className="quantity-input">
                    <input
                      type="number"
                      value={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockRecuentos ?? (stock.stockRecuentos || '')}
                      onChange={(e) => handleStockRecuentoChange(stock.idAlias, stock.idLocalizacionCompra, e.target.value)}
                      className={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockRecuentos !== undefined ? 'modified' : ''}
                    />
                  </div>
                </td>

                <td className="short-text-column">
                  <div className="quantity-input">
                    <input
                      type="number"
                      value={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.capacidadMaxima ?? (stock.capacidadMaxima || '')}
                      onChange={(e) => handleCapacidadMaximaChange(stock.idAlias, stock.idLocalizacionCompra, e.target.value)}
                      className={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.capacidadMaxima !== undefined ? 'modified' : ''}
                    />
                  </div>
                </td>

                <td className="short-text-column">
                  <div className="quantity-input">
                    <input
                      type="number"
                      value={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockMinimo ?? (stock.stockMinimo || '')}
                      onChange={(e) => handlePropuestaMinChange(stock.idAlias, stock.idLocalizacionCompra, e.target.value)}
                      className={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockMinimo !== undefined ? 'modified' : ''}
                    />
                  </div>
                </td>

                <td className="short-text-column">
                  <div className="quantity-input">
                    <input
                      type="number"
                      value={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockMaximo ?? (stock.stockMaximo)}
                      onChange={(e) => handleStockLimiteChange(stock.idAlias, stock.idLocalizacionCompra, e.target.value)}
                      className={modifiedItems[`${stock.idAlias}-${stock.idLocalizacionCompra}`]?.stockMaximo !== undefined ? 'modified' : ''}
                    />
                  </div>
                </td>
                <td className="id-column">{stock.idLocalizacionCompra}</td>
                <td className="short-text-column">{normalizeText(stock.descripcionLocalizacionCompra)}</td>
                <td className="short-text-column">
                  {stock.idPais} - {normalizeText(stock.descripcionPais)}
                </td>
                <td className="short-text-column">{normalizeText(stock.nombreCadena)}</td>
                <td className="medium-text-column">{normalizeText(stock.fechaRecuento)}</td>
                <td className="medium-text-column">{normalizeText(stock.fechaHoraEjecucionStockTeorico)}</td>
                <td className="medium-text-column">{normalizeText(stock.fechaModificacion)}</td>
                <td className="medium-text-column">{"userTest"}</td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoAlias} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoAjenoCompras} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoAjenoRam} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoAliasAjeno} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoRelacion} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.estadoTiendaMtu} />
                </td>
                <td className="medium-text-column">
                  <StatusTag status={stock.descripcionTipoEstadoLocalizacionRam} />
                </td>
              </tr>
            ))}
            {loadingMore && (
              <tr>
                <td colSpan="25" className="loading-more-cell">
                  <div className="loading-more-indicator">Cargando más resultados...</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="consulta-stocks-container">
      <div className="consulta-stocks-header">
        <h1 className="consulta-stocks-title">{t('CONSULTA STOCKS')}</h1>
        <div className="filter-toggle">
          <button className="filter-button" onClick={toggleFilters}>
            <FaFilter /> {showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-section" ref={dropdownRef}>
          <div className="filters-row">
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('alias')}
              >
                <label className="filter-label">{t('Id o Nombre de Alias')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedAlias.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedAlias.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'alias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder= {t("Buscar alias...")}
                        value={aliasSearch}
                        onChange={(e) => setAliasSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
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
                            checked={selectedAlias.includes(alias.id)}
                            readOnly
                          />
                          <span>{alias.id} - {normalizeText(alias.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedAlias.length === aliases.length) {
                          setSelectedAlias([]);
                        } else {
                          setSelectedAlias(aliases.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedAlias.length === aliases.length && aliases.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoAlias')}
              >
                <label className="filter-label">{t('Tipo de Alias')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedTipoAlias.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedTipoAlias.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'tipoAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar tipo...")}
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
                            checked={selectedTipoAlias.includes(tipoAlias.id)}
                            readOnly
                          />
                          <span>{tipo.id} - {normalizeText(tipo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedTipoAlias.length === tiposAlias.length) {
                          setSelectedTipoAlias([]);
                        } else {
                          setSelectedTipoAlias(tiposAlias.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedTipoAlias.length === tiposAlias.length && mercados.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <label className="filter-label">{t('Id Localización')}</label>
              <input
                type="text"
                placeholder={t("Id Localización")}
                value={idLocalizacion}
                onChange={(e) => setIdLocalizacion(e.target.value)}
                className="filter-input"
              />
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('mercado')}
              >
                <label className="filter-label">{t('Id o Mercado')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedMercado.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedMercado.length })
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
                            checked={selectedMercado.includes(mercado.id)}
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
                        if (selectedMercado.length === mercados.length) {
                          setSelectedMercado([]);
                        } else {
                          setSelectedMercado(mercados.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedMercado.length === mercados.length && mercados.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('grupoCadena')}
              >
                <label className="filter-label">{t('Id o Grupo Cadena (T6)')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedGrupoCadena.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedGrupoCadena.length })
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
                            checked={selectedGrupoCadena.includes(grupo.id)}
                            readOnly
                          />
                          <span>{grupo.id} - {normalizeText(grupo.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedGrupoCadena.length === gruposCadena.length) {
                          setSelectedGrupoCadena([]);
                        } else {
                          setSelectedGrupoCadena(gruposCadena.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedGrupoCadena.length === gruposCadena.length && gruposCadena.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="filter-field">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('cadena')}
              >
                <label className="filter-label">{t('Id o Cadena')}</label>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedCadena.length > 0 
                      ? t('{{count}} seleccionados', { count: selectedCadena.length })
                      : t('Seleccionar')}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'cadena' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder={t("Buscar cadena...")}
                        value={cadenaSearch}
                        onChange={(e) => setCadenaSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
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
                            checked={selectedCadena.includes(cadena.id)}
                            readOnly
                          />
                          <span>{cadena.id} - {normalizeText(cadena.descripcion)}</span>
                        </div>
                      ))}
                    </div>
                    <div 
                      className="dropdown-item select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedCadena.length === cadenas.length) {
                          setSelectedCadena([]);
                        } else {
                          setSelectedCadena(cadenas.map(item => item.id));
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedCadena.length === cadenas.length && cadenas.length > 0}
                        readOnly
                      />
                      <span>{t('Seleccionar todo')}</span>
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
                {t('BUSCAR')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showResults && (
        <div className="stocks-results-info">
          <div className="results-count">
            {t('Cargados')} {stocks.length} {t('resultados de')} {totalElements} {t('encontrados')}
            <span className="last-update">
              <FaRedo className="update-icon" />
              {t('Última actualización')}: {formatTime(ultimaActualizacion)}
            </span>
          </div>
          <div className="results-actions">
            <button 
              className={`save-button ${saveEnabled ? 'active' : 'disabled'}`}
              onClick={handleSaveChanges}
              disabled={!saveEnabled || saving}
            >
              <span role="img" aria-label="document">📄</span>
              {saving ? t('GUARDANDO...') : t('GUARDAR CAMBIOS')}
            </button>
          </div>
        </div>
      )}
      
      {showResults ? (
        loading ? (
          <div className="loading-indicator">{t('Cargando...')}</div>
        ) : stocks.length > 0 ? (
          <StocksTable stocks={stocks} loading={loading} />
        ) : (
          <div className="no-results">
            <div className="search-icon">
              <FaSearch />
            </div>
            <p className="no-results-text">{t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}</p>
          </div>
        )
      ) : (
        <div className="no-search-yet">
          <div className="search-icon">
            <FaSearch />
          </div>
          <p className="no-results-text">{t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}</p>
        </div>
      )}
    </div>
  );
};

export default ConsultaStocks;