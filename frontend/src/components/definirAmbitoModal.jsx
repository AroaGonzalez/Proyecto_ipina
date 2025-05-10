import React, { useState, useEffect, useRef, useContext } from 'react';
import { FaSearch, FaChevronDown, FaTimes, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/definirAmbitoModal.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const DefinirAmbitoModal = ({ isOpen, onClose, onSave, selectedAliases = [], initialSelections = {} }) => {
  const { languageId } = useContext(LanguageContext);
  const [gruposCadena, setGruposCadena] = useState([]);
  const [cadenas, setCadenas] = useState([]);
  const [mercados, setMercados] = useState([]);
  const [selectedGruposCadena, setSelectedGruposCadena] = useState(initialSelections.gruposCadena || []);
  const [selectedCadenas, setSelectedCadenas] = useState(initialSelections.cadenas || []);
  const [selectedMercados, setSelectedMercados] = useState(initialSelections.mercados || []);
  const [selectedLocalizaciones, setSelectedLocalizaciones] = useState([]);
  const [localizaciones, setLocalizaciones] = useState([]);
  const [showSeleccionadas, setShowSeleccionadas] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [grupoSearchText, setGrupoSearchText] = useState('');
  const [cadenaSearchText, setCadenaSearchText] = useState('');
  const [mercadoSearchText, setMercadoSearchText] = useState('');
  const [filteredGruposCadena, setFilteredGruposCadena] = useState([]);
  const [filteredCadenas, setFilteredCadenas] = useState([]);
  const [filteredMercados, setFilteredMercados] = useState([]);
  const [isGrupoCadenaDropdownOpen, setIsGrupoCadenaDropdownOpen] = useState(false);
  const [isCadenaDropdownOpen, setIsCadenaDropdownOpen] = useState(false);
  const [isMercadoDropdownOpen, setIsMercadoDropdownOpen] = useState(false);
  
  const modalRef = useRef(null);
  const grupoCadenaDropdownRef = useRef(null);
  const cadenaDropdownRef = useRef(null);
  const mercadoDropdownRef = useRef(null);
  
  const [localizacionesInicializadas, setLocalizacionesInicializadas] = useState(false);

  const normalizeText = (text) => {
    // Check if text is a string
    if (!text || typeof text !== 'string') return String(text || '');
  
    try {
      let normalizedText = String(text);
  
      normalizedText = normalizedText
        .replace(/ESPA.?.'A/g, 'ESPAÑA')
        .replace(/ESPA.?.A/g, 'ESPAÑA');
  
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
    } catch (error) {
      console.error('Error in normalizeText:', error);
      return String(text || '');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen, languageId]);

  useEffect(() => {
    
    if (isOpen && 
        selectedGruposCadena.length > 0 && 
        selectedCadenas.length > 0 && 
        selectedMercados.length > 0 && 
        selectedAliases.length > 0) {
      console.log('¡CUMPLE CONDICIONES! Llamando a fetchTareaAmbitoData');
      console.log('selectedAliases:', JSON.stringify(selectedAliases));
      fetchTareaAmbitoData();
    } else {
      console.log('NO cumple condiciones para fetch. Razones:', {
        isOpen: isOpen ? 'OK' : 'Modal cerrado',
        gruposLength: selectedGruposCadena.length > 0 ? 'OK' : 'Sin grupos seleccionados',
        cadenasLength: selectedCadenas.length > 0 ? 'OK' : 'Sin cadenas seleccionadas',  
        mercadosLength: selectedMercados.length > 0 ? 'OK' : 'Sin mercados seleccionados',
        aliasesLength: selectedAliases.length > 0 ? 'OK' : 'Sin aliases seleccionados'
      });
      setLocalizaciones([]);
    }
  }, [isOpen, selectedGruposCadena, selectedCadenas, selectedMercados, selectedAliases, languageId]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (grupoCadenaDropdownRef.current && !grupoCadenaDropdownRef.current.contains(event.target)) {
        setIsGrupoCadenaDropdownOpen(false);
      }
      if (cadenaDropdownRef.current && !cadenaDropdownRef.current.contains(event.target)) {
        setIsCadenaDropdownOpen(false);
      }
      if (mercadoDropdownRef.current && !mercadoDropdownRef.current.contains(event.target)) {
        setIsMercadoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (localizaciones.length > 0 && !localizacionesInicializadas) {
      // Extract the group, chain and market IDs from the existing locations
      if (initialSelections.existingLocations && initialSelections.existingLocations.length > 0) {
        // Get all unique group, chain and market IDs from the existing locations
        const locationData = localizaciones.filter(loc => 
          initialSelections.existingLocations.some(existingLoc => 
            existingLoc.idLocalizacion === loc.idLocalizacion || 
            existingLoc.idLocalizacion === parseInt(loc.id)
          )
        );
        
        // Update selected dropdowns based on existing locations
        if (locationData.length > 0) {
          const uniqueGrupoIds = [...new Set(locationData.map(loc => loc.idGrupoCadena))];
          const uniqueCadenaIds = [...new Set(locationData.map(loc => loc.idCadena))];
          const uniqueMercadoIds = [...new Set(locationData.map(loc => loc.idMercado))];
          
          setSelectedGruposCadena(uniqueGrupoIds);
          setSelectedCadenas(uniqueCadenaIds);
          setSelectedMercados(uniqueMercadoIds);
        }
        
        // Pre-select the locations
        const existingLocationIds = locationData.map(loc => loc.id);
        setSelectedLocalizaciones(existingLocationIds);
      }
      
      setLocalizacionesInicializadas(true);
    }
  }, [localizaciones, localizacionesInicializadas, initialSelections]);
  
  const fetchInitialData = async () => {
    try {
      const [gruposCadenaRes, cadenasRes, mercadosRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/tareas/grupos-cadena?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/api/tareas/cadenas?idIdioma=${languageId}`),
        axios.get(`${BASE_URL}/api/tareas/mercados?idIdioma=${languageId}`)
      ]);
      
      const gruposCadenaData = gruposCadenaRes.data || [];
      setGruposCadena(gruposCadenaData);
      setFilteredGruposCadena(gruposCadenaData);
      
      const cadenasData = cadenasRes.data || [];
      setCadenas(cadenasData);
      
      // Actualizar las cadenas filtradas basado en los grupos seleccionados
      updateCadenasBySelectedGrupos(selectedGruposCadena, cadenasData);
      
      const mercadosData = mercadosRes.data || [];
      setMercados(mercadosData);
      setFilteredMercados(mercadosData);
            
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchTareaAmbitoData = async () => {
    console.log('INICIANDO fetchTareaAmbitoData...');
    setLoading(true);
    try {
      const aliasData = selectedAliases.map(alias => {
        console.log('Procesando alias:', alias);
        const formattedAlias = {
          idAlias: alias.id || alias.idAlias,
          idTipoEstadoAlias: alias.estadoId || alias.idTipoEstadoAlias || 2,
          idTipoAlias: alias.tipo || alias.idTipoAlias || 1,
          idTipoConexionOrigenDatoAlias: null
        };
        
        if (alias.acoples && alias.acoples.length > 0) {
          formattedAlias.acoples = alias.acoples.map(acople => ({
            idAliasAcople: acople.id || acople.idAliasAcople
          }));
        }
        
        return formattedAlias;
      });
      
      const requestPayload = {
        idsGrupoCadena: selectedGruposCadena,
        idsCadena: selectedCadenas,
        idsMercado: selectedMercados,
        idTipoTarea: 1,  // DISTRIBUTION type
        alias: aliasData
      };
      
      console.log('Sending request payload:', JSON.stringify(requestPayload));
  
      console.log('URL:', `${BASE_URL}/api/tareas/tareas-ambito-multiselect?idIdioma=${languageId}`);
      const response = await axios.post(
        `${BASE_URL}/api/tareas/tareas-ambito-multiselect?idIdioma=${languageId}`, 
        requestPayload
      );
      
      console.log('Response received:', response.data);
      
      const formattedData = response.data.map(item => ({
        id: item.idLocalizacionCompra.toString(),
        idGrupoCadena: item.idGrupoCadena,
        grupoCadena: item.descripcionGrupoCadena || '',
        idCadena: item.idCadena,
        cadena: item.descripcionCadena || '',
        idMercado: item.idMercado,
        mercado: item.descripcionMercado || '',
        idLocalizacion: item.idLocalizacionCompra,
        descripcionLocalizacion: item.descripcionLocalizacionCompra || '',
        estadoTiendaRam: item.descripcionEstadoLocalizacionRam || 'ACTIVA',
        estadoTiendaTarea: item.descripcionEstadoLocalizacionTarea || 'ACTIVO',
        codigoIsoMercado: item.codigoIsoMercado
      }));
      
      console.log('Datos formateados:', formattedData.length);
      setLocalizaciones(formattedData);
      
    } catch (error) {
      console.error('Error fetchTareaAmbitoData:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error stack:', error.stack);
      setLocalizaciones([]);
    } finally {
      setLoading(false);
      console.log('Terminado fetchTareaAmbitoData');
    }
  };

  const handleSelectLocalizacion = (localizacionId) => {
    setSelectedLocalizaciones(prev => {
      if (prev.includes(localizacionId)) {
        return prev.filter(id => id !== localizacionId);
      } else {
        return [...prev, localizacionId];
      }
    });
  };

  const toggleGrupoCadenaDropdown = () => {
    setIsGrupoCadenaDropdownOpen(!isGrupoCadenaDropdownOpen);
    setIsCadenaDropdownOpen(false);
    setIsMercadoDropdownOpen(false);
    
    if (!isGrupoCadenaDropdownOpen) {
      setGrupoSearchText('');
      setFilteredGruposCadena(gruposCadena);
    }
  };

  const toggleCadenaDropdown = () => {
    setIsCadenaDropdownOpen(!isCadenaDropdownOpen);
    setIsGrupoCadenaDropdownOpen(false);
    setIsMercadoDropdownOpen(false);
    
    if (!isCadenaDropdownOpen) {
      setCadenaSearchText('');
      updateCadenasBySelectedGrupos(selectedGruposCadena);
    }
  };

  const toggleMercadoDropdown = () => {
    setIsMercadoDropdownOpen(!isMercadoDropdownOpen);
    setIsGrupoCadenaDropdownOpen(false);
    setIsCadenaDropdownOpen(false);
    
    if (!isMercadoDropdownOpen) {
      setMercadoSearchText('');
      setFilteredMercados(mercados);
    }
  };

  const handleGrupoSearchChange = (e) => {
    const value = e.target.value;
    setGrupoSearchText(value);
    
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = gruposCadena.filter(
        grupo => 
          grupo.id?.toString().toLowerCase().includes(searchValue) || 
          grupo.descripcion?.toLowerCase().includes(searchValue)
      );
      setFilteredGruposCadena(filtered);
    } else {
      setFilteredGruposCadena(gruposCadena);
    }
  };

  const handleCadenaSearchChange = (e) => {
    const value = e.target.value;
    setCadenaSearchText(value);
    
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = cadenas.filter(
        cadena => 
          cadena.id?.toString().toLowerCase().includes(searchValue) || 
          cadena.descripcion?.toLowerCase().includes(searchValue)
      );
      setFilteredCadenas(filtered);
    } else {
      updateCadenasBySelectedGrupos(selectedGruposCadena);
    }
  };

  const handleMercadoSearchChange = (e) => {
    const value = e.target.value;
    setMercadoSearchText(value);
    
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = mercados.filter(
        mercado => 
            mercado.id?.toString().toLowerCase().includes(searchValue) || 
            mercado.descripcion?.toLowerCase().includes(searchValue)
    );
    setFilteredMercados(filtered);
  } else {
    setFilteredMercados(mercados);
  }
};

const clearGrupoSearch = () => {
  setGrupoSearchText('');
  setFilteredGruposCadena(gruposCadena);
};

const clearCadenaSearch = () => {
  setCadenaSearchText('');
  updateCadenasBySelectedGrupos(selectedGruposCadena);
};

const clearMercadoSearch = () => {
  setMercadoSearchText('');
  setFilteredMercados(mercados);
};

const handleGrupoCadenaSelect = (grupo) => {
  const newSelectedGrupos = [...selectedGruposCadena];
  const index = newSelectedGrupos.indexOf(grupo.id);
  
  if (index >= 0) {
    newSelectedGrupos.splice(index, 1);
  } else {
    newSelectedGrupos.push(grupo.id);
  }
  
  setSelectedGruposCadena(newSelectedGrupos);
  updateCadenasBySelectedGrupos(newSelectedGrupos);
};

const updateCadenasBySelectedGrupos = (selectedGrupos, cadenasData = cadenas) => {
  if (selectedGrupos.length === 0) {
    setFilteredCadenas([]);
    return;
  }
  
  const cadenasFiltradas = cadenasData.filter(
    cadena => selectedGrupos.includes(cadena.idGrupoCadena)
  );
  
  setFilteredCadenas(cadenasFiltradas);
};

const handleCadenaSelect = (cadena) => {
  const newSelectedCadenas = [...selectedCadenas];
  const index = newSelectedCadenas.indexOf(cadena.id);
  
  if (index >= 0) {
    newSelectedCadenas.splice(index, 1);
  } else {
    newSelectedCadenas.push(cadena.id);
  }
  
  setSelectedCadenas(newSelectedCadenas);
};

const handleMercadoSelect = (mercado) => {
  const newSelectedMercados = [...selectedMercados];
  const index = newSelectedMercados.indexOf(mercado.id);
  
  if (index >= 0) {
    newSelectedMercados.splice(index, 1);
  } else {
    newSelectedMercados.push(mercado.id);
  }
  
  setSelectedMercados(newSelectedMercados);
};

const handleSave = () => {
    if (onSave) {
      const selectedLocalizacionesData = filteredLocalizaciones.filter(loc => 
        selectedLocalizaciones.includes(loc.id)
      );
      
      onSave(selectedLocalizacionesData);
    }
    onClose();
};

const toggleShowSeleccionadas = () => {
  setShowSeleccionadas(!showSeleccionadas);
};

const toggleShowFiltros = () => {
  setShowFiltros(!showFiltros);
};

const handleSelectAll = (e) => {
  if (e.target.checked) {
    const allIds = filteredLocalizaciones.map(loc => loc.id);
    setSelectedLocalizaciones(allIds);
  } else {
    setSelectedLocalizaciones([]);
  }
};

const filteredLocalizaciones = localizaciones.filter(loc => {
  if (showSeleccionadas && !selectedLocalizaciones.includes(loc.id)) return false;
  return true;
});

// Formatear texto para comboboxes
const getSelectedGrupoCadenaText = () => {
  if (selectedGruposCadena.length === 0) {
    return 'Id o Grupo Cadena (16)';
  } else if (selectedGruposCadena.length === 1) {
    const grupo = gruposCadena.find(g => g.id === selectedGruposCadena[0]);
    return `${selectedGruposCadena[0]} - ${grupo?.descripcion || 'Zara'}`;
  } else {
    return `${selectedGruposCadena.length} seleccionados`;
  }
};

const getSelectedCadenaText = () => {
  if (selectedCadenas.length === 0) {
    return 'Id o Cadena';
  } else if (selectedCadenas.length === 1) {
    const cadena = cadenas.find(c => c.id === selectedCadenas[0]);
    return `${selectedCadenas[0]} - ${cadena?.descripcion || 'Zara'}`;
  } else {
    return `${selectedCadenas.length} seleccionados`;
  }
};

const getSelectedMercadoText = () => {
  if (selectedMercados.length === 0) {
    return 'Id o Mercado';
  } else if (selectedMercados.length === 1) {
    const mercado = mercados.find(m => m.id === selectedMercados[0]);
    return `${selectedMercados[0]} - ${normalizeText(mercado?.descripcion || 'ESPAÑA')}`;
  } else {
    return `${selectedMercados.length} seleccionados`;
  }
};

if (!isOpen) return null;

return (
  <div className="ambito-modal-overlay">
    <div ref={modalRef} className="ambito-modal-content">
      <div className="ambito-modal-header">
        <h2>DEFINIR ÁMBITO LOCALIZACIÓN</h2>
        <button onClick={onClose} className="ambito-close-btn">
          <FaTimes />
        </button>
      </div>
      
      <div className="ambito-modal-body">
        <p className="ambito-description">
          Define el ámbito donde se distribuirán los alias seleccionados para poder crear la tarea.
        </p>
        
        <div className="ambito-dropdowns-row">
          <div className="ambito-dropdown-container" ref={grupoCadenaDropdownRef}>
            <div className="ambito-dropdown-field" onClick={toggleGrupoCadenaDropdown}>
              <span>{getSelectedGrupoCadenaText()}</span>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {isGrupoCadenaDropdownOpen && (
              <div className="ambito-dropdown-content">
                <div className="ambito-dropdown-search">
                  <input 
                    type="text" 
                    placeholder="Buscar grupo cadena..."
                    value={grupoSearchText}
                    onChange={handleGrupoSearchChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {grupoSearchText && (
                    <FaTimes 
                      className="clear-search-icon" 
                      onClick={clearGrupoSearch} 
                    />
                  )}
                </div>
                
                <div className="ambito-dropdown-items">
                  {filteredGruposCadena.map((grupo) => {
                    const isSelected = selectedGruposCadena.includes(grupo.id);
                    
                    return (
                      <div 
                        key={grupo.id} 
                        className={`ambito-dropdown-item ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGrupoCadenaSelect(grupo);
                        }}
                      >
                        <div className="ambito-checkbox">
                          {isSelected && <FaCheck className="checkbox-icon" />}
                        </div>
                        <span className="ambito-dropdown-item-text">
                          {grupo.id} - {normalizeText(grupo.descripcion)}
                        </span>
                      </div>
                    );
                  })}
                  
                  <div className="ambito-dropdown-item select-all" onClick={(e) => {
                    e.stopPropagation();
                    const allSelected = filteredGruposCadena.every(grupo => 
                      selectedGruposCadena.includes(grupo.id)
                    );
                    
                    if (allSelected) {
                      setSelectedGruposCadena([]);
                    } else {
                      setSelectedGruposCadena(filteredGruposCadena.map(grupo => grupo.id));
                    }
                    
                    updateCadenasBySelectedGrupos(
                      allSelected ? [] : filteredGruposCadena.map(grupo => grupo.id)
                    );
                  }}>
                    <div className="ambito-checkbox">
                      {filteredGruposCadena.every(grupo => selectedGruposCadena.includes(grupo.id)) && 
                        <FaCheck className="checkbox-icon" />
                      }
                    </div>
                    <span>Seleccionar todo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ambito-dropdown-container" ref={cadenaDropdownRef}>
            <div className="ambito-dropdown-field" onClick={toggleCadenaDropdown}>
              <span>{getSelectedCadenaText()}</span>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {isCadenaDropdownOpen && (
              <div className="ambito-dropdown-content">
                <div className="ambito-dropdown-search">
                  <input 
                    type="text" 
                    placeholder="Buscar cadena..."
                    value={cadenaSearchText}
                    onChange={handleCadenaSearchChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {cadenaSearchText && (
                    <FaTimes 
                      className="clear-search-icon" 
                      onClick={clearCadenaSearch} 
                    />
                  )}
                </div>
                
                <div className="ambito-dropdown-items">
                  {filteredCadenas.map((cadena) => {
                    const isSelected = selectedCadenas.includes(cadena.id);
                    
                    return (
                      <div 
                        key={cadena.id} 
                        className={`ambito-dropdown-item ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCadenaSelect(cadena);
                        }}
                      >
                        <div className="ambito-checkbox">
                          {isSelected && <FaCheck className="checkbox-icon" />}
                        </div>
                        <span className="ambito-dropdown-item-text">
                          {cadena.id} - {normalizeText(cadena.descripcion)}
                        </span>
                      </div>
                    );
                  })}
                  
                  <div className="ambito-dropdown-item select-all" onClick={(e) => {
                    e.stopPropagation();
                    const allSelected = filteredCadenas.every(cadena => 
                      selectedCadenas.includes(cadena.id)
                    );
                    
                    if (allSelected) {
                      setSelectedCadenas([]);
                    } else {
                      setSelectedCadenas(filteredCadenas.map(cadena => cadena.id));
                    }
                  }}>
                    <div className="ambito-checkbox">
                      {filteredCadenas.length > 0 && filteredCadenas.every(cadena => 
                        selectedCadenas.includes(cadena.id)
                      ) && <FaCheck className="checkbox-icon" />}
                    </div>
                    <span>Seleccionar todo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ambito-dropdown-container" ref={mercadoDropdownRef}>
            <div className="ambito-dropdown-field" onClick={toggleMercadoDropdown}>
              <span>{getSelectedMercadoText()}</span>
              <FaChevronDown className="dropdown-arrow" />
            </div>
            
            {isMercadoDropdownOpen && (
              <div className="ambito-dropdown-content">
                <div className="ambito-dropdown-search">
                  <input 
                    type="text" 
                    placeholder="Buscar mercado..."
                    value={mercadoSearchText}
                    onChange={handleMercadoSearchChange}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {mercadoSearchText && (
                    <FaTimes 
                      className="clear-search-icon" 
                      onClick={clearMercadoSearch} 
                    />
                  )}
                </div>
                <div className="ambito-dropdown-items">
                  {filteredMercados.map((mercado) => {
                    const isSelected = selectedMercados.includes(mercado.id);
                    return (
                      <div 
                        key={mercado.id} 
                        className={`ambito-dropdown-item ${isSelected ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMercadoSelect(mercado);
                        }}
                      >
                        <div className="ambito-checkbox">
                          {isSelected && <FaCheck className="checkbox-icon" />}
                        </div>
                        <span className="ambito-dropdown-item-text">
                          {mercado.id} - {normalizeText(mercado.descripcion)}
                        </span>
                      </div>
                    );
                  })}
                  <div className="ambito-dropdown-item select-all" onClick={(e) => {
                    e.stopPropagation();
                    const allSelected = filteredMercados.every(mercado => 
                      selectedMercados.includes(mercado.id)
                    );
                    
                    if (allSelected) {
                      setSelectedMercados([]);
                    } else {
                      setSelectedMercados(filteredMercados.map(mercado => mercado.id));
                    }
                  }}>
                    <div className="ambito-checkbox">
                      {filteredMercados.length > 0 && filteredMercados.every(mercado => 
                        selectedMercados.includes(mercado.id)
                      ) && <FaCheck className="checkbox-icon" />}
                    </div>
                    <span>Seleccionar todo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="ambito-subheading">
          Selecciona las localizaciones que deseas incluir en la tarea.
        </p>
        
        <div className="ambito-toggles-row">
          <div className="localizaciones-count">
            {selectedLocalizaciones.length} localizaciones seleccionadas de {filteredLocalizaciones.length} disponibles
          </div>
          
          <div className="ambito-toggles">
            <label className="toggle-container">
              <span className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={showSeleccionadas}
                  onChange={toggleShowSeleccionadas}
                />
                <span className="toggle-slider"></span>
              </span>
              <span className="toggle-label">MOSTRAR LOCALIZACIONES SELECCIONADAS</span>
            </label>
            
            <label className="toggle-container">
              <span className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={showFiltros}
                  onChange={toggleShowFiltros}
                />
              </span>
            </label>
          </div>
        </div>
        
        {loading ? (
          <div className="ambito-loading">
            <p>Cargando localizaciones...</p>
          </div>
        ) : filteredLocalizaciones.length > 0 ? (
          <div className="ambito-table-container">
            <table className="ambito-table">
              <thead>
                <tr>
                  <th className="ambito-checkbox-column">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={filteredLocalizaciones.length > 0 && 
                              filteredLocalizaciones.every(loc => 
                                selectedLocalizaciones.includes(loc.id)
                              )}
                    />
                  </th>
                  <th>ID/GRUPO CADENA</th>
                  <th>ID/CADENA</th>
                  <th>MERCADO</th>
                  <th>ID/LOCALIZACIÓN</th>
                  <th>ESTADO DE TIENDA RAM</th>
                  <th>ESTADO DE LA TIENDA EN LA TAREA</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocalizaciones.map(loc => (
                  <tr 
                    key={loc.id} 
                    className={selectedLocalizaciones.includes(loc.id) ? 'selected-row' : ''}
                  >
                    <td className="ambito-checkbox-column">
                      <input 
                        type="checkbox" 
                        checked={selectedLocalizaciones.includes(loc.id)}
                        onChange={() => handleSelectLocalizacion(loc.id)}
                      />
                    </td>
                    <td>{loc.idGrupoCadena} - {loc.grupoCadena}</td>
                    <td>{loc.idCadena} - {normalizeText(loc.cadena)}</td>
                    <td>{normalizeText(loc.mercado)}</td>
                    <td>{normalizeText(loc.idLocalizacion)}</td>
                    <td>{loc.estadoTiendaRam}</td>
                    <td>{loc.estadoTiendaTarea}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ambito-empty-state">
            <FaSearch className="empty-icon" />
            <p className="empty-title">NO HAY LOCALIZACIONES</p>
            <p className="empty-message">UTILIZA LOS CAMPOS NECESARIOS PARA AÑADIR UNA LOCALIZACIÓN</p>
          </div>
        )}
        
        <div className="ambito-pagination">
          <span className="pagination-info">1 - 50 de {filteredLocalizaciones.length} elementos</span>
          <div className="pagination-controls">
            <button className="pagination-button">&lt;&lt;</button>
            <button className="pagination-button">&lt;</button>
            <button className="pagination-button">&gt;</button>
            <button className="pagination-button">&gt;&gt;</button>
          </div>
        </div>
      </div>
      
      <div className="ambito-modal-footer">
        <button onClick={onClose} className="ambito-cancel-btn">
          CANCELAR
        </button>
        <button onClick={handleSave} className="ambito-save-btn">
          ACEPTAR
        </button>
      </div>
    </div>
  </div>
);
};

export default DefinirAmbitoModal;