import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaChevronRight, FaChevronDown, FaCircle, FaTimes, FaSearch, FaCheck, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { LanguageContext } from '../context/LanguageContext';
import DefinirAmbitoModal from './definirAmbitoModal';
import '../styles/editarTarea.css';

const BASE_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:5000';

const EditarTarea = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { languageId } = useContext(LanguageContext);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tarea, setTarea] = useState(null);
  
  const [nombreTarea, setNombreTarea] = useState('');
  const [descripcionTarea, setDescripcionTarea] = useState('');
  const [selectedAliases, setSelectedAliases] = useState([]);
  const [ambitosLocalizacion, setAmbitosLocalizacion] = useState([]);
  const [showAliasesDropdown, setShowAliasesDropdown] = useState(false);
  const [aliasesDisponibles, setAliasesDisponibles] = useState([]);
  const [filteredAliases, setFilteredAliases] = useState([]);
  const [aliasSearchText, setAliasSearchText] = useState('');
  const [selectedAliasesIds, setSelectedAliasesIds] = useState([]);
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);
  const [showAmbitoModal, setShowAmbitoModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  
  const aliasesDropdownRef = useRef(null);
  
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    const fetchTareaData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/tareas/${id}?idIdioma=${languageId}`);
        const tareaData = response.data;
        
        setTarea(tareaData);
        setNombreTarea(tareaData.nombreTarea || '');
        setDescripcionTarea(tareaData.descripcionTarea || '');
        setSelectedAliases(tareaData.alias || []);
        setAmbitosLocalizacion(tareaData.ambitos || []);
        
        try {
          const aliasesResponse = await axios.get(`${BASE_URL}/edicion/alias-info?idIdioma=${languageId}`);
          setAliasesDisponibles(aliasesResponse.data || []);
          setFilteredAliases(aliasesResponse.data || []);
        } catch (aliasesError) {
          console.error('Error al cargar aliases disponibles:', aliasesError);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar la tarea:', error);
        setError('Error al cargar los datos de la tarea');
        setLoading(false);
      }
    };
    
    fetchTareaData();
  }, [id, languageId]);
  
  useEffect(() => {
    if (tarea) {
      const basicChanges = nombreTarea !== tarea.nombreTarea || 
        descripcionTarea !== tarea.descripcionTarea;
    
      const originalAliasIds = new Set((tarea.alias || []).map(a => a.idAlias));
      const currentAliasIds = new Set(selectedAliases.map(a => a.idAlias));
    
      const aliasesChanged = originalAliasIds.size !== currentAliasIds.size || 
          [...originalAliasIds].some(id => !currentAliasIds.has(id)) ||
          [...currentAliasIds].some(id => !originalAliasIds.has(id));
    
      const ambitosChanged = true;
      setHasChanges(basicChanges || aliasesChanged || ambitosChanged);
    }
  }, [nombreTarea, descripcionTarea, selectedAliases, ambitosLocalizacion, tarea]);
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (aliasesDropdownRef.current && !aliasesDropdownRef.current.contains(event.target)) {
        setShowAliasesDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const createTareaAlias = selectedAliases.map(alias => ({
        idAlias: alias.idAlias,
        idTipoAlias: alias.idTipoAlias || alias.tipo,
        idTipoEstadoAlias: alias.idTipoEstadoAlias || alias.estadoId,
        idTipoConexionOrigenDatoAlias: alias.idTipoConexionOrigenDatoAlias || null,
        acoples: (alias.acoples || []).map(acople => ({
          idAlias: alias.idAlias,
          idAliasAcople: acople.idAliasAcople || acople.id,
          idTipoConexionOrigenDatoAlias: acople.idTipoConexionOrigenDatoAlias || acople.tipo
        }))
      }));
      
      const idsLocalizacionCompra = ambitosLocalizacion.map(ambito => 
        ambito.idLocalizacionCompra || ambito.idLocalizacion
      );
      
      const requestData = {
        nombreTarea,
        descripcion: descripcionTarea,
        idTipoTarea: tarea.idTipoTarea,
        idTipoEstadoTarea: tarea.idTipoEstadoTarea,
        idTarea: parseInt(id),
        createTareaAlias,
        idsLocalizacionCompra,
        alias: createTareaAlias,
        createTareaAmbito: {
          createTareaAmbitoAplanado: ambitosLocalizacion.flatMap(loc => 
            selectedAliases.flatMap(alias => {
              const items = [{
                idAlias: alias.idAlias,
                idAliasAcople: null,
                idLocalizacionCompra: loc.idLocalizacionCompra || loc.idLocalizacion,
                idTipoEstadoLocalizacionRam: loc.idTipoEstadoLocalizacionRam || loc.idEstadoLocalizacionRam,
                idTipoEstadoLocalizacionTarea: 1,
                idTipoAlias: alias.idTipoAlias || alias.tipo,
                idTipoConexionOrigenDatoAlias: alias.idTipoConexionOrigenDatoAlias || null
              }];
              
              const acopleItems = (alias.acoples || []).map(acople => ({
                idAlias: alias.idAlias,
                idAliasAcople: acople.idAliasAcople || acople.id,
                idLocalizacionCompra: loc.idLocalizacionCompra || loc.idLocalizacion,
                idTipoEstadoLocalizacionRam: loc.idTipoEstadoLocalizacionRam || loc.idEstadoLocalizacionRam,
                idTipoEstadoLocalizacionTarea: 1,
                idTipoAlias: alias.idTipoAlias || alias.tipo,
                idTipoConexionOrigenDatoAlias: alias.idTipoConexionOrigenDatoAlias || null
              }));
              
              return [...items, ...acopleItems];
            })
          ),
          idTipoReglaAmbito: 3
        }
      };
      
      console.log('Enviando datos para actualizar tarea:', requestData);
      
      const response = await axios.put(`${BASE_URL}/api/tareas/edicion-tarea/${id}`, requestData);
      
      setHasChanges(false);
      setLoading(false);
      
      console.log('Tarea actualizada correctamente:', response.data);
      navigate('/tareas');
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      setError('Error al guardar los cambios: ' + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/tareas');
  };
  
  const toggleAliasesDropdown = () => {
    setShowAliasesDropdown(!showAliasesDropdown);
    if (!showAliasesDropdown) {
      setAliasSearchText('');
      setFilteredAliases(aliasesDisponibles);
    }
  };
  
  const handleAliasSearchChange = (e) => {
    const value = e.target.value;
    setAliasSearchText(value);
    
    if (value) {
      const searchValue = value.toLowerCase();
      const filtered = aliasesDisponibles.filter(
        alias => 
          alias.idAlias.toString().toLowerCase().includes(searchValue) || 
          alias.nombre.toLowerCase().includes(searchValue)
      );
      setFilteredAliases(filtered);
    } else {
      setFilteredAliases(aliasesDisponibles);
    }
  };
  
  const handleAliasSelect = (alias) => {
    setSelectedAliases(prev => {
      if (prev.some(a => a.idAlias === alias.idAlias)) {
        return prev.filter(a => a.idAlias !== alias.idAlias);
      }
      return [...prev, alias];
    });
  };
  
  const handleAliasCheckboxChange = (aliasId) => {
    setSelectedAliasesIds(prev => {
      if (prev.includes(aliasId)) {
        const newSelected = prev.filter(id => id !== aliasId);
        setShowDeleteIcon(newSelected.length > 0);
        return newSelected;
      }
      else {
        setShowDeleteIcon(true);
        return [...prev, aliasId];
      }
    });
  };
  
  const handleDeleteSelectedAliases = () => {
    setSelectedAliases(prev => 
      prev.filter(alias => !selectedAliasesIds.includes(alias.idAlias))
    );
    setSelectedAliasesIds([]);
    setShowDeleteIcon(false);
  };
  
  const openDefinirAmbito = () => {
    setShowAmbitoModal(true);
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
  
  if (loading && !tarea) {
    return (
      <div className="nueva-tarea-container">
        <div className="loading-indicator">{t('Cargando datos de la tarea...')}</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="nueva-tarea-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/tareas')} className="cancel-button">
          {t('Volver')}
        </button>
      </div>
    );
  }
  
  return (
    <div className="nueva-tarea-container">
      <h1 className="nueva-tarea-title">
        {t('EDICIÓN DE TAREAS -')} {id} / {nombreTarea}
      </h1>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">{t('PASO 1')} -</span> {t('DATOS GENERALES DE LA TAREA')}
        </div>
        
        <div className="input-container">
          <input
            type="text"
            className="tarea-input"
            placeholder={t("Nombre de la tarea")}
            value={nombreTarea}
            onChange={(e) => setNombreTarea(e.target.value)}
            maxLength={50}
          />
          <small className="counter">{nombreTarea.length} / 50</small>
        </div>
        
        <div className="input-container">
          <textarea
            className="tarea-textarea"
            placeholder={t("Descripción de la tarea")}
            value={descripcionTarea}
            onChange={(e) => setDescripcionTarea(e.target.value)}
            maxLength={200}
          />
          <small className="counter">{descripcionTarea.length} / 200</small>
        </div>
      </div>
      
      <div>
        <div className="paso-title">
          <span className="paso-number">{t('PASO 2')} -</span> {t('ALIAS Y ÁMBITO QUE INCLUIRÁ ESTA TAREA')}
        </div>
        
        <div className="alias-select-container" ref={aliasesDropdownRef}>
          <div 
            className="alias-select"
            onClick={toggleAliasesDropdown}
          >
            <span>{aliasSearchText || t("Id o Nombre de Alias")}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {showAliasesDropdown && (
            <div className="alias-dropdown">
              <div className="alias-search-container">
                <input
                  type="text"
                  className="alias-search-input"
                  placeholder={t("Buscar...")}
                  value={aliasSearchText}
                  onChange={handleAliasSearchChange}
                />
              </div>
              
              <div className="alias-options-container">
                {filteredAliases.map(alias => (
                  <div 
                    key={alias.idAlias} 
                    className="alias-option"
                    onClick={() => handleAliasSelect(alias)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAliases.some(a => a.idAlias === alias.idAlias)}
                      onChange={() => {}}
                      className="alias-checkbox"
                    />
                    <div className="alias-option-content">
                      <div className="alias-info">
                        <span className="alias-id">{alias.idAlias} - {normalizeText(alias.nombre)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {selectedAliases.length > 0 ? (
          <div className="alias-table-container">
            <div className="alias-count">{t('{{count}} alias incluidos', { count: selectedAliases.length })}</div>
            
            {showDeleteIcon && (
              <div className="articulos-actions-bar">
                <div className="articulos-selection-info">
                  <span className="articulos-selected-count">
                    {t('{{count}} alias seleccionados', { count: selectedAliasesIds.length })}
                  </span>
                </div>
                <button 
                  className="delete-button"
                  onClick={handleDeleteSelectedAliases}
                  disabled={selectedAliasesIds.length === 0}
                >
                  <FaTrash className="action-icon" />
                  {t('Eliminar')}
                </button>
              </div>
            )}
            
            <table className="alias-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox" 
                      onChange={() => {
                        if (selectedAliasesIds.length === selectedAliases.length) {
                          setSelectedAliasesIds([]);
                          setShowDeleteIcon(false);
                        } else {
                          setSelectedAliasesIds(selectedAliases.map(a => a.idAlias));
                          setShowDeleteIcon(true);
                        }
                      }}
                      checked={selectedAliasesIds.length === selectedAliases.length && selectedAliases.length > 0}
                    />
                  </th>
                  <th>ID ALIAS</th>
                  <th>ALIAS</th>
                  <th>{t('ALIAS TIPO')}</th>
                  <th>{t('ESTADO ALIAS')}</th>
                  <th>{t('ALIAS PRINCIPAL ASOCIADO (RATIO)')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedAliases.map((alias, index) => (
                  <React.Fragment key={`alias-${alias.idAlias || index}`}>
                    <tr className={`alias-row ${expandedRows[alias.idAlias] ? 'expanded' : ''}`}>
                      <td className="expand-cell">
                        {hasAcoples(alias) ? (
                          <button 
                            className="expand-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpand(alias.idAlias);
                            }}
                          >
                            {expandedRows[alias.idAlias] ? 
                              <FaChevronDown className="expand-icon" /> : 
                              <FaChevronRight className="expand-icon" />
                            }
                          </button>
                        ) : (
                          <span className="expand-placeholder"></span>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedAliasesIds.includes(alias.idAlias)}
                          onChange={() => handleAliasCheckboxChange(alias.idAlias)}
                        />
                      </td>
                      <td>{alias.idAlias}</td>
                      <td>{normalizeText(alias.nombre || '')}</td>
                      <td>{alias.idTipoAlias || alias.tipoAlias?.descripcion || '-'}</td>
                      <td className="estado-column">
                        <span className={`estado-tag ${(alias.descripcionTipoEstadoAlias || '')?.toLowerCase().includes('PRODUCCIÓN') || 
                          (alias.descripcionTipoEstadoAlias || '')?.toLowerCase().includes('PRODUCCIÓN') ? 
                          'estado-produccion' : 'estado-borrador'}`}>
                          {normalizeText(alias.descripcionTipoEstadoAlias)}
                        </span>
                      </td>
                      <td className="ratio-column">-</td>
                    </tr>
                    
                    {expandedRows[alias.idAlias] && alias.acoples && alias.acoples.map((acople, acopleIndex) => (
                      <tr key={`acople-${alias.idAlias}-${acople.idAliasAcople || acopleIndex}`} className="acople-row">
                        <td className="acople-cell"></td>
                        <td>{acople.idAliasAcople}</td>
                        <td>{normalizeText(acople.nombreAcople || '')}</td>
                        <td>{acople.idTipoAliasAcople || '-'}</td>
                        <td className="estado-column">
                          {acople.descripcionTipoEstadoAliasAcople || '-'}
                        </td>
                        <td className="ratio-column">{acople.ratioAcople || 1}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            
            <div className="description-text">
              {t('Define el ámbito donde se distribuirán los alias seleccionados para poder crear la tarea.')}
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
              onClick={openDefinirAmbito}
            >
              {t('DEFINIR ÁMBITO')}
            </button>
            
            <DefinirAmbitoModal 
                isOpen={showAmbitoModal} 
                onClose={() => setShowAmbitoModal(false)}
                onSave={(localizaciones) => {
                  console.log('Localizaciones seleccionadas:', localizaciones);
                  setAmbitosLocalizacion(localizaciones);
                  setShowAmbitoModal(false);
                }}
                selectedAliases={selectedAliases}
                initialSelections={{
                  existingLocations: ambitosLocalizacion,
                  gruposCadena: [...new Set(ambitosLocalizacion.map(loc => loc.idGrupoCadena))],
                  cadenas: [...new Set(ambitosLocalizacion.map(loc => loc.idCadena))],
                  mercados: [...new Set(ambitosLocalizacion.map(loc => loc.idMercado || loc.mercado))]
                }}
            />

            {ambitosLocalizacion.length > 0 && (
              <div className="ambito-selected-table" style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                  {t('{{count}} localizaciones en las que se distribuirá la tarea', { count: ambitosLocalizacion.length })}
                </div>
                <table className="alias-table">
                  <thead>
                    <tr>
                      <th>{t('ID/GRUPO CADENA')}</th>
                      <th>{t('ID/CADENA')}</th>
                      <th>{t('MERCADO')}</th>
                      <th>{t('ID/LOCALIZACIÓN')}</th>
                      <th>{t('ESTADO DE TIENDA RAM')}</th>
                      <th>{t('ESTADO DE LA TIENDA EN LA TAREA')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambitosLocalizacion.map((loc, index) => (
                      <tr key={`ambito-${loc.idLocalizacionCompra || loc.idLocalizacion || index}`}>
                        <td>{loc.idGrupoCadena} - {normalizeText(loc.descripcionGrupoCadena || loc.grupoCadena || '')}</td>
                        <td>{loc.idCadena} - {normalizeText(loc.descripcionCadena || loc.cadena || '')}</td>
                        <td>{normalizeText(loc.descripcionMercado || loc.mercado || '')}</td>
                        <td>{loc.idLocalizacionCompra || loc.idLocalizacion}</td>
                        <td>
                          <span className="estado-tag">
                            {normalizeText(loc.descripcionEstadoLocalizacionRam || loc.estadoTiendaRam || '')}
                          </span>
                        </td>
                        <td>
                          <span className="estado-tag">
                            {normalizeText(loc.descripcionEstadoLocalizacionTarea || loc.estadoTiendaTarea || '')}
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
              <p className="no-aliases-text">{t('NO HAY ALIAS SELECCIONADOS')}</p>
              <p className="aliases-help-text">{t('UTILIZAR LOS CAMPOS NECESARIOS PARA AÑADIR ALIAS A LA TAREA')}</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="buttons-container">
        <button className="cancel-button" onClick={handleCancel}>
          {t('CANCELAR')}
        </button>
        <button
          className="create-button"
          onClick={handleSave}
          disabled={!hasChanges || loading}
        >
          {t('GUARDAR')}
        </button>
      </div>
    </div>
  );
};

export default EditarTarea;