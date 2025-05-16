import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaChevronDown, FaSearch, FaTrash, FaFilter, FaCalendarAlt, FaUndo, FaRedo, FaDownload } from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from 'react-i18next';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/recuentos.css';
import ViewRecuento07Modal from './ViewRecuento07Modal';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const Recuentos = () => {
    const { t } = useTranslation();
    const { languageId } = useContext(LanguageContext);
    const [showRecuento07Modal, setShowRecuento07Modal] = useState(false);
    const [selectedRecuentoDetails, setSelectedRecuentoDetails] = useState(null);

    const [idLocalizacion, setIdLocalizacion] = useState('');
    const [idEjecucion, setIdEjecucion] = useState('');
    const [idAlias, setIdAlias] = useState('');
    const [inicioFechaCreacion, setInicioFechaCreacion] = useState(null);
    const [finFechaCreacion, setFinFechaCreacion] = useState(null);

    const [mercadoSearch, setMercadoSearch] = useState('');
    const [grupoCadenaSearch, setGrupoCadenaSearch] = useState('');
    const [nombreEventoSearch, setNombreEventoSearch] = useState('');
    const [estadoLineaSearch, setEstadoLineaSearch] = useState('');
    const [tipoAliasSearch, setTipoAliasSearch] = useState('');
    const [nombreAliasSearch, setNombreAliasSearch] = useState('');
    
    const [openFilter, setOpenFilter] = useState(null);
    const [showFilters, setShowFilters] = useState(true);

    const [recuentos, setRecuentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [totalElements, setTotalElements] = useState(0);

    const [selectedRecuentos, setSelectedRecuentos] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    const dropdownRef = useRef(null);
    const tableContainerRef = useRef();

    const [mercados, setMercados] = useState([]);
    const [gruposCadena, setGruposCadena] = useState([]);
    const [eventos, setEventos] = useState([]);
    const [estadosLinea, setEstadosLinea] = useState([]);
    const [tiposAlias, setTiposAlias] = useState([]);
    const [nombreAlias, setNombreAlias] = useState([]);
    const [modifiedRecuentos, setModifiedRecuentos] = useState({});
    const [saveEnabled, setSaveEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    
    const [activeInputId, setActiveInputId] = useState(null);
    
    const [selectedMercados, setSelectedMercados] = useState([]);
    const [selectedGruposCadena, setSelectedGruposCadena] = useState([]);
    const [selectedEventos, setSelectedEventos] = useState([]);
    const [selectedEstadosLinea, setSelectedEstadosLinea] = useState([]);
    const [selectedTiposAlias, setSelectedTiposAlias] = useState([]);
    const [selectedNombreAlias, setSelectedNombreAlias] = useState([]);
    const [paginaActual, setPaginaActual] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [tamañoPagina] = useState(50);
    const [scrollPosition, setScrollPosition] = useState(0);

    const StatusTag = ({ status, type }) => {
        let className = 'status-tag';
        
        const normalizedStatus = status ? status.toUpperCase().trim() : '';
        
        if (normalizedStatus === 'RECOGIDO' || normalizedStatus === 'RECEIVED') {
        className += ' status-recogido';
        } else if (normalizedStatus === 'RESPUESTA' || normalizedStatus === 'ANSWERED') {
        className += ' status-respuesta';
        } else if (normalizedStatus === 'VALIDADO') {
        className += ' status-validado';
        } else if (normalizedStatus === 'PENDIENTE' || normalizedStatus === 'PENDING') {
        className += ' status-validado';
        } else if (normalizedStatus === 'DESCARTADO' || normalizedStatus === 'DISCARDED') {
        className += ' status-descartado';
        }
        
        return <div className={className}>{status || '-'}</div>;
    };

    useEffect(() => {
        const container = tableContainerRef.current;
        if (container && scrollPosition > 0) {
            container.scrollTop = scrollPosition;
        }
        
        if (activeInputId) {
            const activeInput = document.getElementById(activeInputId);
            if (activeInput) {
                activeInput.focus();
            }
        }
    }, [recuentos, modifiedRecuentos, scrollPosition, activeInputId]);

    useEffect(() => {
        setSaveEnabled(Object.keys(modifiedRecuentos).length > 0);
    }, [modifiedRecuentos]);

    useEffect(() => {
        const container = tableContainerRef.current;
        if (container && scrollPosition > 0) {
            container.scrollTop = scrollPosition;
        }
    }, [recuentos, modifiedRecuentos]);

    const handleStockValidadoChange = (idRecuento, value) => {
        const container = tableContainerRef.current;
        if (container) {
            setScrollPosition(container.scrollTop);
        }

        const originalItem = recuentos.find(item => item.idRecuento === idRecuento);
        const originalValue = originalItem?.stockFisicoValidado?.toString() || "";
        
        if (value !== originalValue) {
            setModifiedRecuentos(prev => ({
                ...prev,
                [idRecuento]: {
                    ...prev[idRecuento],
                    stockFisicoValidado: value
                }
            }));
            
            const inputElement = document.querySelector(`#stockValidado-${idRecuento}`);
            if (inputElement) {
                inputElement.classList.add('modified');
            }
        } else {
            setModifiedRecuentos(prev => {
                const newModified = { ...prev };
                if (newModified[idRecuento]) {
                    delete newModified[idRecuento].stockFisicoValidado;
                    if (Object.keys(newModified[idRecuento]).length === 0) {
                        delete newModified[idRecuento];
                    }
                }
                return newModified;
            });
            
            const inputElement = document.querySelector(`#stockValidado-${idRecuento}`);
            if (inputElement) {
                inputElement.classList.remove('modified');
            }
        }
    };

    const handleCapacidadMaximaValidadaChange = (idRecuento, value) => {
        const container = tableContainerRef.current;
        if (container) {
            setScrollPosition(container.scrollTop);
        }

        const originalItem = recuentos.find(item => item.idRecuento === idRecuento);
        const originalValue = originalItem?.capacidadMaximaFisicaValidada?.toString() || "";
        
        if (value !== originalValue) {
            setModifiedRecuentos(prev => ({
                ...prev,
                [idRecuento]: {
                    ...prev[idRecuento],
                    capacidadMaximaFisicaValidada: value
                }
            }));
            
            const inputElement = document.querySelector(`#capacidadValidada-${idRecuento}`);
            if (inputElement) {
                inputElement.classList.add('modified');
            }
        } else {
            setModifiedRecuentos(prev => {
                const newModified = { ...prev };
                if (newModified[idRecuento]) {
                    delete newModified[idRecuento].capacidadMaximaFisicaValidada;
                    if (Object.keys(newModified[idRecuento]).length === 0) {
                        delete newModified[idRecuento];
                    }
                }
                return newModified;
            });
            
            const inputElement = document.querySelector(`#capacidadValidada-${idRecuento}`);
            if (inputElement) {
                inputElement.classList.remove('modified');
            }
        }
    };

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 100);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                
                const [
                    mercadosRes,
                    gruposCadenaRes,
                    eventosRes,
                    estadosLineaRes,
                    tiposAliasRes,
                    nombreAliasRes
                ] = await Promise.all([
                    axios.get(`${BASE_URL}/eventos/mercados?idIdioma=${languageId}`),
                    axios.get(`${BASE_URL}/eventos/grupos-cadena?idIdioma=${languageId}`),
                    axios.get(`${BASE_URL}/eventos/eventos?idIdioma=${languageId}`),
                    axios.get(`${BASE_URL}/recuento/estados?idIdioma=${languageId}`),
                    axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
                    axios.get(`${BASE_URL}/alias?idIdioma=${languageId}`)
                ]);
                
                setMercados(mercadosRes.data || []);
                setGruposCadena(gruposCadenaRes.data || []);
                setEventos(eventosRes.data || []);
                setEstadosLinea(estadosLineaRes.data || []);
                setTiposAlias(tiposAliasRes.data || []);
                setNombreAlias(nombreAliasRes.data || []);
                
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
            loadMoreRecuentos();
          }
        };
    
        container.addEventListener('scroll', handleScroll);
        return () => {
          container.removeEventListener('scroll', handleScroll);
        };
      }
    }, [loading, loadingMore, hasMore, recuentos]);

    const loadMoreRecuentos = async () => {
        if (!hasMore || loadingMore) return;
        
        try {
            setLoadingMore(true);
            
            const nextPage = paginaActual + 1;
            
            const filter = {
                idsLocalizacion: idLocalizacion ? idLocalizacion.split(/\s+/).filter(id => id.trim() !== '') : [],
                idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
                idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
                idsAlias: idAlias.length > 0 ? idAlias : [],
                idsTipoAlias: selectedTiposAlias.length > 0 ? selectedTiposAlias : [],
                idsEstadoLinea: selectedEstadosLinea.length > 0 ? selectedEstadosLinea : [],
                idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
                idsEjecucion: idEjecucion ? idEjecucion.split(/\s+/).filter(id => id.trim() !== '') : [],
                fechaCreacionDesde: inicioFechaCreacion || null,
                fechaCreacionHasta: finFechaCreacion || null
            };
            
            const page = { number: nextPage, size: tamañoPagina };
            
            const response = await axios.post(`${BASE_URL}/recuento/filter?idIdioma=${languageId}`, {
                filter,
                page
            });
            
            const newRecuentos = response.data.recuentos || [];
            
            if (newRecuentos.length === 0 || newRecuentos.length < tamañoPagina) {
                setHasMore(false);
            }
            
            setPropuestas(prevRecuentos => [...prevRecuentos, ...newRecuentos]);
            setPaginaActual(nextPage);
          
        } catch (error) {
            console.error('Error al cargar más recuentos:', error);
            setError('Error al cargar más recuentos');
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    };

    const ESTADO_RECUENTO = {
        DESCARTADO: 5,
        VALIDADO: 4,
        RECOGIDO: 2,
        RESPUESTA: 3,
        PENDIENTE: 1
    };
  
    const handleDescartar = async () => {
        try {
            setLoading(true);
            
            const response = await axios.put(`${BASE_URL}/recuento/update-estado`, {
                idsRecuento: selectedRecuentos,
                idTipoEstadoRecuento: ESTADO_RECUENTO.DESCARTADO,
                usuario: 'frontend_user'
            });
            
            if (response.data.success) {
                handleSearch();
                setSelectedRecuentos([]);
                setSelectAll(false);
                alert(`Se han descartado ${selectedRecuentos.length} recuento(s) correctamente`);
            }
        } catch (error) {
            console.error('Error al descartar recuentos:', error);
            setError('Error al descartar recuentos');
        } finally {
            setLoading(false);
        }
    };
  
    const handleValidar = async () => {
        try {
            setLoading(true);
            
            const response = await axios.put(`${BASE_URL}/recuento/update-estado`, {
                idsRecuento: selectedRecuentos,
                idTipoEstadoRecuento: ESTADO_RECUENTO.VALIDADO,
                usuario: 'frontend_user'
            });
        
            if (response.data.success) {
                handleSearch();
                setSelectedRecuentos([]);
                setSelectAll(false);
                alert(`Se han validado ${selectedRecuentos.length} recuento(s) correctamente`);
            }
        } catch (error) {
            console.error('Error al validar recuentos:', error);
            setError('Error al validar recuentos');
        } finally {
            setLoading(false);
        }
    };

    const handlePublishIn07 = async () => {
        try {
            setLoading(true);
            
            if (selectedRecuentos.length > 0) {
                const recuentoDetails = recuentos.find(r => r.idRecuento === selectedRecuentos[0]);
                if (recuentoDetails) {
                    setSelectedRecuentoDetails(recuentoDetails);
                    setShowRecuento07Modal(true);
                }
            }
            
            setSelectedRecuentos([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error al abrir modal 07:', error);
            setError('Error al abrir modal 07');
        } finally {
            setLoading(false);
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
                (item.nombreAlias || item.descripcion || item.nombre || '');
            
            const searchFieldStr = normalizeText(String(searchField || '').toLowerCase());
            const idString = item.id ? String(item.id) : 
                (item.idEvento ? String(item.idEvento) : '');
            
            const nombreEvento = item.nombre ? normalizeText(String(item.nombre).toLowerCase()) : '';
            
            return searchFieldStr.includes(normalizedSearchTerm) || 
                idString.includes(normalizedSearchTerm) ||
                nombreEvento.includes(normalizedSearchTerm);
        });
    };

    const allSelectedRecuentosHaveState = (stateId) => {
        if (selectedRecuentos.length === 0) return false;
        return selectedRecuentos.every(idRecuento => {
            const recuento = recuentos.find(r => r.idRecuento === idRecuento);
            return recuento && recuento.tipoEstadoRecuento.id === stateId;
        });
    };
    
    const anySelectedRecuentosHaveState = (stateId) => {
        if (selectedRecuentos.length === 0) return false;
        return selectedRecuentos.some(idRecuento => {
            const recuento = recuentos.find(r => r.idRecuento === idRecuento);
            return recuento && recuento.tipoEstadoRecuento.id === stateId;
        });
    };
    
    const canValidate = selectedRecuentos.length > 0 && selectedRecuentos.every(idRecuento => {
        const recuento = recuentos.find(r => r.idRecuento === idRecuento);
        return recuento && recuento.tipoEstadoRecuento.id === ESTADO_RECUENTO.RESPUESTA;
    });
    
    const canDiscard = selectedRecuentos.length > 0 && !anySelectedRecuentosHaveState(ESTADO_RECUENTO.DESCARTADO) && !anySelectedRecuentosHaveState(ESTADO_RECUENTO.VALIDADO);
    
    const canPublish = selectedRecuentos.length > 0 && allSelectedRecuentosHaveState(ESTADO_RECUENTO.PENDIENTE);

    const handleSearch = async () => {
        try {
            setLoading(true);
            setError(null);
            setHasMore(true);
            setPaginaActual(0);
        
            const filter = {
                idsLocalizacion: idLocalizacion ? idLocalizacion.split(/\s+/).filter(id => id.trim() !== '') : [],
                idsMercado: selectedMercados.length > 0 ? selectedMercados : [],
                idsGrupoCadena: selectedGruposCadena.length > 0 ? selectedGruposCadena : [],
                idsAlias: idAlias.length > 0 ? idAlias : [],
                idsTipoAlias: selectedTiposAlias.length > 0 ? selectedTiposAlias : [],
                idsTipoEstadoRecuento: selectedEstadosLinea.length > 0 ? selectedEstadosLinea : [],
                idsEvento: selectedEventos.length > 0 ? selectedEventos : [],
                idsEjecucion: idEjecucion ? idEjecucion.split(/\s+/).filter(id => id.trim() !== '') : [],
                fechaCreacionDesde: inicioFechaCreacion ? inicioFechaCreacion.toISOString().split('T')[0] : null,
                fechaCreacionHasta: finFechaCreacion ? finFechaCreacion.toISOString().split('T')[0] : null
            };
            
            const page = { number: 0, size: tamañoPagina };
            
            const response = await axios.post(`${BASE_URL}/recuento/filter?idIdioma=${languageId}`, {
                filter,
                page
            });              
            
            setRecuentos(response.data.recuentos || []);
            setTotalElements(response.data.page.total || 0);
            setUltimaActualizacion(new Date());
            setShowResults(true);

            if (
                response.data.recuentos.length === 0 || 
                response.data.recuentos.length < tamañoPagina || 
                response.data.recuentos.length === response.data.page.total
            ) {
                setHasMore(false);
            }
        
        } catch (error) {
        console.error('Error al buscar recuentos:', error);
        setError('Error al buscar recuentos');
        } finally {
        setLoading(false);
        }
    };

    const clearFilters = () => {
        setIdLocalizacion('');
        setSelectedMercados([]);
        setSelectedGruposCadena([]);
        setSelectedEventos([]);
        setIdEjecucion('');
        setIdAlias('');
        setSelectedEstadosLinea([]);
        setSelectedTiposAlias([]);
        setInicioFechaCreacion(null);
        setFinFechaCreacion(null);
        setShowResults(false);
        setRecuentos([]);
        setSelectedRecuentos([]);
        setSelectAll(false);
    };

    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };
    
    const formatTime = (date) => {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    };

    const handleFilterSelect = (filterType, value) => {
        switch (filterType) {
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
        case 'evento':
            setSelectedEventos(prev => 
            prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
            );
            break;
        case 'estadoLinea':
            setSelectedEstadosLinea(prev => 
            prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
            );
            break;
        case 'tipoAlias':
            setSelectedTiposAlias(prev => 
            prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
            );
            break;
        case 'nombreAlias':
            setSelectedNombreAlias(prev => 
            prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
            );
            break;
        default:
            break;
        }
    };
  
    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        if (!selectAll) {
            setSelectedRecuentos(recuentos.map(recuento => recuento.idRecuento));
        } else {
            setSelectedRecuentos([]);
        }
    };
  
    const handleSelectRecuento = (idRecuento) => {
        const container = tableContainerRef.current;
        if (container) {
            setScrollPosition(container.scrollTop);
        }
        
        setSelectedRecuentos(prev => {
            if (prev.includes(idRecuento)) {
                return prev.filter(id => id !== idRecuento);
            } else {
                return [...prev, idRecuento];
            }
        });
    };
  
  if (error) {
    return (
      <div className="recuentos-error">
        <span>{error}</span>
        <button onClick={clearFilters} className="retry-btn">
          <FaRedo /> {t('Reintentar')}
        </button>
      </div>
    );
  }

    const RecuentosTable = () => {

        if (loading && recuentos.length === 0) {
            return <div className="loading-indicator">{t('Cargando...')}</div>;
        }  

        if (!showResults || recuentos.length === 0) {
        return null;
        }

        return (
            <div className="recuentos-table-container" ref={tableContainerRef}>
                <table className="recuentos-table">
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
                            <th className="medium-text-column">{t('EVENTO')}</th>
                            <th className="short-text-column">{t('ESTADO DE LA LÍNEA')}</th>
                            <th className="id-column">{t('ID LOCALIZACIÓN')}</th>
                            <th className="medium-text-column">{t('LOCALIZACIÓN')}</th>
                            <th className="id-column">{t('ID ALIAS')}</th>
                            <th className="medium-text-column">{t('ALIAS')}</th>
                            <th className="short-text-column">{t('ALIAS TIPO')}</th>
                            <th className="short-text-column">{t('STOCK')}</th>
                            <th className="short-text-column">{t('STOCK VALIDADO')}</th>
                            <th className="short-text-column">{t('CAPACIDAD MÁXIMA')}</th>
                            <th className="short-text-column">{t('CAPACIDAD MÁXIMA VALIDADA')}</th>
                            <th className="id-column">{t('ID ARTÍCULO')}</th>
                            <th className="medium-text-column">{t('ARTÍCULO')}</th>
                            <th className="short-text-column">{t('COD EJECUCIÓN')}</th>
                            <th className="short-text-column">{t('CADENA')}</th>
                            <th className="short-text-column">{t('MERCADO')}</th>
                            <th className="date-column">{t('FECHA DE CREACIÓN')}</th>
                            <th className="date-column">{t('FECHA DE RECOGIDA')}</th>
                            <th className="date-column">{t('FECHA DE RESPUESTA')}</th>
                            <th className="date-column">{t('FECHA VALIDACIÓN')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recuentos.map((recuento) => (
                            <tr 
                                key={recuento.idRecuento}
                                className={selectedRecuentos.includes(recuento.idRecuento) ? 'selected-row' : ''}
                                >
                                <td className="checkbox-column">
                                    <div className="checkbox">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedRecuentos.includes(recuento.idRecuento)}
                                        onChange={() => handleSelectRecuento(recuento.idRecuento)}
                                        id={`recuento-${recuento.idRecuento}`}
                                    />
                                    </div>
                                </td>
                                <td className="id-column">{recuento.evento.id}</td>
                                <td className="medium-text-column">{normalizeText(recuento.evento.nombre)}</td>
                                <td className="short-text-column">
                                    <StatusTag status={recuento.tipoEstadoRecuento.descripcion} />              
                                </td>
                                <td className="id-column">{recuento.localizacionCompra.id}</td>
                                <td className="medium-text-column">{recuento.localizacionCompra.descripcion}</td>
                                <td className="id-column">{recuento.alias.id}</td>
                                <td className="medium-text-column">{recuento.alias.nombre}</td>
                                <td className="short-text-column">{recuento.alias.idTipoAlias}</td>
                                <td className="short-text-column">{recuento.stockFisico || '-'}</td>
                                <td className="short-text-column editable-cell">
                                    <div className="quantity-input">
                                        <input
                                            id={`stockValidado-${recuento.idRecuento}`}
                                            type="number"
                                            value={modifiedRecuentos[recuento.idRecuento]?.stockFisicoValidado ?? (recuento.stockFisicoValidado || '')}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    handleStockValidadoChange(recuento.idRecuento, value);
                                                }
                                            }}
                                            onFocus={(e) => {
                                                setActiveInputId(`stockValidado-${recuento.idRecuento}`);
                                            }}
                                            onKeyDown={(e) => {
                                                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
                                                if (allowedKeys.includes(e.key)) return;
                                                if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                                                
                                                if (!/^\d$/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pastedText = e.clipboardData.getData('text');
                                                if (/^\d+$/.test(pastedText)) {
                                                    handleStockValidadoChange(recuento.idRecuento, pastedText);
                                                }
                                            }}
                                            min="0"
                                            step="1"
                                            pattern="\d*"
                                        />
                                    </div>
                                </td>
                                <td className="short-text-column">{recuento.capacidadMaximaFisica || '-'}</td>
                                <td className="short-text-column editable-cell">
                                    <div className="quantity-input">
                                        <input
                                            id={`capacidadValidada-${recuento.idRecuento}`}
                                            type="number"
                                            value={modifiedRecuentos[recuento.idRecuento]?.capacidadMaximaFisicaValidada ?? (recuento.capacidadMaximaFisicaValidada || '')}
                                           onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    handleCapacidadMaximaValidadaChange(recuento.idRecuento, value);
                                                }
                                            }}
                                            onFocus={(e) => {
                                                setActiveInputId(`capacidadValidada-${recuento.idRecuento}`);
                                            }}
                                            onKeyDown={(e) => {
                                                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
                                                if (allowedKeys.includes(e.key)) return;
                                                
                                                if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
                                                
                                                if (!/^\d$/.test(e.key)) {
                                                    e.preventDefault();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pastedText = e.clipboardData.getData('text');
                                                if (/^\d+$/.test(pastedText)) {
                                                    handleCapacidadMaximaValidadaChange(recuento.idRecuento, pastedText);
                                                }
                                            }}
                                            min="0"
                                            step="1"
                                            pattern="\d*"
                                        />
                                    </div>
                                </td>
                                <td className="id-column">{recuento.ajeno.id}</td>
                                <td className="medium-text-column">{normalizeText(recuento.ajeno.nombre)}</td>
                                <td className="short-text-column">{recuento.codEjecucion}</td>
                                <td className="short-text-column">{normalizeText(recuento.cadena.nombre)}</td>
                                <td className="short-text-column">
                                    {recuento.mercado.id} - {normalizeText(recuento.mercado.descripcion)}
                                </td>
                                <td className="date-column">{recuento.fechaAlta}</td>
                                <td className="date-column">{recuento.fechaRecogida || '-'}</td>
                                <td className="date-column">{recuento.fechaRespuesta || '-'}</td>
                                <td className="date-column">{recuento.fechaValidacion || '-'}</td>
                            </tr>
                        ))}
                        {loadingMore && (
                            <tr>
                                <td colSpan="18" className="loading-more-cell">
                                <div className="loading-more-indicator">{t('Cargando más resultados...')}</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        );
    };

    return (
        <div className="recuentos-container">
        <div className="recuentos-header">
            <h1 className="recuentos-title">{t('RECUENTOS')}</h1>
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
                        onClick={() => toggleFilter('mercado')}
                    >
                        <label className="filter-label">{t('Id o Mercado')}</label>
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
                                <span>{mercado.id} - {normalizeText(mercado.descripcion)}</span>
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
                                <span>{grupo.id} - {normalizeText(grupo.descripcion)}</span>
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
                        onClick={() => toggleFilter('nombreAlias')}
                    >
                        <label className="filter-label">{t('Id o Nombre de Alias')}</label>
                        <div className="filter-value">
                            <span className="filter-placeholder">
                                {selectedNombreAlias.length > 0 
                                ? t('{{count}} seleccionados', { count: selectedNombreAlias.length })
                                : t('Seleccionar')}
                            </span>
                        <FaChevronDown className="dropdown-arrow" />
                        </div>
                        {openFilter === 'nombreAlias' && (
                        <div className="filter-dropdown-content">
                            <div className="dropdown-search">
                            <input 
                                type="text" 
                                placeholder={t("Buscar alias...")}
                                value={nombreAliasSearch}
                                onChange={(e) => setNombreAliasSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            </div>
                            <div className="dropdown-items">
                            {filterBySearch(nombreAlias, nombreAliasSearch).map((alias) => (
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
                                    checked={selectedNombreAlias.includes(alias.id)}
                                    readOnly
                                />
                                <span>{alias.id} - {normalizeText(alias.descripcion || alias.nombre)}</span>
                                </div>
                            ))}
                            </div>
                            <div 
                                className="dropdown-item select-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedNombreAlias.length === nombreAlias.length) {
                                    setSelectedNombreAlias([]);
                                    } else {
                                    setSelectedNombreAlias(nombreAlias.map(item => item.id));
                                    }
                                }}
                                >
                                <input 
                                    type="checkbox" 
                                    checked={selectedNombreAlias.length === nombreAlias.length && nombreAlias.length > 0}
                                    readOnly
                                />
                                <span>{t('Seleccionar todo')}</span>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="filters-row">
                <div className="filter-field">
                    <div 
                        className="filter-dropdown"
                        onClick={() => toggleFilter('tipoAlias')}
                    >
                        <label className="filter-label">{t('Tipo de Alias')}</label>
                        <div className="filter-value">
                            <span className="filter-placeholder">
                                {selectedTiposAlias.length > 0 
                                ? t('{{count}} seleccionados', { count: selectedTiposAlias.length })
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
                                    checked={selectedTiposAlias.includes(tipo.id)}
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
                                <span>{t('Seleccionar todo')}</span>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                
                <div className="filter-field">
                    <div 
                        className="filter-dropdown"
                        onClick={() => toggleFilter('estadoLinea')}
                    >
                        <label className="filter-label">{t('Id o Estado de Línea')}</label>
                        <div className="filter-value">
                            <span className="filter-placeholder">
                                {selectedEstadosLinea.length > 0 
                                ? t('{{count}} seleccionados', { count: selectedEstadosLinea.length })
                                : t('Seleccionar')}
                            </span>
                        <FaChevronDown className="dropdown-arrow" />
                        </div>
                        {openFilter === 'estadoLinea' && (
                        <div className="filter-dropdown-content">
                            <div className="dropdown-search">
                            <input 
                                type="text" 
                                placeholder={t("Buscar estado...")}
                                value={estadoLineaSearch}
                                onChange={(e) => setEstadoLineaSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            </div>
                            <div className="dropdown-items">
                            {filterBySearch(estadosLinea, estadoLineaSearch).map((estado) => (
                                <div 
                                key={estado.id} 
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterSelect('estadoLinea', estado.id);
                                }}
                                >
                                <input 
                                    type="checkbox" 
                                    checked={selectedEstadosLinea.includes(estado.id)}
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
                                    if (selectedEstadosLinea.length === estadosLinea.length) {
                                    setSelectedEstadosLinea([]);
                                    } else {
                                    setSelectedEstadosLinea(estadosLinea.map(item => item.id));
                                    }
                                }}
                                >
                                <input 
                                    type="checkbox" 
                                    checked={selectedEstadosLinea.length === estadosLinea.length && estadosLinea.length > 0}
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
                        onClick={() => toggleFilter('nombreEvento')}
                    >
                        <label className="filter-label">{t('Id o Nombre Evento')}</label>
                        <div className="filter-value">
                            <span className="filter-placeholder">
                                {selectedEventos.length > 0 
                                ? t('{{count}} seleccionados', { count: selectedEventos.length })
                                : t('Seleccionar')}
                            </span>
                        <FaChevronDown className="dropdown-arrow" />
                        </div>
                        {openFilter === 'nombreEvento' && (
                        <div className="filter-dropdown-content">
                            <div className="dropdown-search">
                            <input 
                                type="text" 
                                placeholder={t("Buscar evento...")}
                                value={nombreEventoSearch}
                                onChange={(e) => setNombreEventoSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            </div>
                            <div className="dropdown-items">
                            {filterBySearch(eventos, nombreEventoSearch).map((evento) => (
                                <div 
                                key={evento.idEvento} 
                                className="dropdown-item"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterSelect('evento', evento.idEvento);
                                }}
                                >
                                <input 
                                    type="checkbox" 
                                    checked={selectedEventos.includes(evento.idEvento)}
                                    readOnly
                                />
                                <span>{`${evento.idEvento} - ${normalizeText(evento.nombre || '')}`}</span>
                                </div>
                            ))}
                            </div>
                            <div 
                                className="dropdown-item select-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (selectedEventos.length === eventos.length) {
                                    setSelectedEventos([]);
                                    } else {
                                    setSelectedEventos(eventos.map(item => item.idEvento));
                                    }
                                }}
                                >
                                <input 
                                    type="checkbox" 
                                    checked={selectedEventos.length === eventos.length && eventos.length > 0}
                                    readOnly
                                />
                                <span>{t('Seleccionar todo')}</span>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
                
                <div className="filter-field">
                    <label className="filter-label">{t('Id Ejecución')}</label>
                    <input
                        type="text"
                        placeholder={t("Id Ejecución")}
                        value={idEjecucion}
                        onChange={(e) => setIdEjecucion(e.target.value)}
                        className="filter-input"
                />
                </div>
            </div>
            
            <div className="filters-row">
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
            <div className="recuentos-results-info">
                <div className="results-count">
                    {t('Cargados {{count}} resultados de {{total}} encontrados', {
                        count: recuentos.length,
                        total: totalElements
                    })}
                    <span className="last-update">
                        <FaRedo className="update-icon" />
                        {t('Última actualización')}: {formatTime(ultimaActualizacion)}
                    </span>
                </div>
            </div>
        )}

        {selectedRecuentos.length > 0 && (
            <div className="selection-toolbar">
                <div className="selection-info">
                    {t('Seleccionados {{count}} resultados de {{total}} encontrados', { 
                        count: selectedRecuentos.length, 
                        total: totalElements 
                    })}
                </div>
                <div className="selection-actions">
                <button 
                    className={`action-button ${!canDiscard ? 'disabled' : ''}`}
                    onClick={handleDescartar}
                    title="Descartar"
                    disabled={!canDiscard}
                >
                    <FaTrash /> {t('DESCARTAR')}
                </button>
                <button 
                    className={`action-button ${!canValidate ? 'disabled' : ''}`}
                    onClick={handleValidar}
                    title="Validar"
                    disabled={!canValidate}
                >
                    {t('VALIDAR')}
                </button>
                <button 
                    className={`action-button publish-button ${!canPublish ? 'disabled' : ''}`}
                    onClick={handlePublishIn07}
                    title="Publicar en 07"
                    disabled={!canPublish}
                >
                    <span>{t('PUBLICAR EN 07')}</span>
                </button>
                </div>
            </div>
        )}
        
        {showResults ? (
            loading ? (
                <div className="results-section">
                <div className="loading-indicator">{t('Cargando...')}</div>
                </div>
            ) : recuentos.length > 0 ? (
                <RecuentosTable recuentos={recuentos} loading={loading} />
            ) : (
                <div className="results-section">
                <div className="no-results">
                    <div className="search-icon">
                    <FaSearch />
                    </div>
                    <p className="no-results-text">
                        {t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}
                    </p>
                </div>
                </div>
            )
            ) : (
            <div className="results-section">
                <div className="no-search-yet">
                <div className="search-icon">
                    <FaSearch />
                </div>
                <p className="no-results-text">
                    {t('UTILIZA LOS CAMPOS NECESARIOS PARA REALIZAR UNA BÚSQUEDA')}
                </p>
                </div>
            </div>
            )}
            {showRecuento07Modal && selectedRecuentoDetails && (
                <ViewRecuento07Modal 
                    recuento={selectedRecuentoDetails}
                    onClose={() => {
                    setShowRecuento07Modal(false);
                    setSelectedRecuentoDetails(null);
                    }}
                    onUpdate={handleSearch}
                />
            )}
        </div>
    );
};

export default Recuentos;