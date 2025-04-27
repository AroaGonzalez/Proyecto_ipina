import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSyncAlt, FaSearch, FaChevronDown, FaPencilAlt, FaTrash, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
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
  const [ajenos, setAjenos] = useState([]);
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
  const [relacionesUnidades, setRelacionesUnidades] = useState([]);
  const [allRelaciones, setAllRelaciones] = useState([]);
  const [loadingAllItems, setLoadingAllItems] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [globalAjenosSelected, setGlobalAjenosSelected] = useState({});
  
  const [mercados, setMercados] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [alias, setAlias] = useState([]);
  const [unidadesCompra, setUnidadesCompra] = useState([]);
  
  const [selectedMercados, setSelectedMercados] = useState([]);
  const [selectedCadenas, setSelectedCadenas] = useState([]);
  const [selectedAlias, setSelectedAlias] = useState(idsAliasSelected || []);
  const [selectedUnidadesCompra, setSelectedUnidadesCompra] = useState([]);
  const [selectedLocalizaciones, setSelectedLocalizaciones] = useState([]);
  
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

  useEffect(() => {
    // Crear un objeto con los ajenos seleccionados inicialmente
    const initialGlobalAjenos = {};
    relaciones.forEach(relacion => {
      initialGlobalAjenos[relacion.idAliasAmbitoAplanado] = relacion.idAjenoSeccionGlobal || 0;
    });
    setGlobalAjenosSelected(initialGlobalAjenos);
  }, [relaciones.length]);

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
  }, [loadingMore, hasMore, totalElements, relaciones.length]);

  const handleGlobalAjenoChange = (idAliasAmbitoAplanado, idAjenoSeccionGlobal) => {
    // Actualizar el estado de selección
    setGlobalAjenosSelected(prev => ({
      ...prev,
      [idAliasAmbitoAplanado]: idAjenoSeccionGlobal
    }));
    
    // Actualizar las relaciones
    const updatedRelaciones = relaciones.map(rel => {
      if (rel.idAliasAmbitoAplanado === idAliasAmbitoAplanado) {
        return {
          ...rel,
          idAjenoSeccionGlobal: idAjenoSeccionGlobal
        };
      }
      return rel;
    });
    
    setRelaciones(updatedRelaciones);
    setFilteredRelaciones(updatedRelaciones);
    setIsModified(true);
  };

  const loadMoreData = async () => {
    if (!hasMore || loadingMore) return;
    
    if (relaciones.length >= totalElements) {
      setHasMore(false);
      return;
    }
    
    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      
      let aliasToUse = [];
      
      if (idsAliasSelected.length > 0) {
        if (selectedAlias.length > 0) {
          aliasToUse = selectedAlias.filter(id => idsAliasSelected.includes(id));
        } else {
          aliasToUse = [...idsAliasSelected];
        }
      } else {
        aliasToUse = selectedAlias;
      }
      
      const filter = {
        idIdioma: languageId,
        idsMercado: selectedMercados.length > 0 ? selectedMercados : undefined,
        idsCadena: selectedCadenas.length > 0 ? selectedCadenas : undefined,
        idsUnidadComprasGestora: selectedUnidadesCompra.length > 0 ? selectedUnidadesCompra : undefined,
        idsLocalizacion: selectedLocalizaciones.length > 0 ? selectedLocalizaciones : undefined
      };
      
      const payload = {
        filter,
        idsAliasSelected: aliasToUse.length > 0 ? aliasToUse : [],
        processAllAlias: false,
        aliasTableOriginalFilter: originalFilters,
        page: {
          number: nextPage,
          size: pageSize
        }
      };
      
      console.log('Cargando más datos, página:', nextPage);
      
      const response = await axios.post(`${BASE_URL}/relaciones/filter`, payload);
      
      if (response.data) {
        const newRelaciones = response.data.relaciones || [];
        const newTotalElements = response.data.page?.total || 0;
        
        if (newTotalElements !== totalElements) {
          setTotalElements(newTotalElements);
        }
        
        if (response.data.ajenos) {
          const newAjenos = response.data.ajenos || [];
          const combinedAjenos = [...ajenos];
          
          newAjenos.forEach(newAjeno => {
            const existingIndex = combinedAjenos.findIndex(a => a.idAlias === newAjeno.idAlias);
            if (existingIndex >= 0) {
              const existingDataAjenos = combinedAjenos[existingIndex].dataAjenos || [];
              const newDataAjenos = newAjeno.dataAjenos || [];
              
              const combinedDataAjenos = [...existingDataAjenos];
              
              newDataAjenos.forEach(dataAjeno => {
                if (!combinedDataAjenos.some(da => da.idAjeno === dataAjeno.idAjeno)) {
                  combinedDataAjenos.push(dataAjeno);
                }
              });
              
              combinedAjenos[existingIndex].dataAjenos = combinedDataAjenos;
            } else {
              combinedAjenos.push(newAjeno);
            }
          });
          
          setAjenos(combinedAjenos);
        }
        
        if (newRelaciones.length > 0) {
          const updatedRelaciones = [...relaciones, ...newRelaciones];
          setRelaciones(updatedRelaciones);
          setFilteredRelaciones(updatedRelaciones);
          setCurrentPage(nextPage);
          
          if (updatedRelaciones.length >= newTotalElements) {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error al cargar más datos:', error);
      setError(t('Error al cargar más datos'));
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const [mercadosRes, cadenasRes, aliasRes, unidadesCompraRes, relacionesUnidadesRes] = await Promise.all([
        axios.get(`${BASE_URL}/relaciones/mercados?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/cadenas`),
        axios.get(`${BASE_URL}/relaciones/lista-alias?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/relaciones/maestros/unidades-compra`),
        axios.get(`${BASE_URL}/relaciones/unidades-compra`)
      ]);
      
      setMercados(Array.isArray(mercadosRes.data) ? mercadosRes.data : []);
      setCadenas(Array.isArray(cadenasRes.data) ? cadenasRes.data : []);
      if (aliasRes.data && aliasRes.data.content && Array.isArray(aliasRes.data.content)) {
        console.log('Datos de alias recibidos correctamente:', aliasRes.data.content.length);
        const processedAlias = aliasRes.data.content.map(item => ({
          id: item.id,
          descripcion: item.descripcion || item.nombreAlias
        }));
        setAlias(processedAlias);
      } else if (Array.isArray(aliasRes.data)) {
        console.log('Datos de alias recibidos en formato array:', aliasRes.data.length);
        setAlias(aliasRes.data);
      } else {
        console.error('Error: datos de alias no válidos:', aliasRes.data);
        setAlias([]);
      }

      setUnidadesCompra(Array.isArray(unidadesCompraRes.data) ? unidadesCompraRes.data : []);
      setRelacionesUnidades(Array.isArray(relacionesUnidadesRes.data) ? relacionesUnidadesRes.data : []);
    
    } catch (error) {
      console.error('Error al cargar opciones de filtro:', error);
      setMercados([]);
      setCadenas([]);
      setAlias([]);
      setUnidadesCompra([]);
      setRelacionesUnidades([]);
      setError(t('Error al cargar opciones de filtro'));
    }
  };

  const normalizeText = (text) => {
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

    Object.entries(replacements).forEach(([badChar, goodChar]) => {
      normalizedText = normalizedText.replace(new RegExp(badChar, 'g'), goodChar);
    });

    return normalizedText;
  };

  const getFilteredAlias = () => {
    if (!Array.isArray(alias)) {
      console.error('Error: "alias" no es un array:', alias);
      return [];
    }
    
    try {
      if (aliasSearchText) {
        return alias.filter(a => {
          if (a && typeof a === 'object') {
            const idStr = a.id?.toString() || '';
            const descStr = a.descripcion?.toLowerCase() || '';
            return idStr.includes(aliasSearchText) || descStr.includes(aliasSearchText.toLowerCase());
          }
          return false;
        });
      }
      
      return alias;
    } catch (error) {
      console.error('Error al filtrar alias:', error);
      return []; 
    }
  };

  const filteredAlias = getFilteredAlias();

  const fetchRelaciones = async () => {
    setLoading(true);
    setError(null);
    setHasMore(true);
    setCurrentPage(0);
    
    try {
      let aliasToUse = [];      
      if (idsAliasSelected.length > 0) {
        if (selectedAlias.length > 0) {
          aliasToUse = selectedAlias.filter(id => idsAliasSelected.includes(id));
        } else {
          aliasToUse = [...idsAliasSelected];
        }
      } else {
        aliasToUse = selectedAlias;
      }
      
      const filter = {
        idIdioma: languageId,
        idsMercado: selectedMercados.length > 0 ? selectedMercados : undefined,
        idsCadena: selectedCadenas.length > 0 ? selectedCadenas : undefined,
        idsUnidadComprasGestora: selectedUnidadesCompra.length > 0 ? selectedUnidadesCompra : undefined,
        idsLocalizacion: selectedLocalizaciones.length > 0 ? selectedLocalizaciones : undefined
      };
      
      const payload = {
        filter,
        idsAliasSelected: aliasToUse.length > 0 ? aliasToUse : [],
        processAllAlias: false,
        aliasTableOriginalFilter: originalFilters,
        page: {
          number: currentPage,
          size: pageSize
        }
      };
      
      const response = await axios.post(`${BASE_URL}/relaciones/filter`, payload);
      
      if (response.data) {
        const initialRelaciones = response.data.relaciones || [];
        const totalCount = response.data.page?.total || 0;
        
        setRelaciones(initialRelaciones);
        setFilteredRelaciones(initialRelaciones);
        setTotalElements(totalCount);
        
        if (response.data.ajenos) {
          setAjenos(response.data.ajenos || []);
        } else {
          setAjenos([]);
        }
        
        setHasMore(initialRelaciones.length < totalCount);
        
        if (response.data.allRelaciones) {
          setAllRelaciones(response.data.allRelaciones || []);
        }
      } else {
        setRelaciones([]);
        setFilteredRelaciones([]);
        setAllRelaciones([]);
        setTotalElements(0);
        setHasMore(false);
        setAjenos([]);
      }
    } catch (error) {
      console.error('Error al cargar relaciones:', error);
      setError(t('Error al cargar relaciones'));
      setAjenos([]);
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
        if (idsAliasSelected.length > 0) {
          if (idsAliasSelected.includes(value)) {
            setSelectedAlias(prev => 
              prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
            );
          }
        } else {
          setSelectedAlias(prev => 
            prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
          );
        }
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

  const handleSelectAll = async () => {
    setLoadingAllItems(true);
    
    try {
      if (selectAll) {
        setSelectedItems([]);
        setSelectAll(false);
      } else {
        if (allRelaciones && allRelaciones.length > 0) {
          const allIds = allRelaciones.map(item => item.idAliasAmbitoAplanado);
          setSelectedItems(allIds);
        } else {
          const visibleIds = filteredRelaciones.map(item => item.idAliasAmbitoAplanado);
          setSelectedItems(visibleIds);
        }
        setSelectAll(true);
      }
    } catch (error) {
      console.error('Error en handleSelectAll:', error);
      const visibleIds = filteredRelaciones.map(item => item.idAliasAmbitoAplanado);
      setSelectedItems(visibleIds);
      setSelectAll(true);
    } finally {
      setLoadingAllItems(false);
    }
  };

  const filteredMercados = mercadoSearchText
    ? (Array.isArray(mercados) ? mercados.filter(mercado => 
        mercado.id?.toString().includes(mercadoSearchText) || 
        (mercado.descripcion || '').toLowerCase().includes(mercadoSearchText.toLowerCase())
      ) : [])
    : mercados || [];

  const filteredCadenas = cadenaSearchText
    ? cadenas.filter(cadena => 
        cadena.id.toString().includes(cadenaSearchText) || 
        cadena.descripcion.toLowerCase().includes(cadenaSearchText.toLowerCase())
      )
    : cadenas;

  const filteredUnidadesCompra = unidadCompraSearchText
    ? relacionesUnidades.filter(unidad => 
        unidad.id.toString().includes(unidadCompraSearchText) || 
        unidad.descripcion.toLowerCase().includes(unidadCompraSearchText.toLowerCase())
      )
    : relacionesUnidades;

  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleActivateRelations = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      let selectedRelations = [];
      
      if (allRelaciones && allRelaciones.length > 0) {
        selectedRelations = allRelaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      } else {
        selectedRelations = relaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      }
      
      const response = await axios.put(`${BASE_URL}/relaciones/activate`, {
        relaciones: selectedRelations,
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
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
        
        if (allRelaciones.length > 0) {
          const updatedAllRelaciones = allRelaciones.map(rel => {
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
          setAllRelaciones(updatedAllRelaciones);
        }
        
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
    
    const fechaHoraFinPausa = new Date();
    fechaHoraFinPausa.setDate(fechaHoraFinPausa.getDate() + 30);
    
    try {
      let selectedRelations = [];
      
      if (allRelaciones && allRelaciones.length > 0) {
        selectedRelations = allRelaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      } else {
        selectedRelations = relaciones.filter(r => selectedItems.includes(r.idAliasAmbitoAplanado));
      }
      
      const response = await axios.put(`${BASE_URL}/relaciones/pause`, {
        relaciones: selectedRelations,
        fechaHoraFinPausa: fechaHoraFinPausa.toISOString(),
        usuario: 'WEBAPP'
      });
      
      if (response.data.success) {
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
        
        if (allRelaciones.length > 0) {
          const updatedAllRelaciones = allRelaciones.map(rel => {
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
          setAllRelaciones(updatedAllRelaciones);
        }
        
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
      const updatedRelaciones = relaciones.map(rel => ({
        ...rel,
        idAjenoSeccionGlobal: globalAjenosSelected[rel.idAliasAmbitoAplanado] || 0
      }));
      
      const response = await axios.put(`${BASE_URL}/relaciones/update`, {
        relaciones: updatedRelaciones,
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
    if (estado === 'Active' || estado === 'ACTIVA') return 'estado-tag ACTIVA';
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

      {idsAliasSelected && idsAliasSelected.length > 0 && (
        <div className="info-message">
          <FaInfoCircle className="info-icon" />
          <span>
            {idsAliasSelected.length === 1 
              ? t('Solo se muestran relaciones para el alias seleccionado en la pantalla anterior. No es posible cambiar el alias en esta vista.')
              : t('Solo se muestran relaciones para los alias seleccionados en la pantalla anterior. Puede filtrar entre estos alias, pero no es posible añadir alias adicionales.')}
          </span>
        </div>
      )}

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
                      {filteredAlias.map((item) => {
                        const isSelectable = !idsAliasSelected.length || idsAliasSelected.includes(item.id);
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`dropdown-item ${!isSelectable ? 'disabled-item' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelectable) {
                                handleFilterSelect('alias', item.id);
                              }
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={selectedAlias.includes(item.id)}
                              readOnly
                              disabled={!isSelectable}
                            />
                            <span>{item.id} - {item.descripcion}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {idsAliasSelected.length > 0 ? (
                      <div 
                        className="dropdown-item select-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedAlias.length === idsAliasSelected.length) {
                            setSelectedAlias([]);
                          } else {
                            setSelectedAlias([...idsAliasSelected]);
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedAlias.length === idsAliasSelected.length && idsAliasSelected.length > 0}
                          readOnly
                        />
                        <span>Seleccionar todos los preseleccionados</span>
                      </div>
                    ) : (
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
                    )}
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
                          if (selectedUnidadesCompra.length === relacionesUnidades.length + 1) {
                            setSelectedUnidadesCompra([]);
                          } else {
                            setSelectedUnidadesCompra([0, ...relacionesUnidades.map(u => u.id)]);
                          }
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selectedUnidadesCompra.length === relacionesUnidades.length + 1 && relacionesUnidades.length > 0}
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
                  disabled={relaciones.length === 0 || loading || loadingAllItems}
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
            {loading || loadingAllItems ? (
              <tr>
                <td colSpan="14" className="loading-cell">
                  {loadingAllItems ? t('Seleccionando todas las relaciones...') : t('Cargando datos...')}
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
                        {/* Buscar los ajenos para el idAlias actual */}
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