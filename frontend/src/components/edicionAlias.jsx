import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronDown, FaTimes, FaCircle, FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/edicionAlias.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

// Mapeo de estados para asegurar compatibilidad entre backend y frontend
const ESTADO_MAPPING = {
  // Si el backend envía IDs numéricos, los mapeamos a strings
  '1': 'BORRADOR',
  '2': 'PRODUCCION',
  '3': 'PAUSADO',
  '0': 'ELIMINADO',
  // Texto directo para mayor flexibilidad
  'BORRADOR': 'BORRADOR',
  'PAUSADO': 'PAUSADO',
  'PRODUCCION': 'PRODUCCION',
  // Descripción completa que podría venir del backend
  'Borrador': 'BORRADOR',
  'Pausado': 'PAUSADO',
  'Producción': 'PRODUCCION'
};

const EdicionAlias = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const dropdownRef = useRef(null);
  const articulosDropdownRef = useRef(null);

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alias, setAlias] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [articulosDisponibles, setArticulosDisponibles] = useState([]);
  const [idiomas, setIdiomas] = useState([]);
  const [ambitos, setAmbitos] = useState([]);

  // Estados para opciones de selección
  const [tiposAlias, setTiposAlias] = useState([]);
  const [idiomasDisponibles, setIdiomasDisponibles] = useState([]);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [mercados, setMercados] = useState([]);

  // Estados para valores seleccionados
  const [selectedTipoAlias, setSelectedTipoAlias] = useState('');
  const [selectedTipoConexion, setSelectedTipoConexion] = useState('');
  const [selectedEstacionalidad, setSelectedEstacionalidad] = useState('');
  const [selectedEstadoAlias, setSelectedEstadoAlias] = useState('');
  const [estadoDesc, setEstadoDesc] = useState(''); // Estado para guardar la descripción
  const [idiomasAliasValues, setIdiomasAliasValues] = useState({});
  const [selectedGrupoCadena, setSelectedGrupoCadena] = useState('');
  const [selectedCadena, setSelectedCadena] = useState('');
  const [selectedMercado, setSelectedMercado] = useState('');
  const [selectedIdiomas, setSelectedIdiomas] = useState([]);

  // Estados para dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [checkAll, setCheckAll] = useState(false);
  const [checkAllArticulos, setCheckAllArticulos] = useState(false);
  const [filteredArticulos, setFilteredArticulos] = useState([]);
  
  // Estado para el input de búsqueda en el nuevo dropdown
  const [articuloSearchText, setArticuloSearchText] = useState('');
  const [isArticulosDropdownOpen, setIsArticulosDropdownOpen] = useState(false);

  // Función para manejar clicks fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
      if (articulosDropdownRef.current && !articulosDropdownRef.current.contains(event.target)) {
        setIsArticulosDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función para mapear el estado del alias
  const getEstadoNormalizado = (estadoId, estadoDesc) => {
    // Si tenemos un mapeo directo, lo usamos
    if (ESTADO_MAPPING[estadoId]) {
      return ESTADO_MAPPING[estadoId];
    }
    
    // Si tenemos la descripción, intentamos normalizarla
    if (estadoDesc) {
      const estadoUpperCase = estadoDesc.toUpperCase();
      if (estadoUpperCase.includes('BORRADOR')) return 'BORRADOR';
      if (estadoUpperCase.includes('PAUSADO')) return 'PAUSADO';
      if (estadoUpperCase.includes('PRODUCCION') || estadoUpperCase.includes('PRODUCCIÓN')) return 'PRODUCCION';
    }
    
    // Por defecto
    return 'PRODUCCION';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch alias details
        const aliasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}?idIdioma=${languageId}`);
        const aliasData = aliasResponse.data;
        setAlias(aliasData);

        // Guardar el ID y descripción del estado
        const estadoId = aliasData.idEstado;
        const estadoDescripcion = aliasData.estado;
        
        // Aquí normalizamos el estado para que coincida con nuestras opciones de UI
        const normalizedEstado = getEstadoNormalizado(estadoId, estadoDescripcion);
        console.log(`Estado del alias: ID=${estadoId}, Desc=${estadoDescripcion}, Normalizado=${normalizedEstado}`);
        
        // Set initial values
        setSelectedTipoAlias(aliasData.idTipoAlias || '');
        setSelectedTipoConexion(aliasData.idTipoConexion || 'PRINCIPAL');
        setSelectedEstacionalidad(aliasData.idEstacionalidad || '');
        setSelectedEstadoAlias(normalizedEstado); // Usamos el estado normalizado
        setEstadoDesc(estadoDescripcion || '');

        // Fetch alias articles
        const articulosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/articulos?idIdioma=${languageId}`);
        setArticulos(articulosResponse.data || []);

        // Fetch alias languages
        const idiomasResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/idiomas?idIdioma=${languageId}`);
        const idiomasData = idiomasResponse.data || [];
        setIdiomas(idiomasData);
        setSelectedIdiomas(idiomasData.map(i => i.idIdioma));

        // Create idiomas values map
        const idiomasValues = {};
        idiomasData.forEach(idioma => {
          idiomasValues[idioma.idIdioma] = {
            nombre: idioma.nombre || '',
            descripcion: idioma.descripcion || ''
          };
        });
        setIdiomasAliasValues(idiomasValues);

        // Fetch ambitos (cadenas, grupos y mercados)
        const ambitosResponse = await axios.get(`${BASE_URL}/edicion/alias/${id}/ambitos?idIdioma=${languageId}`);
        setAmbitos(ambitosResponse.data || {});
        if (ambitosResponse.data && ambitosResponse.data.gruposCadena && ambitosResponse.data.gruposCadena.length > 0) {
          setSelectedGrupoCadena(ambitosResponse.data.gruposCadena[0].id);
        }
        if (ambitosResponse.data && ambitosResponse.data.cadenas && ambitosResponse.data.cadenas.length > 0) {
          setSelectedCadena(ambitosResponse.data.cadenas[0].id);
        }
        if (ambitosResponse.data && ambitosResponse.data.mercados && ambitosResponse.data.mercados.length > 0) {
          setSelectedMercado(ambitosResponse.data.mercados[0].id);
        }

        // Fetch selection options in parallel
        const [
          tiposAliasRes,
          idiomasDisponiblesRes,
          gruposCadenaRes,
          cadenasRes,
          mercadosRes,
          articulosDisponiblesRes
        ] = await Promise.all([
          axios.get(`${BASE_URL}/tipos-alias?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/idiomas?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/grupos-cadena?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/cadenas?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/mercados?idIdioma=${languageId}`),
          axios.get(`${BASE_URL}/edicion/all?idIdioma=${languageId}`)
        ]);

        setTiposAlias(tiposAliasRes.data || []);
        setIdiomasDisponibles(idiomasDisponiblesRes.data || []);
        setGruposCadena(gruposCadenaRes.data || []);
        setCadenas(cadenasRes.data || []);
        setMercados(mercadosRes.data || []);
        setArticulosDisponibles(articulosDisponiblesRes.data || []);
        setFilteredArticulos(articulosDisponiblesRes.data || []);
      } catch (error) {
        console.error('Error fetching alias data:', error);
        setError('No se pudieron cargar los datos del alias');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, languageId]);

  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
    setSearchText('');
  };

  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
    
    // Filtrar artículos si estamos en el dropdown de artículos
    if (openDropdown === 'articulos') {
      const searchValue = e.target.value.toLowerCase();
      const filtered = articulosDisponibles.filter(
        articulo => 
          articulo.idAjeno?.toString().toLowerCase().includes(searchValue) || 
          articulo.nombreAjeno?.toLowerCase().includes(searchValue)
      );
      setFilteredArticulos(filtered);
    }
  };

  // Función para manejar la búsqueda en el nuevo dropdown
  const handleArticuloSearchChange = (e) => {
    const value = e.target.value;
    setArticuloSearchText(value);
    
    // Filtrar artículos basado en la búsqueda
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = articulosDisponibles.filter(
        articulo => 
          articulo.idAjeno?.toString().toLowerCase().includes(searchValue) || 
          articulo.nombreAjeno?.toLowerCase().includes(searchValue)
      );
      setFilteredArticulos(filtered);
    } else {
      setFilteredArticulos(articulosDisponibles);
    }
  };

  // Funciones para el nuevo dropdown de artículos
  const toggleArticulosDropdown = () => {
    setIsArticulosDropdownOpen(!isArticulosDropdownOpen);
    if (!isArticulosDropdownOpen) {
      // Reset filtros al abrir el dropdown
      setArticuloSearchText('');
      setFilteredArticulos(articulosDisponibles);
    }
  };

  const clearArticuloSearch = () => {
    setArticuloSearchText('');
    setFilteredArticulos(articulosDisponibles);
  };

  // Funciones para manejar la selección de artículos
  const handleSelectAllArticulos = () => {
    const newCheckAllArticulos = !checkAllArticulos;
    setCheckAllArticulos(newCheckAllArticulos);
    
    if (newCheckAllArticulos) {
      // Obtener solo los artículos filtrados que no están ya seleccionados
      const articulosToAdd = filteredArticulos.filter(
        articulo => !articulos.some(a => a.idAjeno === articulo.idAjeno)
      );
      
      if (articulosToAdd.length > 0) {
        setArticulos(prev => [...prev, ...articulosToAdd]);
      }
    } else {
      // Deseleccionar solo los que están en la lista filtrada
      const filteredIds = filteredArticulos.map(a => a.idAjeno);
      setArticulos(prev => prev.filter(a => !filteredIds.includes(a.idAjeno)));
    }
  };

  const handleArticuloSelect = (articulo) => {
    const isSelected = articulos.some(a => a.idAjeno === articulo.idAjeno);
    
    if (isSelected) {
      setArticulos(prev => prev.filter(a => a.idAjeno !== articulo.idAjeno));
    } else {
      setArticulos(prev => [...prev, articulo]);
    }
  };

  const handleAddArticulo = () => {
    setIsArticulosDropdownOpen(false);
  };

  const handleEstadoAliasChange = (estadoId) => {
    setSelectedEstadoAlias(estadoId);
  };

  const handleIdiomaAliasChange = (idiomaId, field, value) => {
    setIdiomasAliasValues(prev => ({
      ...prev,
      [idiomaId]: {
        ...prev[idiomaId],
        [field]: value
      }
    }));
  };

  const handleIdiomaCheckboxChange = (idiomaId, isChecked) => {
    if (isChecked) {
      // Añadir idioma si no está ya seleccionado
      if (!selectedIdiomas.includes(idiomaId)) {
        setSelectedIdiomas([...selectedIdiomas, idiomaId]);
        // Inicializar valores vacíos para este idioma si no existen
        if (!idiomasAliasValues[idiomaId]) {
          setIdiomasAliasValues(prev => ({
            ...prev,
            [idiomaId]: { nombre: '', descripcion: '' }
          }));
        }
      }
    } else {
      // Eliminar idioma de la selección
      setSelectedIdiomas(selectedIdiomas.filter(id => id !== idiomaId));
    }
  };

  const handleSelectAllIdiomas = (isChecked) => {
    setCheckAll(isChecked);
    if (isChecked) {
      // Seleccionar todos los idiomas visibles (filtrados)
      const filteredIdiomas = idiomasDisponibles
        .filter(idioma => 
          searchText === '' || 
          idioma.descripcion.toLowerCase().includes(searchText.toLowerCase())
        )
        .map(idioma => idioma.id);
      
      // Combinar con los ya seleccionados para no perder selecciones
      const allSelected = [...new Set([...selectedIdiomas, ...filteredIdiomas])];
      setSelectedIdiomas(allSelected);
      
      // Inicializar valores vacíos para los nuevos idiomas
      let newValues = {...idiomasAliasValues};
      filteredIdiomas.forEach(id => {
        if (!newValues[id]) {
          newValues[id] = { nombre: '', descripcion: '' };
        }
      });
      setIdiomasAliasValues(newValues);
    } else {
      // Deseleccionar solo los idiomas visibles (filtrados)
      const filteredIdiomas = idiomasDisponibles
        .filter(idioma => 
          searchText === '' || 
          idioma.descripcion.toLowerCase().includes(searchText.toLowerCase())
        )
        .map(idioma => idioma.id);
      
      setSelectedIdiomas(selectedIdiomas.filter(id => !filteredIdiomas.includes(id)));
    }
  };

  const handleClearSearchText = () => {
    setSearchText('');
  };

  const handleClearInputValue = (idiomaId, field) => {
    handleIdiomaAliasChange(idiomaId, field, '');
  };

  const handleGrupoCadenaSelect = (grupoId) => {
    setSelectedGrupoCadena(grupoId);
    setOpenDropdown(null);
  };

  const handleCadenaSelect = (cadenaId) => {
    setSelectedCadena(cadenaId);
    setOpenDropdown(null);
  };

  const handleMercadoSelect = (mercadoId) => {
    setSelectedMercado(mercadoId);
    setOpenDropdown(null);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedAlias = {
        id: alias.id,
        idTipoAlias: selectedTipoAlias,
        idTipoConexion: selectedTipoConexion,
        idEstacionalidad: selectedEstacionalidad,
        idEstado: selectedEstadoAlias,
        idiomas: selectedIdiomas.map(idIdioma => ({
          idIdioma,
          nombre: idiomasAliasValues[idIdioma]?.nombre || '',
          descripcion: idiomasAliasValues[idIdioma]?.descripcion || ''
        })),
        ambitos: [{
          idGrupoCadena: selectedGrupoCadena,
          idCadena: selectedCadena,
          idMercado: selectedMercado
        }]
      };

      await axios.put(`${BASE_URL}/alias/${id}`, updatedAlias);
      navigate(-1);
    } catch (error) {
      console.error('Error saving alias:', error);
      setError('Error al guardar los cambios del alias');
    } finally {
      setLoading(false);
    }
  };

  const getIdiomaNombre = (idiomaId) => {
    const idioma = idiomasDisponibles.find(i => i.id === idiomaId);
    return idioma ? idioma.descripcion : idiomaId;
  };

  const getGrupoCadenaNombre = (grupoId) => {
    const grupo = gruposCadena.find(g => g.id === grupoId);
    return grupo ? `${grupoId} - ${grupo.descripcion}` : grupoId;
  };

  const getCadenaNombre = (cadenaId) => {
    const cadena = cadenas.find(c => c.id === cadenaId);
    return cadena ? `${cadenaId} - ${cadena.descripcion}` : cadenaId;
  };

  const getMercadoNombre = (mercadoId) => {
    const mercado = mercados.find(m => m.id === mercadoId);
    return mercado ? `${mercadoId} - ${mercado.descripcion}` : mercadoId;
  };

  if (loading) {
    return (
      <div className="edicion-alias-loading">
        <span>{t('Cargando datos del alias...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edicion-alias-error">
        <span>{error}</span>
      </div>
    );
  }

  if (!alias) {
    return (
      <div className="edicion-alias-error">
        <span>{t('No se encontró el alias solicitado')}</span>
      </div>
    );
  }

  return (
    <div className="edicion-alias-container">
      <div className="edicion-alias-header">
        <h1 className="edicion-alias-title">
          {t('EDICIÓN DE ALIAS')} - {alias.idAlias} / {alias.descripcion || alias.nombreAlias}
        </h1>
      </div>

      <div className="edicion-alias-content">
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 1')}</span> - <span className="paso-descripcion">{t('DATOS ALIAS')}</span> 
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <p className="section-description">{t('Cubre los campos para la descripción del alias.')}</p>
            
            <div className="simple-form-row">
              <div className="simple-form-group">
                <div className="simple-label">{t('Tipo de Alias')}</div>
                <div className="simple-value">Tipo Alias I</div>
              </div>
              
              <div className="simple-form-group">
                <div className="simple-label">{t('Tipo de conexión a origen')}</div>
                <div className="simple-value">PRINCIPAL</div>
              </div>
              
              <div className="simple-form-group">
                <div className="simple-label">{t('Estacionalidad')}</div>
                <div className="simple-value">Siempre</div>
              </div>
              
              <div className="estado-alias-group">
                <div className="simple-label">{t('Estado del alias')}</div>
                <div className="estado-buttons">
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'BORRADOR' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('BORRADOR')}
                  >
                    {t('BORRADOR')}
                  </button>
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'PAUSADO' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('PAUSADO')}
                  >
                    {t('PAUSADO')}
                  </button>
                  <button 
                    className={`estado-button ${selectedEstadoAlias === 'PRODUCCION' ? 'selected' : ''}`}
                    onClick={() => handleEstadoAliasChange('PRODUCCION')}
                  >
                    {t('PRODUCCIÓN')}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <p className="idiomas-description">{t('Añade los idiomas de los mercados donde se distribuirá este alias.')}</p>
            </div>
            
            <div className="form-row idiomas-dropdown-row">
              <div className="idiomas-dropdown" ref={dropdownRef}>
                <div 
                  className="idiomas-dropdown-field" 
                  onClick={() => handleDropdownToggle('idiomas')}
                >
                  <span>{selectedIdiomas.length} {t('seleccionados')}</span>
                  <FaChevronDown className="dropdown-arrow" />
                </div>
                
                {openDropdown === 'idiomas' && (
                  <div className="idiomas-dropdown-menu">
                    <div className="idiomas-dropdown-search">
                      <FaSearch className="search-icon" />
                      <input 
                        type="text" 
                        placeholder={t('Buscar idioma...')}
                        value={searchText}
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {searchText && (
                        <FaTimes className="clear-search-icon" onClick={handleClearSearchText} />
                      )}
                    </div>
                    
                    <div className="idiomas-dropdown-items">
                      <div className="idiomas-dropdown-item select-all">
                        <input 
                          type="checkbox" 
                          checked={checkAll}
                          onChange={(e) => handleSelectAllIdiomas(e.target.checked)}
                        />
                        <span>{t('Seleccionar todo')}</span>
                      </div>
                      
                      {idiomasDisponibles
                        .filter(idioma => 
                          searchText === '' || 
                          idioma.descripcion.toLowerCase().includes(searchText.toLowerCase())
                        )
                        .map(idioma => (
                          <div key={idioma.id} className="idiomas-dropdown-item">
                            <input 
                              type="checkbox" 
                              checked={selectedIdiomas.includes(idioma.id)}
                              onChange={(e) => handleIdiomaCheckboxChange(idioma.id, e.target.checked)}
                              id={`idioma-${idioma.id}`}
                            />
                            <label 
                              htmlFor={`idioma-${idioma.id}`}
                              onClick={() => handleIdiomaCheckboxChange(idioma.id, !selectedIdiomas.includes(idioma.id))}
                            >
                              {idioma.descripcion}
                            </label>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="idiomas-count">{selectedIdiomas.length} {t('idiomas añadidos')}</div>
            
            <div className="idiomas-table-container">
              <table className="idiomas-table">
                <thead>
                  <tr>
                    <th className="checkbox-column"></th>
                    <th>{t('IDIOMA')}</th>
                    <th>{t('ALIAS EN CADA IDIOMA*')}</th>
                    <th>{t('DESCRIPCIÓN DEL ALIAS*')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedIdiomas.map(idiomaId => (
                    <tr key={idiomaId}>
                      <td className="checkbox-column">
                        <input 
                          type="checkbox" 
                          checked 
                          onChange={() => handleIdiomaCheckboxChange(idiomaId, false)}
                        />
                      </td>
                      <td>{getIdiomaNombre(idiomaId)}</td>
                      <td>
                        <div className="editable-cell">
                          <input 
                            type="text" 
                            value={idiomasAliasValues[idiomaId]?.nombre || ''} 
                            onChange={(e) => handleIdiomaAliasChange(idiomaId, 'nombre', e.target.value)}
                            placeholder="QA Prueba"
                          />
                          {idiomasAliasValues[idiomaId]?.nombre && (
                            <FaTimes 
                              className="clear-input" 
                              onClick={() => handleClearInputValue(idiomaId, 'nombre')}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="editable-cell">
                          <input 
                            type="text" 
                            value={idiomasAliasValues[idiomaId]?.descripcion || ''} 
                            onChange={(e) => handleIdiomaAliasChange(idiomaId, 'descripcion', e.target.value)}
                            placeholder="QA Prueba"
                          />
                          {idiomasAliasValues[idiomaId]?.descripcion && (
                            <FaTimes 
                              className="clear-input" 
                              onClick={() => handleClearInputValue(idiomaId, 'descripcion')}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 2')}</span> - <span className="paso-descripcion">{t('ARTÍCULOS*')}</span>
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <p className="section-description">{t('Busca y añade los artículos que desea incluir en el alias.')}</p>
            
            {/* Nuevo dropdown de artículos */}
            <div className="articulos-search-container" ref={articulosDropdownRef}>
              <div className="articulos-search-input-container">
                <input 
                  type="text" 
                  value={articuloSearchText}
                  onChange={handleArticuloSearchChange}
                  onClick={toggleArticulosDropdown}
                  className="articulos-search-input"
                  placeholder={t('Buscar por id o nombre de artículo')}
                />
                
                {articuloSearchText && (
                  <button
                    className="articulos-search-clear-btn"
                    onClick={clearArticuloSearch}
                  >
                    <FaTimes />
                  </button>
                )}
                
                <button 
                  className="articulos-search-toggle-btn" 
                  onClick={toggleArticulosDropdown}
                >
                  <FaChevronDown />
                </button>
              </div>
              
              <button className="articulos-add-btn" onClick={handleAddArticulo}>
                {t('AÑADIR')}
              </button>
              
              {isArticulosDropdownOpen && (
                <div className="articulos-dropdown">
                  <div className="articulos-search-box">
                    <FaSearch className="articulos-search-icon" />
                    <input 
                      type="text"
                      value={articuloSearchText}
                      onChange={handleArticuloSearchChange}
                      placeholder={t('Buscar artículo...')}
                      className="articulos-dropdown-search-input"
                      autoFocus
                    />
                    {articuloSearchText && (
                      <button
                        className="articulos-dropdown-clear-btn"
                        onClick={clearArticuloSearch}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  
                  <div className="articulos-dropdown-items">
                    {filteredArticulos.length === 0 ? (
                      <div className="articulos-no-results">{t('No se encontraron artículos')}</div>
                    ) : (
                      <>
                        {filteredArticulos.map(articulo => (
                          <div 
                            key={articulo.idAjeno || articulo.id} 
                            className="articulos-dropdown-item"
                            onClick={() => handleArticuloSelect(articulo)}
                          >
                            <input 
                              type="checkbox" 
                              checked={articulos.some(a => a.idAjeno === articulo.idAjeno)}
                              readOnly
                            />
                            <div className="articulos-item-info">
                              <div className="articulos-item-id">
                                ID: {articulo.idAjeno || articulo.id}
                              </div>
                              <div className="articulos-item-nombre">
                                {articulo.nombreAjeno || articulo.descripcion || articulo.nombre}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="articulos-select-all" onClick={handleSelectAllArticulos}>
                          <input 
                            type="checkbox" 
                            checked={checkAllArticulos}
                            readOnly
                          />
                          <span>{t('Seleccionar todo')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="articulos-count">{articulos.length} {t('artículos añadidos')}</div>
            
            <div className="articulos-table-container">
              <div className="articulos-table-scroll">
                <table className="articulos-table">
                  <thead>
                    <tr>
                      <th className="checkbox-column"></th>
                      <th className="id-column">{t('ID ARTÍCULO')}</th>
                      <th className="articulo-column">{t('ARTÍCULO')}</th>
                      <th className="unidades-column">{t('UNIDADES BOX')}</th>
                      <th className="unidad-column">
                        <div>{t('UNIDAD DE')}</div>
                        <div>{t('EMPAQUETADO')}</div>
                      </th>
                      <th className="multiplo-column">
                        <div>{t('MÚLTIPLO')}</div>
                        <div>{t('MÍNIMO')}</div>
                      </th>
                      <th className="estado-spi-column">
                        <div>{t('ESTADO ARTÍCULO')}</div>
                        <div>{t('SFI')}</div>
                      </th>
                      <th className="estado-ram-column">
                        <div>{t('ESTADO ARTÍCULO')}</div>
                        <div>{t('RAM')}</div>
                      </th>
                      <th className="estado-alias-column">
                        <div>{t('ESTADO ARTÍCULO')}</div>
                        <div>{t('EN EL ALIAS')}</div>
                      </th>
                      <th className="fecha-column">
                        <div>{t('FECHA DE')}</div>
                        <div>{t('ALTA')}</div>
                      </th>
                      <th className="sint-column">{t('ID SINT')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articulos.map(articulo => (
                      <tr key={articulo.idAjeno || articulo.id}>
                        <td className="checkbox-column">
                          <input type="checkbox" checked readOnly />
                        </td>
                        <td>{articulo.idAjeno || articulo.id}</td>
                        <td className="articulo-name">
                          {articulo.nombreAjeno || articulo.descripcion || articulo.nombre}
                        </td>
                        <td className="unidades-box">{articulo.unidadesBox || 'UNIDAD'}</td>
                        <td>{articulo.unidadEmpaquetado || 'BULTO-PACKAGE'}</td>
                        <td className="text-center">{articulo.multiploMinimo || '1'}</td>
                        <td className="estado-column">
                          <span className="estado-tag activo">
                            {articulo.tipoEstadoCompras?.descripcion || 'ACTIVO'}
                          </span>
                        </td>
                        <td className="estado-column">
                          <span className="estado-tag activo">
                            {articulo.tipoEstadoRam?.descripcion || 'ACTIVO'}
                          </span>
                        </td>
                        <td className="estado-column">
                          <span className="estado-tag activo">
                            {articulo.descripcionTipoEstadoAliasAjenoRam || 'ACTIVO'}
                          </span>
                        </td>
                        <td>{articulo.fechaAlta || '2025-04-11'}</td>
                        <td>{articulo.idSint || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <div className="edicion-alias-section">
          <div className="paso-title">
            <span>{t('PASO 3')}</span> - <span className="paso-descripcion">{t('DEFINICIÓN DEL ÁMBITO')}</span>
            <FaCircle className="paso-icon completed" />
          </div>
          
          <div className="paso-content">
            <div className="form-row ambito-row">
              <div className="form-field ambito-field">
                <span className="ambito-label">{t('Tipo ámbito')}</span>
                <div className="ambito-value">
                  {t('Grupo cadena y mercado')}
                </div>
              </div>
              
              <div className="form-field grupo-cadena-field">
                <label>{t('Id o Grupo Cadena (TG)*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('grupoCadena')}>
                  <span>{getGrupoCadenaNombre(selectedGrupoCadena)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'grupoCadena' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {gruposCadena
                          .filter(grupo => 
                            searchText === '' || 
                            grupo.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            grupo.id.toString().includes(searchText)
                          )
                          .map(grupo => (
                            <div 
                              key={grupo.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGrupoCadenaSelect(grupo.id);
                              }}
                            >
                              {grupo.id} - {grupo.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-field cadena-field">
                <label>{t('Id o Cadena*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('cadena')}>
                  <span>{getCadenaNombre(selectedCadena)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'cadena' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {cadenas
                          .filter(cadena => 
                            searchText === '' || 
                            cadena.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            cadena.id.toString().includes(searchText)
                          )
                          .map(cadena => (
                            <div 
                              key={cadena.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCadenaSelect(cadena.id);
                              }}
                            >
                              {cadena.id} - {cadena.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-field mercado-field">
                <label>{t('Id o Mercado*')}</label>
                <div className="dropdown-field" onClick={() => handleDropdownToggle('mercado')}>
                  <span>{getMercadoNombre(selectedMercado)}</span>
                  <FaChevronDown className="dropdown-arrow" />
                  {openDropdown === 'mercado' && (
                    <div className="dropdown-menu">
                      <input 
                        type="text" 
                        className="dropdown-search" 
                        placeholder={t('Buscar...')} 
                        value={searchText} 
                        onChange={handleSearchChange}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="dropdown-items">
                        {mercados
                          .filter(mercado => 
                            searchText === '' || 
                            mercado.descripcion.toLowerCase().includes(searchText.toLowerCase()) ||
                            mercado.id.toString().includes(searchText)
                          )
                          .map(mercado => (
                            <div 
                              key={mercado.id} 
                              className="dropdown-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMercadoSelect(mercado.id);
                              }}
                            >
                              {mercado.id} - {mercado.descripcion}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="ambitos-table-container">
              <table className="ambitos-table">
                <thead>
                  <tr>
                    <th>{t('ID/GRUPO CADENA')}</th>
                    <th>{t('ID/CADENA')}</th>
                    <th>{t('MERCADO')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ambitos && ambitos.gruposCadena && ambitos.gruposCadena.length > 0 ? (
                    ambitos.gruposCadena.map((grupo, index) => {
                      const cadena = ambitos.cadenas && ambitos.cadenas.length > index ? ambitos.cadenas[index] : null;
                      const mercado = ambitos.mercados && ambitos.mercados.length > index ? ambitos.mercados[index] : null;
                      return (
                        <tr key={index}>
                          <td>{getGrupoCadenaNombre(grupo.id)}</td>
                          <td>{cadena ? getCadenaNombre(cadena.id) : '-'}</td>
                          <td className="mercado-column">
                            <span>{mercado ? getMercadoNombre(mercado.id) : '-'}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td>{getGrupoCadenaNombre(selectedGrupoCadena)}</td>
                      <td>{getCadenaNombre(selectedCadena)}</td>
                      <td className="mercado-column">
                        <span className="mercado-flag">🇪🇸</span>
                        <span>{getMercadoNombre(selectedMercado)}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div className="edicion-alias-actions">
        <button className="cancel-button" onClick={handleCancel}>
          {t('CANCELAR')}
        </button>
        <button className="save-button" onClick={handleSave}>
          {t('GUARDAR')}
        </button>
      </div>
    </div>
  );
};

export default EdicionAlias;