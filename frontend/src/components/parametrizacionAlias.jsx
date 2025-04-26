import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSyncAlt, FaSearch, FaChevronDown, FaPencilAlt, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/parametrizacionAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const ParametrizacionAlias = () => {
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const [aliases, setAliases] = useState([]);
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
  const [activeTab, setActiveTab] = useState('ALIAS');
  const [openFilter, setOpenFilter] = useState(null);
  const tableContainerRef = useRef(null);
  const tableEndRef = useRef(null);

  // Estados para la pestaña de ARTÍCULOS
  const [aliasAjenos, setAliasAjenos] = useState([]);
  const [loadingAjenos, setLoadingAjenos] = useState(false);
  const [loadingMoreAjenos, setLoadingMoreAjenos] = useState(false);
  const [selectAllAjenos, setSelectAllAjenos] = useState(false);
  const [selectedItemsAjenos, setSelectedItemsAjenos] = useState([]);
  const [totalElementsAjenos, setTotalElementsAjenos] = useState(0);
  const [currentPageAjenos, setCurrentPageAjenos] = useState(0);
  const [hasMoreAjenos, setHasMoreAjenos] = useState(true);

  const [tiposAlias, setTiposAlias] = useState([]);
  const [estadosAlias, setEstadosAlias] = useState([]);
  const [estacionalidades, setEstacionalidades] = useState([]);
  const [articulos, setArticulos] = useState([]);
  const [aliasOptions, setAliasOptions] = useState([]);

  const [selectedTiposAlias, setSelectedTiposAlias] = useState([]);
  const [selectedNombresAlias, setSelectedNombresAlias] = useState([]);
  const [selectedEstadosAlias, setSelectedEstadosAlias] = useState([]);
  const [selectedEstacionalidades, setSelectedEstacionalidades] = useState([]);
  const [selectedArticulos, setSelectedArticulos] = useState([]);

  // Estados para los textos de búsqueda en cada filtro
  const [searchText, setSearchText] = useState('');
  const [tipoAliasSearchText, setTipoAliasSearchText] = useState('');
  const [estadoAliasSearchText, setEstadoAliasSearchText] = useState('');
  const [estacionalidadSearchText, setEstacionalidadSearchText] = useState('');
  const [articulosSearchText, setArticulosSearchText] = useState('');

  useEffect(() => {
    fetchFilterOptions();
    fetchAliases();
  }, [languageId]);

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
        if (activeTab === 'ALIAS' && !loadingMore && hasMore && scrollTop + clientHeight >= scrollHeight - 100) {
          loadMoreData();
        } else if (activeTab === 'ARTICULOS' && !loadingMoreAjenos && hasMoreAjenos && scrollTop + clientHeight >= scrollHeight - 100) {
          loadMoreAjenosData();
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
  }, [loadingMore, hasMore, loadingMoreAjenos, hasMoreAjenos, activeTab]);

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

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      await fetchAliases(undefined, nextPage, true);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error cargando más datos:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleActivarArticulos = async () => {
    try {
      setLoadingAjenos(true);
      
      const selectedIds = selectedItemsAjenos.map(item => {
        const [idAlias, idAjeno] = item.split('-');
        return { idAlias, idAjeno };
      });
      
      const response = await axios.put(`${BASE_URL}/activar-alias-ajeno`, {
        items: selectedIds
      });
      
      if (response.data.success) {
        const updatedAliasAjenos = aliasAjenos.map(item => {
          if (selectedItemsAjenos.includes(`${item.idAlias}-${item.idAjeno}`)) {
            return {
              ...item,
              descripcionTipoEstadoAliasAjenoRam: 'ACTIVO'
            };
          }
          return item;
        });
        
        setAliasAjenos(updatedAliasAjenos);
        setSelectedItemsAjenos([]);
        setSelectAllAjenos(false);
        
        alert(t('Los artículos han sido activados correctamente'));
      }
    } catch (error) {
      console.error('Error al activar artículos:', error);
      setError(t('Error al activar artículos'));
    } finally {
      setLoadingAjenos(false);
    }
  };

  const handlePausarArticulos = async () => {
    try {
      setLoadingAjenos(true);
      
      const selectedIds = selectedItemsAjenos.map(item => {
        const [idAlias, idAjeno] = item.split('-');
        return { idAlias, idAjeno };
      });
      
      const response = await axios.put(`${BASE_URL}/pausar-alias-ajeno`, {
        items: selectedIds
      });
      
      if (response.data.success) {
        const updatedAliasAjenos = aliasAjenos.map(item => {
          if (selectedItemsAjenos.includes(`${item.idAlias}-${item.idAjeno}`)) {
            return {
              ...item,
              descripcionTipoEstadoAliasAjenoRam: 'PAUSADO'
            };
          }
          return item;
        });
        
        setAliasAjenos(updatedAliasAjenos);
        setSelectedItemsAjenos([]);
        setSelectAllAjenos(false);
        
        alert(t('Los artículos han sido pausados correctamente'));
      }
    } catch (error) {
      console.error('Error al pausar artículos:', error);
      setError(t('Error al pausar artículos'));
    } finally {
      setLoadingAjenos(false);
    }
  };

  const handleDeleteArticulos = async () => {
    try {
      if (selectedItemsAjenos.length === 0) return;
      
      if (!window.confirm(t('¿Está seguro de que desea eliminar los artículos seleccionados?'))) {
        return;
      }
      
      setLoadingAjenos(true);
      
      // Format the selected items
      const selectedIds = selectedItemsAjenos.map(item => {
        const [idAlias, idAjeno] = item.split('-');
        return { 
          idAlias: parseInt(idAlias), 
          idAjeno: parseInt(idAjeno) 
        };
      });
      
      // Use PUT method with items in the request body
      const response = await axios.delete(`${BASE_URL}/delete-alias-ajeno`, {
        data: {
          items: selectedIds,
          usuario: 'WEBAPP'
        }
      });
      
      if (response.data.success) {
        const filteredAliasAjenos = aliasAjenos.filter(item => 
          !selectedItemsAjenos.includes(`${item.idAlias}-${item.idAjeno}`)
        );
        
        setAliasAjenos(filteredAliasAjenos);
        setSelectedItemsAjenos([]);
        setSelectAllAjenos(false);
        
        alert(t(`${response.data.successCount} artículos han sido eliminados correctamente`));
        
        await fetchAliasAjenos();
      }
    } catch (error) {
      console.error('Error al eliminar artículos:', error);
      setError(t('Error al eliminar artículos'));
      alert(t('Error al eliminar artículos. Por favor, inténtelo de nuevo.'));
    } finally {
      setLoadingAjenos(false);
    }
  };

  const shouldDisableActivarButton = () => {
    if (selectedItemsAjenos.length === 0) return true;
    
    const hasNonActive = selectedItemsAjenos.some(id => {
      const [idAlias, idAjeno] = id.split('-');
      const item = aliasAjenos.find(
        item => item.idAlias == idAlias && item.idAjeno == idAjeno
      );
      return item && (
        item.descripcionTipoEstadoAliasAjenoRam !== 'ACTIVO' && 
        item.idTipoEstadoAliasAjenoRam !== 1
      );
    });
    
    const hasActive = selectedItemsAjenos.some(id => {
      const [idAlias, idAjeno] = id.split('-');
      const item = aliasAjenos.find(
        item => item.idAlias == idAlias && item.idAjeno == idAjeno
      );
      return item && (
        item.descripcionTipoEstadoAliasAjenoRam === 'ACTIVO' || 
        item.idTipoEstadoAliasAjenoRam === 1
      );
    });
    
    if (hasActive && hasNonActive) return true;
    if (hasActive && !hasNonActive) return true;
    return false;
  };
  
  const shouldDisablePausarButton = () => {
    if (selectedItemsAjenos.length === 0) return true;
    
    const hasNonPaused = selectedItemsAjenos.some(id => {
      const [idAlias, idAjeno] = id.split('-');
      const item = aliasAjenos.find(
        item => item.idAlias == idAlias && item.idAjeno == idAjeno
      );
      return item && (
        item.descripcionTipoEstadoAliasAjenoRam !== 'PAUSADO' && 
        item.idTipoEstadoAliasAjenoRam !== 2
      );
    });
    
    const hasPaused = selectedItemsAjenos.some(id => {
      const [idAlias, idAjeno] = id.split('-');
      const item = aliasAjenos.find(
        item => item.idAlias == idAlias && item.idAjeno == idAjeno
      );
      return item && (
        item.descripcionTipoEstadoAliasAjenoRam === 'PAUSADO' || 
        item.idTipoEstadoAliasAjenoRam === 2
      );
    });
    
    if (hasPaused && hasNonPaused) return true;
    if (hasPaused && !hasNonPaused) return true;
    return false;
  };

  const loadMoreAjenosData = async () => {
    if (!hasMoreAjenos || loadingMoreAjenos) return;
    
    setLoadingMoreAjenos(true);
    try {
      const nextPage = currentPageAjenos + 1;
      await fetchAliasAjenos(nextPage, true);
      setCurrentPageAjenos(nextPage);
    } catch (error) {
      console.error('Error cargando más datos de artículos:', error);
    } finally {
      setLoadingMoreAjenos(false);
    }
  };

  const fetchFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const [tiposAliasRes, estadosAliasRes, estacionalidadesRes, articulosRes, aliasOptionsRes] = await Promise.all([
        axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/tipos-estado?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/tipos-estacionalidad?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/ajeno?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/alias?idIdioma=${languageId}`)
      ]);
      
      const processTiposAlias = tiposAliasRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processEstadosAlias = estadosAliasRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processEstacionalidades = estacionalidadesRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      const processArticulos = articulosRes.data?.map(item => ({
        id: item.id,
        descripcion: item.nombre || item.descripcion || `Artículo ${item.id}`
      })) || [];
      
      const processAliasOptions = aliasOptionsRes.data?.map(item => ({
        id: item.id,
        descripcion: item.descripcion
      })) || [];
      
      setTiposAlias(processTiposAlias);
      setEstadosAlias(processEstadosAlias);
      setEstacionalidades(processEstacionalidades);
      setArticulos(processArticulos);
      setAliasOptions(processAliasOptions);
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  const fetchAliasAjenos = async (page = 0, append = false) => {
    if (page === 0) {
      setLoadingAjenos(true);
      setHasMoreAjenos(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('idIdioma', languageId);
      params.append('page', page);
      params.append('size', 50);
      
      // Añadir los filtros aplicados actualmente
      if (selectedNombresAlias.length > 0) {
        const nombresAliasToFilter = selectedNombresAlias.filter(id => id !== 'selectAll');
        nombresAliasToFilter.forEach(id => {
          params.append('idAlias', id);
        });
      }
      
      // Otros filtros específicos para artículos si son necesarios
      const articulosToFilter = selectedArticulos.filter(id => id !== 'selectAll');
      if (articulosToFilter.length > 0) {
        articulosToFilter.forEach(id => {
          params.append('idAjeno', id);
        });
      }
      
      console.log('Parámetros enviados para alias ajenos:', params.toString());
      
      const response = await axios.get(`${BASE_URL}/alias/ajenos/filter?${params.toString()}`);
      
      if (response.data && response.data.content) {
        if (append) {
          setAliasAjenos(prev => [...prev, ...response.data.content]);
        } else {
          setAliasAjenos(response.data.content);
          setCurrentPageAjenos(0);
        }
        
        setTotalElementsAjenos(response.data.totalElements || 0);
        
        if (response.data.content.length === 0 || 
            (response.data.totalPages && page >= response.data.totalPages - 1)) {
          setHasMoreAjenos(false);
        }
      } else {
        if (!append) {
          setAliasAjenos([]);
        }
        setTotalElementsAjenos(0);
        setHasMoreAjenos(false);
      }
    } catch (error) {
      console.error('Error loading alias ajenos:', error);
      setError(t('No se pudieron cargar los artículos de alias'));
    } finally {
      if (page === 0) {
        setLoadingAjenos(false);
      }
    }
  };

  const fetchAliases = async (filters = {}, page = 0, append = false) => {
    if (page === 0) {
      setLoading(true);
      setHasMore(true);
    }
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.append('idIdioma', languageId);
      params.append('page', page);
      params.append('size', 50);
      
      const tiposAliasToFilter = selectedTiposAlias.filter(id => id !== 'selectAll');
      const estadosAliasToFilter = selectedEstadosAlias.filter(id => id !== 'selectAll');
      const estacionalidadesToFilter = selectedEstacionalidades.filter(id => id !== 'selectAll');
      const articulosToFilter = selectedArticulos.filter(id => id !== 'selectAll');
      const nombresAliasToFilter = selectedNombresAlias.filter(id => id !== 'selectAll');
      
      if (tiposAliasToFilter.length > 0) {
        tiposAliasToFilter.forEach(id => {
          params.append('tipoAlias', id);
        });
        console.log('Filtrando por tipos de alias:', tiposAliasToFilter);
      }
      
      if (nombresAliasToFilter.length > 0) {
        nombresAliasToFilter.forEach(id => {
          params.append('idAlias', id);
        });
      }
      
      if (estadosAliasToFilter.length > 0) {
        estadosAliasToFilter.forEach(id => {
          params.append('estadoAlias', id);
        });
      }
      
      if (estacionalidadesToFilter.length > 0) {
        estacionalidadesToFilter.forEach(id => {
          params.append('estacionalidad', id);
        });
      }
      
      if (articulosToFilter.length > 0) {
        articulosToFilter.forEach(id => {
          params.append('articulos', id);
        });
      }
      
      console.log('Parámetros enviados:', params.toString());
      
      const response = await axios.get(`${BASE_URL}/filter?${params.toString()}`);
      
      if (response.data && response.data.content) {
        if (append) {
          setAliases(prev => [...prev, ...response.data.content]);
        } else {
          setAliases(response.data.content);
          setCurrentPage(0);
        }
        
        setTotalElements(response.data.totalElements || 0);
        
        if (response.data.content.length === 0 || 
            (response.data.totalPages && page >= response.data.totalPages - 1)) {
          setHasMore(false);
        }
      } else {
        if (!append) {
          setAliases([]);
        }
        setTotalElements(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading aliases:', error);
      setError(t('No se pudieron cargar los alias'));
    } finally {
      if (page === 0) {
        setLoading(false);
      }
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prevSelected) => {
      if (!prevSelected.includes(id) && prevSelected.length >= 5) {
        alert('Nota: solo se permite el borrado de un máximo de 5 alias al mismo tiempo');
        return prevSelected;
      }
      
      return prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id];
    });
  };

  const handleSelectItemAjeno = (id) => {
    setSelectedItemsAjenos((prevSelected) => {
      if (!prevSelected.includes(id) && prevSelected.length >= 5) {
        alert('Nota: solo se permite el borrado de un máximo de 5 alias al mismo tiempo');
        return prevSelected;
      }
      
      return prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id];
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      const itemsToSelect = aliases.slice(0, 5).map((item) => item.id);
      setSelectedItems(itemsToSelect);
      
      if (aliases.length > 5) {
        alert('Nota: solo se permite el borrado de un máximo de 5 alias al mismo tiempo');
      }
    }
    setSelectAll(!selectAll);
  };

  const handleSelectAllAjenos = () => {
    if (selectAllAjenos) {
      setSelectedItemsAjenos([]);
    } else {
      const itemsToSelect = aliasAjenos.slice(0, 5).map((item) => `${item.idAlias}-${item.idAjeno}`);
      setSelectedItemsAjenos(itemsToSelect);
      
      if (aliasAjenos.length > 5) {
        alert('Nota: solo se permite el borrado de un máximo de 5 alias al mismo tiempo');
      }
    }
    setSelectAllAjenos(!selectAllAjenos);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchAliases();
    if (activeTab === 'ARTICULOS') {
      setCurrentPageAjenos(0);
      fetchAliasAjenos();
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'ARTICULOS' && aliasAjenos.length === 0) {
      fetchAliasAjenos();
    }
  };

  const toggleFilter = (filterName) => {
    setOpenFilter(openFilter === filterName ? null : filterName);
  };

  const handleFilterSelect = (filterType, value) => {
    switch (filterType) {
      case 'tipoAlias':
        setSelectedTiposAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'nombreAlias':
        setSelectedNombresAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'estadoAlias':
        setSelectedEstadosAlias(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'estacionalidad':
        setSelectedEstacionalidades(prev => 
          prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
        );
        break;
      case 'articulos':
        setSelectedArticulos(prev => 
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

  const navigate = useNavigate();

  const handleEdit = () => {
    if (selectedItems.length === 1) {
      const aliasId = selectedItems[0];
      navigate(`/edicion-alias/${aliasId}`);
    } else {
      alert('Por favor, seleccione un único alias para editar');
    }
  };

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(t('¿Está seguro de que desea eliminar los alias seleccionados?'))) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await axios.delete(`${BASE_URL}/delete-alias`, {
        data: { 
          ids: selectedItems,
          usuario: 'WEBAPP'
        }
      });
      
      if (response.data.success) {
        alert(t(`${response.data.successCount} alias han sido eliminados correctamente`));
        setSelectedItems([]);
        setSelectAll(false);
        
        // Recargar la lista de alias
        fetchAliases();
      } else {
        alert(t('Error al eliminar los alias seleccionados'));
      }
    } catch (error) {
      console.error('Error al eliminar alias:', error);
      setError(t('Error al eliminar alias'));
      alert(t('Error al eliminar alias. Por favor, inténtelo de nuevo.'));
    } finally {
      setLoading(false);
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

  const filteredAliasOptions = searchText 
    ? aliasOptions.filter(alias => 
        alias.id.toString().includes(searchText) || 
        alias.descripcion.toLowerCase().includes(searchText.toLowerCase())
      )
    : aliasOptions;

  const filteredTiposAlias = tipoAliasSearchText
    ? tiposAlias.filter(tipo => 
        tipo.id.toString().includes(tipoAliasSearchText) || 
        tipo.descripcion.toLowerCase().includes(tipoAliasSearchText.toLowerCase())
      )
    : tiposAlias;

  const filteredEstadosAlias = estadoAliasSearchText
    ? estadosAlias.filter(estado => 
        estado.id.toString().includes(estadoAliasSearchText) || 
        estado.descripcion.toLowerCase().includes(estadoAliasSearchText.toLowerCase())
      )
    : estadosAlias;

  const filteredEstacionalidades = estacionalidadSearchText
    ? estacionalidades.filter(estacionalidad => 
        estacionalidad.id.toString().includes(estacionalidadSearchText) || 
        estacionalidad.descripcion.toLowerCase().includes(estacionalidadSearchText.toLowerCase())
      )
    : estacionalidades;

  const filteredArticulos = articulosSearchText
    ? articulos.filter(articulo => 
        articulo.id.toString().includes(articulosSearchText) || 
        articulo.descripcion.toLowerCase().includes(articulosSearchText.toLowerCase())
      )
    : articulos;

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const showSelectionActions = activeTab === 'ALIAS' ? selectedItems.length > 0 : selectedItemsAjenos.length > 0;

  return (
    <div className="parametrizacion-alias-container">
      <div className="header">
        <h1 className="main-title">{t('PARAMETRIZACIÓN DE ALIAS')}</h1>
        <div className="header-buttons">
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>{showFilters ? t('OCULTAR FILTROS') : t('MOSTRAR FILTROS')}</span>
          </button>
          <button 
            className="new-alias-button"
            onClick={() => navigate('/nuevo-alias')}
          >
            {t('NUEVO ALIAS')}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-section">
          <div className="filters-row">
            <div className="filter-item">
              <div 
                className="filter-dropdown"
                onClick={() => toggleFilter('tipoAlias')}
              >
                <span className="filter-label">Tipo de Alias</span>
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
                        placeholder="Buscar tipo de alias..." 
                        value={tipoAliasSearchText}
                        onChange={(e) => handleSearchTextChange(e, setTipoAliasSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredTiposAlias.map((tipo) => (
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
                            <span>{tipo.id} - {tipo.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTiposAlias.length === tiposAlias.length) {
                            setSelectedTiposAlias([]);
                          } else {
                            setSelectedTiposAlias(tiposAlias.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedTiposAlias.length === tiposAlias.length && tiposAlias.length > 0}
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
                onClick={() => toggleFilter('nombreAlias')}
              >
                <span className="filter-label">Id o Nombre de Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedNombresAlias.length > 0 
                      ? `${selectedNombresAlias.length} seleccionados` 
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
                        value={searchText}
                        onChange={(e) => handleSearchTextChange(e, setSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredAliasOptions.map((alias) => (
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
                              checked={selectedNombresAlias.includes(alias.id)}
                              readOnly
                            />
                            <span>{alias.id} - {alias.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedNombresAlias.length === aliasOptions.length) {
                            setSelectedNombresAlias([]);
                          } else {
                            setSelectedNombresAlias(aliasOptions.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedNombresAlias.length === aliasOptions.length && aliasOptions.length > 0}
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
                onClick={() => toggleFilter('estadoAlias')}
              >
                <span className="filter-label">Estado del Alias</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstadosAlias.length > 0 
                      ? `${selectedEstadosAlias.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estadoAlias' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estado..." 
                        value={estadoAliasSearchText}
                        onChange={(e) => handleSearchTextChange(e, setEstadoAliasSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredEstadosAlias.map((estado) => (
                          <div 
                            key={estado.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('estadoAlias', estado.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedEstadosAlias.includes(estado.id)}
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
                          if (selectedEstadosAlias.length === estadosAlias.length) {
                            setSelectedEstadosAlias([]);
                          } else {
                            setSelectedEstadosAlias(estadosAlias.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedEstadosAlias.length === estadosAlias.length && estadosAlias.length > 0}
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
                onClick={() => toggleFilter('estacionalidad')}
              >
                <span className="filter-label">Estacionalidad</span>
                <div className="filter-value">
                  <span className="filter-placeholder">
                    {selectedEstacionalidades.length > 0 
                      ? `${selectedEstacionalidades.length} seleccionados` 
                      : 'Seleccionar'}
                  </span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                {openFilter === 'estacionalidad' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar estacionalidad..." 
                        value={estacionalidadSearchText}
                        onChange={(e) => handleSearchTextChange(e, setEstacionalidadSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredEstacionalidades.map((estacionalidad) => (
                          <div 
                            key={estacionalidad.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('estacionalidad', estacionalidad.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedEstacionalidades.includes(estacionalidad.id)}
                              readOnly
                            />
                            <span>{estacionalidad.id} - {estacionalidad.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedEstacionalidades.length === estacionalidades.length) {
                            setSelectedEstacionalidades([]);
                          } else {
                            setSelectedEstacionalidades(estacionalidades.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedEstacionalidades.length === estacionalidades.length && estacionalidades.length > 0}
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
                onClick={() => toggleFilter('articulos')}
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
                {openFilter === 'articulos' && (
                  <div className="filter-dropdown-content">
                    <div className="dropdown-search">
                      <input 
                        type="text" 
                        placeholder="Buscar artículos..." 
                        value={articulosSearchText}
                        onChange={(e) => handleSearchTextChange(e, setArticulosSearchText)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-items-container">
                      <div className="dropdown-items">
                        {filteredArticulos.map((articulo) => (
                          <div 
                            key={articulo.id} 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFilterSelect('articulos', articulo.id);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedArticulos.includes(articulo.id)}
                              readOnly
                            />
                            <span>{articulo.id} - {articulo.descripcion}</span>
                          </div>
                        ))}
                      </div>
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedArticulos.length === articulos.length) {
                            setSelectedArticulos([]);
                          } else {
                            setSelectedArticulos(articulos.map(item => item.id));
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedArticulos.length === articulos.length && articulos.length > 0}
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
                disabled={loading || loadingAjenos}
              >
                <FaSearch className="search-icon" />
                <span>{t('BUSCAR')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'ALIAS' ? 'active' : ''}`}
            onClick={() => handleTabChange('ALIAS')}
          >
            {t('ALIAS')}
          </button>
          <button 
            className={`tab-button ${activeTab === 'ARTICULOS' ? 'active' : ''}`}
            onClick={() => handleTabChange('ARTICULOS')}
          >
            {t('ARTÍCULOS')}
          </button>
        </div>
      </div>

      <div className="results-info">
        <span className="results-count">
          {activeTab === 'ALIAS' ? (
            loading ? t('Cargando...') : 
              t('Cargados {{count}} resultados de {{total}} encontrados', {
                count: aliases.length,
                total: totalElements
              })
          ) : (
            loadingAjenos ? t('Cargando...') : 
              t('Cargados {{count}} resultados de {{total}} encontrados', {
                count: aliasAjenos.length,
                total: totalElementsAjenos
              })
          )}
          {' '}
          <FaSyncAlt className="sync-icon" />
          <span className="update-time">
            {t('Última actualización')}: {currentTime}
          </span>
        </span>        
      </div>
      
      {showSelectionActions && (
        <div className="selection-toolbar">
          <div className="selection-info">
            <span>
              {activeTab === 'ALIAS' 
                ? `Seleccionados ${selectedItems.length} resultados de ${totalElements} encontrados` 
                : `Seleccionados ${selectedItemsAjenos.length} resultados de ${totalElementsAjenos} encontrados`}
            </span>
          </div>
          <div className="selection-actions">
            {activeTab === 'ALIAS' ? (
              <>
                <button className="action-button edit-button" onClick={handleEdit}>
                  <FaPencilAlt className="action-icon" />
                </button>
                <button className="action-button delete-button" onClick={handleDelete} title="Nota: solo se permite el borrado de un máximo de 5 alias al mismo tiempo">
                  <FaTrash className="action-icon" />
                </button>
                <button className="action-button relation-button" onClick={handleEditRelations}>
                  <span>EDITAR RELACIONES</span>
                </button>
              </>
            ) : (
              <>
                <button 
                  className="action-button activate-button" 
                  onClick={handleActivarArticulos}
                  disabled={shouldDisableActivarButton()}
                >
                  <span className="action-icon">⚡</span> {t('ACTIVAR')}
                </button>
                <button 
                  className="action-button pause-button" 
                  onClick={handlePausarArticulos}
                  disabled={shouldDisablePausarButton()}
                >
                  <span className="action-icon">⏸️</span> {t('PAUSAR')}
                </button>
                <button className="action-button delete-button" onClick={handleDeleteArticulos} title="Nota: solo se permite el borrado de un máximo de 5 artículos al mismo tiempo">
                  <FaTrash className="action-icon" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-container" ref={tableContainerRef}>
        {activeTab === 'ALIAS' ? (
          <table className="alias-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={handleSelectAll} 
                    disabled={aliases.length === 0}
                  />
                </th>
                <th>{t('ID ALIAS')}</th>
                <th>{t('ALIAS')}</th>
                <th>{t('DESCRIPCIÓN DEL ALIAS')}</th>
                <th>{t('ALIAS TIPO')}</th>
                <th>{t('ESTADO ALIAS')}</th>
                <th>{t('Nº DE ARTÍCULOS')}</th>
                <th>{t('ESTACIONALIDAD')}</th>
                <th>{t('ÚLTIMA MODIFICACIÓN')}</th>
                <th>{t('FECHA DE ALTA')}</th>
                <th>{t('USUARIO')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="loading-cell">
                    {t('Cargando datos...')}
                  </td>
                </tr>
              ) : aliases.length > 0 ? (
                <>
                  {aliases.map((alias) => (
                    <tr key={alias.id} className={selectedItems.includes(alias.id) ? 'selected-row' : ''}>
                      <td className="checkbox-column">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(alias.id)} 
                          onChange={() => handleSelectItem(alias.id)} 
                        />
                      </td>
                      <td>{alias.id}</td>
                      <td>{alias.nombreAlias}</td>
                      <td>{alias.descripcion}</td>
                      <td>
                        <span className="tipo-tag produccion">
                          {alias.tipo}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag">
                          {alias.estado}
                        </span>
                      </td>
                      <td>{alias.numArticulos}</td>
                      <td>
                        <span className="estacionalidad-tag">
                          {alias.estacionalidad}
                        </span>
                      </td>
                      <td>{alias.ultimaModificacion}</td>
                      <td>{alias.fechaAlta}</td>
                      <td>{alias.usuario}</td>
                    </tr>
                  ))}
                  {loadingMore && (
                    <tr>
                      <td colSpan="11" className="loading-cell">
                        {t('Cargando más datos...')}
                      </td>
                    </tr>
                  )}
                  <tr ref={tableEndRef}></tr>
                </>
              ) : (
                <tr>
                  <td colSpan="11" className="empty-table-message">
                    {t('No hay datos disponibles')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="alias-table">
            <thead>
              <tr>
                <th className="checkbox-column">
                  <input 
                    type="checkbox" 
                    checked={selectAllAjenos} 
                    onChange={handleSelectAllAjenos} 
                    disabled={aliasAjenos.length === 0}
                  />
                </th>
                <th>{t('ID ALIAS')}</th>
                <th>{t('ALIAS')}</th>
                <th>{t('DESCRIPCIÓN DEL ALIAS')}</th>
                <th>{t('ALIAS TIPO')}</th>
                <th>{t('ID ARTÍCULO')}</th>
                <th>{t('ARTÍCULO')}</th>
                <th>{t('ESTADO ARTÍCULO SPI')}</th>
                <th>{t('ESTADO ARTÍCULO RAM')}</th>
                <th>{t('ESTADO ARTÍCULO')}</th>
              </tr>
            </thead>
            <tbody>
              {loadingAjenos ? (
                <tr>
                  <td colSpan="10" className="loading-cell">
                    {t('Cargando datos...')}
                  </td>
                </tr>
              ) : aliasAjenos.length > 0 ? (
                <>
                  {aliasAjenos.map((item) => (
                    <tr 
                      key={`${item.idAlias}-${item.idAjeno}`}
                      className={selectedItemsAjenos.includes(`${item.idAlias}-${item.idAjeno}`) ? 'selected-row' : ''}
                    >
                      <td className="checkbox-column">
                        <input 
                          type="checkbox" 
                          checked={selectedItemsAjenos.includes(`${item.idAlias}-${item.idAjeno}`)} 
                          onChange={() => handleSelectItemAjeno(`${item.idAlias}-${item.idAjeno}`)} 
                        />
                      </td>
                      <td>{item.idAlias}</td>
                      <td>{item.nombreAlias}</td>
                      <td>{item.descripcionAlias || item.nombreAlias}</td>
                      <td className="text-center">{item.idTipoAlias}</td>
                      <td>{item.idAjeno}</td>
                      <td>{item.nombreAjeno}</td>
                      <td>
                        <span className="estado-tag ">
                          {item.tipoEstadoCompras?.descripcion}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag ">
                          {item.tipoEstadoRam?.descripcion}
                        </span>
                      </td>
                      <td>
                        <span className="estado-tag ">
                        {item.descripcionTipoEstadoAliasAjenoRam}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {loadingMoreAjenos && (
                    <tr>
                      <td colSpan="10" className="loading-cell">
                        {t('Cargando más datos...')}
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td colSpan="10" className="empty-table-message">
                    {t('No hay datos disponibles')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ParametrizacionAlias;