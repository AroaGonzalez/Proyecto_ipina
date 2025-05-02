import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaChevronRight, FaChevronDown, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import DefinirAmbitoModal from './definirAmbitoModal';
import '../styles/nuevaTarea.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const NuevaTareaDistribucion = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  const dropdownRef = useRef(null);
  
  const [nombreTarea, setNombreTarea] = useState('');
  const [descripcionTarea, setDescripcionTarea] = useState('');
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [aliasOptions, setAliasOptions] = useState([]);
  const [aliasSearchTerm, setAliasSearchTerm] = useState('');
  const [showAliasDropdown, setShowAliasDropdown] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedRowsForDelete, setSelectedRowsForDelete] = useState([]);
  const [showDeleteAction, setShowDeleteAction] = useState(false);
  const [showAmbitoModal, setShowAmbitoModal] = useState(false);
  const [selectedLocalizaciones, setSelectedLocalizaciones] = useState([]);

  useEffect(() => {
    loadAliases();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAliasDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setShowDeleteAction(selectedRowsForDelete.length > 0);
  }, [selectedRowsForDelete]);

  const normalizeText = (text) => {
    if (!text) return '';

    let normalizedText = text;

    normalizedText = normalizedText
    .replace(/ESPA.?.'A/g, 'ESPAÑA')
    .replace(/ESPA.?.A/g, 'ESPAÑA')
    .replace(/PEQUE.?.AS/g, 'PEQUEÑAS')
    .replace(/PEQUE.?.OS/g, 'PEQUEÑOS')


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

  const handleDeleteSelectedRows = () => {
    const updatedAliases = selectedAliases.filter(alias => !selectedRowsForDelete.includes(alias.id));
    setSelectedAliases(updatedAliases);
    setSelectedRowsForDelete([]);
    
    try {
      handleDeleteTareas(selectedRowsForDelete);
    } catch (error) {
      console.error('Error during delete operation:', error);
    }
  };

  const loadAliases = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tareas/alias-and-acoples`, {
        params: {
          idIdioma: languageId,
          idTipoTarea: 2
        }
      });
      
      const formattedOptions = response.data.map(alias => ({
        id: alias.idAlias,
        nombre: alias.nombre,
        tipo: alias.idTipoAlias, 
        tipoDesc: alias.descripcionTipoAlias,
        estadoId: alias.idTipoEstadoAlias,
        estadoAlias: alias.descripcionTipoEstadoAlias,
        acoples: (alias.acoples || []).map(acople => ({
          id: acople.idAliasAcople,
          nombre: acople.nombreAcople,
          ratio: acople.ratioAcople,
          tipo: acople.idTipoAliasAcople,
          estadoId: acople.idTipoEstadoAliasAcople,
          estadoAlias: acople.descripcionTipoEstadoAliasAcople
        }))
      }));
      
      setAliasOptions(formattedOptions || []);
    } catch (error) {
      console.error('Error al cargar alias:', error);
    }
  };

  const handleAliasSearch = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/tareas/alias-and-acoples`, {
        params: {
          term: aliasSearchTerm,
          idIdioma: languageId,
          idTipoTarea: 2
        }
      });
      
      const formattedOptions = response.data.map(alias => ({
        id: alias.idAlias,
        nombre: alias.nombre,
        tipo: alias.idTipoAlias, 
        tipoDesc: alias.descripcionTipoAlias,
        estadoId: alias.idTipoEstadoAlias,
        estadoAlias: alias.descripcionTipoEstadoAlias,
        acoples: (alias.acoples || []).map(acople => ({
          id: acople.idAliasAcople,
          nombre: acople.nombreAcople,
          ratio: acople.ratioAcople,
          tipo: acople.idTipoAliasAcople,
          estadoId: acople.idTipoEstadoAliasAcople,
          estadoAlias: acople.descripcionTipoEstadoAliasAcople
        }))
      }));
      
      setAliasOptions(formattedOptions || []);
    } catch (error) {
      console.error('Error al buscar alias:', error);
    }
  };

  const toggleAliasDropdown = () => {
    setShowAliasDropdown(!showAliasDropdown);
  };
  
  const handleSearchInputChange = (e) => {
    setAliasSearchTerm(e.target.value);
    handleAliasSearch();
  };
  
  const handleSelectAlias = (alias) => {
    const isSelected = selectedAliases.some(a => a.id === alias.id);
    
    if (isSelected) {
      setSelectedAliases(selectedAliases.filter(a => a.id !== alias.id));
    } else {
      setSelectedAliases([...selectedAliases, alias]);
    }
  };

  const handleDeleteTareas = async (idsTarea) => {
    try {
      await axios.post(`${BASE_URL}/api/tareas/delete-tarea`, {
        idsTarea
      });

      setSelectedTareas([]);
      setSelectedRowsForDelete([]);
      
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
    }
  };
  
  const handleToggleSelectForDelete = (aliasId) => {
    if (selectedRowsForDelete.includes(aliasId)) {
      setSelectedRowsForDelete(selectedRowsForDelete.filter(id => id !== aliasId));
    } else {
      setSelectedRowsForDelete([...selectedRowsForDelete, aliasId]);
    }
  };

  const handleSelectAllForDelete = (event) => {
    if (event.target.checked) {
      setSelectedRowsForDelete(selectedAliases.map(alias => alias.id));
    } else {
      setSelectedRowsForDelete([]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedAll) {
      setSelectedAliases([]);
    } else {
      setSelectedAliases([...aliasOptions]);
    }
    setSelectedAll(!selectedAll);
  };
  
  const isAliasSelected = (aliasId) => {
    return selectedAliases.some(alias => alias.id === aliasId);
  };
  
  const toggleRowExpand = (aliasId) => {
    setExpandedRows(prev => ({
      ...prev,
      [aliasId]: !prev[aliasId]
    }));
  };
  
  const hasAcoples = (alias) => {
    return alias.acoples && alias.acoples.length > 0;
  };
  
  const handleSubmit = async () => {
    try {
      const createTareaAlias = selectedAliases.map(alias => ({
        idAlias: alias.id,
        idTipoAlias: alias.tipo,
        idTipoEstadoAlias: alias.estadoId,
        idTipoConexionOrigenDatoAlias: null,
        acoples: (alias.acoples || []).map(acople => ({
          idAliasAcople: acople.id,
          idTipoConexionOrigenDatoAlias: acople.tipo,
          idAlias: alias.id
        }))
      }));
  
      const createTareaAmbitoAplanado = [];
      selectedLocalizaciones.forEach(loc => {
        selectedAliases.forEach(alias => {
          createTareaAmbitoAplanado.push({
            idAlias: alias.id,
            idAliasAcople: null,
            idLocalizacionCompra: loc.idLocalizacion,
            idTipoEstadoLocalizacionRam: loc.idEstadoLocalizacionRam,
            idTipoEstadoLocalizacionTarea: 1,
            idTipoAlias: alias.tipo,
            idTipoConexionOrigenDatoAlias: null
          });
  
          (alias.acoples || []).forEach(acople => {
            createTareaAmbitoAplanado.push({
              idAlias: alias.id,
              idAliasAcople: acople.id,
              idLocalizacionCompra: loc.idLocalizacion,
              idTipoEstadoLocalizacionRam: loc.idEstadoLocalizacionRam,
              idTipoEstadoLocalizacionTarea: 1,
              idTipoAlias: alias.tipo,
              idTipoConexionOrigenDatoAlias: null
            });
          });
        });
      });
  
      const tareaData = {
        nombreTarea,
        descripcion: descripcionTarea,
        idTipoTarea: 2,
        idTipoEstadoTarea: 1,
        createTareaAlias,
        createTareaAmbito: {
          createTareaAmbitoAplanado,
          idTipoReglaAmbito: 3
        }
      };
      
      console.log('Enviando payload:', tareaData);
      await axios.post(`${BASE_URL}/api/tareas/create-tarea`, tareaData);
      navigate('/tareas');
      
    } catch (error) {
      console.error('Error al crear la tarea:', error);
    }
  };
  
  const handleCancel = () => {
    navigate('/tareas');
  };
  
  const filteredAliases = aliasOptions.filter(alias => 
    alias.nombre.toLowerCase().includes(aliasSearchTerm.toLowerCase()) ||
    alias.id.toString().includes(aliasSearchTerm.toLowerCase())
  );
  
  return (
    <div className="nueva-tarea-container">
      <h1 className="nueva-tarea-title">
        NUEVA TAREA RECUENTO
      </h1>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 1 -</span> DATOS GENERALES DE LA TAREA
        </div>
        
        <div className="input-container">
          <input
            type="text"
            className="tarea-input"
            placeholder="Nombre de la tarea *"
            value={nombreTarea}
            onChange={(e) => setNombreTarea(e.target.value)}
            maxLength={50}
          />
          <small className="counter">{nombreTarea.length} / 50</small>
        </div>
        
        <div className="input-container">
          <textarea
            className="tarea-textarea"
            placeholder="Descripción de la tarea *"
            value={descripcionTarea}
            onChange={(e) => setDescripcionTarea(e.target.value)}
            maxLength={200}
          />
          <small className="counter">{descripcionTarea.length} / 200</small>
        </div>
      </div>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">PASO 2 -</span> ALIAS Y ÁMBITO QUE INCLUIRÁ ESTA TAREA
        </div>
        
        <div className="alias-select-container" ref={dropdownRef}>
          <div 
            className="alias-select"
            onClick={toggleAliasDropdown}
          >
            <span>{aliasSearchTerm || "Id o Nombre de Alias *"}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {showAliasDropdown && (
            <div className="alias-dropdown">
              <div className="alias-search-container">
                <input
                  type="text"
                  className="alias-search-input"
                  placeholder="Buscar..."
                  value={aliasSearchTerm}
                  onChange={handleSearchInputChange}
                />
              </div>
              
              <div className="alias-options-container">
                {filteredAliases.map(alias => (
                  <div 
                    key={alias.id} 
                    className="alias-option"
                    onClick={() => handleSelectAlias(alias)}
                  >
                    <input
                      type="checkbox"
                      checked={isAliasSelected(alias.id)}
                      onChange={() => {}}
                      className="alias-checkbox"
                    />
                    <div className="alias-option-content">
                      <div className="alias-info">
                        <span className="alias-id">{alias.id} - {normalizeText(alias.nombre)} </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div 
                  className="alias-option select-all"
                  onClick={handleSelectAll}
                >
                  <input
                    type="checkbox"
                    checked={selectedAll}
                    onChange={() => {}}
                    className="alias-checkbox"
                  />
                  <span>Seleccionar todo</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {selectedAliases.length > 0 ? (
          <div className="alias-table-container">
            <div className="alias-count">{selectedAliases.length} alias incluidos</div>
            
            {showDeleteAction && (
              <div className="articulos-actions-bar">
                <div className="articulos-selection-info">
                  <span className="articulos-selected-count">
                    {selectedRowsForDelete.length} alias seleccionados
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={handleDeleteSelectedRows}
                  disabled={selectedRowsForDelete.length === 0}
                >
                  <FaTrash className="action-icon" />
                  Eliminar
                </button>
              </div>
            )}            
            <table className="alias-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAllForDelete}
                      checked={selectedRowsForDelete.length === selectedAliases.length && selectedAliases.length > 0}
                    />
                  </th>
                  <th>ID ALIAS</th>
                  <th>ALIAS</th>
                  <th>ALIAS TIPO</th>
                  <th>ESTADO ALIAS</th>
                  <th>ALIAS PRINCIPAL ASOCIADO (RATIO)</th>
                </tr>
              </thead>
              <tbody>
                {selectedAliases.map(alias => (
                  <React.Fragment key={alias.id}>
                    <tr className={`alias-row ${expandedRows[alias.id] ? 'expanded' : ''}`}>
                      <td className="expand-cell">
                        {hasAcoples(alias) ? (
                          <button 
                            className="expand-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(alias.id);
                            }}
                          >
                            {expandedRows[alias.id] ? 
                              <FaChevronDown className="expand-icon" /> : 
                              <FaChevronRight className="expand-icon" />
                            }
                          </button>
                        ) : (
                          <span className="expand-placeholder"></span>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedRowsForDelete.includes(alias.id)}
                          onChange={() => handleToggleSelectForDelete(alias.id)}
                        />
                      </td>
                      <td>{alias.id}</td>
                      <td>{normalizeText(alias.nombre)}</td>
                      <td>{alias.tipoDesc}</td>
                      <td className="estado-column">
                        {alias.estadoAlias}
                      </td>
                      <td className="ratio-column">-</td>
                    </tr>
                    
                    {expandedRows[alias.id] && alias.acoples && alias.acoples.map(acople => (
                      <tr key={`${alias.id}-${acople.id}`} className="acople-row">
                        <td className="acople-cell"></td>
                        <td>{acople.id}</td>
                        <td>{normalizeText(acople.nombre)}</td>
                        <td>{acople.tipo}</td>
                        <td className="estado-column">
                          {acople.estadoAlias}
                        </td>
                        <td className="ratio-column">{acople.ratio}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            <div className="description-text">
              Define el ámbito donde se distribuirán los alias seleccionados para poder crear la tarea.
            </div>
          
            <button 
              className="cancel-button" 
              style={{ 
                marginTop: '20px',
                width: 'auto',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                padding: '10px 25px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}
              onClick={() => setShowAmbitoModal(true)}
            >
              DEFINIR ÁMBITO
            </button>
            
            <DefinirAmbitoModal 
              isOpen={showAmbitoModal} 
              onClose={() => setShowAmbitoModal(false)}
              onSave={(localizaciones) => {
                console.log('Localizaciones seleccionadas:', localizaciones);
                setSelectedLocalizaciones(localizaciones);
                setShowAmbitoModal(false);
              }}
              selectedAliases={selectedAliases}
            />

            {selectedLocalizaciones.length > 0 && (
              <div className="ambito-selected-table" style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  {selectedLocalizaciones.length} localizaciones en las que se distribuirá la tarea
                </div>
                <table className="alias-table">
                  <thead>
                    <tr>
                      <th>ID/GRUPO CADENA</th>
                      <th>ID/CADENA</th>
                      <th>MERCADO</th>
                      <th>ID/LOCALIZACIÓN</th>
                      <th>ESTADO DE TIENDA RAM</th>
                      <th>ESTADO DE LA TIENDA EN LA TAREA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedLocalizaciones.map(loc => (
                      <tr key={loc.id}>
                        <td>{loc.idGrupoCadena} - {normalizeText(loc.grupoCadena)}</td>
                        <td>{loc.idCadena} - {normalizeText(loc.cadena)}</td>
                        <td>{normalizeText(loc.mercado)}</td>
                        <td>{loc.idLocalizacion}</td>
                        <td>
                          <span className="estado-tag" style={{backgroundColor: '#00A19B', color: 'white', padding: '2px 6px', borderRadius: '2px'}}>
                            {loc.estadoTiendaRam}
                          </span>
                        </td>
                        <td>
                          <span className="estado-tag" style={{backgroundColor: '#00A19B', color: 'white', padding: '2px 6px', borderRadius: '2px'}}>
                            {loc.estadoTiendaTarea}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        ) : (
          <div className="selected-aliases-container">
            <div className="no-aliases-message">
              <p className="no-aliases-text">NO HAY ALIAS SELECCIONADOS</p>
              <p className="aliases-help-text">UTILIZAR LOS CAMPOS NECESARIOS PARA AÑADIR ALIAS A LA TAREA</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="buttons-container">
        <button className="cancel-button" onClick={handleCancel}>
          CANCELAR
        </button>
        <button
          className="create-button"
          onClick={handleSubmit}
          disabled={!nombreTarea || !descripcionTarea || selectedAliases.length === 0}
        >
          CREAR
        </button>
      </div>
    </div>
  );
};

export default NuevaTareaRecuento;